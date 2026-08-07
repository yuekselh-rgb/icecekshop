import { verifySessionToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

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

export async function PATCH(
  request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  },
) {
  const session = await getDriverSession();

  if (!session) {
    return NextResponse.json(
      {
        error: "Yetkisiz erişim.",
      },
      {
        status: 403,
      },
    );
  }

  const { id } = await context.params;

  try {
    const body = await request.json();

    const action = String(body.action || "");

    const order = await prisma.order.findFirst({
      where: {
        id,
        driverId: session.userId,
        deletedAt: null,
      },

      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            companyName: true,
            phone: true,
            email: true,
          },
        },

        items: {
          orderBy: {
            name: "asc",
          },
        },

        pfandReturns: {
          include: {
            items: true,
          },

          orderBy: {
            createdAt: "desc",
          },

          take: 1,
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        {
          error: "Sipariş bulunamadı veya bu sipariş size atanmadı.",
        },
        {
          status: 404,
        },
      );
    }

    if (action === "OUT_FOR_DELIVERY") {
      if (
        order.status !== "READY" &&
        order.status !== "PREPARING" &&
        order.status !== "CONFIRMED"
      ) {
        return NextResponse.json(
          {
            error: "Bu sipariş şu anda teslimata çıkarılamaz.",
          },
          {
            status: 409,
          },
        );
      }

      const updated = await prisma.order.update({
        where: {
          id,
        },

        data: {
          status: "OUT_FOR_DELIVERY",

          outForDeliveryAt: new Date(),
        },

        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              companyName: true,
              phone: true,
              email: true,
            },
          },

          items: {
            orderBy: {
              name: "asc",
            },
          },

          pfandReturns: {
            include: {
              items: true,
            },

            orderBy: {
              createdAt: "desc",
            },

            take: 1,
          },
        },
      });

      return NextResponse.json({
        message: "Sipariş teslimata çıkarıldı.",

        order: serializeOrder(updated),
      });
    }

    if (action === "PAID") {
      /*
       * Şoför burada ödemeyi kesin olarak onaylamaz.
       * Yalnızca müşteriden parayı aldığını bildirir.
       *
       * Sipariş ödeme durumu admin onayına kadar OPEN kalır.
       * Gerçek Kasa hareketi yalnızca admin onayından sonra oluşur.
       */
      if (order.paymentStatus === "PAID") {
        return NextResponse.json(
          {
            error: "Bu ödeme daha önce admin tarafından onaylandı.",
          },
          {
            status: 409,
          },
        );
      }

      const latestPfandReturn = order.pfandReturns[0];

      const pfandReturnAmount = latestPfandReturn
        ? Number(
            latestPfandReturn.approvedAmount ??
              latestPfandReturn.totalAmount ??
              0,
          )
        : 0;

      /*
       * Siparişin gerçek açık tutarı:
       * Sipariş toplamı - Pfand iadesi - daha önce admin tarafından
       * onaylanan bütün tahsilatlar.
       */
      const approvedPayments = await prisma.orderPayment.aggregate({
        where: {
          orderId: order.id,
          status: "APPROVED",
        },

        _sum: {
          amount: true,
        },
      });

      const approvedPaymentAmount = Number(approvedPayments._sum.amount ?? 0);

      const effectiveOrderTotal = Number(
        Math.max(
          0,
          Number(order.subtotal) +
            Number(order.pfandAmount) +
            Number(order.deliveryFee) -
            pfandReturnAmount,
        ).toFixed(2),
      );

      const orderOpenAmount = Number(
        Math.max(0, effectiveOrderTotal - approvedPaymentAmount).toFixed(2),
      );

      const existingPendingPayment = await prisma.orderPayment.findFirst({
        where: {
          orderId: order.id,
          status: "PENDING",
        },

        select: {
          id: true,
          amount: true,
        },
      });

      if (existingPendingPayment) {
        return NextResponse.json(
          {
            error:
              "Bu sipariş için zaten admin onayı bekleyen bir ödeme bildirimi bulunuyor.",
          },
          {
            status: 409,
          },
        );
      }

      if (orderOpenAmount <= 0.009) {
        return NextResponse.json(
          {
            error: "Bu siparişin açık hesabı kalmamıştır.",
          },
          {
            status: 409,
          },
        );
      }

      const collectedAmount = Number(Number(body.amount).toFixed(2));

      const paymentMethod =
        body.paymentMethod === "CARD" ? "CARD" : "CASH";

      if (!Number.isFinite(collectedAmount) || collectedAmount <= 0) {
        return NextResponse.json(
          {
            error: "Müşteriden alınan tutar sıfırdan büyük olmalıdır.",
          },
          {
            status: 400,
          },
        );
      }

      if (collectedAmount > orderOpenAmount) {
        return NextResponse.json(
          {
            error:
              `Girilen tutar açık sipariş tutarından büyük olamaz. ` +
              `En fazla ${orderOpenAmount.toLocaleString("de-DE", {
                style: "currency",
                currency: "EUR",
              })} girebilirsiniz.`,
          },
          {
            status: 400,
          },
        );
      }

      const remainingAmount = Number(
        Math.max(0, orderOpenAmount - collectedAmount).toFixed(2),
      );

      const updated = await prisma.$transaction(async (tx) => {
        /*
         * Aynı sipariş için henüz onaylanmamış eski bir bildirim varsa
         * yeni bildirim oluşturulmadan önce kaldırılır.
         */
        await tx.orderPayment.deleteMany({
          where: {
            orderId: order.id,
            status: "PENDING",
          },
        });

        await tx.orderPayment.create({
          data: {
            orderId: order.id,
            customerId: order.userId,
            driverId: session.userId,

            amount: collectedAmount,
            paymentMethod,

            status: "PENDING",

            reportedById: session.userId,
            reporterRole: "DRIVER",

            note:
              `Şoför müşteriden ${collectedAmount.toFixed(2)} € aldığını bildirdi. ` +
              `Sipariş açık tutarı: ${orderOpenAmount.toFixed(2)} €. ` +
              `Onay sonrası kalan: ${remainingAmount.toFixed(2)} €.`,
          },
        });

        return tx.order.update({
          where: {
            id,
          },

          data: {
            /*
             * Kısmi ödeme admin tarafından onaylanana kadar
             * sipariş ödeme durumu OPEN kalır.
             */
            paymentStatus: "OPEN",
            paidAt: null,

            driverPaymentReportedAt: new Date(),
            driverPaymentReportedAmount: collectedAmount,

            paymentApprovedAt: null,
            paymentApprovedById: null,
          },

          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                companyName: true,
                phone: true,
                email: true,
              },
            },

            items: {
              orderBy: {
                name: "asc",
              },
            },

            pfandReturns: {
              include: {
                items: true,
              },

              orderBy: {
                createdAt: "desc",
              },

              take: 1,
            },
          },
        });
      });

      return NextResponse.json({
        message:
          `${collectedAmount.toLocaleString("de-DE", {
            style: "currency",
            currency: "EUR",
          })} müşteriden alındı olarak bildirildi. ` +
          `${remainingAmount.toLocaleString("de-DE", {
            style: "currency",
            currency: "EUR",
          })} açık kalacak. Admin kasa onayı bekleniyor.`,

        order: serializeOrder(updated),
      });
    }

    if (action === "OPEN_PAYMENT") {
      /*
       * Şoför yalnızca henüz admin tarafından onaylanmamış
       * ödeme bildirimini geri çekebilir.
       */
      if (order.paymentStatus === "PAID" || order.paymentApprovedAt) {
        return NextResponse.json(
          {
            error:
              "Admin tarafından onaylanmış ödeme şoför tarafından geri açılamaz.",
          },
          {
            status: 409,
          },
        );
      }

      const updated = await prisma.$transaction(async (tx) => {
        await tx.orderPayment.deleteMany({
          where: {
            orderId: order.id,
            status: "PENDING",
            reportedById: session.userId,
          },
        });

        return tx.order.update({
          where: {
            id,
          },

          data: {
            paymentStatus: "OPEN",
            paidAt: null,

            driverPaymentReportedAt: null,
            driverPaymentReportedAmount: null,

            paymentApprovedAt: null,
            paymentApprovedById: null,
          },

          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                companyName: true,
                phone: true,
                email: true,
              },
            },

            items: {
              orderBy: {
                name: "asc",
              },
            },

            pfandReturns: {
              include: {
                items: true,
              },

              orderBy: {
                createdAt: "desc",
              },

              take: 1,
            },
          },
        });
      });

      return NextResponse.json({
        message: "Şoför ödeme bildirimi geri alındı.",

        order: serializeOrder(updated),
      });
    }

    if (action === "CREATE_PFAND") {
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

      const rawPfandItems = Array.isArray(body.pfandItems)
        ? body.pfandItems
        : [];

      const quantityByKey = new Map<string, number>();

      for (const rawItem of rawPfandItems) {
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

      if (order.pfandReturns.length > 0) {
        return NextResponse.json(
          {
            error: "Bu sipariş için zaten bir Pfand kaydı bulunuyor.",
          },
          {
            status: 409,
          },
        );
      }

      if (order.status === "DELIVERED") {
        return NextResponse.json(
          {
            error: "Teslim edilmiş siparişe yeni Pfand eklenemez.",
          },
          {
            status: 409,
          },
        );
      }

      const totalAmount = Number(
        preparedItems
          .reduce((total, item) => total + item.totalAmount, 0)
          .toFixed(2),
      );

      await prisma.pfandReturn.create({
        data: {
          userId: order.userId,

          orderId: order.id,

          status: "PENDING",

          totalAmount,

          approvedAmount: null,

          note: "Şoför tarafından müşteriden fiziksel olarak teslim alınan Pfand.",

          driverNote:
            "Şoför Pfand kaydı oluşturdu. Admin fiziksel kontrolü bekleniyor.",

          items: {
            create: preparedItems.map((item) => ({
              name: item.name,

              quantity: item.quantity,

              originalQuantity: item.quantity,

              approvedQuantity: null,

              unitAmount: item.unitAmount,

              totalAmount: item.totalAmount,

              originalTotal: item.totalAmount,

              approvedTotal: null,
            })),
          },
        },
      });

      const updated = await prisma.order.findFirst({
        where: {
          id,

          driverId: session.userId,

          deletedAt: null,
        },

        include: {
          user: {
            select: {
              firstName: true,

              lastName: true,

              companyName: true,

              phone: true,

              email: true,
            },
          },

          items: {
            orderBy: {
              name: "asc",
            },
          },

          pfandReturns: {
            include: {
              items: true,
            },

            orderBy: {
              createdAt: "desc",
            },

            take: 1,
          },
        },
      });

      return NextResponse.json(
        {
          message: `${totalAmount.toLocaleString("de-DE", {
            style: "currency",
            currency: "EUR",
          })} Pfand kaydedildi. Admin kontrolü bekleniyor.`,

          order: serializeOrder(updated),
        },
        {
          status: 201,
        },
      );
    }

    if (action === "UPDATE_PFAND") {
      const pfandItems = Array.isArray(body.pfandItems) ? body.pfandItems : [];

      if (pfandItems.length === 0) {
        return NextResponse.json(
          {
            error: "Pfand kalemleri eksik.",
          },
          {
            status: 400,
          },
        );
      }

      const latestPfandReturn = order.pfandReturns[0];

      if (!latestPfandReturn) {
        return NextResponse.json(
          {
            error: "Bu sipariş için Pfand iadesi bulunamadı.",
          },
          {
            status: 404,
          },
        );
      }

      const validItemIds = new Set(
        latestPfandReturn.items.map((item: any) => item.id),
      );

      for (const item of pfandItems) {
        if (!validItemIds.has(item.id)) {
          return NextResponse.json(
            {
              error: "Geçersiz Pfand kalemi.",
            },
            {
              status: 400,
            },
          );
        }

        const approvedQuantity = Number(item.approvedQuantity);

        if (!Number.isInteger(approvedQuantity) || approvedQuantity < 0) {
          return NextResponse.json(
            {
              error: "Pfand miktarı geçersiz.",
            },
            {
              status: 400,
            },
          );
        }
      }

      await prisma.$transaction(
        pfandItems.map((item: any) => {
          const originalItem = latestPfandReturn.items.find(
            (currentItem: any) => currentItem.id === item.id,
          );

          if (!originalItem) {
            throw new Error("Pfand kalemi bulunamadı.");
          }

          const approvedQuantity = Number(item.approvedQuantity);

          const unitAmount = Number(originalItem.unitAmount);

          const newTotal = approvedQuantity * unitAmount;

          return prisma.pfandReturnItem.update({
            where: {
              id: item.id,
            },

            data: {
              originalQuantity:
                originalItem.originalQuantity ?? originalItem.quantity,

              originalTotal:
                originalItem.originalTotal ?? originalItem.totalAmount,

              quantity: approvedQuantity,

              totalAmount: newTotal,

              approvedQuantity: approvedQuantity,

              approvedTotal: newTotal,
            },
          });
        }),
      );

      const updatedItems = await prisma.pfandReturnItem.findMany({
        where: {
          pfandReturnId: latestPfandReturn.id,
        },
      });

      const approvedAmount = updatedItems.reduce(
        (total, item) => total + Number(item.totalAmount || 0),
        0,
      );

      await prisma.pfandReturn.update({
        where: {
          id: latestPfandReturn.id,
        },

        data: {
          totalAmount: approvedAmount,

          approvedAmount: approvedAmount,
        },
      });

      const updated = await prisma.order.findFirst({
        where: {
          id,
          driverId: session.userId,
          deletedAt: null,
        },

        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              companyName: true,
              phone: true,
              email: true,
            },
          },

          items: {
            orderBy: {
              name: "asc",
            },
          },

          pfandReturns: {
            include: {
              items: true,
            },

            orderBy: {
              createdAt: "desc",
            },

            take: 1,
          },
        },
      });

      return NextResponse.json({
        message: "Pfand miktarları kaydedildi.",

        order: serializeOrder(updated),
      });
    }

    if (action === "DELIVERED") {
      if (order.status !== "OUT_FOR_DELIVERY") {
        return NextResponse.json(
          {
            error: "Sipariş önce teslimata çıkarılmalıdır.",
          },
          {
            status: 409,
          },
        );
      }

      const updated = await prisma.$transaction(async (tx) => {
        const updatedOrder = await tx.order.update({
          where: {
            id,
          },

          data: {
            status: "DELIVERED",

            deliveredAt: new Date(),
          },

          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                companyName: true,
                phone: true,
                email: true,
              },
            },

            items: {
              orderBy: {
                name: "asc",
              },
            },

            pfandReturns: {
              include: {
                items: true,
              },

              orderBy: {
                createdAt: "desc",
              },

              take: 1,
            },
          },
        });

        /*
         * Teslim edilen normal siparişler de fiziksel olarak
         * şoförün aracından çıkar. Araç stok takibi tam senkron
         * olmayabileceği için (ör. sipariş ürünleri şoför tarafından
         * "yüklenmiş" olarak işaretlenmemiş olabilir), takip edilen
         * miktar yetersizse teslimatı engellemeden o kalem sessizce
         * atlanır — bu yalnızca raporlama amaçlı bir rakamdır.
         */
        for (const item of updatedOrder.items) {
          const decremented = await tx.driverStock.updateMany({
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

          if (decremented.count !== 1) {
            continue;
          }

          await tx.driverStockMovement.create({
            data: {
              driverId: session.userId,
              productId: item.productId,
              orderId: updatedOrder.id,

              type: "SALE",
              amount: -item.quantity,

              createdById: session.userId,

              note: `Sipariş teslim edildi: ${updatedOrder.orderNumber}.`,
            },
          });
        }

        return updatedOrder;
      });

      return NextResponse.json({
        message: "Sipariş teslim edildi olarak işaretlendi.",

        order: serializeOrder(updated),
      });
    }

    return NextResponse.json(
      {
        error: "Geçersiz işlem.",
      },
      {
        status: 400,
      },
    );
  } catch (error) {
    console.error("DRIVER_ORDER_UPDATE_ERROR", error);

    return NextResponse.json(
      {
        error: "Sipariş güncellenirken hata oluştu.",
      },
      {
        status: 500,
      },
    );
  }
}

function serializeOrder(order: any) {
  return {
    ...order,

    subtotal: Number(order.subtotal),

    deliveryFee: Number(order.deliveryFee),

    pfandAmount: Number(order.pfandAmount),

    totalAmount: Number(order.totalAmount),

    items: order.items.map((item: any) => ({
      ...item,

      price: Number(item.price),

      pfand: Number(item.pfand),
    })),

    pfandReturns: order.pfandReturns.map((pfandReturn: any) => ({
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

        approvedTotal:
          item.approvedTotal !== null ? Number(item.approvedTotal) : null,
      })),
    })),
  };
}
