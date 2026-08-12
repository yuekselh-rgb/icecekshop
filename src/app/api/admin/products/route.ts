import { requireAdminPermission } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { withTenant } from "@/lib/tenant";
import { getRequestLanguage } from "@/lib/request-language";
import { NextRequest, NextResponse } from "next/server";

export const GET = withTenant(async () => {
  const admin = await requireAdminPermission("viewProducts");

  if (!admin) {
    const language = await getRequestLanguage();

    return NextResponse.json(
      {
        error:
          language === "de"
            ? "Sie sind für diese Aktion nicht berechtigt."
            : "Bu işlem için yetkiniz yok.",
      },
      {
        status: 403,
      },
    );
  }

  const products = await prisma.product.findMany({
    include: {
      category: true,
    },
    orderBy: [
      {
        category: {
          sortOrder: "asc",
        },
      },
      {
        category: {
          name: "asc",
        },
      },
      {
        sortOrder: "asc",
      },
      {
        name: "asc",
      },
    ],
  });

  return NextResponse.json({
    products,
  });
});

export const PUT = withTenant(async (request: NextRequest) => {
  const language = await getRequestLanguage();

  const admin = await requireAdminPermission("updateProduct");

  if (!admin) {
    return NextResponse.json(
      {
        error:
          language === "de"
            ? "Sie sind nicht berechtigt, Produkte zu bearbeiten."
            : "Ürün düzenleme yetkiniz yok.",
      },
      {
        status: 403,
      },
    );
  }

  try {
    const body = await request.json();

    const items = Array.isArray(body.products) ? body.products : [];

    await prisma.$transaction(
      items.map((item: { id: string; sortOrder: number }) =>
        prisma.product.update({
          where: {
            id: item.id,
          },
          data: {
            sortOrder: item.sortOrder,
          },
        }),
      ),
    );

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("PRODUCT_SORT_ERROR", error);

    return NextResponse.json(
      {
        error:
          language === "de"
            ? "Produktreihenfolge konnte nicht gespeichert werden."
            : "Ürün sıralaması kaydedilemedi.",
      },
      {
        status: 500,
      },
    );
  }
});

export const POST = withTenant(async (request: NextRequest, _context, tenant) => {
  const admin = await requireAdminPermission("createProduct");

  const language = await getRequestLanguage();

  if (!admin) {
    return NextResponse.json(
      {
        error:
          language === "de"
            ? "Sie sind nicht berechtigt, Produkte hinzuzufügen."
            : "Ürün ekleme yetkiniz yok.",
      },
      {
        status: 403,
      },
    );
  }

  try {
    const body = await request.json();

    const requestedPrice = Number(body.price);

    const requestedOldPrice =
      body.oldPrice === "" ||
      body.oldPrice === null ||
      body.oldPrice === undefined
        ? null
        : Number(body.oldPrice);

    const requestedIsOffer = body.isOffer === true;

    if (!Number.isFinite(requestedPrice) || requestedPrice < 0) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Geben Sie einen gültigen Preis ein."
              : "Geçerli bir fiyat girin.",
        },
        {
          status: 400,
        },
      );
    }

    if (requestedOldPrice !== null && !Number.isFinite(requestedOldPrice)) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Geben Sie einen gültigen Preis vor dem Angebot ein."
              : "Geçerli bir kampanya öncesi fiyat girin.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      (requestedIsOffer || requestedOldPrice !== null) &&
      !admin.isSuperAdmin &&
      !admin.permissions.manageOffers
    ) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Sie sind nicht berechtigt, Angebotsprodukte zu erstellen."
              : "Kampanyalı ürün oluşturma yetkiniz yok.",
        },
        {
          status: 403,
        },
      );
    }

    const canSetPrice = admin.isSuperAdmin || admin.permissions.changePrice;

    const canSetStock = admin.isSuperAdmin || admin.permissions.addStock;

    const finalPrice = canSetPrice ? requestedPrice : 0;

    const finalStock = canSetStock ? Number(body.stock || 0) : 0;

    const nameTr = String(body.nameTr || body.name || "").trim();

    const nameDe = String(body.nameDe || body.name || "").trim();

    const slug = String(body.slug || "")
      .trim()
      .toLowerCase();

    if (
      !nameTr ||
      !nameDe ||
      !slug ||
      body.price === undefined ||
      !body.categoryId
    ) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Türkischer Name, deutscher Name, Slug, Preis und Kategorie sind erforderlich."
              : "Türkçe ad, Almanca ad, slug, fiyat ve kategori zorunludur.",
        },
        {
          status: 400,
        },
      );
    }

    const existing = await prisma.product.findFirst({
      where: {
        slug,
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Ein Produkt mit diesem Slug existiert bereits."
              : "Bu slug ile bir ürün zaten var.",
        },
        {
          status: 409,
        },
      );
    }

    const category = await prisma.category.findUnique({
      where: {
        id: String(body.categoryId),
      },
    });

    if (!category) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Die ausgewählte Kategorie wurde nicht gefunden."
              : "Seçilen kategori bulunamadı.",
        },
        {
          status: 404,
        },
      );
    }

    const packageInfo = String(body.packageInfo || "").trim();

    if (!packageInfo) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Verpackungsinformation ist erforderlich."
              : "Paket bilgisi zorunludur.",
        },
        {
          status: 400,
        },
      );
    }

    const product = await prisma.product.create({
      data: {
        tenantId: tenant.id,
        name: nameDe,
        nameTr,
        nameDe,
        slug,

        description: body.description ? String(body.description).trim() : null,

        descriptionTr: body.descriptionTr
          ? String(body.descriptionTr).trim()
          : null,

        descriptionDe: body.descriptionDe
          ? String(body.descriptionDe).trim()
          : null,

        price: finalPrice,

        oldPrice: requestedOldPrice,
        isOffer: requestedIsOffer,

        pfandAmount: Number(body.pfandAmount || 0),

        stock: finalStock,

        stockUnit: String(body.stockUnit || "ADET") as
          "KASA" | "KARTON" | "PAKET" | "ADET",

        unitsPerPackage: Math.max(
          1,
          Math.round(Number(body.unitsPerPackage || 1)),
        ),

        minStock: Number(body.minStock || 0),

        packageCount: null,
        unitAmount: null,
        unitType: null,
        packageInfo,

        imageUrl: body.imageUrl ? String(body.imageUrl).trim() : null,

        imageScale: Math.min(8, Math.max(0.25, Number(body.imageScale || 1))),

        imagePositionX: Math.min(
          100,
          Math.max(-100, Math.round(Number(body.imagePositionX || 0))),
        ),

        imagePositionY: Math.min(
          100,
          Math.max(-100, Math.round(Number(body.imagePositionY || 0))),
        ),

        categoryId: category.id,

        active: true,
        soldOut: body.soldOut === true,
      },

      include: {
        category: true,
      },
    });

    return NextResponse.json(
      {
        message:
          language === "de"
            ? "Produkt erfolgreich hinzugefügt."
            : "Ürün başarıyla eklendi.",
        product,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("CREATE_PRODUCT_ERROR", error);

    return NextResponse.json(
      {
        error:
          language === "de"
            ? "Beim Erstellen des Produkts ist ein Fehler aufgetreten."
            : "Ürün oluşturulurken hata oluştu.",
      },
      {
        status: 500,
      },
    );
  }
});
