import Link from "next/link";
import DeleteCustomerButton from "./DeleteCustomerButton";
import { prisma } from "@/lib/prisma";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const customer = await prisma.user.findUnique({
    where: {
      id,
    },

    include: {
      orders: {
        include: {
          items: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },

      pfandReturns: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });


  if (!customer) {
    return (
      <main className="p-10">
        <h1 className="text-2xl font-black">
          Müşteri bulunamadı.
        </h1>
      </main>
    );
  }

  const totalPurchase = customer.orders.reduce(
    (sum, order) => sum + Number(order.totalAmount),
    0,
  );

  const openDebt = customer.orders
    .filter((order) => order.paymentStatus === "OPEN")
    .reduce(
      (sum, order) => sum + Number(order.totalAmount),
      0,
    );

  const totalPfand = customer.pfandReturns.reduce(
    (sum, pfand) => sum + Number(pfand.approvedAmount ?? 0),
    0,
  );

  const totalOrders = customer.orders.length;


  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">

        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-black">
            Müşteri Cari Kartı
          </h1>

          <div className="flex gap-3">

            <DeleteCustomerButton id={id} />

            <Link
              href="/super-admin/musteriler"
              className="rounded-xl bg-slate-900 px-5 py-3 font-bold text-white"
            >
              ← Müşterilere Dön
            </Link>

          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">

          <div className="rounded-2xl bg-white p-6 shadow">
            <p className="text-slate-500">Toplam Alış</p>
            <h2 className="mt-2 text-3xl font-black">{totalPurchase.toFixed(2)} €</h2>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow">
            <p className="text-slate-500">Cari Borç</p>
            <h2 className="mt-2 text-3xl font-black text-red-600">
              {openDebt.toFixed(2)} €
            </h2>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow">
            <p className="text-slate-500">Toplam Sipariş</p>
            <h2 className="mt-2 text-3xl font-black">{totalOrders}</h2>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow">
            <p className="text-slate-500">Pfand</p>
            <h2 className="mt-2 text-3xl font-black">{totalPfand.toFixed(2)} €</h2>
          </div>

        </div>

        <div className="rounded-2xl bg-white p-6 shadow">
          <h2 className="mb-4 text-2xl font-black">
            Sipariş Geçmişi
          </h2>

          {customer.orders.length === 0 ? (
            <p className="text-slate-500">
              Bu müşteriye ait henüz sipariş bulunmuyor.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-bold uppercase text-slate-400">
                    <th className="py-2 pr-4">Sipariş No</th>
                    <th className="py-2 pr-4">Tarih</th>
                    <th className="py-2 pr-4">Durum</th>
                    <th className="py-2 pr-4">Ödeme</th>
                    <th className="py-2 pr-4">Ürün</th>
                    <th className="py-2 text-right">Tutar</th>
                  </tr>
                </thead>

                <tbody>
                  {customer.orders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-slate-100 last:border-b-0"
                    >
                      <td className="py-3 pr-4 font-bold text-slate-900">
                        {order.orderNumber}
                      </td>

                      <td className="py-3 pr-4 text-slate-600">
                        {new Date(order.createdAt).toLocaleDateString(
                          "de-DE",
                        )}
                      </td>

                      <td className="py-3 pr-4 text-slate-600">
                        {order.status}
                      </td>

                      <td className="py-3 pr-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                            order.paymentStatus === "PAID"
                              ? "bg-green-50 text-green-700"
                              : "bg-red-50 text-red-600"
                          }`}
                        >
                          {order.paymentStatus === "PAID"
                            ? "Ödendi"
                            : "Açık"}
                        </span>
                      </td>

                      <td className="py-3 pr-4 text-slate-600">
                        {order.items.length}
                      </td>

                      <td className="py-3 text-right font-bold text-slate-900">
                        {Number(order.totalAmount).toFixed(2)} €
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-white p-6 shadow">
          <h2 className="mb-4 text-2xl font-black">
            Pfand İadeleri
          </h2>

          {customer.pfandReturns.length === 0 ? (
            <p className="text-slate-500">
              Bu müşteriye ait henüz Pfand iadesi bulunmuyor.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-bold uppercase text-slate-400">
                    <th className="py-2 pr-4">Tarih</th>
                    <th className="py-2 pr-4">Durum</th>
                    <th className="py-2 pr-4">Talep Edilen</th>
                    <th className="py-2 text-right">Onaylanan</th>
                  </tr>
                </thead>

                <tbody>
                  {customer.pfandReturns.map((pfandReturn) => (
                    <tr
                      key={pfandReturn.id}
                      className="border-b border-slate-100 last:border-b-0"
                    >
                      <td className="py-3 pr-4 text-slate-600">
                        {new Date(
                          pfandReturn.createdAt,
                        ).toLocaleDateString("de-DE")}
                      </td>

                      <td className="py-3 pr-4 text-slate-600">
                        {pfandReturn.status}
                      </td>

                      <td className="py-3 pr-4 text-slate-600">
                        {Number(pfandReturn.totalAmount).toFixed(2)} €
                      </td>

                      <td className="py-3 text-right font-bold text-slate-900">
                        {pfandReturn.approvedAmount !== null
                          ? `${Number(pfandReturn.approvedAmount).toFixed(2)} €`
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
