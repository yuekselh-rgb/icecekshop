import { getAdminWithPermissions } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { getRequestLanguage } from "@/lib/request-language";
import { withTenant } from "@/lib/tenant";
import { isPlaceholderEmail } from "@/lib/utils";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

type RequestedItem = {
  productId: string;
  quantity: number;
  price?: number;
};

type RequestedPfandItem = {
  name: string;
  quantity: number;
  unitAmount: number;
};

function normalizePfandItems(value: unknown): RequestedPfandItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const allowedAmounts = [0.08, 0.15, 0.25, 3.3];

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

    const name = String(raw.name || "").trim();

    const quantity = Number(raw.quantity);

    const requestedAmount = Number(raw.unitAmount);

    const unitAmount = allowedAmounts.find(
      (amount) => Math.abs(amount - requestedAmount) < 0.001,
    );

    if (
      !name ||
      !Number.isInteger(quantity) ||
      quantity <= 0 ||
      quantity > 9999 ||
      unitAmount === undefined
    ) {
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

  return `BAR-${datePart}-${timePart}-${randomPart}`;
}

function normalizeItems(value: unknown): RequestedItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const quantities = new Map<string, number>();

  const prices = new Map<string, number>();

  for (const rawItem of value) {
    if (!rawItem || typeof rawItem !== "object") {
      continue;
    }

    const raw = rawItem as {
      productId?: unknown;
      quantity?: unknown;
      price?: unknown;
    };

    const productId = String(raw.productId || "").trim();

    const quantity = Number(raw.quantity);

    if (
      !productId ||
      !Number.isInteger(quantity) ||
      quantity <= 0 ||
      quantity > 999
    ) {
      continue;
    }

    quantities.set(productId, (quantities.get(productId) || 0) + quantity);

    const rawPrice = Number(raw.price);

    if (Number.isFinite(rawPrice) && rawPrice >= 0 && rawPrice <= 99999) {
      prices.set(productId, Math.round(rawPrice * 100) / 100);
    }
  }

  return Array.from(quantities.entries()).map(([productId, quantity]) => ({
    productId,
    quantity,
    price: prices.get(productId),
  }));
}

