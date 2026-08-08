import { requireAdminPermission } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { withTenant } from "@/lib/tenant";
import { NextRequest, NextResponse } from "next/server";

export const PATCH = withTenant(async (
  request: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  },
) => {
  const { id } = await context.params;

  const baseline = await requireAdminPermission("viewProducts");

  if (!baseline) {
    return NextResponse.json(
      {
        error: "Bu işlem için yetkiniz yok.",
      },
      {
        status: 403,
      },
    );
  }

  let body: Record<string, unknown>;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        error: "Geçersiz istek gönderildi.",
      },
      {
        status: 400,
      },
    );
  }

  try {
    const existing = await prisma.product.findUnique({
      where: {
        id,
      },
      include: {
        category: true,
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          error: "Ürün bulunamadı.",
        },
        {
          status: 404,
        },
      );
    }

    const hasOwn = (key: string) =>
      Object.prototype.hasOwnProperty.call(body, key);

    const stringValue = (value: unknown) => String(value ?? "").trim();

    const nullableString = (value: unknown) => {
      const result = stringValue(value);

      return result || null;
    };

    const nullableNumber = (value: unknown) => {
      if (value === null || value === undefined || value === "") {
        return null;
      }

      const numberValue = Number(value);

      return Number.isFinite(numberValue) ? numberValue : null;
    };

    const requestedStock = hasOwn("stock")
      ? Number(body.stock)
      : existing.stock;

    if (!Number.isInteger(requestedStock) || requestedStock < 0) {
      return NextResponse.json(
        {
          error: "Stok sıfır veya pozitif tam sayı olmalıdır.",
        },
        {
          status: 400,
        },
      );
    }

    const stockIncreased = requestedStock > existing.stock;

    const stockReduced = requestedStock < existing.stock;

    const requestedPrice = hasOwn("price")
      ? Number(body.price)
      : Number(existing.price);

    if (!Number.isFinite(requestedPrice) || requestedPrice < 0) {
      return NextResponse.json(
        {
          error: "Geçerli bir fiyat girin.",
        },
        {
          status: 400,
        },
      );
    }

    const priceChanged =
      hasOwn("price") && requestedPrice !== Number(existing.price);

    const requestedOldPrice = hasOwn("oldPrice")
      ? nullableNumber(body.oldPrice)
      : existing.oldPrice === null
        ? null
        : Number(existing.oldPrice);

    const existingOldPrice =
      existing.oldPrice === null ? null : Number(existing.oldPrice);

    const oldPriceChanged =
      hasOwn("oldPrice") && requestedOldPrice !== existingOldPrice;

    const requestedIsOffer = hasOwn("isOffer")
      ? body.isOffer === true
      : existing.isOffer;

    const isOfferChanged =
      hasOwn("isOffer") && requestedIsOffer !== existing.isOffer;

    const priceFieldsChanged = priceChanged;

    const offerFieldChanged = oldPriceChanged || isOfferChanged;

    if (requestedOldPrice !== null && !Number.isFinite(requestedOldPrice)) {
      return NextResponse.json(
        {
          error: "Geçerli bir kampanya öncesi fiyat girin.",
        },
        {
          status: 400,
        },
      );
    }

    const detailsChanged =
      (hasOwn("nameTr") &&
        stringValue(body.nameTr) !== stringValue(existing.nameTr)) ||
      (hasOwn("nameDe") &&
        stringValue(body.nameDe) !== stringValue(existing.nameDe)) ||
      (hasOwn("name") &&
        stringValue(body.name) !== stringValue(existing.name)) ||
      (hasOwn("slug") &&
        stringValue(body.slug).toLowerCase() !== existing.slug) ||
      (hasOwn("descriptionTr") &&
        nullableString(body.descriptionTr) !==
          (existing.descriptionTr || null)) ||
      (hasOwn("descriptionDe") &&
        nullableString(body.descriptionDe) !==
          (existing.descriptionDe || null)) ||
      (hasOwn("pfandAmount") &&
        Number(body.pfandAmount) !== Number(existing.pfandAmount)) ||
      (hasOwn("minStock") && Number(body.minStock) !== existing.minStock) ||
      (hasOwn("stockUnit") &&
        String(body.stockUnit) !== String(existing.stockUnit)) ||
      (hasOwn("unitsPerPackage") &&
        Number(body.unitsPerPackage) !== existing.unitsPerPackage) ||
      (hasOwn("packageInfo") &&
        stringValue(body.packageInfo) !== stringValue(existing.packageInfo)) ||
      (hasOwn("imageUrl") &&
        nullableString(body.imageUrl) !== (existing.imageUrl || null)) ||
      (hasOwn("imageScale") &&
        Number(body.imageScale) !== existing.imageScale) ||
      (hasOwn("imagePositionX") &&
        Number(body.imagePositionX) !== existing.imagePositionX) ||
      (hasOwn("imagePositionY") &&
        Number(body.imagePositionY) !== existing.imagePositionY) ||
      (hasOwn("categoryId") &&
        stringValue(body.categoryId) !== existing.categoryId) ||
      (hasOwn("active") && Boolean(body.active) !== existing.active) ||
      (hasOwn("soldOut") && Boolean(body.soldOut) !== existing.soldOut);

    if (detailsChanged) {
      const permission = await requireAdminPermission("updateProduct");

      if (!permission) {
        return NextResponse.json(
          {
            error: "Ürün bilgilerini düzenleme yetkiniz yok.",
          },
          {
            status: 403,
          },
        );
      }
    }

    if (priceFieldsChanged) {
      const permission = await requireAdminPermission("changePrice");

      if (!permission) {
        return NextResponse.json(
          {
            error: "Fiyat değiştirme yetkiniz yok.",
          },
          {
            status: 403,
          },
        );
      }
    }

    if (offerFieldChanged) {
      const permission = await requireAdminPermission("manageOffers");

      if (!permission) {
        return NextResponse.json(
          {
            error: "Kampanyalı ürünleri yönetme yetkiniz yok.",
          },
          {
            status: 403,
          },
        );
      }
    }

    if (stockIncreased) {
      const permission = await requireAdminPermission("addStock");

      if (!permission) {
        return NextResponse.json(
          {
            error: "Stok ekleme yetkiniz yok.",
          },
          {
            status: 403,
          },
        );
      }
    }

    if (stockReduced) {
      const permission = await requireAdminPermission("reduceStock");

      if (!permission) {
        return NextResponse.json(
          {
            error: "Stok azaltma yetkiniz yok.",
          },
          {
            status: 403,
          },
        );
      }
    }

    if (
      !detailsChanged &&
      !priceFieldsChanged &&
      !offerFieldChanged &&
      !stockIncreased &&
      !stockReduced
    ) {
      return NextResponse.json({
        message: "Üründe değişiklik yapılmadı.",
        product: existing,
      });
    }

    const categoryId = hasOwn("categoryId")
      ? stringValue(body.categoryId)
      : existing.categoryId;

    const category = await prisma.category.findUnique({
      where: {
        id: categoryId,
      },
    });

    if (!category) {
      return NextResponse.json(
        {
          error: "Seçilen kategori bulunamadı.",
        },
        {
          status: 404,
        },
      );
    }

    const packageInfo = hasOwn("packageInfo")
      ? stringValue(body.packageInfo)
      : existing.packageInfo || "";

    if (!packageInfo) {
      return NextResponse.json(
        {
          error: "Paket bilgisi zorunludur.",
        },
        {
          status: 400,
        },
      );
    }

    const product = await prisma.product.update({
      where: {
        id,
      },

      data: {
        ...(hasOwn("name") || hasOwn("nameDe")
          ? {
              name: stringValue(body.nameDe || body.name),
            }
          : {}),

        ...(hasOwn("nameTr")
          ? {
              nameTr: stringValue(body.nameTr),
            }
          : {}),

        ...(hasOwn("nameDe")
          ? {
              nameDe: stringValue(body.nameDe),
            }
          : {}),

        ...(hasOwn("slug")
          ? {
              slug: stringValue(body.slug).toLowerCase(),
            }
          : {}),

        ...(hasOwn("descriptionTr")
          ? {
              descriptionTr: nullableString(body.descriptionTr),
            }
          : {}),

        ...(hasOwn("descriptionDe")
          ? {
              descriptionDe: nullableString(body.descriptionDe),
            }
          : {}),

        ...(hasOwn("price")
          ? {
              price: requestedPrice,
            }
          : {}),

        ...(hasOwn("oldPrice")
          ? {
              oldPrice: requestedOldPrice,
            }
          : {}),

        ...(hasOwn("isOffer")
          ? {
              isOffer: requestedIsOffer,
            }
          : {}),

        ...(hasOwn("pfandAmount")
          ? {
              pfandAmount: Number(body.pfandAmount),
            }
          : {}),

        ...(hasOwn("stock")
          ? {
              stock: requestedStock,
            }
          : {}),

        ...(hasOwn("minStock")
          ? {
              minStock: Number(body.minStock),
            }
          : {}),

        ...(hasOwn("stockUnit")
          ? {
              stockUnit: String(body.stockUnit) as
                "KASA" | "KARTON" | "PAKET" | "ADET",
            }
          : {}),

        ...(hasOwn("unitsPerPackage")
          ? {
              unitsPerPackage: Math.max(
                1,
                Math.round(Number(body.unitsPerPackage)),
              ),
            }
          : {}),

        ...(hasOwn("packageInfo")
          ? {
              packageInfo,
              packageCount: null,
              unitAmount: null,
              unitType: null,
            }
          : {}),

        ...(hasOwn("imageUrl")
          ? {
              imageUrl: nullableString(body.imageUrl),
            }
          : {}),

        ...(hasOwn("imageScale")
          ? {
              imageScale: Math.min(8, Math.max(0.25, Number(body.imageScale))),
            }
          : {}),

        ...(hasOwn("imagePositionX")
          ? {
              imagePositionX: Math.min(
                100,
                Math.max(-100, Math.round(Number(body.imagePositionX))),
              ),
            }
          : {}),

        ...(hasOwn("imagePositionY")
          ? {
              imagePositionY: Math.min(
                100,
                Math.max(-100, Math.round(Number(body.imagePositionY))),
              ),
            }
          : {}),

        ...(hasOwn("categoryId")
          ? {
              categoryId,
            }
          : {}),

        ...(hasOwn("active")
          ? {
              active: Boolean(body.active),
            }
          : {}),

        ...(hasOwn("soldOut")
          ? {
              soldOut: Boolean(body.soldOut),
            }
          : {}),
      },

      include: {
        category: true,
      },
    });

    return NextResponse.json({
      message: "Ürün güncellendi.",
      product,
    });
  } catch (error) {
    console.error("UPDATE_PRODUCT_ERROR", error);

    return NextResponse.json(
      {
        error: "Ürün güncellenirken hata oluştu.",
      },
      {
        status: 500,
      },
    );
  }
});

export const DELETE = withTenant(async (
  _request: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  },
) => {
  const admin = await requireAdminPermission("deleteProduct");

  if (!admin) {
    return NextResponse.json(
      {
        error: "Ürün silme yetkiniz yok.",
      },
      {
        status: 403,
      },
    );
  }

  const { id } = await context.params;

  try {
    await prisma.product.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      message: "Ürün silindi.",
    });
  } catch (error) {
    console.error("DELETE_PRODUCT_ERROR", error);

    return NextResponse.json(
      {
        error: "Ürün silinemedi.",
      },
      {
        status: 500,
      },
    );
  }
});
