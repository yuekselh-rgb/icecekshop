import { prisma } from "@/lib/prisma";
import { getRequestLanguage } from "@/lib/request-language";
import { getSession } from "@/lib/session";
import { withTenant } from "@/lib/tenant";
import { NextResponse } from "next/server";

export const GET = withTenant(async () => {
  const language = await getRequestLanguage();

  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      {
        error:
          language === "de" ? "Bitte melden Sie sich an." : "Lütfen giriş yapın.",
      },
      {
        status: 401,
      },
    );
  }

  try {
    const orders = await prisma.order.findMany({
      where: {
        userId: session.userId,
        deletedAt: null,
      },

      include: {
        items: true,

        driver: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },

        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
            companyName: true,
            phone: true,
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
                originalQuantity: true,
                unitAmount: true,
                totalAmount: true,
                originalTotal: true,
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
            note: true,
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      orders: orders.map((order) => {
        const pfandReturnAmount =
          order.pfandReturns.length > 0
            ? Number(
                order.pfandReturns[0].approvedAmount ??
                  order.pfandReturns[0].totalAmount,
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

        const pfandReturnItems =
          order.pfandReturns.length > 0
            ? order.pfandReturns[0].items.map((item) => ({
                id: item.id,
                name: item.name,
                quantity: item.quantity,

                originalQuantity: item.originalQuantity ?? item.quantity,

                quantityDifference:
                  item.quantity - (item.originalQuantity ?? item.quantity),

                unitAmount: Number(item.unitAmount),

                totalAmount: Number(item.totalAmount),

                amountDifference: Number(
                  (
                    Number(item.totalAmount) -
                    Number(item.originalTotal ?? item.totalAmount)
                  ).toFixed(2),
                ),
              }))
            : [];

        return {
          ...order,

          subtotal: Number(order.subtotal),
          deliveryFee: Number(order.deliveryFee),
          pfandAmount: Number(order.pfandAmount),

          totalAmount: effectiveTotal,
          pfandReturnAmount,
          pfandReturnItems,

          approvedPaymentAmount,
          pendingPaymentAmount,
          openPaymentAmount,

          accountStatus: openPaymentAmount <= 0.009 ? "CLOSED" : "OPEN",

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
    console.error("CUSTOMER_ORDERS_ERROR", error);

    return NextResponse.json(
      {
        error:
          language === "de"
            ? "Fehler beim Laden der Bestellungen."
            : "Siparişler yüklenirken hata oluştu.",
      },
      {
        status: 500,
      },
    );
  }
});
