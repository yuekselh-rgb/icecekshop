"use client";

import { useLanguage } from "@/context/LanguageContext";
import {
  ArrowLeft,
  HandCoins,
  Loader2,
  Printer,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type ReportMode = "day" | "month" | "range";

type CashMovementRow = {
  id: string;
  accountType: "BAR" | "GENERAL" | "PFAND";
  direction: "IN" | "OUT";
  category: string;
  amount: number;
  companyName: string | null;
  description: string | null;
  supplierName: string | null;
  createdAt: string;
  orderId: string | null;
  createdBy: {
    name: string | null;
  };
};

type OpenOrderRow = {
  id: string;
  orderNumber: string;
  createdAt: string;
  customerName: string;
  openPaymentAmount: number;
  settledAfterPeriod: boolean;
};

type ReportData = {
  period: {
    mode: ReportMode;
    startDate: string;
    endDate: string;
  };
  income: {
    total: number;
    byCategory: Record<string, number>;
  };
  expense: {
    total: number;
    byCategory: Record<string, number>;
  };
  net: number;
  openAccount: {
    total: number;
    orderCount: number;
    orders: OpenOrderRow[];
  };
  movements: CashMovementRow[];
  permissions: {
    createCashHandover?: boolean;
    [key: string]: boolean | undefined;
  };
};

function formatEuro(value: number) {
  return value.toLocaleString("de-DE", {
    style: "currency",
    currency: "EUR",
  });
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function CashReportPage() {
  const { language } = useLanguage();

  const t =
    language === "de"
      ? {
          back: "Adminbereich",
          title: "Kassenbericht",
          subtitle: "Z-Bericht: Einnahmen, Ausgaben und offene Rechnungen für Tag, Monat oder Zeitraum.",
          day: "Tag",
          month: "Monat",
          range: "Zeitraum",
          date: "Datum",
          from: "Von",
          to: "Bis",
          print: "Drucken",
          loading: "Wird geladen...",
          loadError: "Kassenbericht konnte nicht geladen werden.",
          totalIncome: "Gesamteinnahmen",
          totalExpense: "Gesamtausgaben",
          net: "Nettokasse",
          openAccount: "Offene Rechnung",
          orderCount: (count: number) => `${count} Bestellung(en)`,
          incomeByCategory: "Einnahmen nach Kategorie",
          expenseByCategory: "Ausgaben nach Kategorie",
          noIncome: "Keine Einnahmen in diesem Zeitraum.",
          noExpense: "Keine Ausgaben in diesem Zeitraum.",
          openAccountOrders: "Offene Bestellungen",
          noOpenAccountOrders: "Keine offenen Bestellungen in diesem Zeitraum.",
          settledAfterPeriod: "Inzwischen bezahlt",
          settledOpenAccount: "Beglichene offene Rechnung",
          orderNumber: "Bestellnr.",
          customer: "Kunde",
          amount: "Betrag",
          movements: "Kassenbewegungen",
          noMovements: "Keine Kassenbewegungen in diesem Zeitraum.",
          dateTime: "Datum",
          account: "Konto",
          category: "Kategorie",
          description: "Beschreibung",
          staff: "Personal",
          accountLabels: {
            BAR: "Bar",
            GENERAL: "Allgemein",
            PFAND: "Pfand",
          } as Record<string, string>,
          categoryLabels: {
            BAR_SALE: "Barverkauf",
            PFAND_COLLECTION: "Pfandrücknahme",
            SUPPLIER_PAYMENT: "Lieferantenzahlung",
            GOODS_PURCHASE: "Wareneinkauf",
            FUEL: "Kraftstoff",
            PERSONNEL: "Personal",
            RENT: "Miete",
            MANUAL_INCOME: "Manuelle Einnahme",
            OTHER_EXPENSE: "Sonstige Ausgaben",
            CASH_HANDOVER: "Kassenübergabe",
          } as Record<string, string>,
          months: [
            "Januar", "Februar", "März", "April", "Mai", "Juni",
            "Juli", "August", "September", "Oktober", "November", "Dezember",
          ],
          handoverButton: "Kassenübergabe erfassen",
          handoverTitle: "Kassenübergabe erfassen",
          handoverDescription:
            "Wie viel Bargeld übergeben Sie und an wen? Der Betrag wird sofort aus der Kasse gebucht.",
          handoverAmount: "Übergebener Betrag (€)",
          handoverRecipient: "Übergeben an",
          handoverRecipientPlaceholder: "Name der Person",
          handoverNote: "Notiz (optional)",
          handoverCancel: "Abbrechen",
          handoverSubmit: "Übergabe erfassen",
          handoverSaving: "Wird gespeichert...",
          handoverSuccess: "Kassenübergabe wurde erfasst.",
          handoverAmountError: "Bitte geben Sie einen gültigen Betrag ein.",
          handoverRecipientError: "Bitte geben Sie an, wer die Kasse erhalten hat.",
          handoverGenericError: "Kassenübergabe konnte nicht gespeichert werden.",
        }
      : {
          back: "Admin Paneli",
          title: "Kasa Raporu",
          subtitle: "Z Raporu: Günlük, aylık veya tarih aralıklı gelir, gider ve veresiye özeti.",
          day: "Gün",
          month: "Ay",
          range: "Tarih Aralığı",
          date: "Tarih",
          from: "Başlangıç",
          to: "Bitiş",
          print: "Yazdır",
          loading: "Yükleniyor...",
          loadError: "Kasa raporu yüklenemedi.",
          totalIncome: "Toplam Gelir",
          totalExpense: "Toplam Gider",
          net: "Net Kasa",
          openAccount: "Veresiye",
          orderCount: (count: number) => `${count} sipariş`,
          incomeByCategory: "Kategoriye Göre Gelir",
          expenseByCategory: "Kategoriye Göre Gider",
          noIncome: "Bu dönemde gelir bulunmuyor.",
          noExpense: "Bu dönemde gider bulunmuyor.",
          openAccountOrders: "Açık Hesap Siparişleri",
          noOpenAccountOrders: "Bu dönemde açık hesap siparişi bulunmuyor.",
          settledAfterPeriod: "Daha sonra ödendi",
          settledOpenAccount: "Kapatılan açık hesap",
          orderNumber: "Sipariş No",
          customer: "Müşteri",
          amount: "Tutar",
          movements: "Kasa Hareketleri",
          noMovements: "Bu dönemde kasa hareketi bulunmuyor.",
          dateTime: "Tarih",
          account: "Hesap",
          category: "Kategori",
          description: "Açıklama",
          staff: "Personel",
          accountLabels: {
            BAR: "Bar",
            GENERAL: "Genel",
            PFAND: "Pfand",
          } as Record<string, string>,
          categoryLabels: {
            BAR_SALE: "Bar Satışı",
            PFAND_COLLECTION: "Pfand Tahsilatı",
            SUPPLIER_PAYMENT: "Tedarikçi Ödemesi",
            GOODS_PURCHASE: "Mal Alımı",
            FUEL: "Yakıt",
            PERSONNEL: "Personel",
            RENT: "Kira",
            MANUAL_INCOME: "Manuel Gelir",
            OTHER_EXPENSE: "Diğer Gider",
            CASH_HANDOVER: "Kasa Devri",
          } as Record<string, string>,
          months: [
            "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
            "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
          ],
          handoverButton: "Kasa Devri Kaydet",
          handoverTitle: "Kasa Devri Kaydet",
          handoverDescription:
            "Ne kadar nakit devrediyorsunuz ve kime? Tutar hemen kasadan düşülecek.",
          handoverAmount: "Devredilen Tutar (€)",
          handoverRecipient: "Kime Devredildi",
          handoverRecipientPlaceholder: "Kişinin adı",
          handoverNote: "Not (opsiyonel)",
          handoverCancel: "Vazgeç",
          handoverSubmit: "Devri Kaydet",
          handoverSaving: "Kaydediliyor...",
          handoverSuccess: "Kasa devri kaydedildi.",
          handoverAmountError: "Lütfen geçerli bir tutar girin.",
          handoverRecipientError: "Lütfen kasayı kime devrettiğinizi belirtin.",
          handoverGenericError: "Kasa devri kaydedilemedi.",
        };

  const today = useMemo(() => new Date(), []);

  const [mode, setMode] = useState<ReportMode>("day");
  const [selectedDate, setSelectedDate] = useState(toDateInputValue(today));
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
  const [startDate, setStartDate] = useState(toDateInputValue(today));
  const [endDate, setEndDate] = useState(toDateInputValue(today));

  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({ mode });

      if (mode === "day") {
        params.set("date", selectedDate);
      } else if (mode === "month") {
        params.set("year", String(selectedYear));
        params.set("month", String(selectedMonth));
      } else {
        params.set("startDate", startDate);
        params.set("endDate", endDate);
      }

      const response = await fetch(`/api/admin/cash-report?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t.loadError);
        return;
      }

      setReport(data);
    } catch {
      setError(t.loadError);
    } finally {
      setLoading(false);
    }
  }, [mode, selectedDate, selectedYear, selectedMonth, startDate, endDate]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const [showHandoverModal, setShowHandoverModal] = useState(false);
  const [handoverAmount, setHandoverAmount] = useState("");
  const [handoverRecipient, setHandoverRecipient] = useState("");
  const [handoverNote, setHandoverNote] = useState("");
  const [handoverSubmitting, setHandoverSubmitting] = useState(false);
  const [handoverError, setHandoverError] = useState("");

  function openHandoverModal() {
    setHandoverAmount("");
    setHandoverRecipient("");
    setHandoverNote("");
    setHandoverError("");
    setShowHandoverModal(true);
  }

  async function submitHandover() {
    const amount = Number(handoverAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setHandoverError(t.handoverAmountError);
      return;
    }

    if (!handoverRecipient.trim()) {
      setHandoverError(t.handoverRecipientError);
      return;
    }

    setHandoverSubmitting(true);
    setHandoverError("");

    try {
      const response = await fetch("/api/admin/bar-cash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          direction: "OUT",
          category: "CASH_HANDOVER",
          amount,
          companyName: handoverRecipient.trim(),
          description: handoverNote.trim(),
          idempotencyKey:
            typeof crypto !== "undefined" && "randomUUID" in crypto
              ? crypto.randomUUID()
              : `handover-${Date.now()}-${Math.random()}`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setHandoverError(data.error || t.handoverGenericError);
        return;
      }

      setShowHandoverModal(false);
      await loadReport();
    } catch {
      setHandoverError(t.handoverGenericError);
    } finally {
      setHandoverSubmitting(false);
    }
  }

  const incomeCategories = report
    ? Object.entries(report.income.byCategory).sort((a, b) => b[1] - a[1])
    : [];

  const expenseCategories = report
    ? Object.entries(report.expense.byCategory).sort((a, b) => b[1] - a[1])
    : [];

  return (
    <main className="min-h-screen bg-slate-100 p-5 lg:p-8 print:bg-white print:p-0">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 print:hidden">
          <div>
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-orange-500"
            >
              <ArrowLeft size={17} />
              {t.back}
            </Link>

            <h1 className="mt-3 text-4xl font-black text-slate-950">
              {t.title}
            </h1>

            <p className="mt-2 text-slate-500">{t.subtitle}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {report?.permissions?.createCashHandover ? (
              <button
                type="button"
                onClick={openHandoverModal}
                className="inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-5 py-3 font-black text-white transition hover:bg-orange-600"
              >
                <HandCoins size={18} />
                {t.handoverButton}
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 font-black text-white transition hover:bg-slate-800"
            >
              <Printer size={18} />
              {t.print}
            </button>
          </div>
        </div>

        <div className="hidden print:mb-6 print:block">
          <h1 className="text-2xl font-black text-slate-950">{t.title}</h1>
          {report ? (
            <p className="mt-1 text-sm text-slate-600">
              {new Date(report.period.startDate).toLocaleDateString("de-DE")}
              {" – "}
              {new Date(report.period.endDate).toLocaleDateString("de-DE")}
            </p>
          ) : null}
        </div>

        <div className="mb-6 rounded-[28px] bg-white p-5 shadow-sm print:hidden">
          <div className="flex flex-wrap gap-2">
            {(["day", "month", "range"] as ReportMode[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setMode(option)}
                className={`rounded-xl border px-4 py-2 text-sm font-black transition ${
                  mode === option
                    ? "border-orange-500 bg-orange-50 text-orange-600"
                    : "border-slate-200 text-slate-600"
                }`}
              >
                {option === "day" ? t.day : option === "month" ? t.month : t.range}
              </button>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-end gap-4">
            {mode === "day" ? (
              <label className="flex flex-col gap-1">
                <span className="text-xs font-black uppercase text-slate-500">
                  {t.date}
                </span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(event) => setSelectedDate(event.target.value)}
                  className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-orange-500"
                />
              </label>
            ) : null}

            {mode === "month" ? (
              <>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-black uppercase text-slate-500">
                    {t.month}
                  </span>
                  <select
                    value={selectedMonth}
                    onChange={(event) => setSelectedMonth(Number(event.target.value))}
                    className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-orange-500"
                  >
                    {t.months.map((label, index) => (
                      <option key={label} value={index + 1}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-xs font-black uppercase text-slate-500">
                    {language === "de" ? "Jahr" : "Yıl"}
                  </span>
                  <input
                    type="number"
                    value={selectedYear}
                    onChange={(event) => setSelectedYear(Number(event.target.value))}
                    className="w-28 rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-orange-500"
                  />
                </label>
              </>
            ) : null}

            {mode === "range" ? (
              <>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-black uppercase text-slate-500">
                    {t.from}
                  </span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(event) => setStartDate(event.target.value)}
                    className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-orange-500"
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-xs font-black uppercase text-slate-500">
                    {t.to}
                  </span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(event) => setEndDate(event.target.value)}
                    className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-orange-500"
                  />
                </label>
              </>
            ) : null}
          </div>
        </div>

        {error ? (
          <div className="mb-6 rounded-2xl bg-red-50 p-4 font-bold text-red-600 print:hidden">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="flex items-center gap-3 rounded-[28px] bg-white p-7 font-bold text-slate-500 print:hidden">
            <Loader2 className="animate-spin" />
            {t.loading}
          </div>
        ) : report ? (
          <>
            <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 print:grid-cols-4 print:gap-2">
              <div className="rounded-2xl border border-green-200 bg-green-50 p-5 print:border print:border-slate-300 print:bg-white">
                <div className="flex items-center gap-2 text-xs font-black uppercase text-green-700 print:text-slate-600">
                  <TrendingUp size={16} />
                  {t.totalIncome}
                </div>
                <p className="mt-2 text-2xl font-black text-green-800 print:text-slate-950">
                  {formatEuro(report.income.total)}
                </p>
              </div>

              <div className="rounded-2xl border border-red-200 bg-red-50 p-5 print:border print:border-slate-300 print:bg-white">
                <div className="flex items-center gap-2 text-xs font-black uppercase text-red-700 print:text-slate-600">
                  <TrendingDown size={16} />
                  {t.totalExpense}
                </div>
                <p className="mt-2 text-2xl font-black text-red-800 print:text-slate-950">
                  {formatEuro(report.expense.total)}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-center gap-2 text-xs font-black uppercase text-slate-600">
                  <Wallet size={16} />
                  {t.net}
                </div>
                <p className="mt-2 text-2xl font-black text-slate-950">
                  {formatEuro(report.net)}
                </p>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 print:border print:border-slate-300 print:bg-white">
                <div className="text-xs font-black uppercase text-amber-700 print:text-slate-600">
                  {t.openAccount}
                </div>
                <p className="mt-2 text-2xl font-black text-amber-800 print:text-slate-950">
                  {formatEuro(report.openAccount.total)}
                </p>
                <p className="mt-1 text-xs font-bold text-amber-700 print:text-slate-500">
                  {t.orderCount(report.openAccount.orderCount)}
                </p>
              </div>
            </div>

            <div className="mb-6 grid gap-4 lg:grid-cols-2">
              <div className="rounded-[28px] bg-white p-5 shadow-sm print:border print:border-slate-300 print:shadow-none">
                <h2 className="mb-3 text-lg font-black text-slate-950">
                  {t.incomeByCategory}
                </h2>

                {incomeCategories.length === 0 ? (
                  <p className="text-sm text-slate-500">{t.noIncome}</p>
                ) : (
                  <table className="w-full text-left text-sm">
                    <tbody>
                      {incomeCategories.map(([category, amount]) => (
                        <tr key={category} className="border-t border-slate-100">
                          <td className="py-2 text-slate-600">
                            {t.categoryLabels[category] || category}
                          </td>
                          <td className="py-2 text-right font-black text-slate-950">
                            {formatEuro(amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="rounded-[28px] bg-white p-5 shadow-sm print:border print:border-slate-300 print:shadow-none">
                <h2 className="mb-3 text-lg font-black text-slate-950">
                  {t.expenseByCategory}
                </h2>

                {expenseCategories.length === 0 ? (
                  <p className="text-sm text-slate-500">{t.noExpense}</p>
                ) : (
                  <table className="w-full text-left text-sm">
                    <tbody>
                      {expenseCategories.map(([category, amount]) => (
                        <tr key={category} className="border-t border-slate-100">
                          <td className="py-2 text-slate-600">
                            {t.categoryLabels[category] || category}
                          </td>
                          <td className="py-2 text-right font-black text-slate-950">
                            {formatEuro(amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div className="mb-6 rounded-[28px] bg-white p-5 shadow-sm print:border print:border-slate-300 print:shadow-none">
              <h2 className="mb-3 text-lg font-black text-slate-950">
                {t.openAccountOrders}
              </h2>

              {report.openAccount.orders.length === 0 ? (
                <p className="text-sm text-slate-500">{t.noOpenAccountOrders}</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {report.openAccount.orders.map((order) => (
                    <div
                      key={order.id}
                      className={`grid gap-1 py-3 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-4 ${
                        order.settledAfterPeriod
                          ? "-mx-5 bg-green-50/60 px-5"
                          : ""
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-bold text-slate-900">
                            {order.orderNumber}
                          </p>

                          {order.settledAfterPeriod ? (
                            <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-black uppercase text-green-700">
                              {t.settledAfterPeriod}
                            </span>
                          ) : null}
                        </div>

                        <p className="text-xs text-slate-500">
                          {new Date(order.createdAt).toLocaleString("de-DE")}
                          {" · "}
                          {order.customerName}
                        </p>
                      </div>

                      <p
                        className={`font-black sm:text-right ${
                          order.settledAfterPeriod
                            ? "text-green-700"
                            : "text-slate-950"
                        }`}
                      >
                        {formatEuro(order.openPaymentAmount)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-[28px] bg-white p-5 shadow-sm print:border print:border-slate-300 print:shadow-none">
              <h2 className="mb-3 text-lg font-black text-slate-950">
                {t.movements}
              </h2>

              {report.movements.length === 0 ? (
                <p className="text-sm text-slate-500">{t.noMovements}</p>
              ) : (
                <>
                  <div className="hidden overflow-x-auto sm:block">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 text-xs font-black uppercase text-slate-400">
                          <th className="py-2 pr-4">{t.dateTime}</th>
                          <th className="py-2 pr-4">{t.account}</th>
                          <th className="py-2 pr-4">{t.category}</th>
                          <th className="py-2 pr-4">{t.description}</th>
                          <th className="py-2 pr-4">{t.staff}</th>
                          <th className="py-2 text-right">{t.amount}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.movements.map((movement) => {
                          const isSettledOpenAccount =
                            movement.category === "MANUAL_INCOME" &&
                            movement.orderId !== null;

                          return (
                          <tr
                            key={movement.id}
                            className={`border-b border-slate-100 last:border-b-0 ${
                              isSettledOpenAccount ? "bg-green-50/60" : ""
                            }`}
                          >
                            <td className="py-2 pr-4 text-slate-600">
                              {new Date(movement.createdAt).toLocaleString("de-DE")}
                            </td>
                            <td className="py-2 pr-4 text-slate-600">
                              {t.accountLabels[movement.accountType] || movement.accountType}
                            </td>
                            <td className="py-2 pr-4 text-slate-600">
                              <div className="flex flex-wrap items-center gap-2">
                                {t.categoryLabels[movement.category] || movement.category}

                                {isSettledOpenAccount ? (
                                  <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-black uppercase text-green-700">
                                    {t.settledOpenAccount}
                                  </span>
                                ) : null}
                              </div>
                            </td>
                            <td className="py-2 pr-4 text-slate-500">
                              {movement.description || movement.companyName || movement.supplierName || "—"}
                            </td>
                            <td className="py-2 pr-4 text-slate-500">
                              {movement.createdBy.name || "—"}
                            </td>
                            <td
                              className={`py-2 text-right font-black ${
                                movement.direction === "IN"
                                  ? "text-green-700"
                                  : "text-red-700"
                              }`}
                            >
                              {movement.direction === "IN" ? "+" : "-"}
                              {formatEuro(movement.amount)}
                            </td>
                          </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="divide-y divide-slate-100 sm:hidden">
                    {report.movements.map((movement) => {
                      const isSettledOpenAccount =
                        movement.category === "MANUAL_INCOME" &&
                        movement.orderId !== null;

                      return (
                        <div
                          key={movement.id}
                          className={`py-3 ${
                            isSettledOpenAccount
                              ? "-mx-5 bg-green-50/60 px-5"
                              : ""
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs text-slate-500">
                              {new Date(movement.createdAt).toLocaleString("de-DE")}
                            </p>

                            <p
                              className={`shrink-0 font-black ${
                                movement.direction === "IN"
                                  ? "text-green-700"
                                  : "text-red-700"
                              }`}
                            >
                              {movement.direction === "IN" ? "+" : "-"}
                              {formatEuro(movement.amount)}
                            </p>
                          </div>

                          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                            <span className="font-bold text-slate-700">
                              {t.accountLabels[movement.accountType] || movement.accountType}
                            </span>

                            <span className="text-slate-300">·</span>

                            <span className="font-bold text-slate-700">
                              {t.categoryLabels[movement.category] || movement.category}
                            </span>

                            {isSettledOpenAccount ? (
                              <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-black uppercase text-green-700">
                                {t.settledOpenAccount}
                              </span>
                            ) : null}
                          </div>

                          <p className="mt-1 text-sm text-slate-600">
                            {movement.description || movement.companyName || movement.supplierName || "—"}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {movement.createdBy.name || "—"}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </>
        ) : null}
      </div>

      {showHandoverModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 print:hidden">
          <div className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                  <HandCoins size={22} />
                </div>

                <h2 className="text-xl font-black text-slate-950">
                  {t.handoverTitle}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setShowHandoverModal(false)}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <p className="mt-3 text-sm text-slate-500">
              {t.handoverDescription}
            </p>

            <label className="mt-5 block">
              <span className="text-xs font-black uppercase text-slate-500">
                {t.handoverAmount}
              </span>

              <input
                type="number"
                min={0}
                step={0.01}
                value={handoverAmount}
                onChange={(event) => setHandoverAmount(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-lg font-black outline-none focus:border-orange-500"
                placeholder="0,00"
                autoFocus
              />
            </label>

            <label className="mt-4 block">
              <span className="text-xs font-black uppercase text-slate-500">
                {t.handoverRecipient}
              </span>

              <input
                type="text"
                value={handoverRecipient}
                onChange={(event) => setHandoverRecipient(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-orange-500"
                placeholder={t.handoverRecipientPlaceholder}
              />
            </label>

            <label className="mt-4 block">
              <span className="text-xs font-black uppercase text-slate-500">
                {t.handoverNote}
              </span>

              <textarea
                value={handoverNote}
                onChange={(event) => setHandoverNote(event.target.value)}
                rows={2}
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-orange-500"
              />
            </label>

            {handoverError ? (
              <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-600">
                {handoverError}
              </p>
            ) : null}

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowHandoverModal(false)}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-3 font-black text-slate-600 transition hover:bg-slate-50"
              >
                {t.handoverCancel}
              </button>

              <button
                type="button"
                onClick={submitHandover}
                disabled={handoverSubmitting}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 font-black text-white transition hover:bg-orange-600 disabled:opacity-60"
              >
                {handoverSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    {t.handoverSaving}
                  </>
                ) : (
                  t.handoverSubmit
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
