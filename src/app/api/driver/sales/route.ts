import { verifySessionToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withTenant } from "@/lib/tenant";
import { getRequestLanguage } from "@/lib/request-language";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

type RequestedItem = {
  productId: string;
  quantity: number;
};

async function getDriverSession() {
  const cookieStore = await cookies();

  const token = cookieStore.get("paketmarket_session")?.value;

  if (!token) {
    return null;
  }

  const session = await verifySessionToken(token);

  if (!session || session.role !== "DRIVER") {
    return null;
  }

  return session;
}

type RequestedDriverPfandItem = {
  name: string;
  quantity: number;
  unitAmount: number;
};

function normalizeDriverPfandItems(value: unknown): RequestedDriverPfandItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const result: RequestedDriverPfandItem[] = [];

  for (const rawItem of value) {
    if (!rawItem || typeof rawItem !== "object") {
      continue;
    }

    const item = rawItem as Record<string, unknown>;

    const name = String(item.name || "").trim();
    const quantity = Math.floor(Number(item.quantity || 0));
    const unitAmount = Number(item.unitAmount || 0);

    if (
      !name ||
      !Number.isInteger(quantity) ||
      quantity <= 0 ||
      !Number.isFinite(unitAmount) ||
      unitAmount <= 0
    ) {
      continue;
    }

    result.push({
      name,
      quantity,
      unitAmount: Number(unitAmount.toFixed(2)),
    });
  }

  return result;
}

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

  return `SOF-${datePart}-${timePart}-${randomPart}`;
}

function normalizeItems(value: unknown): RequestedItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const quantities = new Map<string, number>();

  for (const rawItem of value) {
    if (!rawItem || typeof rawItem !== "object") {
      continue;
    }

    const item = rawItem as Record<string, unknown>;

    const productId = String(item.productId || "").trim();
    const quantity = Number(item.quantity);

    if (!productId || !Number.isInteger(quantity) || quantity <= 0) {
      continue;
    }

    quantities.set(productId, (quantities.get(productId) || 0) + quantity);
  }

  return Array.from(quantities.entries()).map(([productId, quantity]) => ({
    productId,
    quantity,
  }));
}

