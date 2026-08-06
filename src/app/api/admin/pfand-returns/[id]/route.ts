import { requireAdminPermission } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const allowedStatuses = [
  "PENDING",
  "APPROVED",
  "PAID_CASH",
  "DEDUCTED_FROM_ORDER",
  "CANCELLED",
] as const;

type PfandStatusValue = (typeof allowedStatuses)[number];

function serializePfandReturn(pfandReturn: any) {
  return {
    ...pfandReturn,

    totalAmount: Number(pfandReturn.totalAmount),

    approvedAmount:
      pfandReturn.approvedAmount !== null
        ? Number(pfandReturn.approvedAmount)
        : null,

    items: pfandReturn.items.map((item: any) => ({
      ...item,

      unitAmount: Number(item.unitAmount),

      totalAmount: Number(item.totalAmount),

      originalTotal:
        item.originalTotal !== null ? Number(item.originalTotal) : null,

      approvedTotal:
        item.approvedTotal !== null ? Number(item.approvedTotal) : null,
    })),

    warehouseMovement: pfandReturn.warehouseMovement
      ? {
          ...pfandReturn.warehouseMovement,

          totalAmount: Number(pfandReturn.warehouseMovement.totalAmount),
        }
      : null,
  };
}

const pfandInclude = {
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
      name: "asc" as const,
    },
  },
};

