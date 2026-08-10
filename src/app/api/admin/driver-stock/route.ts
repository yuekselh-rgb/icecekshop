import { requireAdminPermission } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { getRequestLanguage } from "@/lib/request-language";
import { withTenant } from "@/lib/tenant";
import { NextRequest, NextResponse } from "next/server";

type RequestedLoadItem = {
  productId: string;
  quantity: number;
};

function normalizeLoadItems(value: unknown): RequestedLoadItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const quantities = new Map<string, number>();

  for (const rawItem of value) {
    if (!rawItem || typeof rawItem !== "object") {
      continue;
    }

    const item = rawItem as {
      productId?: unknown;
      quantity?: unknown;
    };

    const productId = String(item.productId || "").trim();
    const quantity = Number(item.quantity);

    if (
      !productId ||
      !Number.isInteger(quantity) ||
      quantity <= 0 ||
      quantity > 100000
    ) {
      continue;
    }

    quantities.set(productId, (quantities.get(productId) || 0) + quantity);
  }

  return Array.from(quantities.entries()).map(([productId, quantity]) => ({
    productId,
    quantity,
  }));
}

type RequestedReturnCountItem = {
  productId: string;
  returnedQuantity: number;
};

function normalizeReturnCountItems(value: unknown): RequestedReturnCountItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const quantities = new Map<string, number>();

  for (const rawItem of value) {
    if (!rawItem || typeof rawItem !== "object") {
      continue;
    }

    const item = rawItem as {
      productId?: unknown;
      returnedQuantity?: unknown;
    };

    const productId = String(item.productId || "").trim();
    const returnedQuantity = Number(item.returnedQuantity);

    if (
      !productId ||
      !Number.isInteger(returnedQuantity) ||
      returnedQuantity < 0 ||
      returnedQuantity > 100000
    ) {
      continue;
    }

    quantities.set(productId, returnedQuantity);
  }

  return Array.from(quantities.entries()).map(
    ([productId, returnedQuantity]) => ({
      productId,
      returnedQuantity,
    }),
  );
}

function serializeLoad(load: {
  id: string;
  status: string;
  note: string | null;
  confirmedAt: Date | null;
  createdAt: Date;
  driver: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  createdBy: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  items: Array<{
    id: string;
    quantity: number;
    product: {
      id: string;
      name: string;
      nameTr: string | null;
      nameDe: string | null;
      stockUnit: string;
      packageInfo: string | null;
    };
  }>;
}) {
  return {
    ...load,
    items: load.items.map((item) => ({
      ...item,
      product: {
        ...item.product,
        displayName:
          item.product.nameTr || item.product.nameDe || item.product.name,
      },
    })),
  };
}

