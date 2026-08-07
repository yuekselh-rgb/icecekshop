import { requireAdminPermission } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

function getNoteValue(
  note: string | null,
  label: string
) {
  if (!note) {
    return null;
  }

  const line = note
    .split("\n")
    .find((item) =>
      item
        .trim()
        .toLocaleLowerCase("tr-TR")
        .startsWith(
          label.toLocaleLowerCase(
            "tr-TR"
          )
        )
    );

  if (!line) {
    return null;
  }

  return (
    line
      .slice(line.indexOf(":") + 1)
      .trim() || null
  );
}

function parseAmount(
  value: string | null
) {
  if (!value) {
    return 0;
  }

  const normalized = value
    .replace("€", "")
    .replace(/\s/g, "")
    .replace(",", ".");

  const amount = Number(normalized);

  return Number.isFinite(amount)
    ? amount
    : 0;
}

export async function GET() {
  const admin =
    await requireAdminPermission(
      "viewBarSalesReport"
    );

  if (!admin) {
    return NextResponse.json(
      {
        error:
          "Bar satış raporunu görüntüleme yetkiniz yok.",
      },
      {
        status: 403,
      }
    );
  }

  try {
    const orders =
      await prisma.order.findMany({
        where: {
          deletedAt: null,
          orderNumber: {
            startsWith: "BAR-",
          },
        },

        include: {
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
            orderBy: {
              name: "asc",
            },
          },

          payments: {
            orderBy: {
              reportedAt: "desc",
            },
            take: 1,
            select: {
              paymentMethod: true,
            },
          },

          pfandReturns: {
            orderBy: {
              createdAt: "desc",
            },
            take: 1,
            select: {
              totalAmount: true,
              approvedAmount: true,
              status: true,
              items: {
                select: {
                  id: true,
                  name: true,
                  quantity: true,
                  unitAmount: true,
                  totalAmount: true,
                },
              },
            },
          },
        },

        orderBy: {
          createdAt: "desc",
        },
      });

    const sales = orders.map(
      (order) => {
        const sellerName =
          getNoteValue(
            order.customerNote,
            "Satışı yapan:"
          ) || "Bilinmeyen personel";

        const customerFullName = [
          order.user.firstName,
          order.user.lastName,
        ]
          .filter(Boolean)
          .join(" ")
          .trim();

        const noteCustomerName =
          getNoteValue(
            order.customerNote,
            "Satış yapılan:"
          );

        const isGenericBarCustomer =
          order.user.email ===
          "bar-satis@paketmarket.local";

        const customerName =
          noteCustomerName ||
          (
            isGenericBarCustomer
              ? "Bar müşterisi"
              : (
                  order.user
                    .companyName ||
                  customerFullName ||
                  order.user.email
                )
          );

        const customerEmail =
          isGenericBarCustomer
            ? null
            : order.user.email;

        const customerPhone =
          getNoteValue(
            order.customerNote,
            "Müşteri telefonu:"
          ) ||
          (
            isGenericBarCustomer
              ? null
              : order.user.phone
          );

        /*
         * Yapısal OrderPayment kaydı varsa (bar-sales/route.ts artık
         * her satışta bir tane oluşturuyor) ödeme yöntemi oradan
         * okunur. Bu kayıt yalnızca bu düzeltmeden önce oluşturulmuş
         * eski satışlarda yoktur; onlar için not metnindeki eski
         * yönteme geri dönülür.
         */
        const structuredPaymentMethod =
          order.payments[0]?.paymentMethod ?? null;

        const notePaymentValue = getNoteValue(
          order.customerNote,
          "Ödeme:",
        )?.toLocaleLowerCase("tr-TR");

        const paymentMethodKey: "CASH" | "CARD" | "OPEN" =
          structuredPaymentMethod ||
          (notePaymentValue?.includes("kart")
            ? "CARD"
            : notePaymentValue?.includes("nakit")
              ? "CASH"
              : order.paymentStatus === "PAID"
                ? "CASH"
                : "OPEN");

        const paymentMethod =
          paymentMethodKey === "CASH"
            ? "Nakit"
            : paymentMethodKey === "CARD"
              ? "Kart"
              : "Açık Hesap";

        const notePfandReturn =
          parseAmount(
            getNoteValue(
              order.customerNote,
              "Gelen Pfand:"
            )
          );

        const pfandReturnAmount =
          order.pfandReturns.length > 0
            ? Number(
                order.pfandReturns[0]
                  .approvedAmount ??
                  order.pfandReturns[0]
                    .totalAmount
              )
            : notePfandReturn;

        const subtotal = Number(
          order.subtotal
        );

        const newPfand = Number(
          order.pfandAmount
        );

        const totalAmount = Number(
          Math.max(
            0,
            subtotal +
              newPfand -
              pfandReturnAmount
          ).toFixed(2)
        );

        return {
          id: order.id,
          orderNumber:
            order.orderNumber,
          createdAt:
            order.createdAt,
          sellerName,

          customer: {
            id:
              order.user.id,
            name:
              customerName,
            email:
              customerEmail,
            phone:
              customerPhone,
          },

          paymentMethod,
          paymentMethodKey,
          paymentStatus:
            order.paymentStatus,
          subtotal,
          newPfand,
          pfandReturnAmount,
          totalAmount,

          items: order.items.map(
            (item) => ({
              id: item.id,
              name: item.name,
              price: Number(
                item.price
              ),
              quantity:
                item.quantity,
              pfand: Number(
                item.pfand
              ),
              lineTotal: Number(
                (
                  Number(
                    item.price
                  ) *
                  item.quantity
                ).toFixed(2)
              ),
            })
          ),

          pfandReturnItems:
            order.pfandReturns.length >
            0
              ? order.pfandReturns[0]
                  .items.map(
                    (item) => ({
                      id: item.id,
                      name: item.name,
                      quantity:
                        item.quantity,
                      unitAmount:
                        Number(
                          item.unitAmount
                        ),
                      totalAmount:
                        Number(
                          item.totalAmount
                        ),
                    })
                  )
              : [],
        };
      }
    );

    const staffMap = new Map<
      string,
      {
        sellerName: string;
        saleCount: number;
        totalAmount: number;
        cashAmount: number;
        cardAmount: number;
        openAmount: number;
      }
    >();

    for (const sale of sales) {
      const current =
        staffMap.get(
          sale.sellerName
        ) || {
          sellerName:
            sale.sellerName,
          saleCount: 0,
          totalAmount: 0,
          cashAmount: 0,
          cardAmount: 0,
          openAmount: 0,
        };

      current.saleCount += 1;
      current.totalAmount +=
        sale.totalAmount;

      if (sale.paymentMethodKey === "CASH") {
        current.cashAmount +=
          sale.totalAmount;
      } else if (sale.paymentMethodKey === "CARD") {
        current.cardAmount +=
          sale.totalAmount;
      } else {
        current.openAmount +=
          sale.totalAmount;
      }

      staffMap.set(
        sale.sellerName,
        current
      );
    }

    const staffSummary =
      Array.from(
        staffMap.values()
      )
        .map((item) => ({
          ...item,
          totalAmount: Number(
            item.totalAmount.toFixed(
              2
            )
          ),
          cashAmount: Number(
            item.cashAmount.toFixed(
              2
            )
          ),
          cardAmount: Number(
            item.cardAmount.toFixed(
              2
            )
          ),
          openAmount: Number(
            item.openAmount.toFixed(
              2
            )
          ),
        }))
        .sort(
          (first, second) =>
            second.totalAmount -
            first.totalAmount
        );

    return NextResponse.json({
      sales,
      staffSummary,
    });
  } catch (error) {
    console.error(
      "BAR_SALES_REPORT_ERROR",
      error
    );

    return NextResponse.json(
      {
        error:
          "Bar satış raporu yüklenirken hata oluştu.",
      },
      {
        status: 500,
      }
    );
  }
}
