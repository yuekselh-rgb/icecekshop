"use client";

import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { useLanguage } from "@/context/LanguageContext";
import {
  Loader2,
  Plus,
  RotateCcw,
  Save,
  Trash2,
} from "lucide-react";
import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

type PfandStatus =
  | "PENDING"
  | "APPROVED"
  | "PAID_CASH"
  | "DEDUCTED_FROM_ORDER"
  | "CANCELLED";

type PfandItemForm = {
  id: string;
  name: string;
  quantity: string;
  unitAmount: string;
};

type PfandReturn = {
  id: string;
  status: PfandStatus;
  totalAmount: number;
  note: string | null;
  createdAt: string;

  order: {
    id: string;
    orderNumber: string;
  } | null;

  items: Array<{
    id: string;
    name: string;
    quantity: number;
    unitAmount: number;
    totalAmount: number;
  }>;
};

const statusLabels: Record<
  PfandStatus,
  {
    tr: string;
    de: string;
  }
> = {
  PENDING: {
    tr: "Bekliyor",
    de: "Ausstehend",
  },
  APPROVED: {
    tr: "Onaylandı",
    de: "Genehmigt",
  },
  PAID_CASH: {
    tr: "Nakit Ödendi",
    de: "Bar ausgezahlt",
  },
  DEDUCTED_FROM_ORDER: {
    tr: "Siparişten Düşüldü",
    de: "Von Bestellung abgezogen",
  },
  CANCELLED: {
    tr: "İptal Edildi",
    de: "Storniert",
  },
};

const defaultPfandItems: PfandItemForm[] = [
  {
    id: "PET_025",
    name: "PET / Dose (Einweg)",
    quantity: "0",
    unitAmount: "0.25",
  },
  {
    id: "GLASS_008",
    name: "Glasflasche Mehrweg 0,08 €",
    quantity: "0",
    unitAmount: "0.08",
  },
  {
    id: "GLASS_015",
    name: "Glasflasche Mehrweg 0,15 €",
    quantity: "0",
    unitAmount: "0.15",
  },
  {
    id: "CRATE_330",
    name: "Kiste / Getränkekasten",
    quantity: "0",
    unitAmount: "3.30",
  },
];

const pfandLabels: Record<string, { de: string; tr: string }> = {
  PET_025: {
    de: "PET / Dose (Einweg)",
    tr: "PET / Kutu (Tek Kullanımlık)",
  },
  GLASS_008: {
    de: "Glasflasche Mehrweg 0,08 €",
    tr: "Cam Şişe (İade) 0,08 €",
  },
  GLASS_015: {
    de: "Glasflasche Mehrweg 0,15 €",
    tr: "Cam Şişe (İade) 0,15 €",
  },
  CRATE_330: {
    de: "Kiste / Getränkekasten",
    tr: "Kasa / İçecek Kasası",
  },
};

