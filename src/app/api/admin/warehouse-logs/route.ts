import { getAdminWithPermissions } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { getRequestLanguage } from "@/lib/request-language";
import { withTenant } from "@/lib/tenant";
import { NextRequest, NextResponse } from "next/server";

function cleanOptional(value: unknown) {
  const cleaned = String(value || "").trim();
  return cleaned || null;
}

export const GET = withTenant(async () => {
  const language = await getRequestLanguage();

  const admin = await getAdminWithPermissions();

  if (!admin || (!admin.isSuperAdmin && !admin.permissions.viewStock)) {
    return NextResponse.json(
      {
        error:
          language === "de"
            ? "Sie sind nicht berechtigt, Lagerprotokolle einzusehen."
            : "Depo kayıtlarını görüntüleme yetkiniz yok.",
      },
      {
        status: 403,
      },
    );
  }

  try {
    const logs = await prisma.warehouseLog.findMany({
      include: {
        items: {
          orderBy: {
            itemName: "asc",
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },

      take: 300,
    });

    return NextResponse.json({
      canDeleteWarehouseLog:
        admin.isSuperAdmin || admin.permissions.deleteWarehouseLog,

      logs: logs.map((log) => ({
        ...log,
        items: log.items.map((item) => ({
          ...item,
          quantity: Number(item.quantity),
        })),
      })),
    });
  } catch (error) {
    console.error("LOAD_WAREHOUSE_LOGS_ERROR", error);

    return NextResponse.json(
      {
        error:
          language === "de"
            ? "Lagerprotokolle konnten nicht geladen werden."
            : "Depo kayıtları yüklenemedi.",
      },
      {
        status: 500,
      },
    );
  }
});

export const POST = withTenant(async (request: NextRequest, _context, tenant) => {
  const language = await getRequestLanguage();

  const admin = await getAdminWithPermissions();

  if (!admin || (!admin.isSuperAdmin && !admin.permissions.addStock)) {
    return NextResponse.json(
      {
        error:
          language === "de"
            ? "Sie sind nicht berechtigt, Lagerprotokolle anzulegen."
            : "Depo kaydı oluşturma yetkiniz yok.",
      },
      {
        status: 403,
      },
    );
  }

  try {
    const body = await request.json();

    const type = body.type === "OUT" ? "OUT" : "IN";

    const items = Array.isArray(body.items)
      ? body.items
          .map((item: { itemName?: unknown; quantity?: unknown; unit?: unknown; note?: unknown }) => ({
            itemName: String(item.itemName || "").trim(),
            quantity: Number(item.quantity),
            unit: String(item.unit || "").trim(),
            note: cleanOptional(item.note),
          }))
          .filter(
            (item: { itemName: string; quantity: number; unit: string }) =>
              item.itemName &&
              Number.isFinite(item.quantity) &&
              item.quantity > 0 &&
              item.unit,
          )
      : [];

    if (items.length === 0) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Sie müssen mindestens eine gültige Warenzeile hinzufügen."
              : "En az bir geçerli mal satırı eklemelisiniz.",
        },
        {
          status: 400,
        },
      );
    }

    const log = await prisma.warehouseLog.create({
      data: {
        tenantId: tenant.id,
        type,
        companyName: cleanOptional(body.companyName),
        driverName: cleanOptional(body.driverName),
        vehiclePlate: cleanOptional(body.vehiclePlate),
        deliveryNoteNo: cleanOptional(body.deliveryNoteNo),
        destination: cleanOptional(body.destination),
        contactPerson: cleanOptional(body.contactPerson),
        note: cleanOptional(body.note),
        createdById: admin.user.id,

        items: {
          create: items.map(
            (item: {
              itemName: string;
              quantity: number;
              unit: string;
              note: string | null;
            }) => ({
              itemName: item.itemName,
              quantity: item.quantity,
              unit: item.unit,
              note: item.note,
            }),
          ),
        },
      },

      include: {
        items: true,
      },
    });

    return NextResponse.json(
      {
        message:
          language === "de"
            ? type === "IN"
              ? "Wareneingang wurde erfolgreich erfasst."
              : "Warenausgang wurde erfolgreich erfasst."
            : type === "IN"
              ? "Mal giriş kaydı başarıyla oluşturuldu."
              : "Mal çıkış kaydı başarıyla oluşturuldu.",

        log: {
          ...log,
          items: log.items.map((item) => ({
            ...item,
            quantity: Number(item.quantity),
          })),
        },
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("CREATE_WAREHOUSE_LOG_ERROR", error);

    return NextResponse.json(
      {
        error:
          language === "de"
            ? "Lagerprotokoll konnte nicht angelegt werden."
            : "Depo kaydı oluşturulamadı.",
      },
      {
        status: 500,
      },
    );
  }
});
