import Link from "next/link";
import { headers } from "next/headers";
import DeleteCustomerButton from "./DeleteCustomerButton";
import { prisma } from "@/lib/prisma";
import { getCurrentTenant } from "@/lib/tenant";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tenant = await getCurrentTenant();

  const headersList = await headers();

  const language = headersList.get("accept-language")?.startsWith("de")
    ? "de"
    : "tr";

  const t =
    language === "de"
      ? {
          notFound: "Kunde nicht gefunden.",
          title: "Kunden-Kontokarte",
          back: "← Zurück zu Kunden",
          totalPurchase: "Gesamtumsatz",
          openDebt: "Offener Saldo",
          totalOrders: "Bestellungen gesamt",
          pfand: "Pfand",
          orderHistory: "Bestellhistorie",
          noOrders: "Für diesen Kunden liegen noch keine Bestellungen vor.",
          orderNumber: "Bestellnr.",
          date: "Datum",
          status: "Status",
          payment: "Zahlung",
          items: "Artikel",
          amount: "Betrag",
          paid: "Bezahlt",
          open: "Offen",
          pfandReturns: "Pfand-Rückgaben",
          noPfandReturns: "Für diesen Kunden liegen noch keine Pfand-Rückgaben vor.",
          requested: "Beantragt",
          approved: "Genehmigt",
        }
      : {
          notFound: "Müşteri bulunamadı.",
          title: "Müşteri Cari Kartı",
          back: "← Müşterilere Dön",
          totalPurchase: "Toplam Alış",
          openDebt: "Cari Borç",
          totalOrders: "Toplam Sipariş",
          pfand: "Pfand",
          orderHistory: "Sipariş Geçmişi",
          noOrders: "Bu müşteriye ait henüz sipariş bulunmuyor.",
          orderNumber: "Sipariş No",
          date: "Tarih",
          status: "Durum",
          payment: "Ödeme",
          items: "Ürün",
          amount: "Tutar",
          paid: "Ödendi",
          open: "Açık",
          pfandReturns: "Pfand İadeleri",
          noPfandReturns: "Bu müşteriye ait henüz Pfand iadesi bulunmuyor.",
          requested: "Talep Edilen",
          approved: "Onaylanan",
        };

  const customer = tenant
    ? await prisma.user.findUnique({
    where: {
      id,
      tenantId: tenant.id,
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
  })
    : null;


  if (!customer) {
    return (
      <div>
        <h1 className="text-2xl font-black">
          {t.notFound}
        </h1>
      </div>
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
    <div className="mx-auto max-w-7xl space-y-6">

        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-black">
            {t.title}
          </h1>

          <div className="flex gap-3">

            <DeleteCustomerButton id={id} />

            <Link
              href="/super-admin/customers"
              className="rounded-xl bg-slate-900 px-5 py-3 font-bold text-white"
            >
              {t.back}
            </Link>

          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">

          <div className="rounded-2xl bg-white p-6 shadow">
            <p className="text-slate-500">{t.totalPurchase}</p>
            <h2 className="mt-2 text-3xl font-black">{totalPurchase.toFixed(2)} €</h2>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow">
            <p className="text-slate-500">{t.openDebt}</p>
            <h2 className="mt-2 text-3xl font-black text-red-600">
              {openDebt.toFixed(2)} €
            </h2>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow">
            <p className="text-slate-500">{t.totalOrders}</p>
            <h2 className="mt-2 text-3xl font-black">{totalOrders}</h2>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow">
            <p className="text-slate-500">{t.pfand}</p>
            <h2 className="mt-2 text-3xl font-black">{totalPfand.toFixed(2)} €</h2>
          </div>

        </div>

        <div className="rounded-2xl bg-white p-6 shadow">
          <h2 className="mb-4 text-2xl font-black">
            {t.orderHistory}
          </h2>

          {customer.orders.length === 0 ? (
            <p className="text-slate-500">
              {t.noOrders}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-bold uppercase text-slate-400">
                    <th className="py-2 pr-4">{t.orderNumber}</th>
                    <th className="py-2 pr-4">{t.date}</th>
                    <th className="py-2 pr-4">{t.status}</th>
                    <th className="py-2 pr-4">{t.payment}</th>
                    <th className="py-2 pr-4">{t.items}</th>
                    <th className="py-2 text-right">{t.amount}</th>
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
                            ? t.paid
                            : t.open}
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
            {t.pfandReturns}
          </h2>

          {customer.pfandReturns.length === 0 ? (
            <p className="text-slate-500">
              {t.noPfandReturns}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-bold uppercase text-slate-400">
                    <th className="py-2 pr-4">{t.date}</th>
                    <th className="py-2 pr-4">{t.status}</th>
                    <th className="py-2 pr-4">{t.requested}</th>
                    <th className="py-2 text-right">{t.approved}</th>
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
  );
}
