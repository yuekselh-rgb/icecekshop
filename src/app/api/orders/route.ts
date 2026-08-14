import { randomBytes } from "node:crypto";
import { getSession } from "@/lib/session";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { withTenant } from "@/lib/tenant";
import { NextRequest, NextResponse } from "next/server";

type RequestedUnit = "PIECE" | "CARTON";

type RequestedItem = {
  productId: string;
  quantity: number;
  unit: RequestedUnit;
};

function createOrderNumber() {
  const date = new Date();

  const datePart = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("");

  const timePart = [
    String(date.getHours()).padStart(2, "0"),
    String(date.getMinutes()).padStart(2, "0"),
    String(date.getSeconds()).padStart(2, "0"),
  ].join("");

  const randomPart = Math.random().toString(36).slice(2, 7).toUpperCase();

  return `PM-${datePart}-${timePart}-${randomPart}`;
}

type RequestedPfandItem = {
  name: string;
  quantity: number;
  unitAmount: number;
};

function normalizePfandItems(value: unknown): RequestedPfandItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const result: RequestedPfandItem[] = [];

  for (const rawItem of value) {
    if (!rawItem || typeof rawItem !== "object") {
      continue;
    }

    const raw = rawItem as {
      name?: unknown;
      quantity?: unknown;
      unitAmount?: unknown;
    };

    const name = String(raw.name ?? "").trim();

    const quantity = Number(raw.quantity);

    const rawUnitAmount = Number(
      String(raw.unitAmount ?? "").replace(",", "."),
    );

    if (
      !name ||
      !Number.isInteger(quantity) ||
      quantity <= 0 ||
      quantity > 500 ||
      !Number.isFinite(rawUnitAmount)
    ) {
      continue;
    }

    let unitAmount: number | null = null;

    if (Math.abs(rawUnitAmount - 0.25) < 0.01) {
      unitAmount = 0.25;
    } else if (Math.abs(rawUnitAmount - 0.08) < 0.01) {
      unitAmount = 0.08;
    } else if (Math.abs(rawUnitAmount - 0.15) < 0.01) {
      unitAmount = 0.15;
    } else if (Math.abs(rawUnitAmount - 3.3) < 0.01) {
      unitAmount = 3.3;
    }

    if (unitAmount === null) {
      continue;
    }

    result.push({
      name,
      quantity,
      unitAmount,
    });
  }

  return result;
}

function normalizeItems(value: unknown): RequestedItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  /*
   * Dieselbe Produkt-ID kann zweimal vorkommen: einmal stückweise,
   * einmal im Karton. Der Dedup-Schlüssel enthält deshalb die Einheit.
   */
  const quantityByKey = new Map<string, RequestedItem>();

  for (const rawItem of value) {
    if (!rawItem || typeof rawItem !== "object") {
      continue;
    }

    const productId = String(
      (
        rawItem as {
          productId?: unknown;
        }
      ).productId || "",
    ).trim();

    const quantity = Number(
      (
        rawItem as {
          quantity?: unknown;
        }
      ).quantity,
    );

    const rawUnit = (
      rawItem as {
        unit?: unknown;
      }
    ).unit;

    const unit: RequestedUnit = rawUnit === "CARTON" ? "CARTON" : "PIECE";

    if (
      !productId ||
      !Number.isInteger(quantity) ||
      quantity <= 0 ||
      quantity > 999
    ) {
      continue;
    }

    const key = `${productId}::${unit}`;

    const existing = quantityByKey.get(key);

    quantityByKey.set(key, {
      productId,
      unit,
      quantity: (existing?.quantity || 0) + quantity,
    });
  }

  return Array.from(quantityByKey.values());
}

