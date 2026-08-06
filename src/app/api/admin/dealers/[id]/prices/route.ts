import { requireAdminPermission } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

async function getDealer(id: string) {
  return prisma.user.findFirst({
    where: {
      id,
      role: "DEALER",
    },
    select: {
      id: true,
      isActive: true,
      dealerProfile: {
        select: {
          id: true,
          companyName: true,
          dealerNumber: true,
          active: true,
        },
      },
    },
  });
}

export async function GET(
  _request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  },
) {
  const admin = await requireAdminPermission("manageDealerPrices");

  if (!admin) {
    return NextResponse.json(
      {
        error: "Bayi özel fiyatlarını görüntüleme yetkiniz yok.",
      },
      {
        status: 403,
      },
    );
  }

  try {
    const { id } = await context.params;

    const dealer = await getDealer(id);

    if (!dealer || !dealer.dealerProfile) {
      return NextResponse.json(
        {
          error: "Bayi bulunamadı.",
        },
        {
          status: 404,
        },
      );
    }

    const [products, dealerPrices] = await Promise.all([
      prisma.product.findMany({
        where: {
          active: true,
        },

        select: {
          id: true,
          name: true,
          nameTr: true,
          nameDe: true,
          price: true,
          pfandAmount: true,
          packageInfo: true,
          stockUnit: true,

          category: {
            select: {
              id: true,
              name: true,
              nameTr: true,
              nameDe: true,
            },
          },
        },

        orderBy: [
          {
            category: {
              name: "asc",
            },
          },
          {
            name: "asc",
          },
        ],
      }),

      prisma.dealerPrice.findMany({
        where: {
          dealerId: id,
          active: true,
        },

        select: {
          productId: true,
          price: true,
        },
      }),
    ]);

    const priceMap = new Map(
      dealerPrices.map((dealerPrice) => [
        dealerPrice.productId,
        Number(dealerPrice.price),
      ]),
    );

    return NextResponse.json({
      dealer: {
        id: dealer.id,
        dealerNumber: dealer.dealerProfile.dealerNumber,
        companyName: dealer.dealerProfile.companyName,
      },

      products: products.map((product) => ({
        ...product,
        price: Number(product.price),
        pfandAmount: Number(product.pfandAmount),
        customPrice: priceMap.get(product.id) ?? null,
      })),
    });
  } catch (error) {
    console.error("LOAD_DEALER_PRICES_ERROR", error);

    return NextResponse.json(
      {
        error: "Bayi özel fiyatları yüklenemedi.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function PUT(
  request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  },
) {
  const admin = await requireAdminPermission("manageDealerPrices");

  if (!admin) {
    return NextResponse.json(
      {
        error: "Bayi özel fiyatlarını değiştirme yetkiniz yok.",
      },
      {
        status: 403,
      },
    );
  }

  try {
    const { id } = await context.params;
    const body = await request.json();

    const dealer = await getDealer(id);

    if (!dealer || !dealer.dealerProfile) {
      return NextResponse.json(
        {
          error: "Bayi bulunamadı.",
        },
        {
          status: 404,
        },
      );
    }

    if (!Array.isArray(body.prices)) {
      return NextResponse.json(
        {
          error: "Geçerli fiyat listesi gönderilmedi.",
        },
        {
          status: 400,
        },
      );
    }

    const normalizedPrices = body.prices.map(
      (item: { productId?: unknown; price?: unknown }) => {
        const productId = String(item.productId ?? "").trim();

        const price =
          item.price === null || item.price === undefined || item.price === ""
            ? null
            : Number(item.price);

        return {
          productId,
          price,
        };
      },
    );

    const invalidItem = normalizedPrices.find(
      (item: { productId: string; price: number | null }) =>
        !item.productId ||
        (item.price !== null &&
          (!Number.isFinite(item.price) || item.price < 0)),
    );

    if (invalidItem) {
      return NextResponse.json(
        {
          error: "Geçersiz ürün veya özel fiyat bulundu.",
        },
        {
          status: 400,
        },
      );
    }

    const duplicateProductIds = normalizedPrices
      .map((item: { productId: string }) => item.productId)
      .filter(
        (productId: string, index: number, allProductIds: string[]) =>
          allProductIds.indexOf(productId) !== index,
      );

    if (duplicateProductIds.length > 0) {
      return NextResponse.json(
        {
          error: "Aynı ürün fiyat listesinde birden fazla kez gönderildi.",
        },
        {
          status: 400,
        },
      );
    }

    const productIds = normalizedPrices.map(
      (item: { productId: string }) => item.productId,
    );

    const existingProducts = await prisma.product.findMany({
      where: {
        id: {
          in: productIds,
        },
        active: true,
      },

      select: {
        id: true,
      },
    });

    if (existingProducts.length !== productIds.length) {
      return NextResponse.json(
        {
          error: "Fiyat listesinde bulunamayan veya pasif ürün var.",
        },
        {
          status: 400,
        },
      );
    }

    const pricesToSave = normalizedPrices.filter(
      (item: {
        productId: string;
        price: number | null;
      }): item is {
        productId: string;
        price: number;
      } => item.price !== null,
    );

    await prisma.$transaction(async (tx) => {
      await tx.dealerPrice.deleteMany({
        where: {
          dealerId: id,
        },
      });

      if (pricesToSave.length > 0) {
        await tx.dealerPrice.createMany({
          data: pricesToSave.map(
            (item: { productId: string; price: number }) => ({
              dealerId: id,
              productId: item.productId,
              price: item.price,
              active: true,
            }),
          ),
        });
      }
    });

    return NextResponse.json({
      message: "Bayi özel fiyatları başarıyla kaydedildi.",
      savedCount: pricesToSave.length,
    });
  } catch (error) {
    console.error("SAVE_DEALER_PRICES_ERROR", error);

    return NextResponse.json(
      {
        error: "Bayi özel fiyatları kaydedilemedi.",
      },
      {
        status: 500,
      },
    );
  }
}