export default function PfandClient({
  initialSettings,
}: {
  initialSettings?: any;
} = {}) {
  const { language } =
    useLanguage();

  const t =
    language === "de"
      ? {
          loadError: "Pfandrückgaben konnten nicht geladen werden.",
          saveError: "Pfandrückgabe konnte nicht gespeichert werden.",
          loadFailed: "Pfandrückgaben konnten nicht geladen werden.",
          saveSuccess: "Pfandrückgabe erfolgreich gespeichert.",
          saving: "Wird gespeichert...",
          title: "Pfandrückgabe",
          description: "Erfassen Sie Ihre leeren Kisten und Flaschen und verfolgen Sie den Bearbeitungsstatus.",
          newReturn: "Neue Rückgabe",
          quantity: "Anzahl",
          total: "Gesamt",
          submitSuccess: "Ihre Pfandrückgabe wurde eingereicht.",
          submitError: "Die Pfandrückgabe konnte nicht erstellt werden.",
          note: "Hinweis",
          totalRefund: "Gesamtbetrag",
          submit: "Rückgabe absenden",
          myReturns: "Meine Rückgaben",
          loading: "Wird geladen...",
          noReturns: "Noch keine Rückgabe vorhanden.",
          pending: "Ausstehend",
          approved: "Genehmigt",
          paidCash: "Bar ausgezahlt",
          deducted: "Von Bestellung abgezogen",
          cancelled: "Storniert",
        }
      : {
          loadError: "Pfand iadeleri yüklenemedi.",
          saveError: "Pfand iadesi kaydedilemedi.",
          loadFailed: "Pfand iadeleri yüklenemedi.",
          saveSuccess: "Pfand iadesi başarıyla kaydedildi.",
          saving: "Kaydediliyor...",
          title: "Pfand İadesi",
          description: "Boş kasa ve şişelerinizi kaydedin, iade durumunu takip edin.",
          newReturn: "Yeni İade",
          quantity: "Adet",
          total: "Toplam",
          submitSuccess: "Pfand iade talebiniz oluşturuldu.",
          submitError: "Pfand iadesi oluşturulamadı.",
          note: "Not",
          totalRefund: "Toplam İade",
          submit: "İade Talebi Gönder",
          myReturns: "İade Geçmişim",
          loading: "Yükleniyor...",
          noReturns: "Henüz Pfand iadeniz bulunmuyor.",
          pending: "Bekliyor",
          approved: "Onaylandı",
          paidCash: "Nakit Ödendi",
          deducted: "Siparişten Düşüldü",
          cancelled: "İptal Edildi",
        };

  const [items, setItems] =
    useState<PfandItemForm[]>(
      defaultPfandItems
    );

  const [note, setNote] =
    useState("");

  const [returns, setReturns] =
    useState<PfandReturn[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const loadReturns =
    useCallback(async () => {
      try {
        const response =
          await fetch(
            "/api/pfand-returns"
          );

        const data =
          await response.json();

        if (!response.ok) {
          setError(
            data.error ||
              t.loadFailed
          );
          return;
        }

        setReturns(
          data.returns
        );
      } catch {
        setError(t.loadError);
      } finally {
        setLoading(false);
      }
    }, [language]);

  useEffect(() => {
    loadReturns();
  }, [loadReturns]);

  const totalAmount =
    useMemo(() => {
      return items.reduce(
        (
          total,
          item
        ) => {
          const quantity =
            Number(
              item.quantity
            );

          const unitAmount =
            Number(
              item.unitAmount
                .replace(
                  ",",
                  "."
                )
            );

          if (
            !Number.isFinite(
              quantity
            ) ||
            !Number.isFinite(
              unitAmount
            )
          ) {
            return total;
          }

          return (
            total +
            quantity *
              unitAmount
          );
        },
        0
      );
    }, [items]);

  function updateItem(
    id: string,
    value: string
  ) {
    setItems(
      (current) =>
        current.map(
          (item) =>
            item.id === id
              ? {
                  ...item,
                  quantity:
                    value,
                }
              : item
        )
    );
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response =
        await fetch(
          "/api/pfand-returns",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                note,

                items:
                  items.map(
                    (item) => ({
                      name:
                        item.name,

                      quantity:
                        Number(
                          item.quantity
                        ),

                      unitAmount:
                        Number(
                          item.unitAmount.replace(
                            ",",
                            "."
                          )
                        ),
                    })
                  ),
              }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            t.submitError
        );
        return;
      }

      setSuccess(t.submitSuccess);

      setItems([
        ...defaultPfandItems,
      ]);

      setNote("");

      await loadReturns();
    } catch {
      setError(t.submitError);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f7f5]">
      <Header initialSettings={initialSettings} />

      <section className="border-b border-slate-200 bg-white px-4 py-12 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="font-bold text-orange-500">
            Pfand
          </p>

          <h1 className="mt-2 text-4xl font-black text-slate-950 sm:text-5xl">
            {t.title}
          </h1>

          <p className="mt-4 max-w-2xl text-slate-600">
            {t.description}
          </p>
        </div>
      </section>

      <section className="px-4 py-10 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_420px]">
          <form
            onSubmit={
              handleSubmit
            }
            className="rounded-[32px] bg-white p-6 sm:p-8"
          >
            <div className="flex items-center gap-3">
              <RotateCcw className="text-orange-500" />

              <h2 className="text-2xl font-black text-slate-950">
                {t.newReturn}
              </h2>
            </div>

            {error ? (
              <div className="mt-5 rounded-2xl bg-red-50 p-4 font-bold text-red-600">
                {error}
              </div>
            ) : null}

            {success ? (
              <div className="mt-5 rounded-2xl bg-green-50 p-4 font-bold text-green-700">
                {success}
              </div>
            ) : null}

            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
              {items.map(
                (item) => {
                  const quantity =
                    Number(
                      item.quantity
                    );

                  const unitAmount =
                    Number(
                      item.unitAmount.replace(
                        ",",
                        "."
                      )
                    );

                  const itemTotal =
                    Number.isFinite(
                      quantity
                    ) &&
                    Number.isFinite(
                      unitAmount
                    )
                      ? quantity *
                        unitAmount
                      : 0;

                  return (
                    <div
                      key={item.id}
                      className="grid gap-4 border-b border-slate-200 p-4 last:border-b-0 sm:grid-cols-[1fr_120px_150px_150px] sm:items-center"
                    >
                      <div>
                        <p className="font-black text-slate-950">
                          {pfandLabels[item.id]?.[language] ?? item.name}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-bold uppercase text-slate-400">
                          Pfand
                        </p>

                        <p className="mt-1 font-black text-orange-500">
                          {unitAmount.toFixed(
                            2
                          )}{" "}
                          €
                        </p>
                      </div>

                      <label>
                        <span className="text-xs font-bold uppercase text-slate-400">
                          {t.quantity}
                        </span>

                        <input
                          min="0"
                          type="number"
                          value={
                            item.quantity
                          }
                          onChange={(
                            event
                          ) =>
                            updateItem(
                              item.id,
                              event.target.value
                            )
                          }
                          className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-orange-500"
                        />
                      </label>

                      <div>
                        <p className="text-xs font-bold uppercase text-slate-400">
                          {t.total}
                        </p>

                        <p className="mt-1 text-lg font-black text-green-700">
                          {itemTotal.toFixed(
                            2
                          )}{" "}
                          €
                        </p>
                      </div>
                    </div>
                  );
                }
              )}
            </div>

            <label className="mt-6 block">
              <span className="text-sm font-bold text-slate-700">
                {t.note}
              </span>

              <textarea
                rows={4}
                value={note}
                onChange={(
                  event
                ) =>
                  setNote(
                    event.target
                      .value
                  )
                }
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-orange-500"
              />
            </label>

            <div className="mt-6 flex items-center justify-between rounded-2xl bg-slate-950 p-5 text-white">
              <span className="font-bold">
                {t.totalRefund}
              </span>

              <strong className="text-2xl">
                {totalAmount.toFixed(
                  2
                )}{" "}
                €
              </strong>
            </div>

            <button
              type="submit"
              disabled={
                saving ||
                totalAmount <= 0
              }
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 py-4 font-black text-white disabled:bg-slate-300"
            >
              {saving ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Save size={19} />
              )}

              {t.submit}
            </button>
          </form>

          <aside className="h-fit rounded-[32px] bg-white p-6 lg:sticky lg:top-28">
            <h2 className="text-2xl font-black text-slate-950">
              {t.myReturns}
            </h2>

            {loading ? (
              <div className="flex items-center gap-3 py-10 text-slate-500">
                <Loader2 className="animate-spin" />
                {t.loading}
              </div>
            ) : returns.length ===
              0 ? (
              <p className="mt-5 text-slate-500">
                {t.noReturns}
              </p>
            ) : (
              <div className="mt-5 space-y-4">
                {returns.map(
                  (
                    pfandReturn
                  ) => (
                    <article
                      key={
                        pfandReturn.id
                      }
                      className="rounded-2xl border border-slate-200 p-4"
                    >
                      <div className="flex justify-between gap-3">
                        <div>
                          <p className="font-black text-slate-950">
                            {pfandReturn.totalAmount.toFixed(
                              2
                            )}{" "}
                            €
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {new Date(
                              pfandReturn.createdAt
                            ).toLocaleString(
                              "de-DE"
                            )}
                          </p>
                        </div>

                        <span className="h-fit rounded-full bg-orange-50 px-3 py-1 text-xs font-black text-orange-600">
                          {
                            statusLabels[
                              pfandReturn
                                .status
                            ][language]
                          }
                        </span>
                      </div>

                      <div className="mt-4 space-y-2">
                        {pfandReturn.items.map(
                          (item) => (
                            <div
                              key={
                                item.id
                              }
                              className="flex justify-between gap-3 text-sm"
                            >
                              <span className="text-slate-600">
                                {
                                  item.quantity
                                }{" "}
                                ×{" "}
                                {
                                  item.name
                                }
                              </span>

                              <strong>
                                {item.totalAmount.toFixed(
                                  2
                                )}{" "}
                                €
                              </strong>
                            </div>
                          )
                        )}
                      </div>
                    </article>
                  )
                )}
              </div>
            )}
          </aside>
        </div>
      </section>

      <Footer initialSettings={initialSettings} />
    </main>
  );
}
