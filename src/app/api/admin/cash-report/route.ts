import { getAdminWithPermissions } from "@/lib/admin-auth";
import { adminOrderInclude, serializeAdminOrder } from "@/lib/admin-order-serializer";
import { prisma } from "@/lib/prisma";
import { getRequestLanguage } from "@/lib/request-language";
import { withTenant } from "@/lib/tenant";
import { NextRequest, NextResponse } from "next/server";

function parseDateParam(value: string | null) {
  if (!value) {
    return null;
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const date = new Date(year, month - 1, day);

  return Number.isNaN(date.getTime()) ? null : date;
}

function addDays(date: Date, days: number) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() + days,
  );
}

export const GET = withTenant(async (request: NextRequest) => {
  const language = await getRequestLanguage();

  const admin = await getAdminWithPermissions();

  if (!admin || (!admin.isSuperAdmin && !admin.permissions.viewCashReport)) {
    return NextResponse.json(
      {
        error:
          language === "de"
            ? "Sie sind nicht berechtigt, den Kassenbericht einzusehen."
            : "Kasa raporunu görüntüleme yetkiniz yok.",
      },
      {
        status: 403,
      },
    );
  }

  const { searchParams } = new URL(request.url);

  const mode = searchParams.get("mode") || "day";

  let rangeStart: Date | null = null;
  let rangeEnd: Date | null = null;

  if (mode === "day") {
    const date = parseDateParam(searchParams.get("date"));

    if (!date) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Ein gültiges Datum ist erforderlich."
              : "Geçerli bir tarih gereklidir.",
        },
        { status: 400 },
      );
    }

    rangeStart = date;
    rangeEnd = addDays(date, 1);
  } else if (mode === "month") {
    const year = Number(searchParams.get("year"));
    const month = Number(searchParams.get("month"));

    if (
      !Number.isInteger(year) ||
      !Number.isInteger(month) ||
      month < 1 ||
      month > 12
    ) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Ein gültiger Monat ist erforderlich."
              : "Geçerli bir ay gereklidir.",
        },
        { status: 400 },
      );
    }

    rangeStart = new Date(year, month - 1, 1);
    rangeEnd = new Date(year, month, 1);
  } else if (mode === "range") {
    const startDate = parseDateParam(searchParams.get("startDate"));
    const endDate = parseDateParam(searchParams.get("endDate"));

    if (!startDate || !endDate || startDate > endDate) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Ein gültiger Zeitraum ist erforderlich."
              : "Geçerli bir tarih aralığı gereklidir.",
        },
        { status: 400 },
      );
    }

    rangeStart = startDate;
    rangeEnd = addDays(endDate, 1);
  } else {
    return NextResponse.json(
      {
        error:
          language === "de"
            ? "Ungültiger Berichtsmodus."
            : "Geçersiz rapor modu.",
      },
      { status: 400 },
    );
  }

  try {
    const [movements, openOrders] = await Promise.all([
      prisma.cashMovement.findMany({
        where: {
          createdAt: {
            gte: rangeStart,
            lt: rangeEnd,
          },
        },

        include: {
          supplier: {
            select: {
              id: true,
              name: true,
            },
          },
        },

        orderBy: {
          createdAt: "asc",
        },
      }),

      prisma.order.findMany({
        where: {
          deletedAt: null,
          createdAt: {
            gte: rangeStart,
            lt: rangeEnd,
          },

          /*
           * Historischer Stand: eine Bestellung zählt für diesen
           * Berichtszeitraum als offen, wenn sie am Ende des Zeitraums
           * noch offen war — auch wenn sie inzwischen (nach dem
           * Zeitraum) bezahlt wurde. Sonst verschwindet eine später
           * bezahlte Rechnung rückwirkend aus dem Bericht des Tages,
           * an dem sie tatsächlich offen war.
           */
          OR: [
            { paymentStatus: "OPEN" },
            { paymentStatus: "PAID", paidAt: { gte: rangeEnd } },
          ],
        },

        include: adminOrderInclude,

        orderBy: {
          createdAt: "asc",
        },
      }),
    ]);

    const creatorIds = Array.from(
      new Set(movements.map((movement) => movement.createdById)),
    );

    const creators = creatorIds.length
      ? await prisma.user.findMany({
          where: {
            id: {
              in: creatorIds,
            },
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        })
      : [];

    const creatorsById = new Map(
      creators.map((creator) => [creator.id, creator]),
    );

    const incomeByCategory: Record<string, number> = {};
    const expenseByCategory: Record<string, number> = {};

    let incomeTotal = 0;
    let expenseTotal = 0;

    for (const movement of movements) {
      const amount = Number(movement.amount);

      if (movement.direction === "IN") {
        incomeTotal = Number((incomeTotal + amount).toFixed(2));

        incomeByCategory[movement.category] = Number(
          ((incomeByCategory[movement.category] || 0) + amount).toFixed(2),
        );
      } else {
        expenseTotal = Number((expenseTotal + amount).toFixed(2));

        expenseByCategory[movement.category] = Number(
          ((expenseByCategory[movement.category] || 0) + amount).toFixed(2),
        );
      }
    }

    const serializedOpenOrders = openOrders.map((order) => {
      const serialized = serializeAdminOrder(order);

      /*
       * openPaymentAmount aus serializeAdminOrder ist der aktuelle
       * (Live-)Stand. Für den Bericht brauchen wir den Stand am Ende
       * des Zeitraums: nur Zahlungen zählen, die bis dahin bereits
       * genehmigt waren — spätere Zahlungen dürfen den historischen
       * offenen Betrag nicht verringern.
       */
      const approvedBeforeRangeEnd = Number(
        order.payments
          .filter(
            (payment) =>
              payment.status === "APPROVED" &&
              payment.approvedAt !== null &&
              payment.approvedAt < rangeEnd!,
          )
          .reduce((total, payment) => total + Number(payment.amount), 0)
          .toFixed(2),
      );

      const historicalOpenAmount = Number(
        Math.max(0, serialized.totalAmount - approvedBeforeRangeEnd).toFixed(
          2,
        ),
      );

      return {
        ...serialized,
        openPaymentAmount: historicalOpenAmount,

        /*
         * War am Ende des Berichtszeitraums offen, ist aber inzwischen
         * (nach dem Zeitraum) tatsächlich bezahlt worden — im Frontend
         * auffällig markiert, damit niemand versucht, das Geld noch
         * einzutreiben.
         */
        settledAfterPeriod: order.paymentStatus === "PAID",
      };
    });

    const openAccountTotal = Number(
      serializedOpenOrders
        .reduce((total, order) => total + order.openPaymentAmount, 0)
        .toFixed(2),
    );

    return NextResponse.json({
      period: {
        mode,
        startDate: rangeStart.toISOString(),
        endDate: addDays(rangeEnd, -1).toISOString(),
      },

      income: {
        total: incomeTotal,
        byCategory: incomeByCategory,
      },

      expense: {
        total: expenseTotal,
        byCategory: expenseByCategory,
      },

      net: Number((incomeTotal - expenseTotal).toFixed(2)),

      openAccount: {
        total: openAccountTotal,
        orderCount: serializedOpenOrders.length,
        orders: serializedOpenOrders.map((order) => ({
          id: order.id,
          orderNumber: order.orderNumber,
          createdAt: order.createdAt,
          customerName:
            order.user.companyName ||
            [order.user.firstName, order.user.lastName]
              .filter(Boolean)
              .join(" ") ||
            order.user.email,
          openPaymentAmount: order.openPaymentAmount,
          settledAfterPeriod: order.settledAfterPeriod,
        })),
      },

      movements: movements.map((movement) => {
        const creator = creatorsById.get(movement.createdById);

        const creatorName = creator
          ? [creator.firstName, creator.lastName]
              .filter(Boolean)
              .join(" ") || creator.email
          : null;

        return {
          id: movement.id,
          accountType: movement.accountType,
          direction: movement.direction,
          category: movement.category,
          amount: Number(movement.amount),
          companyName: movement.companyName,
          description: movement.description,
          supplierName: movement.supplier?.name ?? null,
          createdAt: movement.createdAt,
          orderId: movement.orderId,
          createdBy: {
            name: creatorName,
          },
        };
      }),
    });
  } catch (error) {
    console.error("CASH_REPORT_ERROR", error);

    return NextResponse.json(
      {
        error:
          language === "de"
            ? "Kassenbericht konnte nicht geladen werden."
            : "Kasa raporu yüklenemedi.",
      },
      { status: 500 },
    );
  }
});