export const GET = withTenant(async (request: NextRequest) => {
  const language = await getRequestLanguage();
  const admin = await requireAdminPermission("viewDriverStock");

  if (!admin) {
    return NextResponse.json(
      {
        error:
          language === "de"
            ? "Sie haben keine Berechtigung, Fahrerbestände einzusehen."
            : "Şoför stoklarını görüntüleme yetkiniz yok.",
      },
      {
        status: 403,
      },
    );
  }

  try {
    const url = new URL(request.url);
    const driverId = String(url.searchParams.get("driverId") || "").trim();

    const [drivers, products, driverStocks, loads, driverMovements] =
      await Promise.all([
        prisma.user.findMany({
          where: {
            role: "DRIVER",
            isActive: true,
          },

          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },

          orderBy: [
            {
              firstName: "asc",
            },
            {
              lastName: "asc",
            },
            {
              email: "asc",
            },
          ],
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
            packageInfo: true,
            unitsPerPackage: true,
            imageUrl: true,

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

        driverId
          ? prisma.driverStock.findMany({
              where: {
                driverId,
              },

              select: {
                id: true,
                driverId: true,
                productId: true,
                quantity: true,
                updatedAt: true,

                product: {
                  select: {
                    id: true,
                    name: true,
                    nameTr: true,
                    nameDe: true,
                    stockUnit: true,
                    packageInfo: true,
                    imageUrl: true,
                    price: true,
                  },
                },
              },

              orderBy: {
                product: {
                  name: "asc",
                },
              },
            })
          : Promise.resolve([]),

        prisma.driverLoad.findMany({
          where: driverId
            ? {
                driverId,
              }
            : undefined,

          select: {
            id: true,
            status: true,
            note: true,
            confirmedAt: true,
            createdAt: true,

            driver: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },

            createdBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },

            items: {
              select: {
                id: true,
                quantity: true,

                product: {
                  select: {
                    id: true,
                    name: true,
                    nameTr: true,
                    nameDe: true,
                    stockUnit: true,
                    packageInfo: true,
                  },
                },
              },

              orderBy: {
                product: {
                  name: "asc",
                },
              },
            },
          },

          orderBy: {
            createdAt: "desc",
          },

          take: 30,
        }),

        driverId
          ? prisma.driverStockMovement.findMany({
              where: {
                driverId,
              },

              select: {
                productId: true,
                type: true,
                amount: true,
                createdAt: true,
                orderId: true,

                product: {
                  select: {
                    price: true,
                  },
                },

                order: {
                  select: {
                    id: true,
                    orderNumber: true,
                    createdAt: true,
                    subtotal: true,
                    deliveryFee: true,
                    pfandAmount: true,
                    totalAmount: true,
                    paymentStatus: true,
                    driverPaymentReportedAmount: true,
                    driverNote: true,
                    customerNote: true,

                    user: {
                      select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        companyName: true,
                        phone: true,
                      },
                    },

                    items: {
                      select: {
                        id: true,
                        name: true,
                        quantity: true,
                        price: true,
                        pfand: true,
                      },

                      orderBy: {
                        name: "asc",
                      },
                    },

                    pfandReturns: {
                      select: {
                        id: true,
                        status: true,
                        totalAmount: true,
                        approvedAmount: true,
                      },

                      orderBy: {
                        createdAt: "desc",
                      },

                      take: 1,
                    },
                  },
                },
              },

              orderBy: {
                createdAt: "asc",
              },
            })
          : Promise.resolve([]),
      ]);

    type DriverMovementItem = {
      productId: string;
      type: string;
      amount: number;
      createdAt: Date;
      orderId: string | null;

      product: {
        price: unknown;
      };

      order: {
        id: string;
        orderNumber: string;
        createdAt: Date;
        subtotal: unknown;
        deliveryFee: unknown;
        pfandAmount: unknown;
        totalAmount: unknown;
        paymentStatus: string;
        driverPaymentReportedAmount: unknown | null;
        driverNote: string | null;
        customerNote: string | null;

        user: {
          id: string;
          email: string;
          firstName: string | null;
          lastName: string | null;
          companyName: string | null;
          phone: string | null;
        };

        items: Array<{
          id: string;
          name: string;
          quantity: number;
          price: unknown;
          pfand: unknown;
        }>;

        pfandReturns: Array<{
          id: string;
          status: string;
          totalAmount: unknown;
          approvedAmount: unknown | null;
        }>;
      } | null;
    };

    console.log("ADMIN DRIVER ID:", driverId);
    console.log("RAW DRIVER MOVEMENTS:", Array.isArray(driverMovements) ? driverMovements.length : "null");

    const movementList =
      (driverMovements as DriverMovementItem[] | undefined) ?? [];

    /*
     * Şoförün en son araç turunu bütün ürün hareketleri üzerinden bulur.
     *
     * Araçtaki bütün ürünlerin hareket bakiyesi sıfırken gelen ilk LOAD,
     * yeni turun başlangıcıdır.
     *
     * Araç tamamen iade edilse bile son tur bilgileri korunur.
     * Bir sonraki LOAD hareketi geldiğinde yeni tur otomatik başlar.
     */
    function getCurrentDriverTripMovements() {
      const orderedMovements = [...movementList].sort(
        (first, second) =>
          new Date(first.createdAt).getTime() -
          new Date(second.createdAt).getTime(),
      );

      const balances = new Map<string, number>();

      let currentTripStartIndex = -1;

      for (let index = 0; index < orderedMovements.length; index += 1) {
        const movement = orderedMovements[index];

        const vehicleWasEmpty = Array.from(balances.values()).every(
          (quantity) => quantity <= 0,
        );

        /*
         * Araç tamamen boşken yapılan ilk yükleme yeni turdur.
         */
        if (movement.type === "LOAD" && vehicleWasEmpty) {
          currentTripStartIndex = index;
        }

        const previousQuantity = balances.get(movement.productId) || 0;

        let nextQuantity = previousQuantity;

        if (movement.type === "LOAD") {
          nextQuantity += Math.abs(movement.amount);
        }

        if (movement.type === "SALE" || movement.type === "RETURN") {
          nextQuantity -= Math.abs(movement.amount);
        }

        if (movement.type === "ADJUSTMENT") {
          nextQuantity += movement.amount;
        }

        balances.set(movement.productId, Math.max(0, nextQuantity));
      }

      if (currentTripStartIndex < 0) {
        return [];
      }

      return orderedMovements.slice(currentTripStartIndex);
    }

    const currentDriverTripMovements = getCurrentDriverTripMovements();

    console.log("MOVEMENTS", movementList.map(m => ({
      type: m.type,
      amount: m.amount,
      product: m.productId,
      order: m.orderId,
      created: m.createdAt,
    })));

    console.log("CURRENT TRIP", currentDriverTripMovements.map(m => ({
      type: m.type,
      amount: m.amount,
      product: m.productId,
      order: m.orderId,
    })));


    /*
     * Her ürün için sadece açık olan son araç turunu hesaplar.
     *
     * Hareket bakiyesi tekrar sıfıra ulaştığında önceki tur kapanır.
     * Bundan sonraki LOAD hareketi yeni turu başlatır.
     *
     * Böylece:
     * - Önceki günün yüklemesi yeni güne eklenmez.
     * - Akşam iade tamamlanınca şoför stoku sıfırlanır.
     * - Yeni yükleme tekrar sıfırdan hesaplanır.
     */
    function getLatestCycleMovements(productId: string) {
      const productMovements = movementList
        .filter((movement) => movement.productId === productId)
        .sort(
          (first, second) =>
            new Date(first.createdAt).getTime() -
            new Date(second.createdAt).getTime(),
        );

      let latestCycle: DriverMovementItem[] = [];
      let runningQuantity = 0;
      let cycleClosed = true;

      for (const movement of productMovements) {
        /*
         * Önceki tur kapanmışken gelen yeni LOAD,
         * yeni araç turunu başlatır.
         */
        if (movement.type === "LOAD" && cycleClosed) {
          latestCycle = [];
          runningQuantity = 0;
          cycleClosed = false;
        }

        if (movement.type === "LOAD") {
          runningQuantity += Math.abs(movement.amount);
          latestCycle.push(movement);
          continue;
        }

        if (latestCycle.length === 0) {
          continue;
        }

        if (movement.type === "SALE") {
          runningQuantity -= Math.abs(movement.amount);
          latestCycle.push(movement);
        }

        if (movement.type === "RETURN") {
          runningQuantity -= Math.abs(movement.amount);
          latestCycle.push(movement);
        }

        if (movement.type === "ADJUSTMENT") {
          runningQuantity += movement.amount;
          latestCycle.push(movement);
        }

        /*
         * Tur kapansa bile hareketleri silmiyoruz.
         * Böylece son turun giden, gelen ve satılan
         * değerleri yeni yüklemeye kadar görünür.
         */
        if (runningQuantity <= 0) {
          runningQuantity = 0;
          cycleClosed = true;
        }
      }

      return latestCycle;
    }

    const activeStockRows = driverStocks.map((stock) => {
      const activeMovements = getLatestCycleMovements(stock.productId);

      const loadedQuantity = activeMovements
        .filter((movement) => movement.type === "LOAD")
        .reduce((total, movement) => total + Math.abs(movement.amount), 0);

      const soldQuantity = activeMovements
        .filter((movement) => movement.type === "SALE")
        .reduce((total, movement) => total + Math.abs(movement.amount), 0);

      const returnedQuantity = activeMovements
        .filter((movement) => movement.type === "RETURN")
        .reduce((total, movement) => total + Math.abs(movement.amount), 0);

      return {
        ...stock,
        loadedQuantity,
        soldQuantity,
        returnedQuantity,
        currentQuantity: stock.quantity,
        salePrice: Number(stock.product.price || 0),

        product: {
          ...stock.product,

          displayName:
            stock.product.nameTr || stock.product.nameDe || stock.product.name,
        },
      };
    });

    /*
     * Özet kartları driverStock satırlarından hesaplanmaz.
     *
     * Çünkü akşam sayımı tamamlanınca driverStock satırları silinir.
     * Özetler son araç turunun hareket kayıtlarından hesaplanır.
     */
    const movementProductIds = Array.from(
      new Set(movementList.map((movement) => movement.productId)),
    );

    const stockSummary = movementProductIds.reduce(
      (summary, productId) => {
        const latestCycleMovements = getLatestCycleMovements(productId);

        const loadedQuantity = latestCycleMovements
          .filter((movement) => movement.type === "LOAD")
          .reduce((total, movement) => total + Math.abs(movement.amount), 0);

        const returnedQuantity = latestCycleMovements
          .filter((movement) => movement.type === "RETURN")
          .reduce((total, movement) => total + Math.abs(movement.amount), 0);

        const soldQuantity = latestCycleMovements
          .filter((movement) => movement.type === "SALE")
          .reduce((total, movement) => total + Math.abs(movement.amount), 0);

        const loadedValue = latestCycleMovements
          .filter((movement) => movement.type === "LOAD")
          .reduce(
            (total, movement) =>
              total +
              Math.abs(movement.amount) * Number(movement.product.price || 0),
            0,
          );

        const soldValue = latestCycleMovements
          .filter((movement) => movement.type === "SALE")
          .reduce(
            (total, movement) =>
              total +
              Math.abs(movement.amount) * Number(movement.product.price || 0),
            0,
          );

        summary.totalLoadedQuantity += loadedQuantity;
        summary.totalLoadedValue += loadedValue;
        summary.totalReturnedQuantity += returnedQuantity;
        summary.totalSoldQuantity += soldQuantity;
        summary.totalSoldValue += soldValue;

        return summary;
      },
      {
        totalLoadedQuantity: 0,
        totalLoadedValue: 0,
        totalReturnedQuantity: 0,
        totalSoldQuantity: 0,
        totalSoldValue: 0,
      },
    );

    /*
     * Son araç turunda yapılan satışları sipariş bazında tekilleştir.
     *
     * Her ürün için ayrı SALE hareketi oluştuğundan aynı orderId birden
     * fazla kez gelebilir. Burada her siparişi yalnızca bir kez gösteriyoruz.
     */
    const currentTripSaleOrderMap = new Map<
      string,
      NonNullable<DriverMovementItem["order"]>
    >();

    for (const movement of currentDriverTripMovements) {
      if (movement.type !== "SALE" || !movement.orderId || !movement.order) {
        continue;
      }

      currentTripSaleOrderMap.set(movement.orderId, movement.order);
    }

    const currentTripSales = Array.from(currentTripSaleOrderMap.values())
      .map((order) => {
        const customerFullName = [order.user.firstName, order.user.lastName]
          .filter(Boolean)
          .join(" ")
          .trim();

        const customerName =
          order.user.companyName || customerFullName || order.user.email;

        const returnedPfandAmount =
          order.pfandReturns.length > 0
            ? Number(
                order.pfandReturns[0].approvedAmount ??
                  order.pfandReturns[0].totalAmount ??
                  0,
              )
            : 0;

        const grossAmount = Number(
          (
            Number(order.subtotal || 0) +
            Number(order.deliveryFee || 0) +
            Number(order.pfandAmount || 0)
          ).toFixed(2),
        );

        const netAmount = Number(
          Math.max(0, grossAmount - returnedPfandAmount).toFixed(2),
        );

        const paymentText = `${order.driverNote || ""}\n${order.customerNote || ""}`;

        const paymentMethod = paymentText.includes("Ödeme: Kart")
          ? "CARD"
          : paymentText.includes("Ödeme: Açık Hesap")
            ? "OPEN"
            : paymentText.includes("Ödeme: Nakit")
              ? "CASH"
              : "UNKNOWN";

        return {
          id: order.id,
          orderNumber: order.orderNumber,
          createdAt: order.createdAt,

          customer: {
            id: order.user.id,
            name: customerName,
            phone: order.user.phone,
            email: order.user.email,
          },

          paymentMethod,
          paymentStatus: order.paymentStatus,

          grossAmount,
          returnedPfandAmount,
          netAmount,

          driverPaymentReportedAmount:
            order.driverPaymentReportedAmount !== null
              ? Number(order.driverPaymentReportedAmount)
              : null,

          items: order.items.map((item) => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            price: Number(item.price || 0),
            pfand: Number(item.pfand || 0),

            lineTotal: Number(
              (
                item.quantity *
                (Number(item.price || 0) + Number(item.pfand || 0))
              ).toFixed(2),
            ),
          })),
        };
      })
      .sort(
        (first, second) =>
          new Date(second.createdAt).getTime() -
          new Date(first.createdAt).getTime(),
      );

    console.log(
      "CURRENT TRIP SALES",
      currentTripSales.map(s => ({
        order: s.orderNumber,
        paymentMethod: s.paymentMethod,
        paymentStatus: s.paymentStatus,
        netAmount: s.netAmount,
      })),
    );

    const todayCashToCollect = Number(
      currentTripSales
        .filter(
          (sale) =>
            sale.paymentMethod === "CASH" &&
            sale.paymentStatus !== "PAID",
        )
        .reduce((total, sale) => total + sale.netAmount, 0)
        .toFixed(2),
    );

    return NextResponse.json({
      canManage: admin.isSuperAdmin || admin.permissions.manageDriverStock,

      /*
       * Şoförün bildirdiği müşteri tahsilatını kasaya alma yetkisi.
       * Stok yönetme yetkisinden ayrı tutulur.
       */
      canApproveCustomerPayment:
        admin.isSuperAdmin || admin.permissions.approveCustomerPayment,

      summary: {
        ...stockSummary,
        todayCashToCollect,
      },

      drivers,

      products: products.map((product) => ({
        ...product,

        displayName: product.nameTr || product.nameDe || product.name,

        categoryName:
          product.category.nameTr ||
          product.category.nameDe ||
          product.category.name,
      })),

      driverStocks: activeStockRows,

      currentTripSales,

      loads: loads.map(serializeLoad),
    });
  } catch (error) {
    console.error("ADMIN_DRIVER_STOCK_GET_ERROR", error);

    return NextResponse.json(
      {
        error:
          language === "de"
            ? "Fahrerbestandsdaten konnten nicht geladen werden."
            : "Şoför stok bilgileri yüklenemedi.",
      },
      {
        status: 500,
      },
    );
  }
});

