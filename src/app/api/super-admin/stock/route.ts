import {
  verifySessionToken,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRequestLanguage } from "@/lib/request-language";
import { withTenant } from "@/lib/tenant";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

async function getSuperAdminSession() {
  const cookieStore =
    await cookies();

  const token =
    cookieStore.get(
      "paketmarket_session"
    )?.value;

  if (!token) {
    return null;
  }

  const session =
    await verifySessionToken(
      token
    );

  if (
    !session ||
    session.role !==
      "SUPER_ADMIN"
  ) {
    return null;
  }

  const user =
    await prisma.user.findUnique({
      where: {
        id: session.userId,
      },

      select: {
        id: true,
        isActive: true,
      },
    });

  if (
    !user ||
    !user.isActive
  ) {
    return null;
  }

  return session;
}

export const GET = withTenant(async () => {
  const language = await getRequestLanguage();

  const session =
    await getSuperAdminSession();

  if (!session) {
    return NextResponse.json(
      {
        error: language === "de" ? "Unbefugter Zugriff." : "Yetkisiz erişim.",
      },
      {
        status: 403,
      }
    );
  }

  try {
    const now =
      new Date();

    const todayStart =
      new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );

    const tomorrowStart =
      new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1
      );

    const monthStart =
      new Date(
        now.getFullYear(),
        now.getMonth(),
        1
      );

    const nextMonthStart =
      new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        1
      );

    const yearStart =
      new Date(
        now.getFullYear(),
        0,
        1
      );

    const nextYearStart =
      new Date(
        now.getFullYear() + 1,
        0,
        1
      );

    const [
      products,
      movements,
      todaySales,
      monthlySales,
      yearlySales,
    ] =
      await Promise.all([
        prisma.product.findMany({
          include: {
            category: true,
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

        prisma.stockMovement.findMany({
          take: 50,

          include: {
            product: {
              select: {
                id: true,
                name: true,
                nameTr: true,
                nameDe: true,
              },
            },
          },

          orderBy: {
            createdAt:
              "desc",
          },
        }),

        prisma.orderItem.findMany({
          where: {
            order: {
              deletedAt:
                null,

              status: {
                notIn: [
                  "CANCELLED",
                ],
              },

              createdAt: {
                gte:
                  todayStart,

                lt:
                  tomorrowStart,
              },
            },
          },

          select: {
            productId: true,
            quantity: true,
            price: true,
          },
        }),

        prisma.orderItem.findMany({
          where: {
            order: {
              deletedAt:
                null,

              status: {
                notIn: [
                  "CANCELLED",
                ],
              },

              createdAt: {
                gte:
                  monthStart,

                lt:
                  nextMonthStart,
              },
            },
          },

          select: {
            productId: true,
            quantity: true,
            price: true,
          },
        }),

        prisma.orderItem.findMany({
          where: {
            order: {
              deletedAt:
                null,

              status: {
                notIn: [
                  "CANCELLED",
                ],
              },

              createdAt: {
                gte:
                  yearStart,

                lt:
                  nextYearStart,
              },
            },
          },

          select: {
            productId: true,
            quantity: true,
            price: true,
          },
        }),
      ]);

    type SalesTotal = {
      quantity: number;
      revenue: number;
    };

    function buildSalesMap(
      items: Array<{
        productId: string;
        quantity: number;
        price: unknown;
      }>
    ) {
      const map =
        new Map<
          string,
          SalesTotal
        >();

      for (const item of items) {
        const current =
          map.get(
            item.productId
          ) || {
            quantity: 0,
            revenue: 0,
          };

        current.quantity +=
          item.quantity;

        current.revenue +=
          Number(
            item.price
          ) *
          item.quantity;

        map.set(
          item.productId,
          current
        );
      }

      return map;
    }

    const todaySalesMap =
      buildSalesMap(
        todaySales
      );

    const monthlySalesMap =
      buildSalesMap(
        monthlySales
      );

    const yearlySalesMap =
      buildSalesMap(
        yearlySales
      );

    return NextResponse.json({
      products:
        products.map(
          (product) => ({
            id:
              product.id,

            name:
              product.name,

            nameTr:
              product.nameTr,

            nameDe:
              product.nameDe,

            stock:
              product.stock,

            minStock:
              product.minStock,

            salePrice:
              Number(
                product.price
              ),

            purchasePrice:
              Number(
                product.purchasePrice
              ),

            soldToday:
              todaySalesMap.get(
                product.id
              )?.quantity || 0,

            soldTodayRevenue:
              Number(
                (
                  todaySalesMap.get(
                    product.id
                  )?.revenue || 0
                ).toFixed(2)
              ),

            soldTodayCost:
              Number(
                (
                  (
                    todaySalesMap.get(
                      product.id
                    )?.quantity || 0
                  ) *
                  Number(
                    product.purchasePrice
                  )
                ).toFixed(2)
              ),

            soldTodayProfit:
              Number(
                (
                  (
                    todaySalesMap.get(
                      product.id
                    )?.revenue || 0
                  ) -
                  (
                    (
                      todaySalesMap.get(
                        product.id
                      )?.quantity || 0
                    ) *
                    Number(
                      product.purchasePrice
                    )
                  )
                ).toFixed(2)
              ),

            soldThisMonth:
              monthlySalesMap.get(
                product.id
              )?.quantity || 0,

            soldThisMonthRevenue:
              Number(
                (
                  monthlySalesMap.get(
                    product.id
                  )?.revenue || 0
                ).toFixed(2)
              ),

            soldThisMonthCost:
              Number(
                (
                  (
                    monthlySalesMap.get(
                      product.id
                    )?.quantity || 0
                  ) *
                  Number(
                    product.purchasePrice
                  )
                ).toFixed(2)
              ),

            soldThisMonthProfit:
              Number(
                (
                  (
                    monthlySalesMap.get(
                      product.id
                    )?.revenue || 0
                  ) -
                  (
                    (
                      monthlySalesMap.get(
                        product.id
                      )?.quantity || 0
                    ) *
                    Number(
                      product.purchasePrice
                    )
                  )
                ).toFixed(2)
              ),

            soldThisYear:
              yearlySalesMap.get(
                product.id
              )?.quantity || 0,

            soldThisYearRevenue:
              Number(
                (
                  yearlySalesMap.get(
                    product.id
                  )?.revenue || 0
                ).toFixed(2)
              ),

            soldThisYearCost:
              Number(
                (
                  (
                    yearlySalesMap.get(
                      product.id
                    )?.quantity || 0
                  ) *
                  Number(
                    product.purchasePrice
                  )
                ).toFixed(2)
              ),

            soldThisYearProfit:
              Number(
                (
                  (
                    yearlySalesMap.get(
                      product.id
                    )?.revenue || 0
                  ) -
                  (
                    (
                      yearlySalesMap.get(
                        product.id
                      )?.quantity || 0
                    ) *
                    Number(
                      product.purchasePrice
                    )
                  )
                ).toFixed(2)
              ),

            packageInfo:
              product.packageInfo,

            active:
              product.active,

            category: {
              id:
                product.category.id,

              name:
                product.category.name,

              nameTr:
                product.category.nameTr,

              nameDe:
                product.category.nameDe,
            },
          })
        ),

      movements:
        movements.map(
          (movement) => ({
            id:
              movement.id,

            productId:
              movement.productId,

            amount:
              movement.amount,

            reason:
              movement.reason,

            createdAt:
              movement.createdAt,

            product: {
              id:
                movement.product.id,

              name:
                movement.product.name,

              nameTr:
                movement.product.nameTr,

              nameDe:
                movement.product.nameDe,
            },
          })
        ),
    });
  } catch (error) {
    console.error(
      "SUPER_ADMIN_STOCK_GET_ERROR",
      error
    );

    return NextResponse.json(
      {
        error:
          language === "de"
            ? "Bestandsdaten konnten nicht geladen werden."
            : "Stok bilgileri yüklenemedi.",
      },
      {
        status: 500,
      }
    );
  }
});

