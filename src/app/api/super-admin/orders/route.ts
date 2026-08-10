import {
  verifySessionToken,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRequestLanguage } from "@/lib/request-language";
import { withTenant } from "@/lib/tenant";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

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
    session.role !== "SUPER_ADMIN"
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
    const orders =
      await prisma.order.findMany({
        where: {
          deletedAt: null,
        },

        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              companyName: true,
              email: true,
              phone: true,
            },
          },

          driver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },

          items: {
            orderBy: {
              name: "asc",
            },
          },

          pfandReturns: {
            orderBy: {
              createdAt: "desc",
            },
            take: 1,

            include: {
              items: {
                orderBy: {
                  name: "asc",
                },
              },
            },
          },
        },

        orderBy: {
          createdAt: "desc",
        },
      });

    return NextResponse.json({
      orders:
        orders.map(
          (order) => ({
            ...order,

            subtotal:
              Number(
                order.subtotal
              ),

            deliveryFee:
              Number(
                order.deliveryFee
              ),

            pfandAmount:
              Number(
                order.pfandAmount
              ),

            totalAmount:
              Number(
                order.totalAmount
              ),

            items:
              order.items.map(
                (item) => ({
                  ...item,

                  price:
                    Number(
                      item.price
                    ),

                  pfand:
                    Number(
                      item.pfand
                    ),
                })
              ),

            pfandReturns:
              order.pfandReturns.map(
                (pfandReturn) => ({
                  ...pfandReturn,

                  totalAmount:
                    Number(
                      pfandReturn.totalAmount
                    ),

                  approvedAmount:
                    pfandReturn.approvedAmount ===
                    null
                      ? null
                      : Number(
                          pfandReturn.approvedAmount
                        ),

                  items:
                    pfandReturn.items.map(
                      (item) => ({
                        ...item,

                        unitAmount:
                          Number(
                            item.unitAmount
                          ),

                        totalAmount:
                          Number(
                            item.totalAmount
                          ),

                        approvedTotal:
                          item.approvedTotal ===
                          null
                            ? null
                            : Number(
                                item.approvedTotal
                              ),
                      })
                    ),
                })
              ),
          })
        ),
    });
  } catch (error) {
    console.error(
      "SUPER_ADMIN_ORDERS_ERROR",
      error
    );

    return NextResponse.json(
      {
        error:
          language === "de"
            ? "Beim Laden der Bestellungen ist ein Fehler aufgetreten."
            : "Siparişler yüklenirken hata oluştu.",
      },
      {
        status: 500,
      }
    );
  }
});
