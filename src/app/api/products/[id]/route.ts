import { prisma } from "@/lib/prisma";
import { getRequestLanguage } from "@/lib/request-language";
import { withTenant } from "@/lib/tenant";
import { NextRequest, NextResponse } from "next/server";

export const GET = withTenant(async (
  _request: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  },
) => {
  const language = await getRequestLanguage();

  try {
    const { id } = await context.params;

    const product = await prisma.product.findFirst({
      where: {
        id,
        active: true,
      },
      include: {
        category: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        {
          error:
            language === "de" ? "Produkt nicht gefunden." : "Ürün bulunamadı.",
        },
        {
          status: 404,
        },
      );
    }

    const relatedProducts = await prisma.product.findMany({
      where: {
        active: true,
        categoryId: product.categoryId,
        id: {
          not: product.id,
        },
      },
      include: {
        category: true,
      },
      take: 4,
      orderBy: [
        {
          sortOrder: "asc",
        },
        {
          name: "asc",
        },
      ],
    });

    function serializeProduct(item: NonNullable<typeof product>) {
      return {
        id: item.id,
        slug: item.slug,

        name: {
          tr: item.nameTr || item.name,
          de: item.nameDe || item.name,
        },

        category: {
          tr: item.category.nameTr || item.category.name,
          de: item.category.nameDe || item.category.name,
        },

        categorySlug: item.category.slug,

        description: {
          tr: item.descriptionTr || item.description || "",
          de: item.descriptionDe || item.description || "",
        },

        packageInfo: item.packageInfo || "",
        price: Number(item.price),

        oldPrice: item.oldPrice !== null ? Number(item.oldPrice) : undefined,

        pfandAmount: Number(item.pfandAmount),
        image: item.imageUrl || "📦",
        imageScale: item.imageScale,
        imagePositionX: item.imagePositionX,
        imagePositionY: item.imagePositionY,

        badge:
          item.badgeTr || item.badgeDe
            ? {
                tr: item.badgeTr || "",
                de: item.badgeDe || "",
              }
            : undefined,

        stock: item.stock,
        soldOut: item.soldOut,
        inStock: item.stock > 0 && !item.soldOut,
      };
    }

    return NextResponse.json({
      product: serializeProduct(product),
      relatedProducts: relatedProducts.map((item) => serializeProduct(item)),
    });
  } catch (error) {
    console.error("PUBLIC_PRODUCT_DETAIL_ERROR", error);

    return NextResponse.json(
      {
        error: "Ürün yüklenemedi.",
      },
      {
        status: 500,
      },
    );
  }
});
