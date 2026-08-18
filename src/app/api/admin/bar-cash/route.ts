import { getAdminWithPermissions } from "@/lib/admin-auth";
import { getRequestLanguage } from "@/lib/request-language";
import { prisma } from "@/lib/prisma";
import { withTenant } from "@/lib/tenant";
import { NextRequest, NextResponse } from "next/server";

const allowedCategories = [
  "PFAND_COLLECTION",
  "SUPPLIER_PAYMENT",
  "GOODS_PURCHASE",
  "FUEL",
  "PERSONNEL",
  "RENT",
  "MANUAL_INCOME",
  "OTHER_EXPENSE",
  "CASH_HANDOVER",
] as const;

type AllowedCategory = (typeof allowedCategories)[number];

function serializeMovement(movement: any) {
  return {
    ...movement,
    amount: Number(movement.amount),

    purchaseItems: Array.isArray(movement.purchaseItems)
      ? movement.purchaseItems.map((item: any) => ({
          ...item,
          unitPrice: Number(item.unitPrice),

          totalAmount: Number(item.totalAmount),

          packagePrice:
            item.packagePrice !== null && item.packagePrice !== undefined
              ? Number(item.packagePrice)
              : null,
        }))
      : [],
  };
}

export const GET = withTenant(async () => {
  const language = await getRequestLanguage();
  const admin = await getAdminWithPermissions();

  if (!admin || (!admin.isSuperAdmin && !admin.permissions.viewBarCash)) {
    return NextResponse.json(
      {
        error:
          language === "de"
            ? "Sie sind nicht berechtigt, die Kasse einzusehen."
            : "Gerçek kasayı görüntüleme yetkiniz yok.",
      },
      {
        status: 403,
      },
    );
  }

  try {
    const [movements, products] = await Promise.all([
      prisma.cashMovement.findMany({
        where: {
          accountType: "BAR",
        },

        include: {
          supplier: true,

          purchaseItems: {
            orderBy: {
              productName: "asc",
            },
          },
        },

        orderBy: {
          createdAt: "desc",
        },

        take: 500,
      }),

      prisma.product.findMany({
        where: {
          active: true,
        },

        select: {
          id: true,
          name: true,
          nameTr: true,
          nameDe: true,
          stock: true,
          stockUnit: true,
          purchasePrice: true,
          price: true,
          pfandAmount: true,
          packageInfo: true,
          categoryId: true,

          category: {
            select: {
              id: true,
              name: true,
              nameTr: true,
              nameDe: true,
            },
          },
        },

        orderBy: {
          name: "asc",
        },
      }),
    ]);

    const serialized = movements.map(serializeMovement);

    const totalIn = serialized
      .filter((item) => item.direction === "IN")
      .reduce((total, item) => total + item.amount, 0);

    /*
     * Kassenübergabe verlässt die Kasse nicht — das Geld bleibt im
     * Unternehmen, nur die verantwortliche Person wechselt. Zählt daher
     * nicht als Ausgabe und verringert den Kassenstand nicht.
     */
    const totalOut = serialized
      .filter(
        (item) => item.direction === "OUT" && item.category !== "CASH_HANDOVER",
      )
      .reduce((total, item) => total + item.amount, 0);

    return NextResponse.json({
      movements: serialized,

      products: products.map((product) => ({
        ...product,
        purchasePrice: Number(product.purchasePrice),
        price: Number(product.price),
        pfandAmount: Number(product.pfandAmount),
      })),

      summary: {
        totalIn: Number(totalIn.toFixed(2)),
        totalOut: Number(totalOut.toFixed(2)),
        balance: Number((totalIn - totalOut).toFixed(2)),
      },

      permissions: admin.permissions,
    });
  } catch (error) {
    console.error("LOAD_REAL_CASH_ERROR", error);

    return NextResponse.json(
      {
        error:
          language === "de"
            ? "Kasse konnte nicht geladen werden."
            : "Gerçek kasa yüklenemedi.",
      },
      {
        status: 500,
      },
    );
  }
});

