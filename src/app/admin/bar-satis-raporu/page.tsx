"use client";

import { useLanguage } from "@/context/LanguageContext";

import {
  ArrowLeft,
  Banknote,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Loader2,
  ReceiptText,
  Search,
  UserRound,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type SaleItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  pfand: number;
  lineTotal: number;
};

type PfandReturnItem = {
  id: string;
  name: string;
  quantity: number;
  unitAmount: number;
  totalAmount: number;
};

type Sale = {
  id: string;
  orderNumber: string;
  createdAt: string;
  sellerName: string;

  customer: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
  };

  paymentMethod: string;
  paymentStatus: "OPEN" | "PAID";
  subtotal: number;
  newPfand: number;
  pfandReturnAmount: number;
  totalAmount: number;
  items: SaleItem[];
  pfandReturnItems: PfandReturnItem[];
};

type StaffSummary = {
  sellerName: string;
  saleCount: number;
  totalAmount: number;
  cashAmount: number;
  cardAmount: number;
  openAmount: number;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function BarSalesReportPage() {
  const { language } = useLanguage();

  const t =
    language === "de"
      ? {
          title: "Barverkaufsbericht",
          subtitle: "Barverkaufsverwaltung",
          reportLoadError: "Bericht konnte nicht geladen werden.",
          cash: "Bar",
          card: "Karte",
          personnelSummary: "Personalübersicht",
          searchPlaceholder: "Personal, Kunde, Produkt oder Verkaufsnummer suchen...",
          product: "Produkt",
          payment: "Zahlung",
          openAmount: "Offener Betrag",
          subtotal: "Zwischensumme",
          newPfand: "Neues Pfand",
          returnedPfand: "Zurückgegebenes Pfand",
          receivedAmount: "Erhaltener Betrag",
        }
      : {
          title: "Bar Satış Raporu",
          subtitle: "Bar Satış Yönetimi",
          reportLoadError: "Rapor yüklenemedi.",
          cash: "Nakit",
          card: "Kart",
          personnelSummary: "Personel Özeti",
          searchPlaceholder: "Personel, müşteri, ürün veya satış numarası ara...",
          product: "Ürün",
          payment: "Ödeme",
          openAmount: "Açık tutar",
          subtotal: "Ara Toplam",
          newPfand: "Yeni Pfand",
          returnedPfand: "Gelen Pfand",
          receivedAmount: "Alınan Tutar",
        };

  const [sales, setSales] = useState<Sale[]>([]);

  const [staffSummary, setStaffSummary] = useState<StaffSummary[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [selectedSeller, setSelectedSeller] = useState("ALL");

  const [expandedSaleId, setExpandedSaleId] = useState<string | null>(null);

  useEffect(() => {
    async function loadReport() {
      try {
        const response = await fetch("/api/admin/bar-sales/report");

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || t.reportLoadError);
          return;
        }

        setSales(data.sales || []);
        setStaffSummary(data.staffSummary || []);
      } catch {
        setError(t.reportLoadError);
      } finally {
        setLoading(false);
      }
    }

    loadReport();
  }, []);

  const filteredSales = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("tr-TR");

    return sales.filter((sale) => {
      const sellerMatches =
        selectedSeller === "ALL" || sale.sellerName === selectedSeller;

      const searchText = [
        sale.orderNumber,
        sale.sellerName,
        sale.customer.name,
        sale.customer.email,
        sale.customer.phone,
        sale.paymentMethod,
        ...sale.items.map((item) => item.name),
      ]
        .join(" ")
        .toLocaleLowerCase("tr-TR");

      return sellerMatches && (!query || searchText.includes(query));
    });
  }, [sales, search, selectedSeller]);

  const totals = useMemo(
    () => ({
      saleCount: filteredSales.length,

      totalAmount: filteredSales.reduce(
        (total, sale) => total + sale.totalAmount,
        0,
      ),

      cashAmount: filteredSales
        .filter((sale) =>
          sale.paymentMethod.toLocaleLowerCase("tr-TR").includes("nakit"),
        )
        .reduce((total, sale) => total + sale.totalAmount, 0),

      cardAmount: filteredSales
        .filter((sale) =>
          sale.paymentMethod.toLocaleLowerCase("tr-TR").includes("kart"),
        )
        .reduce((total, sale) => total + sale.totalAmount, 0),

      openAmount: filteredSales
        .filter(
          (sale) =>
            sale.paymentStatus === "OPEN" ||
            (!sale.paymentMethod.toLocaleLowerCase("tr-TR").includes("nakit") &&
              !sale.paymentMethod.toLocaleLowerCase("tr-TR").includes("kart")),
        )
        .reduce((total, sale) => total + sale.totalAmount, 0),
    }),
    [filteredSales],
  );

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="flex items-center gap-3 font-bold text-slate-500">
          <Loader2 className="animate-spin" />
          {language === "de" ? "Barverkaufsbericht wird geladen..." : "Bar satış raporu yükleniyor..."}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-5 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-orange-500"
        >
          <ArrowLeft size={17} />
          Admin Paneli
        </Link>

        <section className="mt-4 rounded-[30px] bg-slate-950 p-7 text-white lg:p-9">
          <p className="font-bold text-orange-400">{t.subtitle}</p>

          <h1 className="mt-2 text-4xl font-black">{t.title}</h1>

          <p className="mt-3 text-slate-400">
            {language === "de"
              ? "Zeigt Barverkäufe, Produkte und Einnahmen des Personals an."
              : "Personellerin yaptığı bar satışlarını, ürünleri ve tahsilatları"}
            görüntüleyin.
          </p>
        </section>

        {error ? (
          <div className="mt-6 rounded-2xl bg-red-50 p-4 font-bold text-red-600">
            {error}
          </div>
        ) : null}

        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <ReceiptText className="text-orange-500" />

            <p className="mt-4 text-sm font-bold text-slate-500">
              {language === "de" ? "Verkäufe" : "Satış Sayısı"}
            </p>

            <p className="mt-1 text-3xl font-black text-slate-950">
              {totals.saleCount}
            </p>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <Banknote className="text-green-600" />

            <p className="mt-4 text-sm font-bold text-slate-500">{t.cash}</p>

            <p className="mt-1 text-3xl font-black text-slate-950">
              {totals.cashAmount.toFixed(2)} €
            </p>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <CreditCard className="text-blue-600" />

            <p className="mt-4 text-sm font-bold text-slate-500">{t.card}</p>

            <p className="mt-1 text-3xl font-black text-slate-950">
              {totals.cardAmount.toFixed(2)} €
            </p>
          </div>

          <div className="rounded-3xl bg-slate-950 p-5 text-white shadow-sm">
            <WalletCards className="text-orange-400" />

            <p className="mt-4 text-sm font-bold text-slate-400">
              {language === "de" ? "Gesamtumsatz" : "Toplam Satış"}
            </p>

            <p className="mt-1 text-3xl font-black">
              {totals.totalAmount.toFixed(2)} €
            </p>
          </div>
        </section>

        <section className="mt-6 rounded-[28px] bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black text-slate-950">{t.personnelSummary}</h2>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {staffSummary.map((staff) => (
              <button
                key={staff.sellerName}
                type="button"
                onClick={() =>
                  setSelectedSeller(
                    selectedSeller === staff.sellerName
                      ? "ALL"
                      : staff.sellerName,
                  )
                }
                className={`rounded-2xl border p-4 text-left transition ${
                  selectedSeller === staff.sellerName
                    ? "border-orange-500 bg-orange-50"
                    : "border-slate-200 hover:border-orange-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-white">
                    <UserRound size={19} />
                  </div>

                  <div>
                    <p className="font-black text-slate-950">
                      {staff.sellerName}
                    </p>

                    <p className="text-xs text-slate-500">
                      {staff.saleCount} satış
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-2xl font-black text-orange-500">
                  {staff.totalAmount.toFixed(2)} €
                </p>

                <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold text-slate-500">
                  <span>{t.cash}: {staff.cashAmount.toFixed(2)} €</span>

                  <span>{t.card}: {staff.cardAmount.toFixed(2)} €</span>

                  <span>Açık: {staff.openAmount.toFixed(2)} €</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-[28px] bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-lg">
              <Search
                size={19}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 outline-none focus:border-orange-500"
              />
            </div>

            {selectedSeller !== "ALL" ? (
              <button
                type="button"
                onClick={() => setSelectedSeller("ALL")}
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-700 hover:border-orange-500 hover:text-orange-500"
              >
                Tüm personelleri göster
              </button>
            ) : null}
          </div>

          <p className="mt-4 text-sm font-bold text-slate-500">
            {language === "de" ? `${filteredSales.length} Barverkäufe werden angezeigt` : `${filteredSales.length} bar satışı gösteriliyor`}
          </p>

          <div className="mt-4 space-y-3">
            {filteredSales.map((sale) => {
              const expanded = expandedSaleId === sale.id;

              return (
                <article
                  key={sale.id}
                  className="overflow-hidden rounded-2xl border border-slate-200"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedSaleId(expanded ? null : sale.id)}
                    className="grid w-full gap-4 p-4 text-left md:grid-cols-[1.15fr_1fr_1fr_1fr_auto] md:items-center"
                  >
                    <div>
                      <p className="text-xs font-bold text-orange-500">
                        {sale.orderNumber}
                      </p>

                      <p className="mt-1 font-black text-slate-950">
                        {sale.sellerName}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {formatDate(sale.createdAt)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-bold text-slate-400">
                        {language === "de" ? "Verkauft an" : "Satış Yapılan"}
                      </p>

                      <p className="mt-1 font-black text-slate-950">
                        {sale.customer.name}
                      </p>

                      {sale.paymentStatus === "OPEN" ? (
                        <p className="mt-1 text-xs font-black text-red-600">
                          Ödenmedi
                        </p>
                      ) : (
                        <p className="mt-1 text-xs font-bold text-green-600">
                          Ödendi
                        </p>
                      )}
                    </div>

                    <div>
                      <p className="text-xs font-bold text-slate-400">{t.product}</p>

                      <p className="mt-1 font-black text-slate-950">
                        {sale.items.reduce(
                          (total, item) => total + item.quantity,
                          0,
                        )}{" "}
                        adet
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-bold text-slate-400">{t.payment}</p>

                      <p className="mt-1 font-black text-slate-950">
                        {sale.paymentMethod}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-4 md:justify-end">
                      <strong className="text-xl text-slate-950">
                        {sale.totalAmount.toFixed(2)} €
                      </strong>

                      {expanded ? (
                        <ChevronUp size={20} />
                      ) : (
                        <ChevronDown size={20} />
                      )}
                    </div>
                  </button>

                  {expanded ? (
                    <div className="border-t border-slate-200 bg-slate-50 p-4">
                      <div className="grid gap-5 lg:grid-cols-2">
                        <div>
                          <h3 className="font-black text-slate-950">
                            {language === "de" ? "Verkaufte Produkte" : "Satılan Ürünler"}
                          </h3>

                          <div className="mt-3 space-y-2">
                            {sale.items.map((item) => (
                              <div
                                key={item.id}
                                className="flex justify-between gap-4 rounded-xl bg-white p-3"
                              >
                                <div>
                                  <p className="font-bold text-slate-950">
                                    {item.name}
                                  </p>

                                  <p className="mt-1 text-xs text-slate-500">
                                    {item.quantity} × {item.price.toFixed(2)} €
                                  </p>
                                </div>

                                <strong>{item.lineTotal.toFixed(2)} €</strong>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="rounded-2xl bg-white p-4">
                          <h3 className="font-black text-slate-950">
                            {language === "de" ? "Verkaufsübersicht" : "Satış Özeti"}
                          </h3>

                          <div className="mt-4 space-y-2 text-sm">
                            <div className="rounded-xl bg-slate-50 p-3">
                              <p className="text-xs font-bold text-slate-400">
                                {language === "de" ? "Kunde" : "Satış yapılan müşteri"}
                              </p>

                              <p className="mt-1 font-black text-slate-950">
                                {sale.customer.name}
                              </p>

                              {sale.customer.phone ? (
                                <p className="mt-1 text-xs text-slate-500">
                                  Tel: {sale.customer.phone}
                                </p>
                              ) : null}

                              {sale.customer.email ? (
                                <p className="mt-1 text-xs text-slate-500">
                                  {sale.customer.email}
                                </p>
                              ) : null}

                              {sale.paymentStatus === "OPEN" ? (
                                <div className="mt-2 flex justify-between rounded-lg bg-red-50 px-3 py-2 text-red-700">
                                  <span className="font-black">{t.openAmount}</span>

                                  <strong>
                                    {sale.totalAmount.toFixed(2)} €
                                  </strong>
                                </div>
                              ) : null}
                            </div>

                            <div className="flex justify-between">
                              <span>{t.subtotal}</span>

                              <strong>{sale.subtotal.toFixed(2)} €</strong>
                            </div>

                            <div className="flex justify-between">
                              <span>{t.newPfand}</span>

                              <strong>{sale.newPfand.toFixed(2)} €</strong>
                            </div>

                            <div className="flex justify-between text-green-700">
                              <span>{t.returnedPfand}</span>

                              <strong>
                                -{sale.pfandReturnAmount.toFixed(2)} €
                              </strong>
                            </div>

                            <div className="flex justify-between border-t border-slate-200 pt-2 text-base">
                              <span className="font-black">{t.receivedAmount}</span>

                              <strong>{sale.totalAmount.toFixed(2)} €</strong>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
