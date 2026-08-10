import { verifySessionToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRequestLanguage } from "@/lib/request-language";
import { withTenant } from "@/lib/tenant";
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

export const POST = withTenant(async () => {
  const language = await getRequestLanguage();

  const session = await getDriverSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );

  const orders = await prisma.order.findMany({
    where: {
      status: "DELIVERED",
      driverId: session.userId,
      deliveredAt: {
        gte: startOfToday,
      },
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

  const open = orders
    .filter((o) => o.paymentStatus === "OPEN")
    .reduce((t, o) => t + Number(o.totalAmount), 0);

  const cash = orders.reduce(
    (t, o) =>
      t +
      o.payments
        .filter(
          (p) => p.paymentMethod === "CASH" && p.status !== "REJECTED",
        )
        .reduce((x, p) => x + Number(p.amount), 0),
    0,
  );

  const card = orders.reduce(
    (t, o) =>
      t +
      o.payments
        .filter(
          (p) => p.paymentMethod === "CARD" && p.status !== "REJECTED",
        )
        .reduce((x, p) => x + Number(p.amount), 0),
    0,
  );

  const pfand = orders.reduce(
    (t, o) =>
      t +
      o.pfandReturns.reduce((x, p) => x + Number(p.totalAmount), 0),
    0,
  );

  return NextResponse.json({
    closedAt: now,
    totalSales,
    cash,
    card,
    open,
    pfand,
    orderCount: orders.length,
    message:
      language === "de"
        ? "Tagesabschluss wurde erstellt."
        : "Gün sonu özeti hazırlandı.",
  });
});
