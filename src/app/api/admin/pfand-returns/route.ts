import {
  requireAdminPermission,
} from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

function serializePfandReturn(
  pfandReturn: any
) {
  return {
    ...pfandReturn,

    totalAmount:
      Number(
        pfandReturn.totalAmount
      ),

    approvedAmount:
      pfandReturn.approvedAmount !==
      null
        ? Number(
            pfandReturn.approvedAmount
          )
        : null,

    items:
      pfandReturn.items.map(
        (item: any) => ({
          ...item,

          unitAmount:
            Number(
              item.unitAmount
            ),

          totalAmount:
            Number(
              item.totalAmount
            ),

          originalTotal:
            item.originalTotal !==
            null
              ? Number(
                  item.originalTotal
                )
              : null,

          approvedTotal:
            item.approvedTotal !==
            null
              ? Number(
                  item.approvedTotal
                )
              : null,
        })
      ),

    warehouseMovement:
      pfandReturn.warehouseMovement
        ? {
            ...pfandReturn.warehouseMovement,

            totalAmount:
              Number(
                pfandReturn
                  .warehouseMovement
                  .totalAmount
              ),
          }
        : null,
  };
}

export async function GET() {
  const admin =
    await requireAdminPermission(
      "managePfand"
    );

  if (!admin) {
    return NextResponse.json(
      {
        error:
          "Pfand iadelerini görüntüleme yetkiniz yok.",
      },
      {
        status: 403,
      }
    );
  }

  try {
    const [
      returns,
      warehouseMovements,
    ] = await Promise.all([
      prisma.pfandReturn.findMany({
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

          approvedBy: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              companyName: true,
            },
          },

          order: {
            select: {
              id: true,
              orderNumber: true,

              driver: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                  companyName: true,
                  phone: true,
                },
              },
            },
          },

          warehouseMovement: {
            select: {
              id: true,
              type: true,
              partyType: true,
              partyName: true,
              totalAmount: true,
              createdAt: true,
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
      }),

      prisma.pfandWarehouseMovement.findMany({
        select: {
          id: true,
          type: true,
          createdAt: true,

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

        orderBy: {
          createdAt: "asc",
        },
      }),
    ]);

    const warehouseItemMap =
      new Map<
        string,
        {
          key: string;
          name: string;
          unitAmount: number;
          quantity: number;
          totalValue: number;
          totalIn: number;
          totalOut: number;
        }
      >();

    for (
      const movement of
      warehouseMovements
    ) {
      const movementMultiplier =
        movement.type === "IN"
          ? 1
          : movement.type === "OUT"
            ? -1
            : 1;

      for (
        const item of
        movement.items
      ) {
        const unitAmount =
          Number(
            item.unitAmount
          );

        const movementQuantity =
          Number(
            item.quantity
          ) *
          movementMultiplier;

        const normalizedName =
          item.name
            .trim()
            .toLocaleLowerCase(
              "tr-TR"
            );

        const key =
          `${normalizedName}::${unitAmount.toFixed(
            2
          )}`;

        const current =
          warehouseItemMap.get(
            key
          ) || {
            key,
            name:
              item.name,
            unitAmount,
            quantity:
              0,
            totalValue:
              0,
            totalIn:
              0,
            totalOut:
              0,
          };

        current.quantity +=
          movementQuantity;

        if (
          movementQuantity > 0
        ) {
          current.totalIn +=
            movementQuantity;
        } else if (
          movementQuantity < 0
        ) {
          current.totalOut +=
            Math.abs(
              movementQuantity
            );
        }

        current.totalValue =
          Number(
            (
              current.quantity *
              current.unitAmount
            ).toFixed(2)
          );

        warehouseItemMap.set(
          key,
          current
        );
      }
    }

    const warehouseItems =
      Array.from(
        warehouseItemMap.values()
      )
        .map((item) => ({
          ...item,

          quantity:
            Number(
              item.quantity
            ),

          totalIn:
            Number(
              item.totalIn
            ),

          totalOut:
            Number(
              item.totalOut
            ),

          totalValue:
            Number(
              item.totalValue.toFixed(
                2
              )
            ),
        }))
        .sort((a, b) =>
          a.unitAmount -
          b.unitAmount ||
          a.name.localeCompare(
            b.name,
            "tr"
          )
        );

    const totalQuantity =
      warehouseItems.reduce(
        (
          total,
          item
        ) =>
          total +
          item.quantity,
        0
      );

    const totalValue =
      Number(
        warehouseItems
          .reduce(
            (
              total,
              item
            ) =>
              total +
              item.totalValue,
            0
          )
          .toFixed(2)
      );

    const negativeStockCount =
      warehouseItems.filter(
        (item) =>
          item.quantity < 0
      ).length;

    return NextResponse.json({
      returns:
        returns.map(
          serializePfandReturn
        ),

      warehouseSummary: {
        totalQuantity,
        totalValue,
        negativeStockCount,
        movementCount:
          warehouseMovements.length,
        items:
          warehouseItems,
      },
    });
  } catch (error) {
    console.error(
      "ADMIN_PFAND_RETURNS_ERROR",
      error
    );

    return NextResponse.json(
      {
        error:
          "Pfand iadeleri yüklenemedi.",
      },
      {
        status: 500,
      }
    );
  }
}
