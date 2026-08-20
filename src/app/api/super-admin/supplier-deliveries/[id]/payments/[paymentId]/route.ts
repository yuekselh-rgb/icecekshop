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

export const DELETE = withTenant(async (
  _request: NextRequest,
  context: { params: Promise<{ id: string; paymentId: string }> },
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

  const { id, paymentId } = await context.params;

  try {
    /*
     * SupplierDeliveryPayment trägt keine eigene tenantId (Child-Modell,
     * siehe reset-sales.ts für dasselbe Muster) — die Tenant-Zugehörigkeit
     * wird ausschließlich über die bereits tenant-gescopte Elternzeile
     * geprüft, nie über die Payment-ID direkt.
     */
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

    const payment = await prisma.supplierDeliveryPayment.findUnique({
      where: {
        id: paymentId,
      },
    });

    if (!payment || payment.deliveryId !== delivery.id) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Zahlung nicht gefunden."
              : "Ödeme bulunamadı.",
        },
        {
          status: 404,
        },
      );
    }

    /*
     * paidAmount wird nach dem Löschen aus der Summe der verbleibenden
     * Zahlungszeilen neu berechnet statt vom vor der Transaktion
     * gelesenen delivery.paidAmount subtrahiert — vermeidet Drift bei
     * knapp gleichzeitigen Änderungen an derselben Lieferung.
     */
    const updated = await prisma.$transaction(async (tx) => {
      await tx.supplierDeliveryPayment.delete({
        where: {
          id: payment.id,
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
      action: "supplier_delivery.payment_deleted",
      summary: `Zahlung von ${Number(payment.amount).toFixed(2)} € an "${delivery.supplier.name}" gelöscht.`,
      entityType: "SupplierDelivery",
      entityId: delivery.id,
      metadata: {
        amount: Number(payment.amount),
      },
    });

    return NextResponse.json({
      message: language === "de" ? "Zahlung gelöscht." : "Ödeme silindi.",

      paidAmount: Number(updated.paidAmount),
      payments: updated.payments.map((entry) => ({
        id: entry.id,
        amount: Number(entry.amount),
        note: entry.note,
        createdAt: entry.createdAt,
      })),
    });
  } catch (error) {
    console.error("DELETE_SUPPLIER_DELIVERY_PAYMENT_ERROR", error);

    return NextResponse.json(
      {
        error:
          language === "de"
            ? "Zahlung konnte nicht gelöscht werden."
            : "Ödeme silinemedi.",
      },
      {
        status: 500,
      },
    );
  }
});
