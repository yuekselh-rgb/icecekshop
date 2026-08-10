import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/admin-auth";
import { getRequestLanguage } from "@/lib/request-language";
import { withTenant } from "@/lib/tenant";
function createSlug(value: string) {
  return value
    .toLocaleLowerCase("tr")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}


const allowedTypes = [
  "DRINK",
  "PACKAGING",
  "TAKEAWAY",
  "CLEANING",
  "OTHER",
] as const;

export const PUT = withTenant(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const language = await getRequestLanguage();

  const admin = await requireAdminPermission("updateCategory");

  if (!admin) {
    return NextResponse.json(
      {
        error:
          language === "de"
            ? "Sie sind nicht berechtigt, Kategorien zu bearbeiten."
            : "Kategori düzenleme yetkiniz yok.",
      },
      { status: 403 },
    );
  }

  try {
    const { id } = await params;
    const body = await request.json();

    const nameTr = String(body.nameTr || "").trim();
    const nameDe = String(body.nameDe || "").trim();

    const slug = createSlug(
      String(body.slug || "").trim() || nameTr || nameDe,
    );

    const type = allowedTypes.includes(body.type)
      ? body.type
      : "OTHER";

    const exists = await prisma.category.findFirst({
      where: {
        slug,
        NOT: {
          id,
        },
      },
    });

    if (exists) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Dieser Slug wird bereits von einer anderen Kategorie verwendet."
              : "Bu slug başka bir kategori tarafından kullanılıyor.",
        },
        {
          status: 409,
        },
      );
    }

    const category = await prisma.category.update({
      where: {
        id,
      },
      data: {
        name: nameDe,
        nameTr,
        nameDe,
        slug,
        type,
      },
    });

    return NextResponse.json({
      success: true,
      category,
    });
  } catch (error) {
    console.error("UPDATE_CATEGORY_ERROR", error);

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

export const DELETE = withTenant(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const language = await getRequestLanguage();

  const admin = await requireAdminPermission("deleteCategory");

  if (!admin) {
    return NextResponse.json(
      {
        error:
          language === "de"
            ? "Sie sind nicht berechtigt, Kategorien zu löschen."
            : "Kategori silme yetkiniz yok.",
      },
      { status: 403 },
    );
  }

  try {
    const { id } = await params;

    await prisma.category.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
      message:
        language === "de"
          ? "Kategorie wurde erfolgreich gelöscht."
          : "Kategori başarıyla silindi.",
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Diese Kategorie kann nicht gelöscht werden, da ihr noch Produkte zugeordnet sind. Bitte verschieben Sie zuerst alle Produkte in eine andere Kategorie."
              : "Bu kategoriye bağlı ürünler olduğu için silinemiyor. Lütfen önce tüm ürünleri başka bir kategoriye taşıyın.",
        },
        { status: 409 },
      );
    }

    console.error("DELETE_CATEGORY_ERROR", error);

    return NextResponse.json(
      {
        error:
          language === "de"
            ? "Beim Löschen der Kategorie ist ein Fehler aufgetreten."
            : "Kategori silinirken bir hata oluştu.",
      },
      { status: 500 },
    );
  }
});
