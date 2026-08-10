"use client";

import { useLanguage } from "@/context/LanguageContext";

import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Loader2,
  Minus,
  Plus,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useState,
} from "react";

type PfandStatus =
  | "PENDING"
  | "APPROVED"
  | "PAID_CASH"
  | "DEDUCTED_FROM_ORDER"
  | "CANCELLED";

type PfandReturn = {
  id: string;
  status: PfandStatus;
  totalAmount: number;
  note: string | null;
  createdAt: string;

  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    companyName: string | null;
    phone: string | null;
  };

  approvedAmount: number | null;
  approvedAt: string | null;

  approvedBy: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    companyName: string | null;
  } | null;

  order: {
    id: string;
    orderNumber: string;

    driver: {
      id: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
      companyName: string | null;
      phone: string | null;
    } | null;
  } | null;

  warehouseMovement: {
    id: string;
    type: "IN" | "OUT" | "ADJUSTMENT";
    partyType: string;
    partyName: string | null;
    totalAmount: number;
    createdAt: string;
  } | null;

  items: Array<{
    id: string;
    name: string;
    quantity: number;
    originalQuantity: number | null;
    approvedQuantity: number | null;
    unitAmount: number;
    totalAmount: number;
    originalTotal: number | null;
    approvedTotal: number | null;
  }>;
};

type WarehouseSummary = {
  totalQuantity: number;
  totalValue: number;
  negativeStockCount: number;
  movementCount: number;

  items: Array<{
    key: string;
    name: string;
    unitAmount: number;
    quantity: number;
    totalValue: number;
    totalIn: number;
    totalOut: number;
  }>;
};

const statusLabels: Record<
  PfandStatus,
  string
> = {
  PENDING: "Bekliyor",
  APPROVED: "Onaylandı",
  PAID_CASH: "Nakit Ödendi",
  DEDUCTED_FROM_ORDER:
    "Siparişten Düşüldü",
  CANCELLED: "İptal Edildi",
};

