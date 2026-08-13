"use client";

import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Loader2, Users } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import DeleteCustomerButton from "./[id]/DeleteCustomerButton";

type Customer = {
  id: string;
  companyName: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  address: string | null;

  totalPurchase: number;
  openBalance: number;
  paidTotal: number;
  orderCount: number;
  pendingOrders: number;
  pfandTotal: number;
  lastOrder: string | null;
};

export default function MusterilerPage() {
  const { language } = useLanguage();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const t =
    language === "de"
      ? {
          title: "Kunden",
          pdf: "PDF herunterladen",
          print: "Drucken",
          customer: "Kunde",
          phone: "Telefon",
          total: "Gesamt",
          openBalance: "Offener Saldo",
          collected: "Eingezogen",
          orders: "Bestellungen",
          pending: "Ausstehend",
          pfand: "Pfand",
          lastOrder: "Letzte Bestellung",
          actions: "Aktionen",
          detail: "Details",
          loading: "Kunden werden geladen...",
          error: "Kunden konnten nicht geladen werden.",
          empty: "Noch keine Kunden vorhanden.",
        }
      : {
          title: "Müşteriler",
          pdf: "PDF İndir",
          print: "Yazdır",
          customer: "Müşteri",
          phone: "Telefon",
          total: "Toplam",
          openBalance: "Açık Cari",
          collected: "Tahsil",
          orders: "Sipariş",
          pending: "Bekleyen",
          pfand: "Pfand",
          lastOrder: "Son Sipariş",
          actions: "İşlemler",
          detail: "Detay",
          loading: "Müşteriler yükleniyor...",
          error: "Müşteriler yüklenemedi.",
          empty: "Henüz müşteri bulunmuyor.",
        };

  useEffect(() => {
    fetch("/api/admin/customers")
      .then((r) => r.json())
      .then((d) => {
        setCustomers(d.customers || []);
      })
      .catch(() => {
        setError(t.error);
      })
      .finally(() => {
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function downloadPdf() {
    const pdf = new jsPDF({
      orientation: "landscape",
    });

    const pdfTitle = language === "de" ? "Kunden" : "Musteriler";

    pdf.setFontSize(18);
    pdf.text(pdfTitle, 14, 16);

    autoTable(pdf, {
      startY: 24,
      head: [
        language === "de"
          ? [
              "Kunde",
              "Telefon",
              "Gesamt",
              "Offener Saldo",
              "Eingezogen",
              "Bestellungen",
              "Ausstehend",
              "Pfand",
              "Letzte Bestellung",
            ]
          : [
              "Musteri",
              "Telefon",
              "Toplam",
              "Acik Cari",
              "Tahsil",
              "Siparis",
              "Bekleyen",
              "Pfand",
              "Son Siparis",
            ],
      ],
      body: customers.map((c) => [
        c.companyName || `${c.firstName ?? ""} ${c.lastName ?? ""}`,
        c.phone ?? "",
        `€ ${c.totalPurchase.toFixed(2)}`,
        `€ ${c.openBalance.toFixed(2)}`,
        `€ ${c.paidTotal.toFixed(2)}`,
        String(c.orderCount),
        String(c.pendingOrders),
        `€ ${c.pfandTotal.toFixed(2)}`,
        c.lastOrder
          ? new Date(c.lastOrder).toLocaleDateString("de-DE")
          : "-",
      ]),
      styles: {
        fontSize: 8,
      },
      headStyles: {
        fillColor: [234, 88, 12],
      },
    });

    pdf.save(`${pdfTitle}.pdf`);
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 font-bold text-slate-600">
          <Loader2 className="animate-spin" />
          {t.loading}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-4xl font-black">{t.title}</h1>

          <div className="flex gap-3 print:hidden">
            <button
              onClick={downloadPdf}
              className="rounded-xl bg-red-600 px-5 py-3 font-bold text-white transition hover:bg-red-700"
            >
              {t.pdf}
            </button>

            <button
              onClick={() => window.print()}
              className="rounded-xl bg-orange-600 px-5 py-3 font-bold text-white transition hover:bg-orange-700"
            >
              {t.print}
            </button>
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl bg-red-50 p-6 text-center font-bold text-red-600">
            {error}
          </div>
        ) : customers.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-white p-12 text-center shadow">
            <Users size={32} className="text-slate-300" />
            <p className="font-bold text-slate-500">{t.empty}</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl bg-white shadow">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-100">
                <tr className="text-left">
                  <th className="px-4 py-3">{t.customer}</th>
                  <th className="px-4 py-3">{t.phone}</th>
                  <th className="px-4 py-3">{t.total}</th>
                  <th className="px-4 py-3 text-red-600">{t.openBalance}</th>
                  <th className="px-4 py-3 text-green-600">{t.collected}</th>
                  <th className="px-4 py-3">{t.orders}</th>
                  <th className="px-4 py-3">{t.pending}</th>
                  <th className="px-4 py-3">{t.pfand}</th>
                  <th className="px-4 py-3">{t.lastOrder}</th>
                  <th className="px-4 py-3 text-center">{t.actions}</th>
                </tr>
              </thead>

              <tbody>
                {customers.map((c) => (
                  <tr key={c.id} className="border-t hover:bg-orange-50 transition">
                    <td className="px-4 py-3 font-bold whitespace-nowrap">
                      {c.companyName ||
                        `${c.firstName ?? ""} ${c.lastName ?? ""}`}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">{c.phone}</td>

                    <td className="px-4 py-3 font-semibold">
                      € {c.totalPurchase.toFixed(2)}
                    </td>

                    <td className="px-4 py-3 font-bold text-red-600">
                      € {c.openBalance.toFixed(2)}
                    </td>

                    <td className="px-4 py-3 font-bold text-green-600">
                      € {c.paidTotal.toFixed(2)}
                    </td>

                    <td className="px-4 py-3 text-center">{c.orderCount}</td>

                    <td className="px-4 py-3 text-center">{c.pendingOrders}</td>

                    <td className="px-4 py-3">€ {c.pfandTotal.toFixed(2)}</td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      {c.lastOrder
                        ? new Date(c.lastOrder).toLocaleDateString("de-DE")
                        : "-"}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-2">
                        <a
                          href={`/super-admin/customers/${c.id}`}
                          className="rounded-lg bg-orange-500 px-3 py-2 text-sm font-bold text-white hover:bg-orange-600"
                        >
                          {t.detail}
                        </a>

                        <DeleteCustomerButton
                          id={c.id}
                          compact
                          onDeleted={() =>
                            setCustomers((prev) =>
                              prev.filter((customer) => customer.id !== c.id),
                            )
                          }
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
  );
}