export const POST = withTenant(async (request: NextRequest, _context, tenant) => {
  const language = await getRequestLanguage();

  const admin = await getAdminWithPermissions();

  if (!admin || !admin.permissions.makeBarSale) {
    return NextResponse.json(
      {
        error:
          language === "de"
            ? "Sie sind nicht berechtigt, Bar-Verkäufe zu tätigen."
            : "Bar satışı yapma yetkiniz yok.",
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
      const existing = await prisma.idempotencyKey.findFirst({
        where: {
          key: idempotencyKey,
        },
      });

      if (existing) {
        const existingOrder = await prisma.order.findUnique({
          where: {
            id: existing.resultId,
          },
        });

        if (existingOrder) {
          return NextResponse.json({
            message:
              language === "de"
                ? "Bar-Verkauf wurde erfolgreich gespeichert."
                : "Bar satışı başarıyla kaydedildi.",
            order: {
              id: existingOrder.id,
              orderNumber: existingOrder.orderNumber,
              totalAmount: Number(existingOrder.totalAmount),
            },
          });
        }
      }
    }

    const items = normalizeItems(body.items);

    const pfandItems = normalizePfandItems(body.pfandItems);

    const paymentMethod = String(body.paymentMethod || "").toUpperCase();

    const customerId = String(body.customerId || "").trim();

    if (!["CASH", "CARD", "OPEN"].includes(paymentMethod)) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Wählen Sie eine gültige Zahlungsart."
              : "Geçerli bir ödeme türü seçin.",
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
              ? "Der Verkaufswarenkorb ist leer."
              : "Satış sepeti boş.",
        },
        {
          status: 400,
        },
      );
    }

    if (paymentMethod === "OPEN" && !customerId) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Wählen Sie für einen Verkauf auf Rechnung einen Kunden aus."
              : "Açık hesap satışı için müşteri seçin.",
        },
        {
          status: 400,
        },
      );
    }

    const selectedCustomer =
      paymentMethod === "OPEN"
        ? await prisma.user.findFirst({
            where: {
              id: customerId,
              role: "CUSTOMER",
              isActive: true,

              email: {
                not: "bar-satis@paketmarket.local",
              },
            },

            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              companyName: true,
              phone: true,

              addresses: {
                select: {
                  street: true,
                  houseNumber: true,
                  postalCode: true,
                  city: true,
                  country: true,
                },
                take: 1,
              },
            },
          })
        : null;

    if (paymentMethod === "OPEN" && !selectedCustomer) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Der ausgewählte Kunde wurde nicht gefunden oder ist nicht aktiv."
              : "Seçilen müşteri bulunamadı veya aktif değil.",
        },
        {
          status: 404,
        },
      );
    }

    const products = await prisma.product.findMany({
      where: {
        id: {
          in: items.map((item) => item.productId),
        },
        active: true,
      },
      select: {
        id: true,
        name: true,
        nameTr: true,
        nameDe: true,
        price: true,
        pfandAmount: true,
        stock: true,
      },
    });

    if (products.length !== items.length) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Der Warenkorb enthält ein nicht gefundenes oder nicht verkäufliches Produkt."
              : "Sepette bulunamayan veya satışta olmayan ürün var.",
        },
        {
          status: 409,
        },
      );
    }

    const productById = new Map(
      products.map((product) => [product.id, product]),
    );

    let subtotal = 0;
    let pfandAmount = 0;

    const preparedItems = items.map((item) => {
      const product = productById.get(item.productId);

      if (!product) {
        throw new Error("PRODUCT_NOT_FOUND");
      }

      if (product.stock < item.quantity) {
        throw new Error(`INSUFFICIENT_STOCK:${product.name}:${product.stock}`);
      }

      const price =
        admin.permissions.changePrice && item.price !== undefined
          ? item.price
          : Number(product.price);

      const pfand = Number(product.pfandAmount);

      subtotal += price * item.quantity;

      pfandAmount += pfand * item.quantity;

      return {
        productId: product.id,
        name: product.nameTr || product.nameDe || product.name,
        price,
        pfand,
        quantity: item.quantity,
      };
    });

    subtotal = Number(subtotal.toFixed(2));

    pfandAmount = Number(pfandAmount.toFixed(2));

    const pfandReturnAmount = Number(
      pfandItems
        .reduce((total, item) => total + item.quantity * item.unitAmount, 0)
        .toFixed(2),
    );

    const totalAmount = Number(
      Math.max(0, subtotal + pfandAmount - pfandReturnAmount).toFixed(2),
    );

    const fullName = [admin.user.firstName, admin.user.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();

    const adminName = fullName || admin.user.companyName || admin.user.email;

    const paymentLabel =
      paymentMethod === "CASH"
        ? "Nakit"
        : paymentMethod === "CARD"
          ? "Kart"
          : "Açık Hesap";

    const selectedCustomerFullName = selectedCustomer
      ? [selectedCustomer.firstName, selectedCustomer.lastName]
          .filter(Boolean)
          .join(" ")
          .trim()
      : "";

    const selectedCustomerName = selectedCustomer
      ? selectedCustomer.companyName ||
        selectedCustomerFullName ||
        selectedCustomer.email
      : "Bar Satışı";

    const selectedCustomerAddress = selectedCustomer?.addresses?.[0];

    const deliveryAddress =
      paymentMethod === "OPEN" && selectedCustomer && selectedCustomerAddress
        ? [
            selectedCustomerName,
            `${selectedCustomerAddress.street} ${selectedCustomerAddress.houseNumber}`,
            `${selectedCustomerAddress.postalCode} ${selectedCustomerAddress.city}`,
            selectedCustomerAddress.country,
            selectedCustomer.phone ? `Telefon: ${selectedCustomer.phone}` : null,
          ]
            .filter(Boolean)
            .join("\n")
        : language === "de"
          ? "Barverkauf\nAbholung im Geschäft"
          : "Bar Satışı\nMağazadan teslim";

    const orderNumber = createOrderNumber();

    const randomPassword = await bcrypt.hash(
      `${Date.now()}-${Math.random()}`,
      10,
    );

    const order = await prisma.$transaction(async (tx) => {
      const barCustomer = await tx.user.upsert({
        where: {
          tenantId_email: {
            tenantId: tenant.id,
            email: "bar-satis@paketmarket.local",
          },
        },
        update: {
          firstName: "Bar",
          lastName: "Satışı",
        },
        create: {
          tenantId: tenant.id,
          email: "bar-satis@paketmarket.local",
          passwordHash: randomPassword,
          role: "CUSTOMER",
          firstName: "Bar",
          lastName: "Satışı",
          companyName: "Bar Satışı",
          profileCompleted: true,
        },
      });

      const orderCustomerId =
        paymentMethod === "OPEN" && selectedCustomer
          ? selectedCustomer.id
          : barCustomer.id;

      for (const item of preparedItems) {
        const updated = await tx.product.updateMany({
          where: {
            id: item.productId,
            active: true,
            stock: {
              gte: item.quantity,
            },
          },
          data: {
            stock: {
              decrement: item.quantity,
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
            amount: -item.quantity,
            reason:
              language === "de"
                ? `Barverkauf ${orderNumber} - ${adminName}`
                : `Bar satışı ${orderNumber} - ${adminName}`,
          },
        });
      }

      const createdOrder = await tx.order.create({
        data: {
          tenantId: tenant.id,
          orderNumber,
          userId: orderCustomerId,
          status: "DELIVERED",
          subtotal,
          deliveryFee: 0,
          pfandAmount,
          totalAmount,
          deliveryAddress,
          customerNote: [
            "BAR SATIŞI",
            `Satışı yapan: ${adminName}`,
            `Satış yapılan: ${selectedCustomerName}`,
            selectedCustomer?.phone
              ? `Müşteri telefonu: ${selectedCustomer.phone}`
              : null,
            selectedCustomer?.email && !isPlaceholderEmail(selectedCustomer.email)
              ? `Müşteri e-posta: ${selectedCustomer.email}`
              : null,
            `Ödeme: ${paymentLabel}`,
            `Gelen Pfand: ${pfandReturnAmount.toFixed(2)} €`,
          ]
            .filter(Boolean)
            .join("\n"),
          paymentStatus: paymentMethod === "OPEN" ? "OPEN" : "PAID",
          paidAt: paymentMethod === "OPEN" ? null : new Date(),
          deliveredAt: new Date(),
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
        include: {
          items: true,
        },
      });

      if (idempotencyKey) {
        await tx.idempotencyKey.create({
          data: {
            tenantId: tenant.id,
            key: idempotencyKey,
            scope: "bar-sale",
            resultId: createdOrder.id,
          },
        });
      }

      await tx.orderPayment.create({
        data: {
          tenantId: tenant.id,
          orderId: createdOrder.id,
          customerId: orderCustomerId,

          amount: totalAmount,
          paymentMethod: paymentMethod as "CASH" | "CARD" | "OPEN",

          status: paymentMethod === "OPEN" ? "PENDING" : "APPROVED",

          reportedById: admin.user.id,
          reporterRole: "ADMIN",

          ...(paymentMethod === "OPEN"
            ? {}
            : {
                approvedById: admin.user.id,
                approvedAt: new Date(),
              }),

          note:
            language === "de"
              ? `Barverkauf ${orderNumber}. Verkauft von: ${adminName}.`
              : `Bar satışı ${orderNumber}. Satışı yapan: ${adminName}.`,
        },
      });

      if (pfandItems.length > 0 && pfandReturnAmount > 0) {
        const receivedAt = new Date();

        await tx.pfandReturn.create({
          data: {
            tenantId: tenant.id,
            userId: orderCustomerId,
            orderId: createdOrder.id,

            status: "APPROVED",

            totalAmount: pfandReturnAmount,
            approvedAmount: pfandReturnAmount,

            approvedById: admin.user.id,
            approvedAt: receivedAt,

            note:
              language === "de"
                ? `In der Barkasse entgegengenommen. Admin: ${adminName}`
                : `Bar kasasında teslim alındı. Admin: ${adminName}`,

            items: {
              create: pfandItems.map((item) => {
                const itemTotal = Number(
                  (item.quantity * item.unitAmount).toFixed(2),
                );

                return {
                  name: item.name,
                  quantity: item.quantity,
                  originalQuantity: item.quantity,
                  approvedQuantity: item.quantity,
                  unitAmount: item.unitAmount,
                  totalAmount: itemTotal,
                  originalTotal: itemTotal,
                  approvedTotal: itemTotal,
                };
              }),
            },

            warehouseMovement: {
              create: {
                tenantId: tenant.id,
                type: "IN",
                partyType: "CUSTOMER",
                partyName: selectedCustomerName,
                createdById: admin.user.id,
                note:
                  language === "de"
                    ? `Physisch in der Barkasse entgegengenommen. Verkauf: ${orderNumber}`
                    : `Bar kasasında fiziksel olarak teslim alındı. Satış: ${orderNumber}`,
                totalAmount: pfandReturnAmount,
                createdAt: receivedAt,

                items: {
                  create: pfandItems.map((item) => ({
                    name: item.name,
                    quantity: item.quantity,
                    unitAmount: item.unitAmount,
                    totalAmount: Number(
                      (item.quantity * item.unitAmount).toFixed(2),
                    ),
                  })),
                },
              },
            },
          },
        });
      }

      /*
       * Yalnızca nakit bar satışları fiziksel kasaya girer.
       * Kart ve açık hesap satışları nakit kasaya eklenmez.
       */
      if (paymentMethod === "CASH") {
        const cashAmount = Number(Number(createdOrder.totalAmount).toFixed(2));

        if (cashAmount > 0) {
          const existingCashMovement = await tx.cashMovement.findFirst({
            where: {
              accountType: "BAR",
              category: "BAR_SALE",
              orderId: createdOrder.id,
            },
            select: {
              id: true,
            },
          });

          if (!existingCashMovement) {
            await tx.cashMovement.create({
              data: {
                tenantId: tenant.id,
                accountType: "BAR",
                direction: "IN",
                category: "BAR_SALE",
                amount: cashAmount,
                orderId: createdOrder.id,
                createdById: admin.user.id,
                companyName: selectedCustomerName,
                description:
                  language === "de"
                    ? `Barverkauf ${orderNumber}. Verkauft von: ${adminName}`
                    : `Nakit bar satışı ${orderNumber}. Satışı yapan: ${adminName}`,
              },
            });
          }
        }
      }

      return createdOrder;
    });

    return NextResponse.json(
      {
        message:
              language === "de"
                ? "Bar-Verkauf wurde erfolgreich gespeichert."
                : "Bar satışı başarıyla kaydedildi.",
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          totalAmount: Number(order.totalAmount),
          paymentMethod,
          adminName,

          customer: {
            id: selectedCustomer?.id || null,

            name: selectedCustomerName,

            email: selectedCustomer?.email || null,

            phone: selectedCustomer?.phone || null,
          },

          pfandReturnAmount,
        },
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("BAR_SALE_ERROR", error);

    /*
     * Aynı idempotency key ile eşzamanlı iki istek gelirse biri bu
     * kaydı oluşturur, diğeri benzersizlik kısıtına çarpar. Hata
     * döndürmek yerine kazanan isteğin siparişini döndürüyoruz.
     */
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      const existing = idempotencyKey
        ? await prisma.idempotencyKey.findFirst({
            where: { key: idempotencyKey },
          })
        : null;

      const existingOrder = existing
        ? await prisma.order.findUnique({ where: { id: existing.resultId } })
        : null;

      if (existingOrder) {
        return NextResponse.json({
          message:
              language === "de"
                ? "Bar-Verkauf wurde erfolgreich gespeichert."
                : "Bar satışı başarıyla kaydedildi.",
          order: {
            id: existingOrder.id,
            orderNumber: existingOrder.orderNumber,
            totalAmount: Number(existingOrder.totalAmount),
          },
        });
      }
    }

    const message = error instanceof Error ? error.message : "";

    if (message.startsWith("INSUFFICIENT_STOCK:")) {
      const [, productName, stock] = message.split(":");

      return NextResponse.json(
        {
          error:
            language === "de"
              ? `Nicht genügend Bestand für ${productName}. Verfügbar: ${stock}`
              : `${productName} için yeterli stok yok. Mevcut stok: ${stock}`,
        },
        {
          status: 409,
        },
      );
    }

    if (message.startsWith("STOCK_CHANGED:")) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Der Lagerbestand hat sich geändert. Bitte laden Sie die Seite neu und versuchen Sie es erneut."
              : "Stok bilgisi değişti. Sayfayı yenileyip tekrar deneyin.",
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
            ? "Fehler beim Speichern des Bar-Verkaufs."
            : "Bar satışı kaydedilirken hata oluştu.",
      },
      {
        status: 500,
      },
    );
  }
});
