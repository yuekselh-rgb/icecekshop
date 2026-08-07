import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/admin-auth";
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
  const admin = await requireAdminPermission("updateCategory");

  if (!admin) {
    return NextResponse.json(
      { error: "Kategori düzenleme yetkiniz yok." },
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
          error: "Bu slug başka bir kategori tarafından kullanılıyor.",
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
        error: "Kategori güncellenemedi.",
      },
      {
        status: 500,
      },
    );
  }
});
