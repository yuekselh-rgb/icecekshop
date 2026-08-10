import { prisma } from "@/lib/prisma";
import { getRequestLanguage } from "@/lib/request-language";
import { getSession } from "@/lib/session";
import { withTenant } from "@/lib/tenant";
import { NextRequest, NextResponse } from "next/server";

type RequestedPfandItem = {
  name: string;
  quantity: number;
  unitAmount: number;
};

function normalizeItems(
  value: unknown
): RequestedPfandItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((rawItem) => {
      if (
        !rawItem ||
        typeof rawItem !== "object"
      ) {
        return null;
      }

      const item =
        rawItem as Record<
          string,
          unknown
        >;

      const name =
        String(
          item.name || ""
        ).trim();

      const quantity =
        Number(item.quantity);

      const unitAmount =
        Number(item.unitAmount);

      if (
        !name ||
        !Number.isInteger(
          quantity
        ) ||
        quantity <= 0 ||
        quantity > 9999 ||
        !Number.isFinite(
          unitAmount
        ) ||
        unitAmount <= 0 ||
        unitAmount > 9999
      ) {
        return null;
      }

      return {
        name:
          name.slice(0, 150),
        quantity,
        unitAmount:
          Number(
            unitAmount.toFixed(2)
          ),
      };
    })
    .filter(
      (
        item
      ): item is RequestedPfandItem =>
        item !== null
    );
}

export const GET = withTenant(async () => {
  const language =
    await getRequestLanguage();

  const session =
    await getSession();

  if (
    !session ||
    session.role !== "CUSTOMER"
  ) {
    return NextResponse.json(
      {
        error:
          language === "de"
            ? "Um Ihre Pfand-Rückgaben einzusehen, müssen Sie sich mit einem Kundenkonto anmelden."
            : "Pfand iadelerini görmek için müşteri hesabıyla giriş yapmalısınız.",
      },
      {
        status: 401,
      }
    );
  }

  try {
    const returns =
      await prisma.pfandReturn.findMany({
        where: {
          userId:
            session.userId,
        },

        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
            },
          },

          items: {
            orderBy: {
              name: "asc",
            },
          },
        },

        orderBy: {
          createdAt: "desc",
        },
      });

    return NextResponse.json({
      returns:
        returns.map(
          (pfandReturn) => ({
            ...pfandReturn,

            totalAmount:
              Number(
                pfandReturn.totalAmount
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
                })
              ),
          })
        ),
    });
  } catch (error) {
    console.error(
      "GET_CUSTOMER_PFAND_RETURNS_ERROR",
      error
    );

    return NextResponse.json(
      {
        error:
          language === "de"
            ? "Pfand-Rückgaben konnten nicht geladen werden."
            : "Pfand iadeleri yüklenemedi.",
      },
      {
        status: 500,
      }
    );
  }
});

export const POST = withTenant(async (
  request: NextRequest,
  _context,
  tenant
) => {
  const language =
    await getRequestLanguage();

  const session =
    await getSession();

  if (
    !session ||
    session.role !== "CUSTOMER"
  ) {
    return NextResponse.json(
      {
        error:
          language === "de"
            ? "Um eine Pfand-Rückgabe zu erstellen, müssen Sie sich mit einem Kundenkonto anmelden."
            : "Pfand iadesi oluşturmak için müşteri hesabıyla giriş yapmalısınız.",
      },
      {
        status: 401,
      }
    );
  }

  try {
    const body =
      await request.json();

    const items =
      normalizeItems(
        body.items
      );

    const note =
      String(
        body.note || ""
      )
        .trim()
        .slice(0, 1000);

    const orderId =
      String(
        body.orderId || ""
      ).trim();

    if (
      items.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Sie müssen mindestens eine gültige Pfand-Position hinzufügen."
              : "En az bir geçerli Pfand kalemi eklemelisiniz.",
        },
        {
          status: 400,
        }
      );
    }

    let linkedOrder:
      | {
          id: string;
        }
      | null = null;

    if (orderId) {
      linkedOrder =
        await prisma.order.findFirst({
          where: {
            id: orderId,
            userId:
              session.userId,
            deletedAt: null,
          },

          select: {
            id: true,
          },
        });

      if (!linkedOrder) {
        return NextResponse.json(
          {
            error:
              language === "de"
                ? "Die ausgewählte Bestellung wurde nicht gefunden."
                : "Seçilen sipariş bulunamadı.",
          },
          {
            status: 404,
          }
        );
      }
    }

    const preparedItems =
      items.map((item) => ({
        ...item,

        totalAmount:
          Number(
            (
              item.quantity *
              item.unitAmount
            ).toFixed(2)
          ),
      }));

    const totalAmount =
      Number(
        preparedItems
          .reduce(
            (
              total,
              item
            ) =>
              total +
              item.totalAmount,
            0
          )
          .toFixed(2)
      );

    const pfandReturn =
      await prisma.pfandReturn.create({
        data: {
          tenantId:
            tenant.id,

          userId:
            session.userId,

          orderId:
            linkedOrder?.id ||
            null,

          status:
            "PENDING",

          totalAmount,

          note:
            note || null,

          items: {
            create:
              preparedItems.map(
                (item) => ({
                  name:
                    item.name,

                  quantity:
                    item.quantity,

                  unitAmount:
                    item.unitAmount,

                  totalAmount:
                    item.totalAmount,
                })
              ),
          },
        },

        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
            },
          },

          items: true,
        },
      });

    return NextResponse.json(
      {
        message:
          language === "de"
            ? "Ihre Pfand-Rückgabeanfrage wurde erstellt."
            : "Pfand iade talebiniz oluşturuldu.",

        pfandReturn: {
          ...pfandReturn,

          totalAmount:
            Number(
              pfandReturn.totalAmount
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
              })
            ),
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "CREATE_PFAND_RETURN_ERROR",
      error
    );

    return NextResponse.json(
      {
        error:
          language === "de"
            ? "Beim Erstellen der Pfand-Rückgabeanfrage ist ein Fehler aufgetreten."
            : "Pfand iade talebi oluşturulurken hata oluştu.",
      },
      {
        status: 500,
      }
    );
  }
});