export const POST = withTenant(async (request: NextRequest, _context, tenant) => {
  const language = await getRequestLanguage();
  const admin = await getAdminWithPermissions();

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

  let idempotencyKey: string | null = null;

  try {
    const body = await request.json();

    idempotencyKey = String(body.idempotencyKey || "").trim() || null;

    if (idempotencyKey) {
      const existingKey = await prisma.idempotencyKey.findFirst({
        where: {
          key: idempotencyKey,
        },
      });

      if (existingKey) {
        const existingMovement = await prisma.cashMovement.findUnique({
          where: {
            id: existingKey.resultId,
          },
          include: {
            purchaseItems: true,
          },
        });

        if (existingMovement) {
          return NextResponse.json({
            message:
              language === "de"
                ? "Kassenbewegung wurde gespeichert."
                : "Kasa hareketi kaydedildi.",
            movement: serializeMovement(existingMovement),
          });
        }
      }
    }

    const direction = String(body.direction || "");

    const category = String(body.category || "") as AllowedCategory;

    const companyName = String(body.companyName || "").trim();

    const supplierId = String(body.supplierId || "").trim();

    const description = String(body.description || "").trim();

    if (direction !== "IN" && direction !== "OUT") {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Ungültige Kassenbewegung."
              : "Geçersiz kasa hareketi.",
        },
        {
          status: 400,
        },
      );
    }

    if (!allowedCategories.includes(category)) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Ungültige Kassenkategorie."
              : "Geçersiz kasa kategorisi.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      direction === "IN" &&
      !admin.isSuperAdmin &&
      !admin.permissions.createBarCashIncome
    ) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Sie sind nicht berechtigt, Geldeingänge in der Kasse zu erfassen."
              : "Kasaya para girişi yapma yetkiniz yok.",
        },
        {
          status: 403,
        },
      );
    }

    /*
     * Kassenübergabe (CASH_HANDOVER) hat eine eigene, von
     * createBarCashExpense unabhängige Berechtigung — genau dafür
     * gedacht, dass Admins ohne vollen Kassenzugriff (viewBarCash)
     * trotzdem eine Übergabe vom Kassenbericht aus erfassen können.
     */
    const canCreateOutMovement =
      admin.isSuperAdmin ||
      admin.permissions.createBarCashExpense ||
      (category === "CASH_HANDOVER" && admin.permissions.createCashHandover);

    if (direction === "OUT" && !canCreateOutMovement) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Sie sind nicht berechtigt, Geldausgänge aus der Kasse zu erfassen."
              : "Kasadan para çıkışı yapma yetkiniz yok.",
        },
        {
          status: 403,
        },
      );
    }

    /*
     * MAL ALIMI
     *
     * Aynı transaction içinde:
     * - kasa çıkışı
     * - stok artışı
     * - stok hareketi
     * - alış fiyatı güncellemesi
     */
    if (category === "GOODS_PURCHASE") {
      if (direction !== "OUT") {
        return NextResponse.json(
          {
            error:
              language === "de"
                ? "Ein Wareneinkauf kann nur als Geldausgang gebucht werden."
                : "Mal alımı yalnızca para çıkışı olarak kaydedilebilir.",
          },
          {
            status: 400,
          },
        );
      }

      if (!supplierId) {
        return NextResponse.json(
          {
            error:
              language === "de"
                ? "Für einen Wareneinkauf muss ein hinterlegter Lieferant ausgewählt werden."
                : "Mal alımında kayıtlı bir firma seçilmelidir.",
          },
          {
            status: 400,
          },
        );
      }

      const supplier = await prisma.supplier.findFirst({
        where: {
          id: supplierId,
          active: true,
        },

        select: {
          id: true,
          name: true,
        },
      });

      if (!supplier) {
        return NextResponse.json(
          {
            error:
              language === "de"
                ? "Der ausgewählte Lieferant wurde nicht gefunden oder ist nicht aktiv."
                : "Seçilen firma bulunamadı veya aktif değil.",
          },
          {
            status: 400,
          },
        );
      }

      const rawItems = Array.isArray(body.purchaseItems)
        ? body.purchaseItems
        : [];

      if (rawItems.length === 0) {
        return NextResponse.json(
          {
            error:
              language === "de"
                ? "Fügen Sie mindestens ein Produkt hinzu."
                : "En az bir ürün ekleyin.",
          },
          {
            status: 400,
          },
        );
      }

      const activeStockUnitOptions = await prisma.stockUnitOption.findMany({
        where: {
          active: true,
        },
        select: {
          code: true,
        },
      });

      const validStockUnitCodes = new Set(
        activeStockUnitOptions.map((unit) => unit.code),
      );

      const requestedItems: Array<{
        productId: string;
        packageCount: number;
        unitsPerPackage: number;
        packagePrice: number;
        purchaseUnit: string;
        stockUnit: string;
        salePrice: number;
        pfandAmount: number;
      }> = [];

      const seenProductIds = new Set<string>();

      for (const rawItem of rawItems) {
        const productId = String(rawItem?.productId || "").trim();

        const packageCount = Number(rawItem?.packageCount);

        const unitsPerPackage = Number(rawItem?.unitsPerPackage);

        const packagePrice = Number(rawItem?.packagePrice);

        const purchaseUnit = String(rawItem?.purchaseUnit || "ADET")
          .trim()
          .toLocaleUpperCase("tr-TR");

        const stockUnit = String(rawItem?.stockUnit || "ADET")
          .trim()
          .toLocaleUpperCase("tr-TR");

        const salePrice = Number(rawItem?.salePrice);

        const pfandAmount = Number(rawItem?.pfandAmount || 0);

        if (!productId) {
          return NextResponse.json(
            {
              error:
                language === "de"
                  ? "Bei einer der Wareneinkaufspositionen wurde kein Produkt ausgewählt."
                  : "Mal alımı kalemlerinden birinde ürün seçilmedi.",
            },
            {
              status: 400,
            },
          );
        }

        if (seenProductIds.has(productId)) {
          return NextResponse.json(
            {
              error:
                language === "de"
                  ? "Dasselbe Produkt kann nicht zweimal in einen Wareneinkauf aufgenommen werden."
                  : "Aynı ürün mal alımına iki kez eklenemez.",
            },
            {
              status: 400,
            },
          );
        }

        if (!Number.isInteger(packageCount) || packageCount <= 0) {
          return NextResponse.json(
            {
              error:
                language === "de"
                  ? "Die eingekaufte Verpackungsmenge muss eine positive ganze Zahl sein."
                  : "Alınan ambalaj miktarı pozitif tam sayı olmalıdır.",
            },
            {
              status: 400,
            },
          );
        }

        if (!Number.isInteger(unitsPerPackage) || unitsPerPackage <= 0) {
          return NextResponse.json(
            {
              error:
                language === "de"
                  ? "Der Verpackungsinhalt muss eine positive ganze Zahl sein."
                  : "Ambalaj içeriği pozitif tam sayı olmalıdır.",
            },
            {
              status: 400,
            },
          );
        }

        if (!validStockUnitCodes.has(purchaseUnit)) {
          return NextResponse.json(
            {
              error:
                language === "de"
                  ? "Ungültige Einkaufsverpackung."
                  : "Geçersiz alış ambalajı.",
            },
            {
              status: 400,
            },
          );
        }

        if (!validStockUnitCodes.has(stockUnit)) {
          return NextResponse.json(
            {
              error:
                language === "de"
                  ? "Ungültige Verkaufseinheit."
                  : "Geçersiz satış birimi.",
            },
            {
              status: 400,
            },
          );
        }

        if (!Number.isFinite(packagePrice) || packagePrice <= 0) {
          return NextResponse.json(
            {
              error:
                language === "de"
                  ? "Der Einkaufspreis der Verpackung muss größer als null sein."
                  : "Ambalaj alış fiyatı sıfırdan büyük olmalıdır.",
            },
            {
              status: 400,
            },
          );
        }

        if (!Number.isFinite(salePrice) || salePrice < 0) {
          return NextResponse.json(
            {
              error:
                language === "de"
                  ? "Der Verkaufspreis des Produkts ist ungültig."
                  : "Ürün satış fiyatı geçersiz.",
            },
            {
              status: 400,
            },
          );
        }

        if (!Number.isFinite(pfandAmount) || pfandAmount < 0) {
          return NextResponse.json(
            {
              error:
                language === "de"
                  ? "Der Pfandbetrag ist ungültig."
                  : "Pfand tutarı geçersiz.",
            },
            {
              status: 400,
            },
          );
        }

        seenProductIds.add(productId);

        requestedItems.push({
          productId,
          packageCount,
          unitsPerPackage,
          packagePrice,
          purchaseUnit,
          stockUnit,
          salePrice,
          pfandAmount,
        });
      }

      const products = await prisma.product.findMany({
        where: {
          id: {
            in: requestedItems.map((item) => item.productId),
          },
          active: true,
        },

        select: {
          id: true,
          name: true,
          nameTr: true,
          nameDe: true,
        },
      });

      if (products.length !== requestedItems.length) {
        return NextResponse.json(
          {
            error:
              language === "de"
                ? "Eines der ausgewählten Produkte wurde nicht gefunden oder ist nicht aktiv."
                : "Seçilen ürünlerden biri bulunamadı veya aktif değil.",
          },
          {
            status: 400,
          },
        );
      }

      const productMap = new Map(
        products.map((product) => [product.id, product]),
      );

      const preparedItems = requestedItems.map((item) => {
        const product = productMap.get(item.productId);

        if (!product) {
          throw new Error("PURCHASE_PRODUCT_NOT_FOUND");
        }

        const productName = product.nameTr || product.nameDe || product.name;

        /*
         * Stok satış birimi üzerinden tutulur.
         *
         * Aynı birim:
         * 10 kasa alınır, kasa satılır -> stok +10 kasa
         *
         * Farklı birim:
         * 10 karton alınır, her kartonda 24 adet vardır,
         * adet satılır -> stok +240 adet
         */
        const quantity =
          item.purchaseUnit === item.stockUnit
            ? item.packageCount
            : item.packageCount * item.unitsPerPackage;

        const unitPrice = item.packagePrice;

        const totalAmount = Number(
          (item.packageCount * item.packagePrice).toFixed(2),
        );

        return {
          ...item,
          productName,
          quantity,
          unitPrice,
          totalAmount,
        };
      });

      const amount = Number(
        preparedItems
          .reduce((total, item) => total + item.totalAmount, 0)
          .toFixed(2),
      );

      if (amount <= 0) {
        return NextResponse.json(
          {
            error:
              language === "de"
                ? "Der Gesamtbetrag des Wareneinkaufs muss größer als null sein."
                : "Mal alımı toplam tutarı sıfırdan büyük olmalıdır.",
          },
          {
            status: 400,
          },
        );
      }

      const movement = await prisma.$transaction(async (tx) => {
        const createdMovement = await tx.cashMovement.create({
          data: {
            tenantId: tenant.id,
            accountType: "BAR",
            direction: "OUT",
            category: "GOODS_PURCHASE",
            amount,

            supplierId: supplier.id,

            companyName: supplier.name,

            description:
              description ||
              (language === "de"
                ? `Wareneinkauf: ${supplier.name}`
                : `Mal alımı: ${supplier.name}`),

            createdById: admin.user.id,

            purchaseItems: {
              create: preparedItems.map((item) => ({
                productId: item.productId,
                productName: item.productName,
                quantity: item.quantity,

                purchaseUnit: item.purchaseUnit,

                stockUnit: item.stockUnit,

                unitPrice: item.unitPrice,

                totalAmount: item.totalAmount,

                packageCount: item.packageCount,

                unitsPerPackage: item.unitsPerPackage,

                packagePrice: item.packagePrice,
              })),
            },
          },

          include: {
            purchaseItems: true,
          },
        });

        if (idempotencyKey) {
          await tx.idempotencyKey.create({
            data: {
              tenantId: tenant.id,
              key: idempotencyKey,
              scope: "bar-cash-movement",
              resultId: createdMovement.id,
            },
          });
        }

        for (const item of preparedItems) {
          await tx.product.update({
            where: {
              id: item.productId,
            },

            data: {
              stock: {
                increment: item.quantity,
              },

              purchasePrice: item.unitPrice,

              price: item.salePrice,

              pfandAmount: item.pfandAmount,

              stockUnit: item.stockUnit,

              unitsPerPackage: item.unitsPerPackage,
            },
          });

          await tx.stockMovement.create({
            data: {
              tenantId: tenant.id,
              productId: item.productId,
              amount: item.quantity,
              reason:
                `Mal alımı ${supplier.name} · ` +
                `${item.packageCount} ${item.purchaseUnit.toLocaleLowerCase("tr-TR")} alındı · ` +
                `${item.quantity} ${item.stockUnit.toLocaleLowerCase("tr-TR")} stoğa eklendi · ` +
                `Ambalaj içeriği ${item.unitsPerPackage} ${item.stockUnit.toLocaleLowerCase("tr-TR")} · ` +
                `Ambalaj alış fiyatı ${item.packagePrice.toFixed(2)} € · ` +
                `Satış fiyatı ${item.salePrice.toFixed(2)} € · ` +
                `Pfand ${item.pfandAmount.toFixed(2)} € · ` +
                `Kasa hareketi: ${createdMovement.id}`,
            },
          });
        }

        return createdMovement;
      });

      return NextResponse.json(
        {
          message:
            language === "de"
              ? `Wareneinkauf gespeichert. ` +
                `${preparedItems.reduce((total, item) => total + item.packageCount, 0)} Kiste(n) wurden dem Lager hinzugefügt und ` +
                `${amount.toFixed(2)} € aus der Kasse abgebucht.`
              : `Mal alımı kaydedildi. ` +
                `${preparedItems.reduce((total, item) => total + item.packageCount, 0)} kasa stoğa eklendi ve ` +
                `${amount.toFixed(2)} € kasadan düşüldü.`,

          movement: serializeMovement(movement),
        },
        {
          status: 201,
        },
      );
    }

    const amount = Number(body.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Geben Sie einen gültigen Betrag ein."
              : "Geçerli bir tutar girin.",
        },
        {
          status: 400,
        },
      );
    }

    const movement = await prisma.$transaction(async (tx) => {
      const createdMovement = await tx.cashMovement.create({
        data: {
          tenantId: tenant.id,
          accountType: "BAR",
          direction,
          category,
          amount: Number(amount.toFixed(2)),

          supplierId: supplierId || null,

          companyName: companyName || null,

          description: description || null,

          createdById: admin.user.id,
        },

        include: {
          purchaseItems: true,
        },
      });

      if (idempotencyKey) {
        await tx.idempotencyKey.create({
          data: {
            tenantId: tenant.id,
            key: idempotencyKey,
            scope: "bar-cash-movement",
            resultId: createdMovement.id,
          },
        });
      }

      return createdMovement;
    });

    return NextResponse.json(
      {
        message:
          direction === "IN"
            ? language === "de"
              ? "Geldeingang in der Kasse wurde gespeichert."
              : "Gerçek kasaya para girişi kaydedildi."
            : language === "de"
              ? "Geldausgang aus der Kasse wurde gespeichert."
              : "Gerçek kasadan para çıkışı kaydedildi.",

        movement: serializeMovement(movement),
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("CREATE_REAL_CASH_ERROR", error);

    /*
     * Aynı idempotency key ile eşzamanlı iki istek gelirse biri bu
     * kaydı oluşturur, diğeri benzersizlik kısıtına çarpar. Hata
     * döndürmek yerine kazanan isteğin hareketini döndürüyoruz.
     */
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "P2002" &&
      idempotencyKey
    ) {
      const existingKey = await prisma.idempotencyKey.findFirst({
        where: { key: idempotencyKey },
      });

      const existingMovement = existingKey
        ? await prisma.cashMovement.findUnique({
            where: { id: existingKey.resultId },
            include: { purchaseItems: true },
          })
        : null;

      if (existingMovement) {
        return NextResponse.json({
          message: "Kasa hareketi kaydedildi.",
          movement: serializeMovement(existingMovement),
        });
      }
    }

    return NextResponse.json(
      {
        error: "Kasa hareketi kaydedilemedi.",
      },
      {
        status: 500,
      },
    );
  }
});