export default function AdminPfandPage() {

  const { language } = useLanguage();

  const t =
    language === "de"
      ? {
          pending: "Ausstehend",
          approved: "Genehmigt",
          paidCash: "Bar bezahlt",
          deductedFromOrder: "Von Bestellung abgezogen",
          cancelled: "Storniert",
        }
      : {
          pending: "Bekliyor",
          approved: "Onaylandı",
          paidCash: "Nakit Ödendi",
          deductedFromOrder: "Siparişten Düşüldü",
          cancelled: "İptal Edildi",
        };


  const [returns, setReturns] =
    useState<PfandReturn[]>([]);

  const [
    warehouseSummary,
    setWarehouseSummary,
  ] = useState<WarehouseSummary>({
    totalQuantity: 0,
    totalValue: 0,
    negativeStockCount: 0,
    movementCount: 0,
    items: [],
  });

  const [
    showWarehouseSummary,
    setShowWarehouseSummary,
  ] = useState(false);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [
    updatingId,
    setUpdatingId,
  ] = useState<string | null>(
    null
  );

  const [
    expandedId,
    setExpandedId,
  ] = useState<string | null>(
    null
  );

  const [
    approvedQuantities,
    setApprovedQuantities,
  ] = useState<Record<string, number>>(
    {}
  );

  function getReportedQuantity(
    item: PfandReturn["items"][number]
  ) {
    return (
      item.originalQuantity ??
      item.quantity
    );
  }

  function getApprovedQuantity(
    item: PfandReturn["items"][number]
  ) {
    return (
      approvedQuantities[
        item.id
      ] ??
      item.approvedQuantity ??
      item.quantity
    );
  }

  function changeApprovedQuantity(
    item: PfandReturn["items"][number],
    difference: number
  ) {
    setApprovedQuantities(
      (current) => {
        const currentQuantity =
          current[item.id] ??
          item.approvedQuantity ??
          item.quantity;

        return {
          ...current,

          [item.id]:
            Math.max(
              0,
              currentQuantity +
                difference
            ),
        };
      }
    );
  }

  const loadReturns =
    useCallback(async () => {
      try {
        const response =
          await fetch(
            "/api/admin/pfand-returns"
          );

        const data =
          await response.json();

        if (!response.ok) {
          setError(
            data.error ||
              "Pfand iadeleri yüklenemedi."
          );
          return;
        }

        setReturns(
          data.returns
        );

        setWarehouseSummary(
          data.warehouseSummary || {
            totalQuantity: 0,
            totalValue: 0,
            negativeStockCount: 0,
            movementCount: 0,
            items: [],
          }
        );
      } catch {
        setError(
          language === "de"
            ? "Pfand-Rückgaben konnten nicht geladen werden."
            : "Pfand iadeleri yüklenemedi."
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    loadReturns();
  }, [loadReturns]);

  async function changeStatus(
    pfandReturn: PfandReturn,
    status: PfandStatus
  ) {
    if (
      status ===
      pfandReturn.status
    ) {
      return;
    }

    setUpdatingId(
      pfandReturn.id
    );

    setError("");
    setSuccess("");

    try {
      const response =
        await fetch(
          `/api/admin/pfand-returns/${pfandReturn.id}`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                status,

                approvedItems:
                  status ===
                  "APPROVED"
                    ? pfandReturn.items.map(
                        (item) => ({
                          id:
                            item.id,

                          approvedQuantity:
                            getApprovedQuantity(
                              item
                            ),
                        })
                      )
                    : undefined,
              }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            (language === "de"
              ? "Pfand-Status konnte nicht aktualisiert werden."
              : "Pfand durumu güncellenemedi.")
        );
        return;
      }

      await loadReturns();

      setSuccess(
        data.message
      );
    } catch {
      setError(
        language === "de"
          ? "Pfand-Status konnte nicht aktualisiert werden."
          : "Pfand durumu güncellenemedi."
      );
    } finally {
      setUpdatingId(
        null
      );
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="flex items-center gap-3 font-bold text-slate-600">
          <Loader2 className="animate-spin" />
          Pfand iadeleri yükleniyor...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 sm:p-6 lg:p-10">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 font-bold text-slate-600 transition hover:text-orange-500"
        >
          <ArrowLeft size={18} />
          Admin Paneli
        </Link>

        <section className="mt-6 rounded-[32px] bg-slate-950 p-7 text-white sm:p-10">
          <RotateCcw
            size={30}
            className="text-orange-400"
          />

          <h1 className="mt-4 text-4xl font-black">
            {language === "de" ? "Pfand-Rückgabeverwaltung" : "Pfand İade Yönetimi"}
          </h1>

          <p className="mt-3 text-slate-400">
            {language === "de"
              ? "Nehmen Sie die vom Fahrer beim Kunden eingesammelten Pfands ins Lager auf und verwalten Sie die Lagerbewegungen."
              : "Şoförün müşteriden aldığı Pfandları depoya teslim alın ve stok hareketlerini yönetin."}
          </p>
        </section>

        <section className="mt-8 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
          <button
            type="button"
            onClick={() =>
              setShowWarehouseSummary(
                (current) =>
                  !current
              )
            }
            aria-expanded={
              showWarehouseSummary
            }
            className="flex w-full flex-col gap-5 p-6 text-left transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between sm:p-7"
          >
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-orange-500">
                {language === "de" ? "Aktueller Lagerstatus" : "Güncel Depo Durumu"}
              </p>

              <h2 className="mt-1 text-2xl font-black text-slate-950">
                {language === "de" ? "Pfand-Lagerübersicht" : "Pfand Depo Özeti"}
              </h2>

              <p className="mt-2 text-sm font-semibold text-slate-500">
                {showWarehouseSummary
                  ? language === "de" ? "Pfandmengen ausblenden" : "Pfand miktarlarını kapat"
                  : language === "de" ? "Pfandmengen anzeigen" : "Pfand miktarlarını göster"}
              </p>
            </div>

            <div className="flex w-full items-center justify-between gap-4 sm:w-auto sm:justify-end">
              <div className="grid grid-cols-2 gap-3">
                <div className="min-w-32 rounded-2xl bg-orange-50 p-3 text-center sm:min-w-36">
                  <p className="text-xs font-black uppercase tracking-wide text-orange-600">
                    {language === "de" ? "Gesamtstück" : "Toplam Adet"}
                  </p>

                  <p className="mt-1 text-xl font-black text-orange-700 sm:text-2xl">
                    {warehouseSummary.totalQuantity.toLocaleString(
                      "de-DE"
                    )}
                  </p>
                </div>

                <div className="min-w-32 rounded-2xl bg-green-50 p-3 text-center sm:min-w-36">
                  <p className="text-xs font-black uppercase tracking-wide text-green-600">
                    {language === "de" ? "Gesamtwert" : "Toplam Değer"}
                  </p>

                  <p className="mt-1 text-xl font-black text-green-700 sm:text-2xl">
                    {warehouseSummary.totalValue.toLocaleString(
                      "de-DE",
                      {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }
                    )}{" "}
                    €
                  </p>
                </div>
              </div>

              <ChevronDown
                size={24}
                className={`shrink-0 text-slate-500 transition-transform ${
                  showWarehouseSummary
                    ? "rotate-180"
                    : ""
                }`}
              />
            </div>
          </button>

          {showWarehouseSummary ? (
            <div className="border-t border-slate-200">
              {warehouseSummary.negativeStockCount > 0 ? (
                <div className="m-5 rounded-2xl border border-red-200 bg-red-50 p-4 font-bold text-red-700">
                  {language === "de" ? "Achtung:" : "Dikkat:"}{" "}
                  {
                    warehouseSummary.negativeStockCount
                  }{" "}
                  {language === "de"
                    ? "Pfand-Arten haben eine negative Lagermenge. Prüfen Sie die Ein- und Ausgangsbewegungen."
                    : "Pfand türünde depo miktarı negatiftir. Giriş ve çıkış hareketlerini kontrol edin."}
                </div>
              ) : null}

              {warehouseSummary.items.length === 0 ? (
                <div className="p-6 text-slate-500">
                  {language === "de"
                    ? "Im Lager ist noch kein Pfand erfasst."
                    : "Depoda henüz kayıtlı Pfand bulunmuyor."}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-slate-50">
                      <tr className="text-left text-xs font-black uppercase tracking-wide text-slate-500">
                        <th className="px-5 py-4">
                          {language === "de" ? "Pfand-Art" : "Pfand Türü"}
                        </th>

                        <th className="px-5 py-4 text-right">
                          {language === "de" ? "Stückwert" : "Birim Değeri"}
                        </th>

                        <th className="px-5 py-4 text-right">
                          {language === "de" ? "Gesamteingang" : "Toplam Giriş"}
                        </th>

                        <th className="px-5 py-4 text-right">
                          {language === "de" ? "Gesamtausgang" : "Toplam Çıkış"}
                        </th>

                        <th className="px-5 py-4 text-right">
                          {language === "de" ? "Anzahl im Lager" : "Depodaki Adet"}
                        </th>

                        <th className="px-5 py-4 text-right">
                          {language === "de" ? "Aktueller Wert" : "Güncel Değer"}
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {warehouseSummary.items.map(
                        (item) => (
                          <tr
                            key={
                              item.key
                            }
                            className="border-t border-slate-100"
                          >
                            <td className="px-5 py-4 font-black text-slate-950">
                              {
                                item.name
                              }
                            </td>

                            <td className="px-5 py-4 text-right font-bold text-slate-600">
                              {item.unitAmount.toLocaleString(
                                "de-DE",
                                {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                }
                              )}{" "}
                              €
                            </td>

                            <td className="px-5 py-4 text-right font-bold text-green-700">
                              +
                              {item.totalIn.toLocaleString(
                                "de-DE"
                              )}
                            </td>

                            <td className="px-5 py-4 text-right font-bold text-red-600">
                              -
                              {item.totalOut.toLocaleString(
                                "de-DE"
                              )}
                            </td>

                            <td
                              className={`px-5 py-4 text-right font-black ${
                                item.quantity < 0
                                  ? "text-red-600"
                                  : "text-slate-950"
                              }`}
                            >
                              {item.quantity.toLocaleString(
                                "de-DE"
                              )}
                            </td>

                            <td
                              className={`px-5 py-4 text-right font-black ${
                                item.totalValue < 0
                                  ? "text-red-600"
                                  : "text-green-700"
                              }`}
                            >
                              {item.totalValue.toLocaleString(
                                "de-DE",
                                {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                }
                              )}{" "}
                              €
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="border-t border-slate-200 bg-slate-50 px-6 py-3 text-xs font-semibold text-slate-500">
                Hesaplamaya dahil edilen depo hareketi:{" "}
                {
                  warehouseSummary.movementCount
                }
              </div>
            </div>
          ) : null}
        </section>

        {error ? (
          <div className="mt-6 rounded-2xl bg-red-50 p-5 font-bold text-red-600">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="mt-6 rounded-2xl bg-green-50 p-5 font-bold text-green-700">
            {success}
          </div>
        ) : null}

        <section className="mt-8 rounded-[28px] bg-white p-6 shadow-sm">
          {returns.length === 0 ? (
            <p className="text-slate-500">
              Henüz Pfand iade talebi bulunmuyor.
            </p>
          ) : (
            <div className="space-y-4">
              {returns.map(
                (
                  pfandReturn
                ) => {
                  const expanded =
                    expandedId ===
                    pfandReturn.id;

                  const updating =
                    updatingId ===
                    pfandReturn.id;

                  return (
                    <article
                      key={
                        pfandReturn.id
                      }
                      className="overflow-hidden rounded-2xl border border-slate-200"
                    >
                      <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center">
                        <div className="flex-1">
                          <p className="text-sm font-bold text-orange-500">
                            {new Date(
                              pfandReturn.createdAt
                            ).toLocaleString(
                              "de-DE"
                            )}
                          </p>

                          <h2 className="mt-1 text-lg font-black text-slate-950">
                            {pfandReturn
                              .user
                              .companyName ||
                              `${pfandReturn.user.firstName || ""} ${pfandReturn.user.lastName || ""}`}
                          </h2>

                          <p className="mt-1 text-sm text-slate-500">
                            {
                              pfandReturn
                                .user.email
                            }
                          </p>
                        </div>

                        <div>
                          <p className="text-sm font-bold text-slate-500">
                            {language === "de" ? "Gesamt" : "Toplam"}
                          </p>

                          <p className="font-black text-slate-950">
                            {pfandReturn.totalAmount.toFixed(
                              2
                            )}{" "}
                            €
                          </p>
                        </div>

                        <div className="min-w-64">
                          <p className="mb-1 text-sm font-bold text-slate-500">
                            {language === "de" ? "Lagerstatus" : "Depo Durumu"}
                          </p>

                          {pfandReturn.warehouseMovement ? (
                            <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3">
                              <p className="font-black text-green-700">
                                {language === "de" ? "Ins Lager übernommen" : "Depoya Alındı"}
                              </p>

                              <p className="mt-1 text-xs font-semibold text-green-600">
                                {pfandReturn.approvedBy
                                  ? pfandReturn.approvedBy.companyName ||
                                    [
                                      pfandReturn.approvedBy.firstName,
                                      pfandReturn.approvedBy.lastName,
                                    ]
                                      .filter(Boolean)
                                      .join(" ") ||
                                    pfandReturn.approvedBy.email
                                  : language === "de" ? "Administrator" : "Admin"}
                              </p>

                              {pfandReturn.approvedAt ? (
                                <p className="mt-1 text-xs text-green-600">
                                  {new Date(
                                    pfandReturn.approvedAt
                                  ).toLocaleString("de-DE")}
                                </p>
                              ) : null}
                            </div>
                          ) : pfandReturn.status === "CANCELLED" ? (
                            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-black text-red-700">
                              {language === "de" ? "Storniert" : "İptal Edildi"}
                            </div>
                          ) : (
                            <button
                              type="button"
                              disabled={updating}
                              onClick={() =>
                                changeStatus(
                                  pfandReturn,
                                  "APPROVED"
                                )
                              }
                              className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 font-black text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {updating ? (
                                <>
                                  <Loader2
                                    size={18}
                                    className="animate-spin"
                                  />
                                  {language === "de" ? "Wird ins Lager übernommen..." : "Depoya Kaydediliyor..."}
                                </>
                              ) : (
                                language === "de" ? "Ins Lager übernommen" : "Depoya Alındı"
                              )}
                            </button>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setExpandedId(
                              expanded
                                ? null
                                : pfandReturn.id
                            )
                          }
                          className="rounded-xl bg-slate-100 p-3 text-slate-700"
                        >
                          {expanded ? (
                            <ChevronUp
                              size={18}
                            />
                          ) : (
                            <ChevronDown
                              size={18}
                            />
                          )}
                        </button>
                      </div>

                      {expanded ? (
                        <div className="border-t border-slate-200 bg-slate-50 p-5">
                          <div className="grid gap-6 lg:grid-cols-2">
                            <div>
                              <h3 className="font-black text-slate-950">
                                İade Kalemleri
                              </h3>

                              <div className="mt-3 space-y-3">
                                {pfandReturn.items.map(
                                  (
                                    item
                                  ) => (
                                    <div
                                      key={
                                        item.id
                                      }
                                      className="rounded-xl bg-white p-4"
                                    >
                                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                          <p className="font-bold">
                                            {
                                              item.name
                                            }
                                          </p>

                                          <p className="mt-1 text-sm text-slate-500">
                                            {language === "de" ? "Fahrer meldete:" : "Şoför bildirdi:"}{" "}
                                            {getReportedQuantity(
                                              item
                                            )}{" "}
                                            ×{" "}
                                            {item.unitAmount.toFixed(
                                              2
                                            )}{" "}
                                            €
                                          </p>
                                        </div>

                                        {pfandReturn.warehouseMovement ? (
                                          <div className="text-right">
                                            <p className="text-xs font-bold uppercase tracking-wide text-green-600">
                                              {language === "de" ? "Ins Lager eingegangen" : "Depoya Giren"}
                                            </p>

                                            <p className="font-black text-green-700">
                                              {item.approvedQuantity ??
                                                item.quantity}{" "}
                                              {language === "de" ? "Stück" : "adet"}
                                            </p>

                                            <p className="text-sm font-bold text-green-700">
                                              {(
                                                item.approvedTotal ??
                                                item.totalAmount
                                              ).toFixed(
                                                2
                                              )}{" "}
                                              €
                                            </p>
                                          </div>
                                        ) : (
                                          <div>
                                            <p className="mb-2 text-center text-xs font-bold uppercase tracking-wide text-slate-400">
                                              {language === "de" ? "Admin-Zählung" : "Admin Sayımı"}
                                            </p>

                                            <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50">
                                              <button
                                                type="button"
                                                disabled={
                                                  getApprovedQuantity(
                                                    item
                                                  ) <= 0 ||
                                                  updating
                                                }
                                                onClick={() =>
                                                  changeApprovedQuantity(
                                                    item,
                                                    -1
                                                  )
                                                }
                                                className="flex h-10 w-10 items-center justify-center disabled:text-slate-300"
                                              >
                                                <Minus
                                                  size={16}
                                                />
                                              </button>

                                              <span className="min-w-12 text-center font-black">
                                                {getApprovedQuantity(
                                                  item
                                                )}
                                              </span>

                                              <button
                                                type="button"
                                                disabled={
                                                  updating
                                                }
                                                onClick={() =>
                                                  changeApprovedQuantity(
                                                    item,
                                                    1
                                                  )
                                                }
                                                className="flex h-10 w-10 items-center justify-center disabled:text-slate-300"
                                              >
                                                <Plus
                                                  size={16}
                                                />
                                              </button>
                                            </div>
                                          </div>
                                        )}
                                      </div>

                                      {!pfandReturn.warehouseMovement ? (
                                        <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm">
                                          {(() => {
                                            const reported =
                                              getReportedQuantity(
                                                item
                                              );

                                            const approved =
                                              getApprovedQuantity(
                                                item
                                              );

                                            const quantityDifference =
                                              approved -
                                              reported;

                                            const amountDifference =
                                              Number(
                                                (
                                                  quantityDifference *
                                                  item.unitAmount
                                                ).toFixed(
                                                  2
                                                )
                                              );

                                            if (
                                              quantityDifference ===
                                              0
                                            ) {
                                              return (
                                                <span className="font-bold text-slate-600">
                                                  Fark yok
                                                </span>
                                              );
                                            }

                                            if (
                                              quantityDifference >
                                              0
                                            ) {
                                              return (
                                                <span className="font-bold text-green-700">
                                                  Fazla teslim: +
                                                  {quantityDifference} adet · Şoförün kasaya vereceği para{" "}
                                                  {Math.abs(
                                                    amountDifference
                                                  ).toFixed(
                                                    2
                                                  )}{" "}
                                                  € düşer
                                                </span>
                                              );
                                            }

                                            return (
                                              <span className="font-bold text-red-600">
                                                Eksik teslim:{" "}
                                                {Math.abs(
                                                  quantityDifference
                                                )} adet · Şoförün kasaya vereceği para{" "}
                                                {Math.abs(
                                                  amountDifference
                                                ).toFixed(
                                                  2
                                                )}{" "}
                                                € yükselir
                                              </span>
                                            );
                                          })()}
                                        </div>
                                      ) : null}
                                    </div>
                                  )
                                )}
                              </div>
                            </div>

                            <div>
                              <h3 className="font-black text-slate-950">
                                {language === "de" ? "Lieferinformationen" : "Teslimat Bilgileri"}
                              </h3>

                              <div className="mt-3 space-y-3 rounded-xl bg-white p-4 text-slate-600">
                                <div>
                                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                                    {language === "de" ? "Kunde" : "Müşteri"}
                                  </p>

                                  <p className="mt-1 font-bold text-slate-800">
                                    {pfandReturn.user.companyName ||
                                      [
                                        pfandReturn.user.firstName,
                                        pfandReturn.user.lastName,
                                      ]
                                        .filter(Boolean)
                                        .join(" ") ||
                                      pfandReturn.user.email}
                                  </p>

                                  <p className="text-sm">
                                    {pfandReturn.user.phone || "-"}
                                  </p>
                                </div>

                                <div className="border-t border-slate-100 pt-3">
                                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                                    {language === "de" ? "Fahrer, der es vom Kunden entgegengenommen hat" : "Müşteriden Alan Şoför"}
                                  </p>

                                  <p className="mt-1 font-bold text-slate-800">
                                    {pfandReturn.order?.driver
                                      ? pfandReturn.order.driver.companyName ||
                                        [
                                          pfandReturn.order.driver.firstName,
                                          pfandReturn.order.driver.lastName,
                                        ]
                                          .filter(Boolean)
                                          .join(" ") ||
                                        pfandReturn.order.driver.email
                                      : language === "de" ? "Keine Fahrerdaten vorhanden" : "Şoför bilgisi bulunmuyor"}
                                  </p>
                                </div>

                                {pfandReturn.approvedBy ? (
                                  <div className="border-t border-slate-100 pt-3">
                                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                                      {language === "de" ? "Admin, der es im Lager entgegengenommen hat" : "Depoda Teslim Alan Admin"}
                                    </p>

                                    <p className="mt-1 font-bold text-slate-800">
                                      {pfandReturn.approvedBy.companyName ||
                                        [
                                          pfandReturn.approvedBy.firstName,
                                          pfandReturn.approvedBy.lastName,
                                        ]
                                          .filter(Boolean)
                                          .join(" ") ||
                                        pfandReturn.approvedBy.email}
                                    </p>

                                    {pfandReturn.approvedAt ? (
                                      <p className="text-sm">
                                        {new Date(
                                          pfandReturn.approvedAt
                                        ).toLocaleString("de-DE")}
                                      </p>
                                    ) : null}
                                  </div>
                                ) : null}
                              </div>

                              {pfandReturn.note ? (
                                <>
                                  <h3 className="mt-5 font-black text-slate-950">
                                    {language === "de" ? "Kundennotiz" : "Müşteri Notu"}
                                  </h3>

                                  <p className="mt-3 rounded-xl bg-white p-4 text-slate-600">
                                    {
                                      pfandReturn.note
                                    }
                                  </p>
                                </>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </article>
                  );
                }
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
