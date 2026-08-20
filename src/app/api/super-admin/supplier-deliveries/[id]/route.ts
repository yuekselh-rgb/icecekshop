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
    /*
     * findFirst statt findUnique — läuft über die tenant-scopende
     * Prisma-Extension (SupplierDelivery ist in TENANT_SCOPED_MODELS),
     * sodass eine ID aus einem anderen Tenant hier nie gefunden wird.
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
        items: true,
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

    await prisma.$transaction(async (tx) => {
      /*
       * Produktverknüpfte Zeilen hatten beim Anlegen den Lagerbestand
       * erhöht — das muss beim Löschen (z. B. falsch erfasste Lieferung)
       * symmetrisch rückgängig gemacht werden, sonst bleibt der Bestand
       * dauerhaft zu hoch.
       */
      for (const item of delivery.items) {
        if (!item.productId) {
          continue;
        }

        const stockAmount = Math.round(Number(item.quantity));

        /*
         * Kein reines decrement — der Bestand kann inzwischen (durch
         * reguläre Verkäufe) niedriger sein als die ursprünglich gebuchte
         * Menge. Löschen ist eine Buchführungskorrektur, kein Verkaufs-
         * vorgang, also wird auf 0 begrenzt statt die Löschung mit
         * "Bestand reicht nicht" zu blockieren.
         */
        const product = await tx.product.findUnique({
          where: {
            id: item.productId,
          },
          select: {
            stock: true,
          },
        });

        if (product) {
          await tx.product.update({
            where: {
              id: item.productId,
            },
            data: {
              stock: Math.max(0, product.stock - stockAmount),
            },
          });
        }

        await tx.stockMovement.create({
          data: {
            tenantId: tenant.id,
            productId: item.productId,
            amount: -stockAmount,
            reason:
              (language === "de"
                ? `Lieferung von ${delivery.supplier.name} gelöscht`
                : `${delivery.supplier.name} teslimatı silindi`) +
              ` · Lieferung: ${delivery.id}`,
          },
        });
      }

      // Cascade löscht SupplierDeliveryItem/-Payment-Zeilen dieser Lieferung mit.
      await tx.supplierDelivery.delete({
        where: {
          id: delivery.id,
        },
      });
    });

    await logAuditEvent({
      tenantId: tenant.id,
      actorUserId: admin.session.userId,
      actorEmail: admin.session.email,
      actorRole: admin.session.role,
      action: "supplier_delivery.deleted",
      summary: `Lieferung von "${delivery.supplier.name}" (${Number(delivery.totalAmount).toFixed(2)} €) gelöscht.`,
      entityType: "SupplierDelivery",
      entityId: delivery.id,
    });

    return NextResponse.json({
      message: language === "de" ? "Lieferung gelöscht." : "Teslimat silindi.",
    });
  } catch (error) {
    console.error("DELETE_SUPPLIER_DELIVERY_ERROR", error);

    return NextResponse.json(
      {
        error:
          language === "de"
            ? "Lieferung konnte nicht gelöscht werden."
            : "Teslimat silinemedi.",
      },
      {
        status: 500,
      },
    );
  }
});