export async function PATCH(
  request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  },
) {
  const admin = await requireAdminPermission("managePfand");

  if (!admin) {
    return NextResponse.json(
      {
        error: "Pfand iadesini güncelleme yetkiniz yok.",
      },
      {
        status: 403,
      },
    );
  }

  const { id } = await context.params;

  try {
    const body = await request.json();

    const status = String(body.status || "") as PfandStatusValue;

    if (!allowedStatuses.includes(status)) {
      return NextResponse.json(
        {
          error: "Geçersiz Pfand durumu.",
        },
        {
          status: 400,
        },
      );
    }

    const existing = await prisma.pfandReturn.findUnique({
      where: {
        id,
      },

      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
          },
        },

        items: true,

        order: {
          select: {
            id: true,
            orderNumber: true,
            driverId: true,
          },
        },

        warehouseMovement: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          error: "Pfand iade talebi bulunamadı.",
        },
        {
          status: 404,
        },
      );
    }

    if (existing.warehouseMovement && status !== "APPROVED") {
      return NextResponse.json(
        {
          error:
            "Bu Pfand depoya giriş yaptığı için durumu artık değiştirilemez.",
        },
        {
          status: 409,
        },
      );
    }

    if (existing.warehouseMovement && status === "APPROVED") {
      const current = await prisma.pfandReturn.findUnique({
        where: {
          id,
        },

        include: pfandInclude,
      });

      return NextResponse.json({
        message: "Bu Pfand daha önce depoya alınmış.",

        pfandReturn: current ? serializePfandReturn(current) : null,
      });
    }

    if (status === "APPROVED") {
      const requestedApprovedItems = Array.isArray(body.approvedItems)
        ? body.approvedItems
        : [];

      const requestedQuantityById = new Map<string, number>();

      for (const requestedItem of requestedApprovedItems) {
        const itemId = String(requestedItem?.id || "").trim();

        const approvedQuantity = Number(requestedItem?.approvedQuantity);

        if (
          !itemId ||
          !Number.isInteger(approvedQuantity) ||
          approvedQuantity < 0 ||
          approvedQuantity > 9999
        ) {
          return NextResponse.json(
            {
              error: "Onaylanan Pfand miktarlarından biri geçersiz.",
            },
            {
              status: 400,
            },
          );
        }

        requestedQuantityById.set(itemId, approvedQuantity);
      }

      const existingItemIds = new Set(existing.items.map((item) => item.id));

      for (const itemId of requestedQuantityById.keys()) {
        if (!existingItemIds.has(itemId)) {
          return NextResponse.json(
            {
              error: "Geçersiz Pfand kalemi gönderildi.",
            },
            {
              status: 400,
            },
          );
        }
      }

      const preparedItems = existing.items.map((item) => {
        const originalQuantity = item.originalQuantity ?? item.quantity;

        const originalTotal = Number(item.originalTotal ?? item.totalAmount);

        const approvedQuantity = requestedQuantityById.has(item.id)
          ? requestedQuantityById.get(item.id)!
          : (item.approvedQuantity ?? item.quantity);

        const unitAmount = Number(item.unitAmount);

        const approvedTotal = Number(
          (approvedQuantity * unitAmount).toFixed(2),
        );

        return {
          id: item.id,
          name: item.name,
          originalQuantity,
          originalTotal,
          approvedQuantity,
          unitAmount,
          approvedTotal,
        };
      });

      const approvedItems = preparedItems
        .filter((item) => item.approvedQuantity > 0)
        .map((item) => ({
          name: item.name,

          quantity: item.approvedQuantity,

          unitAmount: item.unitAmount,

          totalAmount: item.approvedTotal,
        }));

      if (approvedItems.length === 0) {
        return NextResponse.json(
          {
            error: "Depoya alınabilecek Pfand miktarı bulunmuyor.",
          },
          {
            status: 400,
          },
        );
      }

      const reportedAmount = Number(
        preparedItems
          .reduce((total, item) => total + item.originalTotal, 0)
          .toFixed(2),
      );

      const approvedAmount = Number(
        preparedItems
          .reduce((total, item) => total + item.approvedTotal, 0)
          .toFixed(2),
      );

      /*
       * Pozitif adjustmentAmount:
       * Şoförün kasaya vereceği para yükselir.
       *
       * Negatif adjustmentAmount:
       * Şoförün kasaya vereceği para düşer.
       *
       * Örnek:
       * Bildirilen 5,00 €
       * Gerçek 5,75 €
       * adjustmentAmount = -0,75 €
       */
      const adjustmentAmount = Number(
        (reportedAmount - approvedAmount).toFixed(2),
      );

      const customerName =
        existing.user.companyName ||
        [existing.user.firstName, existing.user.lastName]
          .filter(Boolean)
          .join(" ") ||
        "Müşteri";

      await prisma.$transaction(async (transaction) => {
        /*
         * Üretilen Prisma Client çalışma anında bu delegate'leri
         * içeriyor. VS Code TypeScript sunucusu yeni modellerin
         * tipini geç yenilediği için yalnızca bu iki delegate
         * yerel olarak tanımlanıyor.
         */
        const extendedTransaction = transaction as unknown as {
          pfandWarehouseMovement: {
            findUnique: (args: unknown) => Promise<{
              id: string;
            } | null>;

            create: (args: unknown) => Promise<unknown>;
          };

          driverCashAdjustment: {
            create: (args: unknown) => Promise<unknown>;
          };
        };
        /*
         * Prisma TransactionClient bazı editör önbelleklerinde
         * yeni eklenen modelleri göstermeyebiliyor.
         *
         * Runtime nesnesi aynı Prisma delegate'lerini içerdiği için
         * mevcut Prisma Client tipiyle eşleştiriyoruz.
         */
        const tx = transaction as unknown as typeof prisma;
        const alreadyCreated =
          await extendedTransaction.pfandWarehouseMovement.findUnique({
            where: {
              pfandReturnId: existing.id,
            },

            select: {
              id: true,
            },
          });

        if (alreadyCreated) {
          throw new Error("PFAND_ALREADY_IN_WAREHOUSE");
        }

        for (const item of preparedItems) {
          await transaction.pfandReturnItem.update({
            where: {
              id: item.id,
            },

            data: {
              originalQuantity: item.originalQuantity,

              originalTotal: item.originalTotal,

              quantity: item.approvedQuantity,

              totalAmount: item.approvedTotal,

              approvedQuantity: item.approvedQuantity,

              approvedTotal: item.approvedTotal,
            },
          });
        }

        await transaction.pfandReturn.update({
          where: {
            id: existing.id,
          },

          data: {
            status: "APPROVED",

            approvedById: admin.user.id,

            approvedAt: new Date(),

            approvedAmount,

            totalAmount: approvedAmount,
          },
        });

        await extendedTransaction.pfandWarehouseMovement.create({
          data: {
            type: "IN",

            partyType: "CUSTOMER",

            partyName: customerName,

            pfandReturnId: existing.id,

            createdById: admin.user.id,

            note: "Admin tarafından fiziksel depo girişi sayılarak onaylandı.",

            totalAmount: approvedAmount,

            items: {
              create: approvedItems,
            },
          },
        });

        if (existing.order?.driverId) {
          await extendedTransaction.driverCashAdjustment.create({
            data: {
              driverId: existing.order.driverId,

              orderId: existing.order.id,

              pfandReturnId: existing.id,

              reportedAmount,

              approvedAmount,

              adjustmentAmount,

              createdById: admin.user.id,

              note:
                adjustmentAmount > 0
                  ? `Eksik Pfand teslimi. Şoförün kasaya vereceği tutar ${adjustmentAmount.toFixed(
                      2,
                    )} € yükseltildi.`
                  : adjustmentAmount < 0
                    ? `Fazla Pfand teslimi. Şoförün kasaya vereceği tutar ${Math.abs(
                        adjustmentAmount,
                      ).toFixed(2)} € düşürüldü.`
                    : "Şoförün bildirdiği ve teslim ettiği Pfand eşit.",
            },
          });
        }
      });

      const updated = await prisma.pfandReturn.findUnique({
        where: {
          id,
        },

        include: pfandInclude,
      });

      const differenceMessage =
        adjustmentAmount > 0
          ? ` Şoförün kasaya vereceği tutar ${adjustmentAmount.toFixed(
              2,
            )} € yükseltildi.`
          : adjustmentAmount < 0
            ? ` Şoförün kasaya vereceği tutar ${Math.abs(
                adjustmentAmount,
              ).toFixed(2)} € düşürüldü.`
            : " Şoförün bildirdiği miktarla teslim ettiği miktar eşit.";

      return NextResponse.json({
        message:
          "Pfand fiziksel olarak doğrulandı ve depoya giriş yapıldı." +
          differenceMessage,

        pfandReturn: updated ? serializePfandReturn(updated) : null,

        cashAdjustment: {
          reportedAmount,
          approvedAmount,
          adjustmentAmount,
        },
      });
    }

    const updated = await prisma.pfandReturn.update({
      where: {
        id,
      },

      data: {
        status,
      },

      include: pfandInclude,
    });

    return NextResponse.json({
      message: "Pfand iade durumu güncellendi.",

      pfandReturn: serializePfandReturn(updated),
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "PFAND_ALREADY_IN_WAREHOUSE"
    ) {
      return NextResponse.json(
        {
          error: "Bu Pfand daha önce depoya alınmış.",
        },
        {
          status: 409,
        },
      );
    }

    console.error("UPDATE_PFAND_RETURN_ERROR", error);

    return NextResponse.json(
      {
        error: "Pfand iadesi güncellenirken hata oluştu.",
      },
      {
        status: 500,
      },
    );
  }
}