export const POST = withTenant(async (request: NextRequest, _context, tenant) => {
  const language = await getRequestLanguage();
  const session = await getDriverSession();

  if (!session) {
    return NextResponse.json(
      {
        error: language === "de" ? "Unbefugter Zugriff." : "Yetkisiz erişim.",
      },
      {
        status: 403,
      },
    );
  }

  try {
    const body = await request.json();

    const returnedPfandItems = normalizeDriverPfandItems(body.pfandItems);

    const customerId = String(body.customerId || "").trim();

    const paymentMethod =
      body.paymentMethod === "CARD"
        ? "CARD"
        : body.paymentMethod === "OPEN"
          ? "OPEN"
          : "CASH";

    const note = String(body.note || "")
      .trim()
      .slice(0, 1000);

    const items = normalizeItems(body.items);

    if (!customerId) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Wählen Sie den Kunden für den Verkauf aus."
              : "Satış yapılacak müşteriyi seçin.",
        },
        {
          status: 400,
        },
      );
    }

    if (items.length === 0) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Geben Sie mindestens ein Produkt und eine Menge zum Verkauf ein."
              : "Satılacak en az bir ürün ve miktar girin.",
        },
        {
          status: 400,
        },
      );
    }

    const [driver, customer, driverStocks] = await Promise.all([
      prisma.user.findFirst({
        where: {
          id: session.userId,
          role: "DRIVER",
          isActive: true,
        },

        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      }),

      prisma.user.findFirst({
        where: {
          id: customerId,
          role: "CUSTOMER",
          isActive: true,
        },

        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          companyName: true,
          phone: true,

          addresses: {
            where: {
              isDefault: true,
            },

            take: 1,

            select: {
              street: true,
              houseNumber: true,
              postalCode: true,
              city: true,
              country: true,
              floor: true,
              doorbellName: true,
            },
          },
        },
      }),

      prisma.driverStock.findMany({
        where: {
          driverId: session.userId,

          productId: {
            in: items.map((item) => item.productId),
          },
        },

        select: {
          productId: true,
          quantity: true,

          product: {
            select: {
              id: true,
              name: true,
              nameTr: true,
              nameDe: true,
              price: true,
              pfandAmount: true,
              stockUnit: true,
              active: true,
            },
          },
        },
      }),
    ]);

    if (!driver) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Kein aktives Fahrerkonto gefunden."
              : "Aktif şoför hesabı bulunamadı.",
        },
        {
          status: 404,
        },
      );
    }

    if (!customer) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Der ausgewählte Kunde wurde nicht gefunden."
              : "Seçilen müşteri bulunamadı.",
        },
        {
          status: 404,
        },
      );
    }

    if (driverStocks.length !== items.length) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Eines der ausgewählten Produkte ist nicht im Fahrzeugbestand vorhanden. Aktualisieren Sie den Fahrzeugbestand."
              : "Seçilen ürünlerden biri araç stokunda bulunmuyor. Araç stoklarını yenileyin.",
        },
        {
          status: 409,
        },
      );
    }

    const stockByProductId = new Map(
      driverStocks.map((stock) => [stock.productId, stock]),
    );

    const preparedItems = items.map((item) => {
      const stock = stockByProductId.get(item.productId);

      if (!stock || !stock.product.active) {
        throw new Error(`PRODUCT_NOT_FOUND:${item.productId}`);
      }

      if (item.quantity > stock.quantity) {
        const productName =
          stock.product.nameTr || stock.product.nameDe || stock.product.name;

        throw new Error(
          `INSUFFICIENT_DRIVER_STOCK:${productName}:${stock.quantity}`,
        );
      }

      const price = Number(stock.product.price || 0);
      const pfand = Number(stock.product.pfandAmount || 0);

      return {
        productId: stock.productId,

        name:
          stock.product.nameTr || stock.product.nameDe || stock.product.name,

        quantity: item.quantity,
        price,
        pfand,
        stockUnit: stock.product.stockUnit,
      };
    });

    const subtotal = Number(
      preparedItems
        .reduce((total, item) => total + item.quantity * item.price, 0)
        .toFixed(2),
    );

    const pfandAmount = Number(
      preparedItems
        .reduce((total, item) => total + item.quantity * item.pfand, 0)
        .toFixed(2),
    );

    /*
     * Satılan ürünlerin müşteriden alınacak brüt toplamı.
     * Müşterinin verdiği boş Pfand bu tutardan ayrıca düşülür.
     */
    const totalAmount = Number((subtotal + pfandAmount).toFixed(2));

    const returnedPfandAmount = Number(
      returnedPfandItems
        .reduce((total, item) => total + item.quantity * item.unitAmount, 0)
        .toFixed(2),
    );

    if (returnedPfandAmount > totalAmount) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Der vom Kunden erhaltene Pfandbetrag darf nicht höher als die Verkaufssumme sein."
              : "Müşteriden alınan Pfand tutarı satış toplamından yüksek olamaz.",
        },
        {
          status: 400,
        },
      );
    }

    const payableAmount = Number(
      Math.max(0, totalAmount - returnedPfandAmount).toFixed(2),
    );

    const customerFullName = [customer.firstName, customer.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();

    const customerName =
      customer.companyName || customerFullName || customer.email;

    const driverName =
      [driver.firstName, driver.lastName].filter(Boolean).join(" ").trim() ||
      driver.email;

    const address = customer.addresses[0];

    const deliveryAddress = address
      ? [
          customerName,
          `${address.street} ${address.houseNumber}`,
          address.floor ? `Kat: ${address.floor}` : null,
          address.doorbellName ? `Zil: ${address.doorbellName}` : null,
          `${address.postalCode} ${address.city}`,
          address.country,
          customer.phone ? `Telefon: ${customer.phone}` : null,
        ]
          .filter(Boolean)
          .join("\n")
      : [
          customerName,
          customer.phone ? `Telefon: ${customer.phone}` : null,
          "Şoför araç satışı",
        ]
          .filter(Boolean)
          .join("\n");

    const paymentLabel =
      paymentMethod === "CARD"
        ? "Kart"
        : paymentMethod === "OPEN"
          ? "Açık Hesap"
          : "Nakit";

    const orderNumber = createOrderNumber();
    const now = new Date();

    const order = await prisma.$transaction(async (tx) => {
      for (const item of preparedItems) {
        /*
         * Ürün ana depodan şoföre yüklenirken ana stoktan zaten düştü.
         * Burada ana ürün stoğuna tekrar dokunmuyoruz.
         *
         * Sadece şoförün fiziksel araç stoğu azaltılır.
         */
        const updatedStock = await tx.driverStock.updateMany({
          where: {
            driverId: session.userId,
            productId: item.productId,

            quantity: {
              gte: item.quantity,
            },
          },

          data: {
            quantity: {
              decrement: item.quantity,
            },
          },
        });

        if (updatedStock.count !== 1) {
          throw new Error(`DRIVER_STOCK_CHANGED:${item.name}`);
        }
      }

      const createdOrder = await tx.order.create({
        data: {
          tenantId: tenant.id,
          orderNumber,
          userId: customer.id,
          driverId: driver.id,

          status: "DELIVERED",

          subtotal,
          deliveryFee: 0,
          pfandAmount,
          totalAmount,

          deliveryAddress,

          customerNote: [
            "ŞOFÖR ARAÇ SATIŞI",
            `Satışı yapan şoför: ${driverName}`,
            `Müşteri: ${customerName}`,
            `Ödeme: ${paymentLabel}`,
            returnedPfandAmount > 0
              ? `Müşteriden alınan Pfand: ${returnedPfandAmount.toLocaleString(
                  "de-DE",
                  {
                    style: "currency",
                    currency: "EUR",
                  },
                )}`
              : null,
            `Müşteriden alınacak net tutar: ${payableAmount.toLocaleString(
              "de-DE",
              {
                style: "currency",
                currency: "EUR",
              },
            )}`,
            note ? `Not: ${note}` : null,
          ]
            .filter(Boolean)
            .join("\n"),

          assignedAt: now,
          outForDeliveryAt: now,
          deliveredAt: now,

          /*
           * Nakit satışta şoför parayı aldığını bildirir.
           * Para, admin onayından önce kesin PAID yapılmaz.
           */
          paymentStatus: paymentMethod === "CARD" ? "PAID" : "OPEN",

          paidAt: paymentMethod === "CARD" ? now : null,

          driverPaymentReportedAt: paymentMethod === "CASH" ? now : null,

          driverPaymentReportedAmount:
            paymentMethod === "CASH" ? payableAmount : null,

          driverNote: `Araçtan doğrudan satış. Ödeme: ${paymentLabel}`,

          items: {
            create: preparedItems.map((item) => ({
              productId: item.productId,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              pfand: item.pfand,
            })),
          },
        },

        select: {
          id: true,
          orderNumber: true,
          totalAmount: true,
        },
      });

      /*
       * Şoför araç satışında bildirilen nakit tahsilatı
       * admin onayı bekleyen OrderPayment kaydına dönüştürülür.
       *
       * Admin bu kaydı onayladığında para gerçek kasaya girer.
       */
      if (paymentMethod === "CASH" && payableAmount > 0) {
        const existingPendingPayment = await tx.orderPayment.findFirst({
          where: {
            orderId: createdOrder.id,
            status: "PENDING",
          },

          select: {
            id: true,
          },
        });

        if (!existingPendingPayment) {
          await tx.orderPayment.create({
            data: {
              tenantId: tenant.id,
              orderId: createdOrder.id,
              customerId: customer.id,
              driverId: driver.id,

              amount: payableAmount,

              paymentMethod,

              status: "PENDING",

              reportedById: driver.id,
              reporterRole: "DRIVER",

              note:
                `Şoför araç satışı ${orderNumber}. ` +
                `${driverName} müşteriden ${payableAmount.toFixed(2)} € tahsil etti. ` +
                `Admin kasa onayı bekleniyor.`,
            },
          });
        }
      }

      /*
       * Müşterinin şoföre verdiği boş Pfand kaydedilir.
       *
       * PENDING olarak kalır. Admin, şoförden fiziksel Pfandları
       * teslim aldığında kontrol edip onaylayabilir.
       *
       * orderId ve order.driverId üzerinden hangi şoförün,
       * hangi müşteriden aldığı görülebilir.
       */
      if (returnedPfandItems.length > 0 && returnedPfandAmount > 0) {
        await tx.pfandReturn.create({
          data: {
            tenantId: tenant.id,
            userId: customer.id,
            orderId: createdOrder.id,

            status: "PENDING",

            totalAmount: returnedPfandAmount,
            approvedAmount: null,

            driverNote:
              language === "de"
                ? `${driverName} hat beim Fahrzeugverkauf von ${customerName} ` +
                  `${returnedPfandAmount.toLocaleString("de-DE", {
                    style: "currency",
                    currency: "EUR",
                  })} Pfand entgegengenommen.`
                : `${driverName}, ${customerName} müşterisinden araç satışı ` +
                  `sırasında ${returnedPfandAmount.toLocaleString("de-DE", {
                    style: "currency",
                    currency: "EUR",
                  })} Pfand teslim aldı.`,

            note:
              language === "de"
                ? `Fahrzeugverkauf ${orderNumber}. ` +
                  `Muss vom Admin bestätigt werden, sobald das physische Pfand vom Fahrer entgegengenommen wurde.`
                : `Şoför araç satışı ${orderNumber}. ` +
                  `Admin şoförden fiziksel Pfandları teslim aldığında onaylanmalıdır.`,

            items: {
              create: returnedPfandItems.map((item) => {
                const itemTotal = Number(
                  (item.quantity * item.unitAmount).toFixed(2),
                );

                return {
                  name: item.name,
                  quantity: item.quantity,
                  originalQuantity: item.quantity,
                  approvedQuantity: null,
                  unitAmount: item.unitAmount,
                  totalAmount: itemTotal,
                  originalTotal: itemTotal,
                  approvedTotal: null,
                };
              }),
            },
          },
        });
      }

      for (const item of preparedItems) {
        await tx.driverStockMovement.create({
          data: {
            tenantId: tenant.id,
            driverId: session.userId,
            productId: item.productId,
            orderId: createdOrder.id,

            type: "SALE",
            amount: -item.quantity,

            createdById: session.userId,

            note:
              `${customerName} müşterisine ${item.quantity} ` +
              `${item.stockUnit.toLocaleLowerCase("tr-TR")} satıldı. ` +
              `Sipariş: ${orderNumber}. Birim fiyat: ` +
              `${item.price.toLocaleString("de-DE", {
                style: "currency",
                currency: "EUR",
              })}.`,
          },
        });
      }

      /*
       * Satış sonrasında sıfır olan araç stok satırları kaldırılır.
       * Geçmiş hareket ve satış kayıtları korunur.
       */
      await tx.driverStock.deleteMany({
        where: {
          driverId: session.userId,
          quantity: 0,
        },
      });

      return createdOrder;
    });

    return NextResponse.json(
      {
        message:
          language === "de"
            ? `Verkauf für ${customerName} wurde erfolgreich gespeichert. ` +
              (returnedPfandAmount > 0
                ? `Pfand: -${returnedPfandAmount.toLocaleString("de-DE", {
                    style: "currency",
                    currency: "EUR",
                  })}. `
                : "") +
              `Vom Kunden zu erhalten: ${payableAmount.toLocaleString("de-DE", {
                style: "currency",
                currency: "EUR",
              })}.`
            : `${customerName} için satış başarıyla kaydedildi. ` +
              (returnedPfandAmount > 0
                ? `Pfand: -${returnedPfandAmount.toLocaleString("de-DE", {
                    style: "currency",
                    currency: "EUR",
                  })}. `
                : "") +
              `Müşteriden alınacak: ${payableAmount.toLocaleString("de-DE", {
                style: "currency",
                currency: "EUR",
              })}.`,

        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          totalAmount: Number(order.totalAmount),
          returnedPfandAmount,
          payableAmount,
        },
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("DRIVER_DIRECT_SALE_ERROR", error);

    const message = error instanceof Error ? error.message : "";

    if (message.startsWith("INSUFFICIENT_DRIVER_STOCK:")) {
      const [, productName, stock] = message.split(":");

      return NextResponse.json(
        {
          error:
            language === "de"
              ? `Fahrzeugbestand für ${productName} reicht nicht aus. ` +
                `Im Fahrzeug vorhanden: ${stock}.`
              : `${productName} için araç stoğu yetersiz. ` +
                `Araçta bulunan: ${stock}.`,
        },
        {
          status: 409,
        },
      );
    }

    if (message.startsWith("DRIVER_STOCK_CHANGED:")) {
      const productName = message.split(":")[1];

      return NextResponse.json(
        {
          error:
            language === "de"
              ? `Der Fahrzeugbestand von ${productName} hat sich geändert. ` +
                `Aktualisieren Sie den Fahrzeugbestand und versuchen Sie es erneut.`
              : `${productName} araç stoğu değişti. ` +
                `Araç stoklarını yenileyip tekrar deneyin.`,
        },
        {
          status: 409,
        },
      );
    }

    if (message.startsWith("PRODUCT_NOT_FOUND:")) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Das zu verkaufende Produkt wurde nicht gefunden."
              : "Satılacak ürün bulunamadı.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json(
      {
        error:
          language === "de"
            ? "Beim Speichern des Fahrerverkaufs ist ein Fehler aufgetreten."
            : "Şoför satışı kaydedilirken hata oluştu.",
      },
      {
        status: 500,
      },
    );
  }
});
