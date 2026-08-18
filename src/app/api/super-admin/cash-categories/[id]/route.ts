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

export const PATCH = withTenant(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
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
    const existing = await prisma.cashMovementCustomCategory.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Kategorie nicht gefunden."
              : "Kategori bulunamadı.",
        },
        {
          status: 404,
        },
      );
    }

    const body = await request.json();

    const data: {
      nameDe?: string;
      nameTr?: string;
      direction?: "IN" | "OUT";
      active?: boolean;
    } = {};

    if (typeof body.nameDe === "string") {
      const nameDe = body.nameDe.trim();

      if (!nameDe) {
        return NextResponse.json(
          {
            error:
              language === "de"
                ? "Der deutsche Name darf nicht leer sein."
                : "Almanca isim boş olamaz.",
          },
          {
            status: 400,
          },
        );
      }

      data.nameDe = nameDe;
    }

    if (typeof body.nameTr === "string") {
      const nameTr = body.nameTr.trim();

      if (!nameTr) {
        return NextResponse.json(
          {
            error:
              language === "de"
                ? "Der türkische Name darf nicht leer sein."
                : "Türkçe isim boş olamaz.",
          },
          {
            status: 400,
          },
        );
      }

      data.nameTr = nameTr;
    }

    if (typeof body.direction === "string") {
      if (body.direction !== "IN" && body.direction !== "OUT") {
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

      data.direction = body.direction;
    }

    if (typeof body.active === "boolean") {
      data.active = body.active;
    }

    const category = await prisma.cashMovementCustomCategory.update({
      where: { id },
      data,
    });

    return NextResponse.json({ category });
  } catch (error) {
    console.error("UPDATE_CASH_CATEGORY_ERROR", error);

    return NextResponse.json(
      {
        error:
          language === "de"
            ? "Kategorie konnte nicht aktualisiert werden."
            : "Kategori güncellenemedi.",
      },
      {
        status: 500,
      },
    );
  }
});
