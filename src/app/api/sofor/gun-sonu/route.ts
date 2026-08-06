import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function POST() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  const orders = await prisma.order.findMany({
    where: {
      status: "DELIVERED",
      driverId: session.userId,
    },
    include: {
      payments: true,
      pfandReturns: true,
    },
  });

  const totalSales = orders.reduce(
    (t, o) => t + Number(o.totalAmount),
    0,
  );

  const cash = orders.reduce(
    (t, o) =>
      t +
      o.payments
        .filter((p) => p.paymentMethod === "CASH")
        .reduce((x, p) => x + Number(p.amount), 0),
    0,
  );

  const card = orders.reduce(
    (t, o) =>
      t +
      o.payments
        .filter((p) => p.paymentMethod === "CARD")
        .reduce((x, p) => x + Number(p.amount), 0),
    0,
  );

  const pfand = orders.reduce(
    (t, o) =>
      t +
      o.pfandReturns.reduce(
        (x, p) => x + Number(p.totalAmount),
        0,
      ),
    0,
  );


  const open = Math.max(
    0,
    totalSales - pfand - cash - card,
  );


  return NextResponse.json({
    closedAt: now,
    totalSales,
    cash,
    card,
    open,
    pfand,
    message: "Gün sonu hazır.",
  });
}