export const POST = withTenant(async (request: NextRequest, _context, tenant) => {
  const language: "de" | "tr" =
    new URL(request.url).searchParams.get("lang") === "de" ? "de" : "tr";

  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      {
        error:
          language === "de"
            ? "Bitte melden Sie sich an, um eine Bestellung aufzugeben."
            : "Sipariş vermek için giriş yapmalısınız.",
      },
      {
        status: 401,
      },
    );
  }

  if (!["CUSTOMER", "DEALER"].includes(session.role)) {
    return NextResponse.json(
      {
        error:
          language === "de"
            ? "Mit diesem Konto kann keine Bestellung erstellt werden."
            : "Bu hesapla sipariş oluşturulamaz.",
      },
      {
        status: 403,
      },
    );
  }

  try {
    const body = await request.json();

    const items = normalizeItems(body.items);

    const pfandItems = normalizePfandItems(body.pfandItems);

    if (items.length === 0) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Der Warenkorb ist leer oder ungültig."
              : "Sipariş sepeti boş veya geçersiz.",
        },
        {
          status: 400,
        },
      );
    }

    const firstName = String(body.firstName || "").trim();

    const lastName = String(body.lastName || "").trim();

    const phone = String(body.phone || "").trim();

    const street = String(body.street || "").trim();

    const houseNumber = String(body.houseNumber || "").trim();

    const postalCode = String(body.postalCode || "").trim();

    const city = String(body.city || "").trim();

    const country = String(body.country || "Deutschland").trim();

    const floor = String(body.floor || "").trim();

    const doorbellName = String(body.doorbellName || "").trim();

    const customerNote = String(body.customerNote || "")
      .trim()
      .slice(0, 1000);

    const isDealer = session.role === "DEALER";

    const dealerProfile = isDealer
      ? await prisma.dealerProfile.findFirst({
          where: {
            userId: session.userId,
            active: true,
          },
          select: {
            dealerNumber: true,
            companyName: true,
            contactName: true,
            phone: true,
            taxNumber: true,
          },
        })
      : null;

    if (isDealer && !dealerProfile) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Kein aktives Händlerprofil gefunden."
              : "Aktif bayi profili bulunamadı.",
        },
        {
          status: 404,
        },
      );
    }

    if (
      !isDealer &&
      (!firstName ||
        !lastName ||
        !phone ||
        !street ||
        !houseNumber ||
        !postalCode ||
        !city ||
        !country)
    ) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Bitte füllen Sie die Liefer- und Kontaktdaten vollständig aus."
              : "Teslimat ve iletişim bilgilerini eksiksiz doldurun.",
        },
        {
          status: 400,
        },
      );
    }

    if (!isDealer && !/^\d{5}$/.test(postalCode)) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Geben Sie eine gültige 5-stellige Postleitzahl ein."
              : "Geçerli bir 5 haneli posta kodu girin.",
        },
        {
          status: 400,
        },
      );
    }

    const productIds = Array.from(
      new Set(items.map((item) => item.productId)),
    );

    const products = await prisma.product.findMany({
      where: {
        id: {
          in: productIds,
        },
        active: true,
        soldOut: false,
      },

      select: {
        id: true,
        name: true,
        nameTr: true,
        nameDe: true,
        price: true,
        pfandAmount: true,
        stock: true,
        sellByCarton: true,
        unitsPerCarton: true,
        cartonPrice: true,
      },
    });

    if (products.length !== productIds.length) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Ein Produkt in Ihrem Warenkorb ist nicht mehr verfügbar."
              : "Sepette artık satışta olmayan bir ürün bulunuyor.",
        },
        {
          status: 409,
        },
      );
    }

    const productById = new Map(
      products.map((product) => [product.id, product]),
    );

    /*
     * Bayi özel fiyatı sadece ürün fiyatıdır.
     * Pfand ürün üzerinden sabit olarak ayrıca hesaplanır.
     */
    const dealerPrices = isDealer
      ? await prisma.dealerPrice.findMany({
          where: {
            dealerId: session.userId,
            active: true,
            productId: {
              in: productIds,
            },
          },
          select: {
            productId: true,
            price: true,
          },
        })
      : [];

    const dealerPriceMap = new Map(
      dealerPrices.map((dealerPrice) => [
        dealerPrice.productId,
        Number(dealerPrice.price),
      ]),
    );

    let subtotal = 0;
    let pfandAmount = 0;

    const preparedItems = items.map((item) => {
      const product = productById.get(item.productId);

      if (!product) {
        throw new Error("PRODUCT_NOT_FOUND");
      }

      const isCarton = item.unit === "CARTON";

      if (
        isCarton &&
        (!product.sellByCarton ||
          !product.unitsPerCarton ||
          product.cartonPrice === null)
      ) {
        throw new Error(`CARTON_NOT_AVAILABLE:${product.name}`);
      }

      const unitsPerCarton = isCarton ? Number(product.unitsPerCarton) : 1;

      const stockDeduction = item.quantity * unitsPerCarton;

      if (product.stock < stockDeduction) {
        throw new Error(`INSUFFICIENT_STOCK:${product.name}:${product.stock}`);
      }

      const normalPrice = isCarton
        ? Number(product.cartonPrice)
        : Number(product.price);

      const price = !isCarton && isDealer
        ? (dealerPriceMap.get(product.id) ?? normalPrice)
        : normalPrice;

      const unitPfand = Number(product.pfandAmount) * unitsPerCarton;

      subtotal += price * item.quantity;

      pfandAmount += unitPfand * item.quantity;

      return {
        productId: product.id,

        name: product.nameTr || product.nameDe || product.name,

        price,
        quantity: item.quantity,

        pfand: unitPfand,

        stockDeduction,

        unitLabel: isCarton ? "Karton" : null,
      };
    });

    subtotal = Number(subtotal.toFixed(2));

    pfandAmount = Number(pfandAmount.toFixed(2));

    if (!isDealer) {
      const companySettings = await prisma.companySetting.findUnique({
        where: {
          tenantId: tenant.id,
        },
        select: {
          minOrderValueEnabled: true,
          minOrderValue: true,
        },
      });

      const minOrderValue = companySettings?.minOrderValue
        ? Number(companySettings.minOrderValue)
        : 0;

      if (
        companySettings?.minOrderValueEnabled &&
        minOrderValue > 0 &&
        subtotal < minOrderValue
      ) {
        return NextResponse.json(
          {
            error:
              language === "de"
                ? `Der Mindestbestellwert beträgt ${minOrderValue.toFixed(2)} €. Bitte fügen Sie weitere Artikel hinzu.`
                : `Minimum sipariş tutarı ${minOrderValue.toFixed(2)} €. Lütfen sepetinize ürün ekleyin.`,
          },
          {
            status: 400,
          },
        );
      }
    }

    const pfandReturnAmount = Number(
      pfandItems
        .reduce((total, item) => total + item.quantity * item.unitAmount, 0)
        .toFixed(2),
    );

    if (pfandReturnAmount > 500) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Die angegebene Pfandrückgabe ist zu hoch. Bitte wickeln Sie größere Rückgaben persönlich mit dem Fahrer ab."
              : "Beyan edilen Pfand iadesi çok yüksek. Lütfen büyük miktarlardaki iadeleri şoförünüzle yerinde gerçekleştirin.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * Bayiler siparişi depodan kendileri teslim alır.
     * Sipariş miktarı ve tutarı ne olursa olsun teslimat ücreti yoktur.
     */
    const deliveryFee = isDealer ? 0 : subtotal >= 100 ? 0 : 7.9;

    const totalAmount = Number(
      Math.max(
        0,
        subtotal + pfandAmount + deliveryFee - pfandReturnAmount,
      ).toFixed(2),
    );

    const deliveryAddress = isDealer
      ? [
          "DEPODAN TESLİM",
          `Bayi: ${dealerProfile?.companyName || "-"}`,
          dealerProfile?.dealerNumber
            ? `Bayi No: ${dealerProfile.dealerNumber}`
            : null,
          dealerProfile?.contactName
            ? `Yetkili: ${dealerProfile.contactName}`
            : null,
          `Telefon: ${dealerProfile?.phone || phone || "-"}`,
          dealerProfile?.taxNumber
            ? `Vergi No: ${dealerProfile.taxNumber}`
            : null,
        ]
          .filter(Boolean)
          .join("\n")
      : [
          `${firstName} ${lastName}`,
          `${street} ${houseNumber}`,
          floor ? `Kat: ${floor}` : null,
          doorbellName ? `Zil: ${doorbellName}` : null,
          `${postalCode} ${city}`,
          country,
          `Telefon: ${phone}`,
        ]
          .filter(Boolean)
          .join("\n");

    const orderNumber = createOrderNumber();

    /*
     * Bestellbestätigung per E-Mail-Link (Schutz vor Spaß-/Fake-Bestellungen):
     * Kundenbestellungen brauchen einen Bestätigungsklick, bevor Personal sie
     * bearbeiten kann. Händler sind bereits von der Firma geprüfte Konten,
     * daher werden ihre Bestellungen direkt als bestätigt angelegt.
     */
    const requiresConfirmation = session.role === "CUSTOMER";
    const confirmationToken = requiresConfirmation
      ? randomBytes(32).toString("hex")
      : null;

    const order = await prisma.$transaction(async (tx) => {
      for (const item of preparedItems) {
        const updated = await tx.product.updateMany({
          where: {
            id: item.productId,

            active: true,

            stock: {
              gte: item.stockDeduction,
            },
          },

          data: {
            stock: {
              decrement: item.stockDeduction,
            },
          },
        });

        if (updated.count !== 1) {
          throw new Error(`STOCK_CHANGED:${item.name}`);
        }

        await tx.stockMovement.create({
          data: {
            tenantId: tenant.id,

            productId: item.productId,

            amount: -item.stockDeduction,

            reason:
              language === "de"
                ? `Bestellung ${orderNumber}`
                : `Sipariş ${orderNumber}`,
          },
        });
      }

      const createdOrder = await tx.order.create({
        data: {
          tenantId: tenant.id,
          orderNumber,
          userId: session.userId,
          status: "NEW",
          subtotal,
          deliveryFee,
          pfandAmount,
          totalAmount,
          deliveryAddress,
          customerNote: customerNote || null,
          confirmationToken,
          confirmedAt: requiresConfirmation ? null : new Date(),

          items: {
            create: preparedItems.map((item) => ({
              productId: item.productId,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              pfand: item.pfand,
              unitLabel: item.unitLabel,
            })),
          },
        },

        include: {
          items: true,
        },
      });

      if (pfandItems.length > 0 && pfandReturnAmount > 0) {
        await tx.pfandReturn.create({
          data: {
            tenantId: tenant.id,

            userId: session.userId,

            orderId: createdOrder.id,

            status: "PENDING",

            totalAmount: pfandReturnAmount,

            items: {
              create: pfandItems.map((item) => ({
                name: item.name,

                quantity: item.quantity,

                originalQuantity: item.quantity,

                unitAmount: item.unitAmount,

                totalAmount: Number(
                  (item.quantity * item.unitAmount).toFixed(2),
                ),

                originalTotal: Number(
                  (item.quantity * item.unitAmount).toFixed(2),
                ),
              })),
            },
          },
        });
      }

      return createdOrder;
    });

    if (requiresConfirmation && confirmationToken) {
      try {
        const confirmUrl = `${request.nextUrl.protocol}//${request.nextUrl.host}/orders/confirm?token=${confirmationToken}`;

        const companySettings = await prisma.companySetting.findUnique({
          where: {
            tenantId: tenant.id,
          },
          select: {
            logoUrl: true,
            companyName: true,
          },
        });

        await sendOrderConfirmationEmail(
          session.email,
          order.orderNumber,
          confirmUrl,
          {
            logoUrl: companySettings?.logoUrl,
            companyName: companySettings?.companyName,
          },
        );
      } catch (err) {
        console.error("ORDER_CONFIRMATION_EMAIL_ERROR", err);
      }
    }

    return NextResponse.json(
      {
        message:
          language === "de"
            ? "Ihre Bestellung wurde erfolgreich aufgegeben."
            : "Siparişiniz başarıyla oluşturuldu.",
        requiresConfirmation,
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          subtotal: Number(order.subtotal),
          deliveryFee: Number(order.deliveryFee),
          pfandAmount: Number(order.pfandAmount),
          totalAmount: Number(order.totalAmount),
          createdAt: order.createdAt,
        },
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("CREATE_ORDER_ERROR", error);

    const message = error instanceof Error ? error.message : "";

    if (message.startsWith("INSUFFICIENT_STOCK:")) {
      const [, productName, stock] = message.split(":");

      return NextResponse.json(
        {
          error:
            language === "de"
              ? `Nicht genügend Lagerbestand für ${productName}. Verfügbar: ${stock}.`
              : `${productName} için yeterli stok yok. Mevcut stok: ${stock}.`,
        },
        {
          status: 409,
        },
      );
    }

    if (message.startsWith("CARTON_NOT_AVAILABLE:")) {
      const productName = message.split(":")[1];

      return NextResponse.json(
        {
          error:
            language === "de"
              ? `${productName} kann derzeit nicht im Karton bestellt werden. Bitte prüfen Sie Ihren Warenkorb.`
              : `${productName} şu anda karton olarak sipariş edilemiyor. Sepetinizi kontrol edin.`,
        },
        {
          status: 409,
        },
      );
    }

    if (message.startsWith("STOCK_CHANGED:")) {
      const productName = message.split(":")[1];

      return NextResponse.json(
        {
          error:
            language === "de"
              ? `Der Lagerbestand von ${productName} hat sich geändert. Bitte prüfen Sie Ihren Warenkorb.`
              : `${productName} ürününün stok durumu değişti. Sepetinizi kontrol edin.`,
        },
        {
          status: 409,
        },
      );
    }

    return NextResponse.json(
      {
        error:
          language === "de"
            ? "Bei der Bestellung ist ein unerwarteter Fehler aufgetreten."
            : "Sipariş oluşturulurken beklenmeyen bir hata oluştu.",
      },
      {
        status: 500,
      },
    );
  }
});