export const POST = withTenant(async (request: NextRequest, _context, tenant) => {
  const language = await getRequestLanguage();
  const admin = await requireAdminPermission("manageDriverStock");

  if (!admin) {
    return NextResponse.json(
      {
        error:
          language === "de"
            ? "Sie haben keine Berechtigung, den Fahrer zu beladen."
            : "Şoföre stok yükleme yetkiniz yok.",
      },
      {
        status: 403,
      },
    );
  }

  try {
    const body = await request.json();

    const action =
      body.action === "COUNT_RETURN"
        ? "COUNT_RETURN"
        : body.action === "RETURN"
          ? "RETURN"
          : "LOAD";

    const driverId = String(body.driverId || "").trim();

    const note = String(body.note || "")
      .trim()
      .slice(0, 1000);

    const countItems =
      action === "COUNT_RETURN" ? normalizeReturnCountItems(body.items) : [];

    const items =
      action === "COUNT_RETURN" ? [] : normalizeLoadItems(body.items);

    if (!driverId) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Sie müssen einen Fahrer auswählen."
              : "Şoför seçmelisiniz.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      action === "COUNT_RETURN" ? countItems.length === 0 : items.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? action === "COUNT_RETURN"
                ? "Geben Sie mindestens eine zu bestätigende Produktzählung ein."
                : action === "RETURN"
                  ? "Geben Sie mindestens ein zurückzunehmendes Produkt mit Menge ein."
                  : "Geben Sie mindestens ein zu ladendes Produkt mit Menge ein."
              : action === "COUNT_RETURN"
                ? "Onaylanacak en az bir ürün sayımı girin."
                : action === "RETURN"
                  ? "İade alınacak en az bir ürün ve miktar girin."
                  : "Yüklenecek en az bir ürün ve miktar girin.",
        },
        {
          status: 400,
        },
      );
    }

    const driver = await prisma.user.findFirst({
      where: {
        id: driverId,
        role: "DRIVER",
        isActive: true,
      },

      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    });

    if (!driver) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Der ausgewählte aktive Fahrer wurde nicht gefunden."
              : "Seçilen aktif şoför bulunamadı.",
        },
        {
          status: 404,
        },
      );
    }

    const products = await prisma.product.findMany({
      where: {
        id: {
          in:
            action === "COUNT_RETURN"
              ? countItems.map((item) => item.productId)
              : items.map((item) => item.productId),
        },

        ...(action === "LOAD"
          ? {
              active: true,
            }
          : {}),
      },

      select: {
        id: true,
        name: true,
        nameTr: true,
        nameDe: true,
        stock: true,
        stockUnit: true,
      },
    });

    if (
      products.length !==
      (action === "COUNT_RETURN" ? countItems.length : items.length)
    ) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? action === "COUNT_RETURN"
                ? "Einige Produkte aus der Fahrzeugzählung wurden nicht gefunden."
                : action === "RETURN"
                  ? "Einige Produkte aus der Rückgabeliste wurden nicht gefunden."
                  : "Einige Produkte aus der Ladeliste wurden nicht gefunden oder sind nicht verkaufbar."
              : action === "COUNT_RETURN"
                ? "Araç sayımındaki bazı ürünler bulunamadı."
                : action === "RETURN"
                  ? "İade listesindeki bazı ürünler bulunamadı."
                  : "Yükleme listesindeki bazı ürünler bulunamadı veya satışa kapalı.",
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
     * Admin araç sayımı:
     *
     * - Araçta görünmesi gereken miktarın tamamı kapatılır.
     * - Gerçek geri gelen miktar ana depoya eklenir.
     * - Aradaki fark eksik olarak ADJUSTMENT hareketine kaydedilir.
     * - Sıfır geri gelen miktarı da geçerli bir sayımdır.
     */
    if (action === "COUNT_RETURN") {
      const currentDriverStocks = await prisma.driverStock.findMany({
        where: {
          driverId,

          productId: {
            in: countItems.map((item) => item.productId),
          },
        },

        select: {
          productId: true,
          quantity: true,
        },
      });

      const driverStockByProductId = new Map(
        currentDriverStocks.map((stock) => [stock.productId, stock.quantity]),
      );

      for (const item of countItems) {
        const expectedQuantity = driverStockByProductId.get(item.productId);

        const product = productById.get(item.productId);

        if (!product || expectedQuantity === undefined) {
          return NextResponse.json(
            {
              error:
                language === "de"
                  ? "Der zu zählende Fahrzeugbestand wurde nicht gefunden."
                  : "Sayımı yapılacak araç stoku bulunamadı.",
            },
            {
              status: 404,
            },
          );
        }

        if (item.returnedQuantity > expectedQuantity) {
          const productName = product.nameTr || product.nameDe || product.name;

          return NextResponse.json(
            {
              error:
                language === "de"
                  ? `Die zurückgemeldete Menge für ${productName} übersteigt den Fahrzeugbestand. ` +
                    `Im Fahrzeug erwartet: ${expectedQuantity}, ` +
                    `zurückgemeldet: ${item.returnedQuantity}.`
                  : `${productName} için geri gelen miktar araç stokundan fazla. ` +
                    `Araçta beklenen: ${expectedQuantity}, ` +
                    `geri gelen: ${item.returnedQuantity}.`,
            },
            {
              status: 409,
            },
          );
        }
      }

      const result = await prisma.$transaction(async (tx) => {
        let totalReturnedQuantity = 0;
        let totalMissingQuantity = 0;

        for (const item of countItems) {
          const product = productById.get(item.productId);

          const expectedQuantity = driverStockByProductId.get(item.productId);

          if (!product || expectedQuantity === undefined) {
            throw new Error("COUNT_PRODUCT_NOT_FOUND");
          }

          const missingQuantity = expectedQuantity - item.returnedQuantity;

          const reducedDriverStock = await tx.driverStock.updateMany({
            where: {
              driverId,
              productId: item.productId,
              quantity: expectedQuantity,
            },

            data: {
              quantity: {
                decrement: expectedQuantity,
              },
            },
          });

          if (reducedDriverStock.count !== 1) {
            throw new Error(
              `DRIVER_STOCK_CHANGED:${
                product.nameTr || product.nameDe || product.name
              }`,
            );
          }

          if (item.returnedQuantity > 0) {
            await tx.product.update({
              where: {
                id: item.productId,
              },

              data: {
                stock: {
                  increment: item.returnedQuantity,
                },
              },
            });

            await tx.stockMovement.create({
              data: {
                tenantId: tenant.id,
                productId: item.productId,
                amount: item.returnedQuantity,

                reason:
                  `Admin araç sayımı: ${item.returnedQuantity} ` +
                  `${product.stockUnit.toLocaleLowerCase("tr-TR")} ` +
                  `şoförden ana depoya geri alındı.`,
              },
            });

            await tx.driverStockMovement.create({
              data: {
                tenantId: tenant.id,
                driverId,
                productId: item.productId,
                type: "RETURN",
                amount: -item.returnedQuantity,
                createdById: admin.session.userId,

                note:
                  `Admin araç sayımında ${item.returnedQuantity} ` +
                  `${product.stockUnit.toLocaleLowerCase("tr-TR")} ` +
                  `geri geldi olarak onaylandı.` +
                  (note ? ` Not: ${note}` : ""),
              },
            });
          }

          if (missingQuantity > 0) {
            await tx.driverStockMovement.create({
              data: {
                tenantId: tenant.id,
                driverId,
                productId: item.productId,
                type: "ADJUSTMENT",
                amount: -missingQuantity,
                createdById: admin.session.userId,

                note:
                  `Admin araç sayımında ${missingQuantity} ` +
                  `${product.stockUnit.toLocaleLowerCase("tr-TR")} ` +
                  `eksik tespit edildi. Araçta beklenen: ` +
                  `${expectedQuantity}, geri gelen: ` +
                  `${item.returnedQuantity}.` +
                  (note ? ` Not: ${note}` : ""),
              },
            });
          }

          totalReturnedQuantity += item.returnedQuantity;
          totalMissingQuantity += missingQuantity;
        }

        await tx.driverStock.deleteMany({
          where: {
            driverId,
            quantity: 0,
          },
        });

        return {
          totalReturnedQuantity,
          totalMissingQuantity,
        };
      });

      return NextResponse.json({
        message:
          language === "de"
            ? `${countItems.length} Produktzählungen bestätigt. ` +
              `${result.totalReturnedQuantity} Produkte ins Lager zurückgenommen` +
              (result.totalMissingQuantity > 0
                ? `, ${result.totalMissingQuantity} Produkte als fehlend erfasst.`
                : ", kein Fehlbestand.")
            : `${countItems.length} ürün sayımı onaylandı. ` +
              `${result.totalReturnedQuantity} ürün depoya geri alındı` +
              (result.totalMissingQuantity > 0
                ? `, ${result.totalMissingQuantity} ürün eksik kaydedildi.`
                : ", eksik bulunmadı."),

        approvedCount: countItems.length,
        totalReturnedQuantity: result.totalReturnedQuantity,
        totalMissingQuantity: result.totalMissingQuantity,
      });
    }

    /*
     * Akşam şoförden araçta kalan malları geri alma işlemi.
     *
     * - Şoför stokundan düşer.
     * - Ana depo stokuna geri eklenir.
     * - Her iki stok hareketi de kayıt altına alınır.
     * - İşlemin tamamı transaction içinde gerçekleştirilir.
     */
    if (action === "RETURN") {
      const currentDriverStocks = await prisma.driverStock.findMany({
        where: {
          driverId,

          productId: {
            in: items.map((item) => item.productId),
          },
        },

        select: {
          productId: true,
          quantity: true,
        },
      });

      const driverStockByProductId = new Map(
        currentDriverStocks.map((stock) => [stock.productId, stock.quantity]),
      );

      for (const item of items) {
        const product = productById.get(item.productId);

        if (!product) {
          return NextResponse.json(
            {
              error:
                language === "de"
                  ? "Das zurückzunehmende Produkt wurde nicht gefunden."
                  : "İade alınacak ürün bulunamadı.",
            },
            {
              status: 404,
            },
          );
        }

        const currentDriverQuantity =
          driverStockByProductId.get(item.productId) || 0;

        if (item.quantity > currentDriverQuantity) {
          const productName = product.nameTr || product.nameDe || product.name;

          return NextResponse.json(
            {
              error:
                language === "de"
                  ? `Der Fahrer hat nicht genügend ${productName} auf Lager. ` +
                    `Beim Fahrer: ${currentDriverQuantity}, Rückgabe: ${item.quantity}.`
                  : `${productName} için şoförde yeterli ürün bulunmuyor. ` +
                    `Şoförde: ${currentDriverQuantity}, iade: ${item.quantity}.`,
            },
            {
              status: 409,
            },
          );
        }
      }

      await prisma.$transaction(async (tx) => {
        for (const item of items) {
          const product = productById.get(item.productId);

          if (!product) {
            throw new Error("PRODUCT_NOT_FOUND");
          }

          /*
           * Aynı anda başka işlem yapılsa bile şoför stoğu
           * eksiye düşemez.
           */
          const reducedDriverStock = await tx.driverStock.updateMany({
            where: {
              driverId,
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

          if (reducedDriverStock.count !== 1) {
            throw new Error(
              `INSUFFICIENT_DRIVER_STOCK:${
                product.nameTr || product.nameDe || product.name
              }`,
            );
          }

          await tx.product.update({
            where: {
              id: item.productId,
            },

            data: {
              stock: {
                increment: item.quantity,
              },
            },
          });

          const driverName =
            [driver.firstName, driver.lastName]
              .filter(Boolean)
              .join(" ")
              .trim() || driver.email;

          await tx.stockMovement.create({
            data: {
              tenantId: tenant.id,
              productId: item.productId,
              amount: item.quantity,

              reason:
                `Şoförden depoya iade: ${driverName}. ` +
                `${item.quantity} ${product.stockUnit.toLocaleLowerCase(
                  "tr-TR",
                )} geri alındı.`,
            },
          });

          await tx.driverStockMovement.create({
            data: {
              tenantId: tenant.id,
              driverId,
              productId: item.productId,
              type: "RETURN",
              amount: -item.quantity,
              createdById: admin.session.userId,

              note:
                `Admin tarafından şoförden ${item.quantity} ` +
                `${product.stockUnit.toLocaleLowerCase(
                  "tr-TR",
                )} geri alındı ve ana depoya eklendi.` +
                (note ? ` Not: ${note}` : ""),
            },
          });
        }

        /*
         * Sıfır kalan satırlar araç stok ekranını gereksiz
         * doldurmasın.
         */
        await tx.driverStock.deleteMany({
          where: {
            driverId,
            quantity: 0,
          },
        });
      });

      return NextResponse.json({
        message:
          language === "de"
            ? "Produkte wurden vom Fahrer zurückgenommen und dem Hauptlager hinzugefügt."
            : "Ürünler şoförden geri alındı ve ana depo stokuna eklendi.",
      });
    }

    for (const item of items) {
      const product = productById.get(item.productId);

      if (!product) {
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

      if (product.stock < item.quantity) {
        const productName = product.nameTr || product.nameDe || product.name;

        return NextResponse.json(
          {
            error:
              `${productName} için ana stok yetersiz. ` +
              `Mevcut: ${product.stock}, istenen: ${item.quantity}.`,
          },
          {
            status: 409,
          },
        );
      }
    }

    const load = await prisma.$transaction(async (tx) => {
      const createdLoad = await tx.driverLoad.create({
        data: {
          tenantId: tenant.id,
          driverId,
          createdById: admin.session.userId,
          status: "CONFIRMED",
          confirmedAt: new Date(),
          note: note || null,
        },

        select: {
          id: true,
        },
      });

      for (const item of items) {
        const product = productById.get(item.productId);

        if (!product) {
          throw new Error("PRODUCT_NOT_FOUND");
        }

        /*
         * Aynı anda iki işlem yapılırsa stok eksiye düşmesin.
         */
        const reduced = await tx.product.updateMany({
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

        if (reduced.count !== 1) {
          throw new Error(
            `INSUFFICIENT_STOCK:${product.nameTr || product.nameDe || product.name}`,
          );
        }

        await tx.stockMovement.create({
          data: {
            tenantId: tenant.id,
            productId: item.productId,
            amount: -item.quantity,

            reason:
              `Şoför yüklemesi: ${driver.firstName || ""} ` +
              `${driver.lastName || ""} (${driver.email})`.trim() +
              ` · Yükleme: ${createdLoad.id}`,
          },
        });

        await tx.driverLoadItem.create({
          data: {
            loadId: createdLoad.id,
            productId: item.productId,
            quantity: item.quantity,
          },
        });

        await tx.driverStock.upsert({
          where: {
            driverId_productId: {
              driverId,
              productId: item.productId,
            },
          },

          update: {
            quantity: {
              increment: item.quantity,
            },
          },

          create: {
            tenantId: tenant.id,
            driverId,
            productId: item.productId,
            quantity: item.quantity,
          },
        });

        await tx.driverStockMovement.create({
          data: {
            tenantId: tenant.id,
            driverId,
            productId: item.productId,
            loadId: createdLoad.id,
            type: "LOAD",
            amount: item.quantity,
            createdById: admin.session.userId,

            note:
              language === "de"
                ? `Admin hat ${item.quantity} ` +
                  `${(
                    {
                      KASA: "Kiste",
                      KARTON: "Karton",
                      PAKET: "Paket",
                      ADET: "Stück",
                    } as Record<string, string>
                  )[product.stockUnit] ||
                    product.stockUnit.toLocaleLowerCase("de-DE")} an den Fahrer geladen.`
                : `Admin tarafından şoföre ${item.quantity} ` +
                  `${product.stockUnit.toLocaleLowerCase("tr-TR")} yüklendi.`,
          },
        });
      }

      return tx.driverLoad.findUniqueOrThrow({
        where: {
          id: createdLoad.id,
        },

        select: {
          id: true,
          status: true,
          note: true,
          confirmedAt: true,
          createdAt: true,

          driver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },

          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },

          items: {
            select: {
              id: true,
              quantity: true,

              product: {
                select: {
                  id: true,
                  name: true,
                  nameTr: true,
                  nameDe: true,
                  stockUnit: true,
                  packageInfo: true,
                },
              },
            },
          },
        },
      });
    });

    return NextResponse.json(
      {
        message:
          language === "de"
            ? "Produkte wurden erfolgreich auf den Fahrer geladen."
            : "Ürünler şoför stokuna başarıyla yüklendi.",
        load: serializeLoad(load),
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("ADMIN_DRIVER_STOCK_POST_ERROR", error);

    const message = error instanceof Error ? error.message : "";

    if (message.startsWith("DRIVER_STOCK_CHANGED:")) {
      return NextResponse.json(
        {
          error:
            `${message.split(":")[1]} için araç stoku işlem sırasında değişti. ` +
            "Sayfayı yenileyip tekrar deneyin.",
        },
        {
          status: 409,
        },
      );
    }

    if (message.startsWith("INSUFFICIENT_STOCK:")) {
      return NextResponse.json(
        {
          error:
            `${message.split(":")[1]} için ana stok yetersiz. ` +
            "Hiçbir ürün şoföre yüklenmedi.",
        },
        {
          status: 409,
        },
      );
    }

    if (message.startsWith("INSUFFICIENT_DRIVER_STOCK:")) {
      return NextResponse.json(
        {
          error:
            `${message.split(":")[1]} için şoförde yeterli stok bulunmuyor. ` +
            "Hiçbir ürün depoya iade alınmadı.",
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
            ? "Fahrzeugbeladung konnte nicht durchgeführt werden."
            : "Şoför stok yüklemesi gerçekleştirilemedi.",
      },
      {
        status: 500,
      },
    );
  }
});