export const PATCH = withTenant(async (
  request: NextRequest,
  _context,
  tenant,
) => {
  const language = await getRequestLanguage();

  const session =
    await getSuperAdminSession();

  if (!session) {
    return NextResponse.json(
      {
        error: language === "de" ? "Unbefugter Zugriff." : "Yetkisiz erişim.",
      },
      {
        status: 403,
      }
    );
  }

  try {
    const body =
      await request.json();

    const productId =
      String(
        body.productId || ""
      ).trim();

    const action =
      String(
        body.action || ""
      )
        .trim()
        .toUpperCase();

    const quantity =
      Number(
        body.quantity
      );

    const purchasePrice =
      Number(
        body.purchasePrice
      );

    const allowedActions = [
      "STOCK_ADD",
      "RETURN",
      "BROKEN",
      "EXPIRED",
      "UPDATE_PURCHASE_PRICE",
    ] as const;

    type StockAction =
      (typeof allowedActions)[number];

    if (!productId) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Kein Produkt ausgewählt."
              : "Ürün seçilmedi.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !allowedActions.includes(
        action as StockAction
      )
    ) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Ungültiger Bestandsvorgang."
              : "Geçersiz stok işlemi.",
        },
        {
          status: 400,
        }
      );
    }

    const selectedAction =
      action as StockAction;

    if (
      selectedAction ===
      "UPDATE_PURCHASE_PRICE"
    ) {
      if (
        !Number.isFinite(
          purchasePrice
        ) ||
        purchasePrice < 0 ||
        purchasePrice > 999999
      ) {
        return NextResponse.json(
          {
            error:
              language === "de"
                ? "Geben Sie einen gültigen Einkaufspreis ein."
                : "Geçerli bir alış fiyatı girin.",
          },
          {
            status: 400,
          }
        );
      }

      const product =
        await prisma.product.update({
          where: {
            id:
              productId,
          },

          data: {
            purchasePrice,
          },

          select: {
            id: true,
            stock: true,
            purchasePrice: true,
          },
        });

      return NextResponse.json({
        message:
          language === "de"
            ? `Einkaufspreis wurde auf ${purchasePrice.toFixed(2)} € aktualisiert.`
            : `Alış fiyatı ${purchasePrice.toFixed(2)} € olarak güncellendi.`,

        product: {
          id:
            product.id,

          stock:
            product.stock,

          purchasePrice:
            Number(
              product.purchasePrice
            ),
        },
      });
    }

    if (
      !Number.isInteger(
        quantity
      ) ||
      quantity <= 0 ||
      quantity > 999999
    ) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Die Menge muss eine positive ganze Zahl sein."
              : "Miktar pozitif tam sayı olmalıdır.",
        },
        {
          status: 400,
        }
      );
    }

    const stockAction =
      selectedAction as Exclude<
        StockAction,
        "UPDATE_PURCHASE_PRICE"
      >;

    const addsStock =
      stockAction ===
        "STOCK_ADD";

    const stockAmount =
      addsStock
        ? quantity
        : -quantity;

    const reasonByAction:
      Record<
        Exclude<
          StockAction,
          "UPDATE_PURCHASE_PRICE"
        >,
        string
      > =
      language === "de"
        ? {
            STOCK_ADD:
              "Bestand von Super Admin erhöht",

            RETURN:
              "An Lieferant zurückgegebenes Produkt vom Bestand abgezogen",

            BROKEN:
              "Beschädigtes Produkt vom Bestand abgezogen",

            EXPIRED:
              "Abgelaufenes Produkt vom Bestand abgezogen",
          }
        : {
            STOCK_ADD:
              "Super Admin stok artırdı",

            RETURN:
              "Tedarikçiye iade edilen ürün stoktan düşüldü",

            BROKEN:
              "Kırılan ürün stoktan düşüldü",

            EXPIRED:
              "Tarihi geçen ürün stoktan düşüldü",
          };

    const result =
      await prisma.$transaction(
        async (
          tx
        ) => {
          const product =
            await tx.product.findUnique({
              where: {
                id:
                  productId,
              },

              select: {
                id: true,
                name: true,
                nameTr: true,
                nameDe: true,
                stock: true,
              },
            });

          if (!product) {
            throw new Error(
              "PRODUCT_NOT_FOUND"
            );
          }

          if (
            !addsStock &&
            product.stock <
              quantity
          ) {
            throw new Error(
              "INSUFFICIENT_STOCK"
            );
          }

          if (addsStock) {
            await tx.product.update({
              where: {
                id: productId,
              },

              data: {
                stock: {
                  increment: quantity,
                },
              },
            });
          } else {
            const updated = await tx.product.updateMany({
              where: {
                id: productId,
                stock: {
                  gte: quantity,
                },
              },

              data: {
                stock: {
                  decrement: quantity,
                },
              },
            });

            if (updated.count !== 1) {
              throw new Error("INSUFFICIENT_STOCK");
            }
          }

          const updatedProduct = await tx.product.findUniqueOrThrow({
            where: {
              id: productId,
            },

            select: {
              id: true,
              stock: true,
            },
          });

          const productName =
            language === "de"
              ? product.nameDe ||
                product.nameTr ||
                product.name
              : product.nameTr ||
                product.nameDe ||
                product.name;

          const movement =
            await tx.stockMovement.create({
              data: {
                tenantId:
                  tenant.id,

                productId:
                  product.id,

                amount:
                  stockAmount,

                reason:
                  `${reasonByAction[stockAction]}: ${productName}`,
              },

              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    nameTr: true,
                    nameDe: true,
                  },
                },
              },
            });

          return {
            product:
              updatedProduct,

            movement,
          };
        }
      );

    const messageByAction:
      Record<
        Exclude<
          StockAction,
          "UPDATE_PURCHASE_PRICE"
        >,
        string
      > =
      language === "de"
        ? {
            STOCK_ADD:
              `${quantity} Stück wurden dem Bestand hinzugefügt.`,

            RETURN:
              `${quantity} Stück wurden an den Lieferanten zurückgegeben und vom Bestand abgezogen.`,

            BROKEN:
              `${quantity} Stück beschädigte Ware wurden vom Bestand abgezogen.`,

            EXPIRED:
              `${quantity} Stück abgelaufene Ware wurden vom Bestand abgezogen.`,
          }
        : {
            STOCK_ADD:
              `${quantity} adet stok eklendi.`,

            RETURN:
              `${quantity} adet ürün tedarikçiye iade edildi ve stoktan düşüldü.`,

            BROKEN:
              `${quantity} adet kırık ürün stoktan düşüldü.`,

            EXPIRED:
              `${quantity} adet tarihi geçmiş ürün stoktan düşüldü.`,
          };

    return NextResponse.json({
      message:
        messageByAction[
          stockAction
        ],

      product:
        result.product,

      movement: {
        id:
          result.movement.id,

        productId:
          result.movement.productId,

        amount:
          result.movement.amount,

        reason:
          result.movement.reason,

        createdAt:
          result.movement.createdAt,

        product:
          result.movement.product,
      },
    });
  } catch (error) {
    console.error(
      "SUPER_ADMIN_STOCK_PATCH_ERROR",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "";

    if (
      message ===
      "PRODUCT_NOT_FOUND"
    ) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Produkt nicht gefunden."
              : "Ürün bulunamadı.",
        },
        {
          status: 404,
        }
      );
    }

    if (
      message ===
      "INSUFFICIENT_STOCK"
    ) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Der aktuelle Bestand reicht für diesen Vorgang nicht aus."
              : "Mevcut stok bu işlem için yeterli değil.",
        },
        {
          status: 409,
        }
      );
    }

    return NextResponse.json(
      {
        error:
          language === "de"
            ? "Bestandsvorgang konnte nicht durchgeführt werden."
            : "Stok işlemi gerçekleştirilemedi.",
      },
      {
        status: 500,
      }
    );
  }
});
