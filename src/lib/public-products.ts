import { prisma } from "@/lib/prisma";
import { getCurrentTenant } from "@/lib/tenant";

export async function queryPublicProductsForTenant(tenantId: string) {
  const products = await prisma.product.findMany({
    where: {
      tenantId,
      active: true,
      stock: {
        gt: 0,
      },
      /*
       * Ein Preis von 0 € ist praktisch immer eine noch nicht
       * gepflegte Preisangabe, kein echtes Gratisprodukt — solche
       * Produkte werden im Shop ausgeblendet, bis ein echter Preis
       * eingetragen ist.
       */
      price: {
        gt: 0,
      },
    },
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
          type: "asc",
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

  return products.map((product) => ({
    id: product.id,
    slug: product.slug,

    name: {
      tr: product.nameTr || product.name,
      de: product.nameDe || product.name,
    },

    category: {
      tr: product.category.nameTr || product.category.name,
      de: product.category.nameDe || product.category.name,
    },

    categorySlug: product.category.slug,
    packageInfo: product.packageInfo || "",
    price: Number(product.price),
    pfandAmount: Number(product.pfandAmount),

    oldPrice:
      product.oldPrice !== null ? Number(product.oldPrice) : undefined,

    isOffer: product.isOffer,

    image: product.imageUrl || "📦",
    imageScale: product.imageScale,
    imagePositionX: product.imagePositionX,
    imagePositionY: product.imagePositionY,

    badge:
      product.badgeTr || product.badgeDe
        ? {
            tr: product.badgeTr || "",
            de: product.badgeDe || "",
          }
        : undefined,

    inStock: product.stock > 0 && !product.soldOut,
    soldOut: product.soldOut,
    stock: product.stock,
    createdAt: product.createdAt.toISOString(),

    sellByCarton: product.sellByCarton,
    unitsPerCarton: product.unitsPerCarton,

    cartonPrice:
      product.cartonPrice !== null ? Number(product.cartonPrice) : null,
  }));
}

export async function getPublicProducts() {
  const tenant = await getCurrentTenant();

  if (!tenant) {
    return [];
  }

  return queryPublicProductsForTenant(tenant.id);
}

export type PublicProduct = Awaited<
  ReturnType<typeof getPublicProducts>
>[number];
