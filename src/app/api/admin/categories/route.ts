import {
  requireAdminPermission,
} from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { getRequestLanguage } from "@/lib/request-language";
import { withTenant } from "@/lib/tenant";
import { NextRequest, NextResponse } from "next/server";

const allowedTypes = [
  "DRINK",
  "PACKAGING",
  "TAKEAWAY",
  "CLEANING",
  "OTHER",
] as const;

function createSlug(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/ä/g, "a")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const GET = withTenant(async () => {
  const language = await getRequestLanguage();

  const admin =
    await requireAdminPermission(
      "viewCategories"
    );

  if (!admin) {
    return NextResponse.json(
      {
        error:
          language === "de"
            ? "Sie sind nicht berechtigt, Kategorien einzusehen."
            : "Kategori görüntüleme yetkiniz yok.",
      },
      {
        status: 403,
      }
    );
  }

  const categories =
    await prisma.category.findMany({
      orderBy: [
        {
          sortOrder: "asc",
        },
        {
          type: "asc",
        },
        {
          name: "asc",
        },
      ],
    });

  return NextResponse.json({
    categories,
  });
});

export const POST = withTenant(async (
  request: NextRequest,
  _context,
  tenant,
) => {
  const language = await getRequestLanguage();

  const admin =
    await requireAdminPermission(
      "createCategory"
    );

  if (!admin) {
    return NextResponse.json(
      {
        error:
          language === "de"
            ? "Sie sind nicht berechtigt, Kategorien hinzuzufügen."
            : "Kategori ekleme yetkiniz yok.",
      },
      {
        status: 403,
      }
    );
  }

  try {
    const body =
      await request.json();

    const nameTr =
      String(body.nameTr || "").trim();

    const nameDe =
      String(body.nameDe || "").trim();

    const requestedSlug =
      String(body.slug || "").trim();

    const slug = createSlug(
      requestedSlug ||
        nameTr ||
        nameDe
    );

    const type =
      allowedTypes.includes(body.type)
        ? body.type
        : "OTHER";

    if (!nameTr || !nameDe || !slug) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Türkischer Name, deutscher Name und Slug sind erforderlich."
              : "Türkçe ad, Almanca ad ve slug zorunludur.",
        },
        {
          status: 400,
        }
      );
    }

    const existing =
      await prisma.category.findFirst({
        where: {
          slug,
        },
      });

    if (existing) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Es gibt bereits eine Kategorie mit diesem Slug."
              : "Bu slug ile bir kategori zaten bulunuyor.",
        },
        {
          status: 409,
        }
      );
    }

    const category =
      await prisma.category.create({
        data: {
          tenantId: tenant.id,
          name: nameDe,
          nameTr,
          nameDe,
          slug,
          type,
        },
      });

    return NextResponse.json(
      {
        message:
          language === "de"
            ? "Kategorie wurde erfolgreich hinzugefügt."
            : "Kategori başarıyla eklendi.",
        category,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "CREATE_CATEGORY_ERROR",
      error
    );

    return NextResponse.json(
      {
        error:
          language === "de"
            ? "Beim Erstellen der Kategorie ist ein Fehler aufgetreten."
            : "Kategori oluşturulurken hata oluştu.",
      },
      {
        status: 500,
      }
    );
  }
});


export const PUT = withTenant(async (request: NextRequest) => {
  const language = await getRequestLanguage();

  const admin =
    await requireAdminPermission(
      "updateCategory"
    );

  if (!admin) {
    return NextResponse.json(
      {
        error:
          language === "de"
            ? "Sie sind nicht berechtigt, Kategorien zu bearbeiten."
            : "Kategori düzenleme yetkiniz yok.",
      },
      {
        status: 403,
      }
    );
  }

  try {
    const body =
      await request.json();

    const items = Array.isArray(body.categories)
      ? body.categories
      : [];

    await prisma.$transaction(
      items.map(
        (item: {
          id: string;
          sortOrder: number;
        }) =>
          prisma.category.update({
            where: {
              id: item.id,
            },
            data: {
              sortOrder:
                item.sortOrder,
            },
          }),
      ),
    );

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "CATEGORY_SORT_ERROR",
      error,
    );

    return NextResponse.json(
      {
        error:
          language === "de"
            ? "Kategoriereihenfolge konnte nicht gespeichert werden."
            : "Kategori sırası kaydedilemedi.",
      },
      {
        status: 500,
      },
    );
  }
});
