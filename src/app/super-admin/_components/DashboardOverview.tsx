"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  PackageCheck,
  Recycle,
  Users,
} from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";

import { useLanguage } from "@/context/LanguageContext";

import ResetSalesButton from "./ResetSalesButton";

export type DashboardStats = {
  totalCustomers: number;
  totalRevenue: number;
  totalOrders: number;
  pfandReturnsCount: number;
  pfandReturnsAmount: number;
  dailyRevenue: { date: string; cost: number; revenue: number }[];
  categoryBreakdown: { label: { de: string; tr: string }; amount: number }[];
  cityBreakdown: { city: string; amount: number }[];
  customerTypeBreakdown: { private: number; business: number };
};

const DONUT_COLORS = [
  "#f97316", // orange-500
  "#0ea5e9", // sky-500
  "#10b981", // emerald-500
  "#8b5cf6", // violet-500
  "#f43f5e", // rose-500
  "#eab308", // yellow-500
];

function formatEuro(value: number) {
  return value.toLocaleString("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });
}

function formatNumber(value: number) {
  return value.toLocaleString("de-DE");
}

function weekdayLabel(dateKey: string, language: "de" | "tr") {
  const date = new Date(`${dateKey}T00:00:00`);

  return date.toLocaleDateString(language === "de" ? "de-DE" : "tr-TR", {
    day: "2-digit",
    month: "2-digit",
  });
}

export default function DashboardOverview({
  stats,
}: {
  stats: DashboardStats;
}) {
  const { language } = useLanguage();

  const [hoveredBar, setHoveredBar] = useState<{
    date: string;
    series: "cost" | "revenue";
  } | null>(null);

  const revenueScrollRef = useRef<HTMLDivElement>(null);

  /*
   * Der Chart zeigt immer die letzten 14 Tage, heute ist der letzte
   * (rechteste) Balken. Auf schmalen Bildschirmen ist die Reihe breiter
   * als der sichtbare Bereich, deshalb direkt zum aktuellen Tag scrollen
   * statt beim ältesten Tag zu starten.
   */
  useLayoutEffect(() => {
    const el = revenueScrollRef.current;

    if (el) {
      el.scrollLeft = el.scrollWidth;
    }
  }, [stats.dailyRevenue]);

  const t =
    language === "de"
      ? {
          eyebrow: "Systemverwaltung",
          title: "Super-Administrator",
          subtitle: "Systemverwaltung und alle Admin-Berechtigungen.",
          totalCustomers: "Gesamtkunden",
          totalRevenue: "Gesamtumsatz",
          totalOrders: "Gesamtbestellungen",
          pfandReturns: "Pfand-Rückgaben",
          revenueOverTime: "Umsatz-Verlauf",
          revenueOverTimeSubtitle: "Letzte 14 Tage",
          purchasePrice: "Einkaufspreis",
          salePrice: "Verkaufspreis",
          salesByCategory: "Umsatz nach Kategorie",
          salesByCategorySubtitle: "Letzte 30 Tage",
          salesByCity: "Umsatz nach Stadt",
          salesByCitySubtitle: "Letzte 30 Tage, nach Standardadresse",
          salesByCustomerType: "Umsatz nach Kundentyp",
          salesByCustomerTypeSubtitle: "Letzte 30 Tage",
          privateCustomers: "Privatkunden",
          businessCustomers: "Firmenkunden",
          unknownCity: "Unbekannt",
          noData: "Noch keine Daten vorhanden.",
          today: "Heute",
        }
      : {
          eyebrow: "Sistem Yönetimi",
          title: "Süper Admin",
          subtitle: "Sistem yönetimi ve tüm yönetici yetkileri.",
          totalCustomers: "Toplam Müşteri",
          totalRevenue: "Toplam Ciro",
          totalOrders: "Toplam Sipariş",
          pfandReturns: "Pfand İadeleri",
          revenueOverTime: "Ciro Grafiği",
          revenueOverTimeSubtitle: "Son 14 gün",
          purchasePrice: "Alış Fiyatı",
          salePrice: "Satış Fiyatı",
          salesByCategory: "Kategoriye Göre Satış",
          salesByCategorySubtitle: "Son 30 gün",
          salesByCity: "Şehre Göre Satış",
          salesByCitySubtitle: "Son 30 gün, varsayılan adrese göre",
          salesByCustomerType: "Müşteri Tipine Göre Satış",
          salesByCustomerTypeSubtitle: "Son 30 gün",
          privateCustomers: "Bireysel Müşteriler",
          businessCustomers: "Firma Müşterileri",
          unknownCity: "Bilinmiyor",
          noData: "Henüz veri yok.",
          today: "Bugün",
        };

  const statCards = [
    {
      label: t.totalCustomers,
      value: formatNumber(stats.totalCustomers),
      icon: Users,
    },
    {
      label: t.totalRevenue,
      value: formatEuro(stats.totalRevenue),
      icon: Banknote,
    },
    {
      label: t.totalOrders,
      value: formatNumber(stats.totalOrders),
      icon: PackageCheck,
    },
    {
      label: t.pfandReturns,
      value: `${formatNumber(stats.pfandReturnsCount)} · ${formatEuro(stats.pfandReturnsAmount)}`,
      icon: Recycle,
    },
  ];

  const maxDailyRevenue = Math.max(
    1,
    ...stats.dailyRevenue.map((day) => Math.max(day.cost, day.revenue)),
  );

  const categoryTotal = stats.categoryBreakdown.reduce(
    (sum, entry) => sum + entry.amount,
    0,
  );

  const donutStops: string[] = [];
  let cumulativePercent = 0;

  stats.categoryBreakdown.forEach((entry, index) => {
    const percent = categoryTotal > 0 ? (entry.amount / categoryTotal) * 100 : 0;
    const color = DONUT_COLORS[index % DONUT_COLORS.length];
    const start = cumulativePercent;
    const end = cumulativePercent + percent;

    donutStops.push(`${color} ${start}% ${end}%`);
    cumulativePercent = end;
  });

  const donutGradient =
    donutStops.length > 0
      ? `conic-gradient(${donutStops.join(", ")})`
      : "conic-gradient(#e2e8f0 0% 100%)";

  const maxCityRevenue = Math.max(
    1,
    ...stats.cityBreakdown.map((entry) => entry.amount),
  );

  const topCities = stats.cityBreakdown.slice(0, 5);

  const customerTypeTotal =
    stats.customerTypeBreakdown.private + stats.customerTypeBreakdown.business;

  const privatePercent =
    customerTypeTotal > 0
      ? (stats.customerTypeBreakdown.private / customerTypeTotal) * 100
      : 0;

  const businessPercent = customerTypeTotal > 0 ? 100 - privatePercent : 0;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="relative rounded-3xl bg-slate-950 p-8 text-white lg:min-h-[260px] lg:pr-[420px]">
        <p className="font-bold text-orange-400">{t.eyebrow}</p>

        <h1 className="mt-2 text-4xl font-black">{t.title}</h1>

        <p className="mt-3 text-slate-400">{t.subtitle}</p>

        <ResetSalesButton />
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.label}
              className="rounded-3xl bg-white p-6 shadow-sm"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
                <Icon size={20} />
              </div>

              <p className="mt-4 text-xs font-black uppercase tracking-wide text-slate-400">
                {card.label}
              </p>

              <p className="mt-1 text-2xl font-black text-slate-950">
                {card.value}
              </p>
            </div>
          );
        })}
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-slate-950">
              {t.revenueOverTime}
            </h2>

            <span className="text-xs font-bold text-slate-400">
              {t.revenueOverTimeSubtitle}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
              <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
              {t.purchasePrice}
            </span>

            <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
              <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
              {t.salePrice}
            </span>
          </div>
        </div>

        {stats.dailyRevenue.every((day) => day.cost === 0 && day.revenue === 0) ? (
          <p className="mt-8 text-sm font-bold text-slate-400">{t.noData}</p>
        ) : (
          <div ref={revenueScrollRef} className="mt-12 overflow-x-auto">
          <div className="flex h-48 min-w-[700px] items-stretch gap-2 sm:gap-3">
            {stats.dailyRevenue.map((day, index) => {
              const isToday = index === stats.dailyRevenue.length - 1;

              const costHeightPercent = Math.max(
                2,
                (day.cost / maxDailyRevenue) * 100,
              );

              const revenueHeightPercent = Math.max(
                2,
                (day.revenue / maxDailyRevenue) * 100,
              );

              const previousDay = stats.dailyRevenue[index - 1];

              const isHoveredHere =
                hoveredBar !== null && hoveredBar.date === day.date;

              const hoveredValue = hoveredBar
                ? hoveredBar.series === "cost"
                  ? day.cost
                  : day.revenue
                : 0;

              const previousValue = hoveredBar
                ? hoveredBar.series === "cost"
                  ? previousDay?.cost
                  : previousDay?.revenue
                : undefined;

              const trendPercent =
                previousValue !== undefined && previousValue > 0
                  ? ((hoveredValue - previousValue) / previousValue) * 100
                  : null;

              // Klemmt die Tooltip-Position, damit sie bei sehr hohen
              // Balken nicht in die Legende/Überschrift hineinragt.
              const hoveredHeightPercent = hoveredBar
                ? Math.min(
                    hoveredBar.series === "cost"
                      ? costHeightPercent
                      : revenueHeightPercent,
                    70,
                  )
                : 0;

              const horizontalAnchor =
                index <= 1
                  ? "left-0"
                  : index >= stats.dailyRevenue.length - 2
                    ? "right-0"
                    : "left-1/2 -translate-x-1/2";

              return (
                <div
                  key={day.date}
                  className={`flex flex-1 flex-col items-center gap-2 rounded-2xl pt-2 ${
                    isToday ? "bg-orange-50" : ""
                  }`}
                >
                  <div className="relative flex w-full flex-1 items-end justify-center gap-1">
                    {isHoveredHere && hoveredBar ? (
                      <div
                        style={{
                          bottom: `calc(${hoveredHeightPercent}% + 10px)`,
                        }}
                        className={`pointer-events-none absolute z-20 w-max max-w-[200px] rounded-xl bg-white px-4 py-3 shadow-xl ring-1 ring-slate-900/10 ${horizontalAnchor}`}
                      >
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{
                              backgroundColor:
                                hoveredBar.series === "cost"
                                  ? "#0ea5e9"
                                  : "#f97316",
                            }}
                          />
                          {hoveredBar.series === "cost"
                            ? t.purchasePrice
                            : t.salePrice}
                        </div>

                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-base font-black text-slate-950">
                            {formatEuro(hoveredValue)}
                          </span>

                          {trendPercent !== null ? (
                            <span
                              className={`flex items-center gap-0.5 text-xs font-bold ${
                                trendPercent >= 0
                                  ? "text-emerald-600"
                                  : "text-red-500"
                              }`}
                            >
                              {trendPercent >= 0 ? (
                                <ArrowUpRight size={13} />
                              ) : (
                                <ArrowDownRight size={13} />
                              )}
                              {Math.abs(trendPercent).toFixed(1)}%
                            </span>
                          ) : null}
                        </div>
                      </div>
                    ) : null}

                    <div
                      onMouseEnter={() =>
                        setHoveredBar({ date: day.date, series: "cost" })
                      }
                      onMouseLeave={() => setHoveredBar(null)}
                      style={{ height: `${costHeightPercent}%` }}
                      className="w-2.5 rounded-t-md bg-sky-500 transition-all hover:brightness-110 sm:w-3"
                    />

                    <div
                      onMouseEnter={() =>
                        setHoveredBar({ date: day.date, series: "revenue" })
                      }
                      onMouseLeave={() => setHoveredBar(null)}
                      style={{ height: `${revenueHeightPercent}%` }}
                      className="w-2.5 rounded-t-md bg-orange-500 transition-all hover:brightness-110 sm:w-3"
                    />
                  </div>

                  <span
                    className={`pb-2 text-[10px] font-bold ${
                      isToday ? "text-orange-600" : "text-slate-400"
                    }`}
                  >
                    {isToday ? t.today : weekdayLabel(day.date, language)}
                  </span>
                </div>
              );
            })}
          </div>
          </div>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-black text-slate-950">
              {t.salesByCategory}
            </h2>
          </div>

          <span className="text-xs font-bold text-slate-400">
            {t.salesByCategorySubtitle}
          </span>

          {stats.categoryBreakdown.length === 0 ? (
            <p className="mt-8 text-sm font-bold text-slate-400">{t.noData}</p>
          ) : (
            <div className="mt-6 flex items-center gap-6">
              <div
                className="h-32 w-32 shrink-0 rounded-full"
                style={{
                  background: donutGradient,
                  WebkitMask:
                    "radial-gradient(farthest-side, transparent calc(100% - 18px), black calc(100% - 18px))",
                  mask: "radial-gradient(farthest-side, transparent calc(100% - 18px), black calc(100% - 18px))",
                }}
              />

              <ul className="min-w-0 flex-1 space-y-2.5">
                {stats.categoryBreakdown.map((entry, index) => {
                  const percent =
                    categoryTotal > 0
                      ? Math.round((entry.amount / categoryTotal) * 100)
                      : 0;

                  return (
                    <li
                      key={entry.label.de}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span className="flex min-w-0 items-center gap-2 font-bold text-slate-700">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{
                            backgroundColor:
                              DONUT_COLORS[index % DONUT_COLORS.length],
                          }}
                        />
                        <span className="truncate">{entry.label[language]}</span>
                      </span>

                      <span className="shrink-0 font-black text-slate-950">
                        {percent}%
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-black text-slate-950">
              {t.salesByCity}
            </h2>
          </div>

          <span className="text-xs font-bold text-slate-400">
            {t.salesByCitySubtitle}
          </span>

          {topCities.length === 0 ? (
            <p className="mt-8 text-sm font-bold text-slate-400">{t.noData}</p>
          ) : (
            <ul className="mt-6 space-y-3.5">
              {topCities.map((entry) => (
                <li key={entry.city}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold text-slate-700">
                      {entry.city === "__unknown__" ? t.unknownCity : entry.city}
                    </span>

                    <span className="font-black text-slate-950">
                      {formatEuro(entry.amount)}
                    </span>
                  </div>

                  <div className="mt-1.5 h-1.5 rounded-full bg-slate-100">
                    <div
                      style={{
                        width: `${Math.max(4, (entry.amount / maxCityRevenue) * 100)}%`,
                      }}
                      className="h-1.5 rounded-full bg-orange-500"
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-black text-slate-950">
              {t.salesByCustomerType}
            </h2>
          </div>

          <span className="text-xs font-bold text-slate-400">
            {t.salesByCustomerTypeSubtitle}
          </span>

          {customerTypeTotal === 0 ? (
            <p className="mt-8 text-sm font-bold text-slate-400">{t.noData}</p>
          ) : (
            <div className="mt-6 space-y-5">
              <div className="flex h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  style={{ width: `${privatePercent}%` }}
                  className="h-full bg-orange-500"
                />
                <div
                  style={{ width: `${businessPercent}%` }}
                  className="h-full bg-slate-950"
                />
              </div>

              <div className="space-y-3.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 font-bold text-slate-700">
                    <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
                    {t.privateCustomers}
                  </span>

                  <span className="font-black text-slate-950">
                    {formatEuro(stats.customerTypeBreakdown.private)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 font-bold text-slate-700">
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-950" />
                    {t.businessCustomers}
                  </span>

                  <span className="font-black text-slate-950">
                    {formatEuro(stats.customerTypeBreakdown.business)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
