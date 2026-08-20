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

    // Cascade löscht SupplierDeliveryItem/-Payment-Zeilen dieser Lieferung mit.
    await prisma.supplierDelivery.delete({
      where: {
        id: delivery.id,
      },
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
