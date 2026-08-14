import { requireAdminPermission } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { withTenant } from "@/lib/tenant";
import { getRequestLanguage } from "@/lib/request-language";
import { Prisma } from "@prisma/client";
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

  const language = await getRequestLanguage();

  const baseline = await requireAdminPermission("viewProducts");

  if (!baseline) {
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

  let body: Record<string, unknown>;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        error:
          language === "de"
            ? "Ungültige Anfrage gesendet."
            : "Geçersiz istek gönderildi.",
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
          error:
            language === "de"
              ? "Produkt nicht gefunden."
              : "Ürün bulunamadı.",
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
          error:
            language === "de"
              ? "Der Lagerbestand muss null oder eine positive ganze Zahl sein."
              : "Stok sıfır veya pozitif tam sayı olmalıdır.",
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
      (hasOwn("sellByCarton") &&
        Boolean(body.sellByCarton) !== existing.sellByCarton) ||
      (hasOwn("unitsPerCarton") &&
        (body.unitsPerCarton === null || body.unitsPerCarton === undefined
          ? null
          : Math.round(Number(body.unitsPerCarton))) !==
          existing.unitsPerCarton) ||
      (hasOwn("cartonPrice") &&
        (body.cartonPrice === null || body.cartonPrice === undefined
          ? null
          : Number(body.cartonPrice)) !==
          (existing.cartonPrice === null
            ? null
            : Number(existing.cartonPrice))) ||
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
            error:
              language === "de"
                ? "Sie sind nicht berechtigt, Produktinformationen zu bearbeiten."
                : "Ürün bilgilerini düzenleme yetkiniz yok.",
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
            error:
              language === "de"
                ? "Sie sind nicht berechtigt, den Preis zu ändern."
                : "Fiyat değiştirme yetkiniz yok.",
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
            error:
              language === "de"
                ? "Sie sind nicht berechtigt, Angebotsprodukte zu verwalten."
                : "Kampanyalı ürünleri yönetme yetkiniz yok.",
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
            error:
              language === "de"
                ? "Sie sind nicht berechtigt, Lagerbestand hinzuzufügen."
                : "Stok ekleme yetkiniz yok.",
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
            error:
              language === "de"
                ? "Sie sind nicht berechtigt, Lagerbestand zu reduzieren."
                : "Stok azaltma yetkiniz yok.",
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
        message:
          language === "de"
            ? "Am Produkt wurde nichts geändert."
            : "Üründe değişiklik yapılmadı.",
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

    const packageInfo = hasOwn("packageInfo")
      ? stringValue(body.packageInfo)
      : existing.packageInfo || "";

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

        ...(hasOwn("sellByCarton")
          ? {
              sellByCarton: Boolean(body.sellByCarton),
            }
          : {}),

        ...(hasOwn("unitsPerCarton")
          ? {
              unitsPerCarton:
                body.unitsPerCarton === null ||
                body.unitsPerCarton === undefined
                  ? null
                  : Math.max(1, Math.round(Number(body.unitsPerCarton))),
            }
          : {}),

        ...(hasOwn("cartonPrice")
          ? {
              cartonPrice:
                body.cartonPrice === null || body.cartonPrice === undefined
                  ? null
                  : Math.max(0, Number(body.cartonPrice)),
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
      message:
        language === "de" ? "Produkt aktualisiert." : "Ürün güncellendi.",
      product,
    });
  } catch (error) {
    console.error("UPDATE_PRODUCT_ERROR", error);

    return NextResponse.json(
      {
        error:
          language === "de"
            ? "Beim Aktualisieren des Produkts ist ein Fehler aufgetreten."
            : "Ürün güncellenirken hata oluştu.",
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

  const language = await getRequestLanguage();

  if (!admin) {
    return NextResponse.json(
      {
        error:
          language === "de"
            ? "Sie sind nicht berechtigt, Produkte zu löschen."
            : "Ürün silme yetkiniz yok.",
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
      message: language === "de" ? "Produkt gelöscht." : "Ürün silindi.",
    });
  } catch (error) {
    /*
     * Sipariş, kasa alımı veya şoför stok geçmişi bulunan ürünler
     * foreign key kısıtı nedeniyle kalıcı olarak silinemez. Bu
     * durumda geçmiş kayıtları bozmadan ürünü pasife alıyoruz.
     */
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      try {
        await prisma.product.update({
          where: {
            id,
          },
          data: {
            active: false,
          },
        });

        return NextResponse.json({
          message:
            language === "de"
              ? "Dieses Produkt hat bereits Bestell-, Kassen- oder Fahrerbestandshistorie und kann daher nicht endgültig gelöscht werden. Es wurde stattdessen deaktiviert und ist im Shop nicht mehr sichtbar."
              : "Bu ürünün sipariş, kasa veya şoför stok geçmişi olduğu için kalıcı olarak silinemiyor. Bunun yerine pasife alındı ve mağazada artık görünmeyecek.",
        });
      } catch (deactivateError) {
        console.error("DEACTIVATE_PRODUCT_ERROR", deactivateError);
      }
    }

    console.error("DELETE_PRODUCT_ERROR", error);

    return NextResponse.json(
      {
        error:
          language === "de"
            ? "Produkt konnte nicht gelöscht werden."
            : "Ürün silinemedi.",
      },
      {
        status: 500,
      },
    );
  }
});
