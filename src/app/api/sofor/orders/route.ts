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

export async function GET() {
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

  try {
    const orders = await prisma.order.findMany({
      where: {
        driverId: session.userId,

        deletedAt: null,

        status: {
          not: "CANCELLED",
        },
      },

      include: {
        user: {
          select: {
            id: true,
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

        payments: {
          orderBy: {
            reportedAt: "desc",
          },

          select: {
            id: true,
            customerId: true,
            driverId: true,
            amount: true,
            status: true,
            reporterRole: true,
            reportedById: true,
            reportedAt: true,
            approvedAt: true,
            approvedById: true,
            note: true,
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    const serializedOrders = orders.map((order) => {
      const latestPfandReturn = order.pfandReturns[0];

      const pfandReturnAmount = latestPfandReturn
        ? Number(
            latestPfandReturn.approvedAmount ??
              latestPfandReturn.totalAmount ??
              0,
          )
        : 0;

      const effectiveTotal = Number(
        Math.max(
          0,
          Number(order.subtotal) +
            Number(order.pfandAmount) +
            Number(order.deliveryFee) -
            pfandReturnAmount,
        ).toFixed(2),
      );

      const approvedPaymentAmount = Number(
        order.payments
          .filter((payment) => payment.status === "APPROVED")
          .reduce((total, payment) => total + Number(payment.amount), 0)
          .toFixed(2),
      );

      const pendingPaymentAmount = Number(
        order.payments
          .filter((payment) => payment.status === "PENDING")
          .reduce((total, payment) => total + Number(payment.amount), 0)
          .toFixed(2),
      );

      const openPaymentAmount = Number(
        Math.max(0, effectiveTotal - approvedPaymentAmount).toFixed(2),
      );

      return {
        ...order,

        subtotal: Number(order.subtotal),

        deliveryFee: Number(order.deliveryFee),

        pfandAmount: Number(order.pfandAmount),

        totalAmount: openPaymentAmount,

        pfandReturnAmount,

        approvedPaymentAmount,

        pendingPaymentAmount,

        openPaymentAmount,

        accountStatus: openPaymentAmount <= 0.009 ? "CLOSED" : "OPEN",

        driverPaymentReportedAmount:
          order.driverPaymentReportedAmount !== null
            ? Number(order.driverPaymentReportedAmount)
            : null,

        payments: order.payments.map((payment) => ({
          ...payment,

          amount: Number(payment.amount),
        })),

        items: order.items.map((item) => ({
          ...item,

          price: Number(item.price),

          pfand: Number(item.pfand),
        })),

        pfandReturns: order.pfandReturns.map((pfandReturn) => ({
          ...pfandReturn,

          totalAmount: Number(pfandReturn.totalAmount),

          approvedAmount:
            pfandReturn.approvedAmount !== null
              ? Number(pfandReturn.approvedAmount)
              : null,

          items: pfandReturn.items.map((item) => ({
            ...item,

            unitAmount: Number(item.unitAmount),

            totalAmount: Number(item.totalAmount),

            approvedTotal:
              item.approvedTotal !== null ? Number(item.approvedTotal) : null,
          })),
        })),
      };
    });

    /*
     * Şoför listesi:
     *
     * 1. Henüz teslim edilmemiş siparişler her zaman görünür.
     *    Şoför teslimatı tamamlayabilmelidir.
     *
     * 2. Teslim edilmiş siparişlerde yalnızca:
     *    - açık borcu bulunanlar
     *    - admin onayı bekleyen ödeme bulunanlar
     *    görünür.
     *
     * 3. Teslim edilmiş ve hesabı tamamen kapanmış siparişler
     *    şoför panelinden kaldırılır.
     */
    const visibleOrders = serializedOrders.filter((order) => {
      // Teslim edilmemiş siparişler her zaman görünür.
      if (order.status !== "DELIVERED") {
        return true;
      }

      // Teslim edilmiş sipariş sadece admin onayı bekleyen ödeme varsa görünür.
      return order.pendingPaymentAmount > 0;
    });

    console.log(
      "VISIBLE ORDERS:",
      visibleOrders.map((o) => ({
        order: o.orderNumber,
        pending: o.pendingPaymentAmount,
        approved: o.approvedPaymentAmount,
      })),
    );

    return NextResponse.json({
      orders: visibleOrders,
    });
  } catch (error) {
    console.error("DRIVER_ORDERS_ERROR", error);

    return NextResponse.json(
      {
        error: "Teslimatlar yüklenirken hata oluştu.",
      },
      {
        status: 500,
      },
    );
  }
}
