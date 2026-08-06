import { requireAdminPermission } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const allowedPfandTypes = [
  {
    key: "0.08",
    name: "Pfand 0,08 €",
    unitAmount: 0.08,
  },
  {
    key: "0.15",
    name: "Pfand 0,15 €",
    unitAmount: 0.15,
  },
  {
    key: "0.25",
    name: "Pfand 0,25 €",
    unitAmount: 0.25,
  },
  {
    key: "3.30",
    name: "Kasa Pfandı 3,30 €",
    unitAmount: 3.3,
  },
] as const;

type RequestedPfandItem = {
  key?: unknown;
  quantity?: unknown;
};

export async function POST(
  request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  },
) {
  const admin = await requireAdminPermission("updateOrder");

  if (!admin) {
    return NextResponse.json(
      {
        error: "Bayi Pfand girişini kaydetme yetkiniz yok.",
      },
      {
        status: 403,
      },
    );
  }

  const { id } = await context.params;

  try {
    const body = await request.json();

    const rawItems: RequestedPfandItem[] = Array.isArray(body.items)
      ? body.items
      : [];

    const quantityByKey = new Map<string, number>();

    for (const rawItem of rawItems) {
      const key = String(rawItem?.key || "").trim();
      const quantity = Number(rawItem?.quantity);

      if (
        !key ||
        !Number.isInteger(quantity) ||
        quantity < 0 ||
        quantity > 9999
      ) {
        return NextResponse.json(
          {
            error: "Pfand adetlerinden biri geçersiz.",
          },
          {
            status: 400,
          },
        );
      }

      quantityByKey.set(key, quantity);
    }

    const preparedItems = allowedPfandTypes
      .map((pfandType) => {
        const quantity = quantityByKey.get(pfandType.key) || 0;

        return {
          name: pfandType.name,
          quantity,
          unitAmount: pfandType.unitAmount,
          totalAmount: Number((quantity * pfandType.unitAmount).toFixed(2)),
        };
      })
      .filter((item) => item.quantity > 0);

    if (preparedItems.length === 0) {
      return NextResponse.json(
        {
          error: "En az bir Pfand adedi girin.",
        },
        {
          status: 400,
        },
      );
    }

    const approvedAmount = Number(
      preparedItems
        .reduce((total, item) => total + item.totalAmount, 0)
        .toFixed(2),
    );

    const order = await prisma.order.findFirst({
      where: {
        id,
        deletedAt: null,
      },

      include: {
        user: {
          select: {
            id: true,
            role: true,
            companyName: true,
            firstName: true,
            lastName: true,

            dealerProfile: {
              select: {
                dealerNumber: true,
                companyName: true,
              },
            },
          },
        },

        pfandReturns: {
          where: {
            status: {
              not: "CANCELLED",
            },
          },

          include: {
            warehouseMovement: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        {
          error: "Sipariş bulunamadı.",
        },
        {
          status: 404,
        },
      );
    }

    if (order.user.role !== "DEALER") {
      return NextResponse.json(
        {
          error: "Bu işlem yalnızca bayi siparişlerinde kullanılabilir.",
        },
        {
          status: 400,
        },
      );
    }

    const existingWarehouseReturn = order.pfandReturns.find((pfandReturn) =>
      Boolean(pfandReturn.warehouseMovement),
    );

    if (existingWarehouseReturn) {
      return NextResponse.json(
        {
          error: "Bu bayi siparişi için Pfand daha önce kaydedilmiş.",
        },
        {
          status: 409,
        },
      );
    }

    const dealerName =
      order.user.dealerProfile?.companyName ||
      order.user.companyName ||
      [order.user.firstName, order.user.lastName].filter(Boolean).join(" ") ||
      "Bayi";

    const createdPfandReturn = await prisma.$transaction(async (tx) => {
      const pfandReturn = await tx.pfandReturn.create({
        data: {
          userId: order.user.id,
          orderId: order.id,

          status: "APPROVED",

          totalAmount: approvedAmount,
          approvedAmount,

          approvedById: admin.user.id,
          approvedAt: new Date(),

          note: "Bayi depodan siparişini alırken admin tarafından sayılarak teslim alındı.",

          items: {
            create: preparedItems.map((item) => ({
              name: item.name,

              quantity: item.quantity,
              originalQuantity: item.quantity,
              approvedQuantity: item.quantity,

              unitAmount: item.unitAmount,

              totalAmount: item.totalAmount,
              originalTotal: item.totalAmount,
              approvedTotal: item.totalAmount,
            })),
          },
        },
      });

      await tx.pfandWarehouseMovement.create({
        data: {
          type: "IN",
          partyType: "WHOLESALER",

          partyName: dealerName,

          pfandReturnId: pfandReturn.id,
          createdById: admin.user.id,

          totalAmount: approvedAmount,

          note: `Bayi siparişi ${order.orderNumber} için fiziksel Pfand girişi.`,

          items: {
            create: preparedItems.map((item) => ({
              name: item.name,
              quantity: item.quantity,
              unitAmount: item.unitAmount,
              totalAmount: item.totalAmount,
            })),
          },
        },
      });

      return pfandReturn;
    });

    const remainingAmount = Number(
      Math.max(0, Number(order.totalAmount) - approvedAmount).toFixed(2),
    );

    return NextResponse.json(
      {
        message: `${approvedAmount.toLocaleString("de-DE", {
          style: "currency",
          currency: "EUR",
        })} Pfand depoya kaydedildi ve sipariş hesabından düşüldü.`,

        pfandReturn: {
          id: createdPfandReturn.id,
          approvedAmount,
        },

        remainingAmount,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("CREATE_DEALER_ORDER_PFAND_ERROR", error);

    return NextResponse.json(
      {
        error: "Bayi Pfand girişi kaydedilemedi.",
      },
      {
        status: 500,
      },
    );
  }
}
