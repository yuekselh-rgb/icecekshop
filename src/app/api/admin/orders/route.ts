import { requireAdminPermission } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type AdminOrderPayment = {
  id: string;
  amount: unknown;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reporterRole: "DRIVER" | "ADMIN" | "SUPER_ADMIN";
  reportedAt: Date;
  approvedAt: Date | null;
  approvedById: string | null;
  driverId: string | null;
  note: string | null;
};

type AdminOrderWithPayments<T> = Omit<
  T,
  "payments" | "driverPaymentReportedAmount"
> & {
  payments: AdminOrderPayment[];
  driverPaymentReportedAmount: unknown | null;
};

export async function GET() {
  const admin = await requireAdminPermission("viewOrders");

  if (!admin) {
    return NextResponse.json(
      {
        error: "Siparişleri görüntüleme yetkiniz yok.",
      },
      {
        status: 403,
      },
    );
  }

  try {
    const orders = await prisma.order.findMany({
      where: {
        deletedAt: null,
      },

      include: {
        user: {
          select: {
            id: true,
            role: true,
            email: true,
            firstName: true,
            lastName: true,
            companyName: true,
            phone: true,
            customerType: true,
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
          select: {
            id: true,
            totalAmount: true,
            approvedAmount: true,
            status: true,

            items: {
              select: {
                id: true,
                name: true,
                quantity: true,
                originalQuantity: true,
                approvedQuantity: true,
                unitAmount: true,
                totalAmount: true,
                originalTotal: true,
                approvedTotal: true,
              },
            },
          },
        },

        payments: {
          orderBy: {
            reportedAt: "desc",
          },

          select: {
            id: true,
            amount: true,
            status: true,
            reporterRole: true,
            reportedAt: true,
            approvedAt: true,
            approvedById: true,
            driverId: true,
            note: true,
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      orders: (
        orders as unknown as Array<
          AdminOrderWithPayments<(typeof orders)[number]>
        >
      ).map((order) => {
        const effectiveTotal = Number(
          Math.max(
            0,
            Number(order.subtotal) +
              Number(order.pfandAmount) +
              Number(order.deliveryFee) -
              (order.pfandReturns.length > 0
                ? Number(
                    order.pfandReturns[0].approvedAmount ??
                      order.pfandReturns[0].totalAmount,
                  )
                : 0),
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

          driverPaymentReportedAmount:
            order.driverPaymentReportedAmount !== null
              ? Number(order.driverPaymentReportedAmount)
              : null,

          pfandReturnId:
            order.pfandReturns.length > 0 ? order.pfandReturns[0].id : null,

          pfandReturnStatus:
            order.pfandReturns.length > 0 ? order.pfandReturns[0].status : null,

          pfandReturnAmount:
            order.pfandReturns.length > 0
              ? Number(
                  order.pfandReturns[0].approvedAmount ??
                    order.pfandReturns[0].totalAmount,
                )
              : 0,

          pfandReturnItems:
            order.pfandReturns.length > 0
              ? order.pfandReturns[0].items.map((item) => ({
                  id: item.id,
                  name: item.name,
                  quantity: item.quantity,

                  originalQuantity: item.originalQuantity ?? item.quantity,

                  approvedQuantity: item.approvedQuantity,

                  quantityDifference:
                    item.quantity - (item.originalQuantity ?? item.quantity),

                  unitAmount: Number(item.unitAmount),

                  totalAmount: Number(item.totalAmount),

                  originalTotal: Number(item.originalTotal ?? item.totalAmount),

                  amountDifference: Number(
                    (
                      Number(item.totalAmount) -
                      Number(item.originalTotal ?? item.totalAmount)
                    ).toFixed(2),
                  ),
                }))
              : [],

          totalAmount: effectiveTotal,

          approvedPaymentAmount,
          pendingPaymentAmount,
          openPaymentAmount,

          paymentHistory: order.payments.map((payment) => ({
            ...payment,
            amount: Number(payment.amount),
          })),

          items: order.items.map((item) => ({
            ...item,

            price: Number(item.price),

            pfand: Number(item.pfand),
          })),
        };
      }),
    });
  } catch (error) {
    console.error("ADMIN_ORDERS_ERROR", error);

    return NextResponse.json(
      {
        error: "Siparişler yüklenirken hata oluştu.",
      },
      {
        status: 500,
      },
    );
  }
}
