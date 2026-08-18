import { getAdminWithPermissions } from "@/lib/admin-auth";
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

export const GET = withTenant(async (_request: NextRequest, _context, tenant) => {
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

  const categories = await prisma.cashMovementCustomCategory.findMany({
    where: {
      tenantId: tenant.id,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return NextResponse.json({ categories });
});

export const POST = withTenant(async (request: NextRequest, _context, tenant) => {
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

  try {
    const body = await request.json();

    const nameDe = String(body.nameDe || "").trim();
    const nameTr = String(body.nameTr || "").trim();
    const direction = String(body.direction || "");

    if (!nameDe || !nameTr) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Bitte geben Sie einen Namen auf Deutsch und Türkisch an."
              : "Lütfen Almanca ve Türkçe bir isim girin.",
        },
        {
          status: 400,
        },
      );
    }

    if (direction !== "IN" && direction !== "OUT") {
      return NextResponse.json(
        {
          error:
            language === "de" ? "Ungültige Richtung." : "Geçersiz yön.",
        },
        {
          status: 400,
        },
      );
    }

    const category = await prisma.cashMovementCustomCategory.create({
      data: {
        tenantId: tenant.id,
        nameDe,
        nameTr,
        direction,
      },
    });

    return NextResponse.json({ category });
  } catch (error) {
    console.error("CREATE_CASH_CATEGORY_ERROR", error);

    return NextResponse.json(
      {
        error:
          language === "de"
            ? "Kategorie konnte nicht erstellt werden."
            : "Kategori oluşturulamadı.",
      },
      {
        status: 500,
      },
    );
  }
});
