import { getAdminWithPermissions } from "@/lib/admin-auth";
import { logAuditEvent } from "@/lib/audit-log";
import { prisma } from "@/lib/prisma";
import { getRequestLanguage } from "@/lib/request-language";
import { withTenant } from "@/lib/tenant";
import { NextRequest, NextResponse } from "next/server";

async function requireSuperAdmin() {
  const admin = await getAdminWithPermissions();

  if (!admin || !admin.isSuperAdmin) {
    return null;
  }

  return admin;
}

export const POST = withTenant(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
  tenant,
) => {
  const language = await getRequestLanguage();

  const admin = await requireSuperAdmin();

  if (!admin) {
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
    const delivery = await prisma.supplierDelivery.findFirst({
      where: {
        id,
      },
      include: {
        supplier: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!delivery) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Lieferung nicht gefunden."
              : "Teslimat bulunamadı.",
        },
        {
          status: 404,
        },
      );
    }

    const body = await request.json();

    const amount = Number(body.amount);

    const remaining = Number(delivery.totalAmount) - Number(delivery.paidAmount);

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

    if (amount > remaining + 0.01) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? `Der Betrag übersteigt die offene Schuld von ${remaining.toFixed(2)} €.`
              : `Tutar, ${remaining.toFixed(2)} € olan açık borcu aşıyor.`,
        },
        {
          status: 400,
        },
      );
    }

    const note = String(body.note || "").trim() || null;

    /*
     * paidAmount wird innerhalb derselben Transaktion aus der Summe aller
     * Zahlungszeilen neu berechnet statt aus dem vor der Transaktion
     * gelesenen delivery.paidAmount fortgeschrieben — sonst könnten zwei
     * knapp gleichzeitige Zahlungen (zwei Admins) sich gegenseitig
     * überschreiben, exakt dasselbe Muster wie die Pfand-Race im Warenkorb.
     */
    const updated = await prisma.$transaction(async (tx) => {
      await tx.supplierDeliveryPayment.create({
        data: {
          deliveryId: delivery.id,
          amount: Number(amount.toFixed(2)),
          note,
          createdById: admin.session.userId,
        },
      });

      const sum = await tx.supplierDeliveryPayment.aggregate({
        where: {
          deliveryId: delivery.id,
        },
        _sum: {
          amount: true,
        },
      });

      return tx.supplierDelivery.update({
        where: {
          id: delivery.id,
        },
        data: {
          paidAmount: Number(sum._sum.amount || 0),
        },
        include: {
          payments: {
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      });
    });

    await logAuditEvent({
      tenantId: tenant.id,
      actorUserId: admin.session.userId,
      actorEmail: admin.session.email,
      actorRole: admin.session.role,
      action: "supplier_delivery.payment_added",
      summary: `Zahlung von ${amount.toFixed(2)} € an "${delivery.supplier.name}" erfasst.`,
      entityType: "SupplierDelivery",
      entityId: delivery.id,
      metadata: {
        amount,
      },
    });

    return NextResponse.json(
      {
        message:
          language === "de" ? "Zahlung erfasst." : "Ödeme kaydedildi.",

        paidAmount: Number(updated.paidAmount),
        payments: updated.payments.map((payment) => ({
          id: payment.id,
          amount: Number(payment.amount),
          note: payment.note,
          createdAt: payment.createdAt,
        })),
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("ADD_SUPPLIER_DELIVERY_PAYMENT_ERROR", error);

    return NextResponse.json(
      {
        error:
          language === "de"
            ? "Zahlung konnte nicht gespeichert werden."
            : "Ödeme kaydedilemedi.",
      },
      {
        status: 500,
      },
    );
  }
});
