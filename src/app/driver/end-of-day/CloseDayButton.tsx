"use client";

import { useLanguage } from "@/context/LanguageContext";
import { Loader2 } from "lucide-react";
import { useState } from "react";

type Summary = {
  totalSales: number;
  cash: number;
  card: number;
  open: number;
  pfand: number;
  orderCount: number;
};

function formatEuro(value: number) {
  return value.toLocaleString("de-DE", {
    style: "currency",
    currency: "EUR",
  });
}

export default function CloseDayButton() {
  const { language } = useLanguage();

  const t =
    language === "de"
      ? {
          closeDay: "Tag abschließen",
          notPrepared: "Tagesabschluss konnte nicht vorbereitet werden.",
          prepareError:
            "Beim Vorbereiten des Tagesabschlusses ist ein Fehler aufgetreten.",
          orders: "Bestellungen",
          totalSales: "Gesamtumsatz",
          cash: "Bar",
          card: "Karte",
          pfand: "Pfand",
          openAccount: "Offene Rechnung",
        }
      : {
          closeDay: "Gün Sonunu Kapat",
          notPrepared: "Gün sonu hazırlanamadı.",
          prepareError: "Gün sonu hazırlanırken hata oluştu.",
          orders: "sipariş",
          totalSales: "Toplam Satış",
          cash: "Nakit",
          card: "Kart",
          pfand: "Pfand",
          openAccount: "Açık Hesap",
        };

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<Summary | null>(null);

  async function closeDay() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/driver/end-of-day", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t.notPrepared);
        return;
      }

      setSummary(data);
    } catch {
      setError(t.prepareError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-8">
      <button
        type="button"
        onClick={closeDay}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-green-600 py-4 text-center text-xl font-black text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? <Loader2 className="animate-spin" /> : null}
        {t.closeDay}
      </button>

      {error ? (
        <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-600">
          {error}
        </p>
      ) : null}

      {summary ? (
        <div className="mt-4 rounded-2xl bg-slate-950 p-6 text-white">
          <p className="text-sm font-bold text-slate-400">
            {summary.orderCount} {t.orders}
          </p>

          <div className="mt-3 grid gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">{t.totalSales}</span>
              <strong>{formatEuro(summary.totalSales)}</strong>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-400">{t.cash}</span>
              <strong>{formatEuro(summary.cash)}</strong>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-400">{t.card}</span>
              <strong>{formatEuro(summary.card)}</strong>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-400">{t.pfand}</span>
              <strong>{formatEuro(summary.pfand)}</strong>
            </div>

            <div className="flex justify-between border-t border-white/10 pt-2">
              <span className="text-slate-400">{t.openAccount}</span>
              <strong>{formatEuro(summary.open)}</strong>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
