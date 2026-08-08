import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getCurrentTenant } from "@/lib/tenant";
import CloseDayButton from "./CloseDayButton";

export default async function GunSonuPage() {
  const session = await getSession();

  if (!session) {
    return null;
  }

  const tenant = await getCurrentTenant();

  if (!tenant) {
    return null;
  }

  const now = new Date();

  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );

  const orders = await prisma.order.findMany({
    where: {
      tenantId: tenant.id,
      status: "DELIVERED",
      driverId: session.userId,
      deliveredAt: {
        gte: startOfToday,
      },
    },
    include: {
      pfandReturns: {
        include: {
          items: true,
        },
      },
      payments: true,
    },
  });

  const totalSales = orders.reduce(
    (total, order) => total + Number(order.totalAmount),
    0,
  );

  const open = orders
    .filter((order) => order.paymentStatus === "OPEN")
    .reduce((total, order) => total + Number(order.totalAmount), 0);

  const cash = orders.reduce(
    (t, o) =>
      t +
      o.payments
        .filter((p) => p.paymentMethod === "CASH" && p.status !== "REJECTED")
        .reduce((x, p) => x + Number(p.amount), 0),
    0,
  );

  const card = orders.reduce(
    (t, o) =>
      t +
      o.payments
        .filter((p) => p.paymentMethod === "CARD" && p.status !== "REJECTED")
        .reduce((x, p) => x + Number(p.amount), 0),
    0,
  );

  const pfand = orders.reduce(
    (t, o) =>
      t +
      o.pfandReturns.reduce((x, r) => x + Number(r.totalAmount), 0),
    0,
  );

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-6 text-4xl font-black">Gün Sonu</h1>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <Card title="Toplam Satış" value={totalSales} />
          <Card title="Nakit" value={cash} />
          <Card title="Kart" value={card} />
          {open > 0 && <Card title="Açık Hesap" value={open} />}
          <Card title="Pfand" value={pfand} />
        </div>

        <CloseDayButton />
      </div>
    </main>
  );
}

function Card({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow">
      <p className="text-xs uppercase text-slate-500">{title}</p>

      <p className="mt-3 text-3xl font-black">
        {value.toLocaleString("de-DE", {
          style: "currency",
          currency: "EUR",
        })}
      </p>
    </div>
  );
}