export const DELETE = withTenant(async (request: NextRequest) => {
  const language = await getRequestLanguage();

  const admin = await getAdminWithPermissions();

  if (
    !admin ||
    (!admin.isSuperAdmin && !admin.permissions.deleteBarCashMovement)
  ) {
    return NextResponse.json(
      {
        error:
          language === "de"
            ? "Sie sind nicht berechtigt, Kassenbewegungen zu löschen."
            : "Kasa hareketini silme yetkiniz yok.",
      },
      {
        status: 403,
      },
    );
  }

  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          error: "Kasa hareketi seçilmedi.",
        },
        {
          status: 400,
        },
      );
    }

    const existing = await prisma.cashMovement.findFirst({
      where: {
        id,
        accountType: "BAR",
      },

      select: {
        id: true,
        category: true,
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Kassenbewegung nicht gefunden."
              : "Kasa hareketi bulunamadı.",
        },
        {
          status: 404,
        },
      );
    }

    if (existing.category === "BAR_SALE") {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Automatisch erstellte Bar-Verkaufsbuchungen können nicht gelöscht werden."
              : "Otomatik oluşturulan bar satışı hareketi silinemez.",
        },
        {
          status: 409,
        },
      );
    }

    if (existing.category === "GOODS_PURCHASE") {
      return NextResponse.json(
        {
          error:
            "Stoğa bağlanmış mal alımı doğrudan silinemez. " +
            "Stok ve kasa için iptal/ters kayıt yapılmalıdır.",
        },
        {
          status: 409,
        },
      );
    }

    await prisma.cashMovement.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      message: "Kasa hareketi silindi.",
    });
  } catch (error) {
    console.error("DELETE_REAL_CASH_ERROR", error);

    return NextResponse.json(
      {
        error: "Kasa hareketi silinemedi.",
      },
      {
        status: 500,
      },
    );
  }
});
