import { verifySessionToken } from "@/lib/auth";
import {
  adminOrderInclude,
  serializeAdminOrder,
} from "@/lib/admin-order-serializer";
import { prisma } from "@/lib/prisma";
import { getRequestLanguage } from "@/lib/request-language";
import { withTenant } from "@/lib/tenant";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

async function getSuperAdminSession() {
  const cookieStore = await cookies();

  const token = cookieStore.get("paketmarket_session")?.value;

  if (!token) {
    return null;
  }

  const session = await verifySessionToken(token);

  if (!session || session.role !== "SUPER_ADMIN") {
    return null;
  }

  return session;
}

/*
 * Süper admin, şoför/onay akışına bağlı kalmadan açık bir bakiyeye
 * doğrudan ödeme kaydı düşer (ör. bar-satışı açık hesabın ofiste
 * elden ödenmesi). Kısmi tutar girilebilir; bakiye tamamen
 * kapanmadıysa sipariş "OPEN" kalır, sadece kısmi ödeme kaydedilir.
 */
export const POST = withTenant(async (
  request: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  },
  tenant,
) => {
  const language = await getRequestLanguage();

  const session = await getSuperAdminSession();

  if (!session) {
    return NextResponse.json(
      {
        error: language === "de" ? "Unbefugter Zugriff." : "Yetkisiz erişim.",
      },
      {
        status: 403,
      },
    );
  }

  const { id } = await context.params;

  try {
    const body = await request.json();

    const amount = Number(body.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Bitte geben Sie einen gültigen Betrag ein."
              : "Lütfen geçerli bir tutar girin.",
        },
        {
          status: 400,
        },
      );
    }

    const order = await prisma.order.findFirst({
      where: {
        id,
        deletedAt: null,
      },

      include: adminOrderInclude,
    });

    if (!order) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Bestellung nicht gefunden."
              : "Sipariş bulunamadı.",
        },
        {
          status: 404,
        },
      );
    }

    if (order.paymentStatus === "PAID") {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Diese Bestellung ist bereits vollständig bezahlt."
              : "Bu sipariş zaten tamamen ödendi.",
        },
        {
          status: 409,
        },
      );
    }

    const effectiveTotal = Number(
      Math.max(
        0,
        Number(order.subtotal) +
          Number(order.pfandAmount) +
          Number(order.deliveryFee) -
          (order.pfandReturns.length > 0
            ? Number(
                order.pfandReturns[0].approvedAmount ??
                  order.pfandReturns[0].totalAmount,
              )
            : 0),
      ).toFixed(2),
    );

    const approvedSoFar = Number(
      order.payments
        .filter((payment) => payment.status === "APPROVED")
        .reduce((total, payment) => total + Number(payment.amount), 0)
        .toFixed(2),
    );

    const remaining = Number(
      Math.max(0, effectiveTotal - approvedSoFar).toFixed(2),
    );

    const roundedAmount = Number(amount.toFixed(2));

    if (roundedAmount > remaining + 0.01) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? `Der Betrag übersteigt den offenen Betrag von ${remaining.toFixed(2)} €.`
              : `Tutar, açık bakiye olan ${remaining.toFixed(2)} €'yu aşıyor.`,
        },
        {
          status: 400,
        },
      );
    }

    const now = new Date();

    const customerName =
      order.user.companyName ||
      [order.user.firstName, order.user.lastName].filter(Boolean).join(" ") ||
      order.user.email;

    const updatedOrder = await prisma.$transaction(async (tx) => {
      await tx.orderPayment.create({
        data: {
          tenantId: tenant.id,
          orderId: order.id,
          customerId: order.userId,

          amount: roundedAmount,

          status: "APPROVED",

          reportedById: session.userId,
          reporterRole: "SUPER_ADMIN",
          reportedAt: now,

          approvedById: session.userId,
          approvedAt: now,

          note:
            language === "de"
              ? "Manuell erfasste Zahlung durch Super-Admin."
              : "Süper admin tarafından manuel olarak kaydedilen ödeme.",
        },
      });

      /*
       * Ohne diesen Eintrag taucht die manuell erfasste Zahlung im
       * Bestellbericht (Order.paidAt-basiert) auf, aber nicht im
       * Kassenbericht (CashMovement-basiert) — die beiden Berichte
       * driften dann auseinander.
       */
      await tx.cashMovement.create({
        data: {
          tenantId: tenant.id,
          accountType: "BAR",
          direction: "IN",
          category: "MANUAL_INCOME",
          amount: roundedAmount,
          orderId: order.id,
          createdById: session.userId,
          companyName: customerName,

          description:
            language === "de"
              ? `Manuell erfasste Zahlung (Super-Admin) für Bestellung ${order.orderNumber}.`
              : `Süper admin tarafından manuel olarak kaydedilen ödeme, sipariş ${order.orderNumber}.`,
        },
      });

      const newApprovedTotal = Number(
        (approvedSoFar + roundedAmount).toFixed(2),
      );

      const fullyPaid = newApprovedTotal >= effectiveTotal - 0.01;

      return tx.order.update({
        where: {
          id: order.id,
        },

        data: fullyPaid
          ? {
              paymentStatus: "PAID",
              paidAt: now,
            }
          : {},

        include: adminOrderInclude,
      });
    });

    return NextResponse.json({
      message:
        language === "de" ? "Zahlung wurde erfasst." : "Ödeme kaydedildi.",
      order: serializeAdminOrder(updatedOrder),
    });
  } catch (error) {
    console.error("SUPER_ADMIN_SETTLE_PAYMENT_ERROR", error);

    return NextResponse.json(
      {
        error:
          language === "de"
            ? "Zahlung konnte nicht erfasst werden."
            : "Ödeme kaydedilemedi.",
      },
      {
        status: 500,
      },
    );
  }
});
