"use client";

import {
  ArrowLeft,
  Loader2,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import { useLanguage } from "@/context/LanguageContext";

type Order = {
  id: string;
  orderNumber: string;
  status: string;

  paymentStatus:
    | "OPEN"
    | "PAID";

  totalAmount: number;

  deletedAt:
    string | null;

  user: {
    firstName:
      string | null;

    lastName:
      string | null;

    companyName:
      string | null;

    email: string;
  };

  driver: {
    firstName:
      string | null;

    lastName:
      string | null;

    email: string;
  } | null;
};

export default function TrashPage() {
  const { language } = useLanguage();

  const t =
    language === "de"
      ? {
          backLink: "Alle Bestellungen",
          pageTitle: "Papierkorb",
          pageDesc:
            "Stellen Sie gelöschte Bestellungen wieder her oder löschen Sie sie mit dem Super-Admin-Passwort endgültig.",
          loading: "Wird geladen...",
          empty: "Im Papierkorb befinden sich keine Bestellungen.",
          driverLabel: "Lieferfahrer",
          unassigned: "Nicht zugewiesen",
          paymentLabel: "Zahlung",
          paid: "Bezahlt",
          open: "Offen",
          totalLabel: "Gesamt",
          deletedAtLabel: "Löschdatum",
          restore: "Wiederherstellen",
          permanentDelete: "Endgültig löschen",
          deleting: "Wird gelöscht...",
          passwordLabel: "Super-Admin-Passwort",
          passwordPlaceholder: "Passwort eingeben",
          loadError: "Papierkorb konnte nicht geladen werden.",
          restoreError: "Bestellung konnte nicht wiederhergestellt werden.",
          restoreSuccess: "Bestellung wurde wiederhergestellt.",
          restoreCatchError:
            "Beim Wiederherstellen der Bestellung ist ein Fehler aufgetreten.",
          passwordRequired: "Bitte geben Sie das Super-Admin-Passwort ein.",
          deleteError:
            "Bestellung konnte nicht endgültig gelöscht werden.",
          deleteSuccess: "Bestellung wurde endgültig gelöscht.",
          deleteCatchError:
            "Beim endgültigen Löschen der Bestellung ist ein Fehler aufgetreten.",
          confirmRestore: (orderNumber: string) =>
            `Soll die Bestellung ${orderNumber} wiederhergestellt werden?\n\nSie erscheint danach wieder im Admin- und im zugewiesenen Fahrerbereich.`,
          modalWarning: (orderNumber: string) =>
            `Die Bestellung ${orderNumber} wird endgültig aus der Datenbank gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.`,
        }
      : {
          backLink: "Tüm Siparişler",
          pageTitle: "Çöp Kutusu",
          pageDesc:
            "Silinen siparişleri geri getirin veya Super Admin şifresiyle kalıcı olarak silin.",
          loading: "Yükleniyor...",
          empty: "Çöp kutusunda sipariş bulunmuyor.",
          driverLabel: "Şoför",
          unassigned: "Atanmadı",
          paymentLabel: "Ödeme",
          paid: "Parası Ödendi",
          open: "Ödeme Açık",
          totalLabel: "Toplam",
          deletedAtLabel: "Silinme Tarihi",
          restore: "Geri Getir",
          permanentDelete: "Kalıcı Olarak Sil",
          deleting: "Siliniyor...",
          passwordLabel: "Super Admin Şifresi",
          passwordPlaceholder: "Şifrenizi girin",
          loadError: "Çöp kutusu yüklenemedi.",
          restoreError: "Sipariş geri getirilemedi.",
          restoreSuccess: "Sipariş geri getirildi.",
          restoreCatchError: "Sipariş geri getirilirken hata oluştu.",
          passwordRequired: "Super Admin şifresini girin.",
          deleteError: "Sipariş kalıcı olarak silinemedi.",
          deleteSuccess: "Sipariş kalıcı olarak silindi.",
          deleteCatchError: "Sipariş kalıcı olarak silinirken hata oluştu.",
          confirmRestore: (orderNumber: string) =>
            `${orderNumber} numaralı sipariş geri getirilsin mi?\n\nSipariş tekrar Admin ve atanmış şoför ekranında görünecektir.`,
          modalWarning: (orderNumber: string) =>
            `${orderNumber} veritabanından tamamen silinecek. Bu işlem geri alınamaz.`,
        };

  const [
    orders,
    setOrders,
  ] =
    useState<Order[]>([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    actionOrderId,
    setActionOrderId,
  ] =
    useState<string | null>(
      null
    );

  const [
    permanentDeleteOrder,
    setPermanentDeleteOrder,
  ] =
    useState<Order | null>(
      null
    );

  const [
    password,
    setPassword,
  ] =
    useState("");

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    success,
    setSuccess,
  ] =
    useState("");

  async function loadOrders() {
    setLoading(true);

    try {
      const response =
        await fetch(
          "/api/super-admin/trash"
        );

      const data =
        await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            t.loadError
        );

        return;
      }

      setOrders(
        data.orders
      );
    } catch {
      setError(
        t.loadError
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function restoreOrder(
    order: Order
  ) {
    const confirmed =
      window.confirm(
        t.confirmRestore(order.orderNumber)
      );

    if (!confirmed) {
      return;
    }

    setActionOrderId(
      order.id
    );

    setError("");
    setSuccess("");

    try {
      const response =
        await fetch(
          `/api/super-admin/orders/${order.id}`,
          {
            method:
              "PATCH",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            t.restoreError
        );

        return;
      }

      setOrders(
        (current) =>
          current.filter(
            (item) =>
              item.id !==
              order.id
          )
      );

      setSuccess(
        data.message ||
          t.restoreSuccess
      );
    } catch {
      setError(
        t.restoreCatchError
      );
    } finally {
      setActionOrderId(
        null
      );
    }
  }

  function openPermanentDelete(
    order: Order
  ) {
    setError("");
    setSuccess("");
    setPassword("");

    setPermanentDeleteOrder(
      order
    );
  }

  function closePermanentDelete() {
    if (actionOrderId) {
      return;
    }

    setPermanentDeleteOrder(
      null
    );

    setPassword("");
  }

  async function permanentlyDelete(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      !permanentDeleteOrder
    ) {
      return;
    }

    if (!password) {
      setError(
        t.passwordRequired
      );

      return;
    }

    const order =
      permanentDeleteOrder;

    setActionOrderId(
      order.id
    );

    setError("");
    setSuccess("");

    try {
      const response =
        await fetch(
          `/api/super-admin/orders/${order.id}`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                password,
              }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            t.deleteError
        );

        return;
      }

      setOrders(
        (current) =>
          current.filter(
            (item) =>
              item.id !==
              order.id
          )
      );

      setPermanentDeleteOrder(
        null
      );

      setPassword("");

      setSuccess(
        data.message ||
          t.deleteSuccess
      );
    } catch {
      setError(
        t.deleteCatchError
      );
    } finally {
      setActionOrderId(
        null
      );
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 sm:p-6 lg:p-10">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/super-admin/orders"
          className="inline-flex items-center gap-2 font-bold text-slate-600 transition hover:text-orange-500"
        >
          <ArrowLeft
            size={18}
          />

          {t.backLink}
        </Link>

        <section className="mt-6 rounded-[32px] bg-slate-950 p-7 text-white sm:p-10">
          <Trash2
            size={30}
            className="text-red-400"
          />

          <h1 className="mt-4 text-4xl font-black">
            {t.pageTitle}
          </h1>

          <p className="mt-3 text-slate-400">
            {t.pageDesc}
          </p>
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

        <section className="mt-8 rounded-[28px] bg-white p-6">
          {loading ? (
            <div className="flex items-center gap-3 text-slate-500">
              <Loader2 className="animate-spin" />
              {t.loading}
            </div>
          ) : orders.length ===
            0 ? (
            <p className="text-slate-500">
              {t.empty}
            </p>
          ) : (
            <div className="space-y-4">
              {orders.map(
                (order) => {
                  const customer =
                    order.user
                      .companyName ||
                    `${order.user.firstName || ""} ${order.user.lastName || ""}`.trim();

                  const driver =
                    order.driver
                      ? `${order.driver.firstName || ""} ${order.driver.lastName || ""}`.trim() ||
                        order.driver
                          .email
                      : t.unassigned;

                  const busy =
                    actionOrderId ===
                    order.id;

                  return (
                    <article
                      key={
                        order.id
                      }
                      className="rounded-2xl border border-red-100 bg-red-50/30 p-5"
                    >
                      <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
                        <div className="flex-1">
                          <p className="text-sm font-black text-red-600">
                            {
                              order.orderNumber
                            }
                          </p>

                          <h2 className="mt-1 font-black text-slate-950">
                            {
                              customer
                            }
                          </h2>
                        </div>

                        <div>
                          <p className="text-xs font-bold uppercase text-slate-400">
                            {t.driverLabel}
                          </p>

                          <p className="mt-1 font-black text-slate-950">
                            {
                              driver
                            }
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-bold uppercase text-slate-400">
                            {t.paymentLabel}
                          </p>

                          <p
                            className={`mt-1 font-black ${
                              order.paymentStatus ===
                              "PAID"
                                ? "text-green-700"
                                : "text-red-600"
                            }`}
                          >
                            {order.paymentStatus ===
                            "PAID"
                              ? t.paid
                              : t.open}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-bold uppercase text-slate-400">
                            {t.totalLabel}
                          </p>

                          <p className="mt-1 font-black text-slate-950">
                            {order.totalAmount.toFixed(
                              2
                            )}{" "}
                            €
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-bold uppercase text-slate-400">
                            {t.deletedAtLabel}
                          </p>

                          <p className="mt-1 font-black text-slate-950">
                            {order.deletedAt
                              ? new Date(
                                  order.deletedAt
                                ).toLocaleString(
                                  "de-DE"
                                )
                              : "-"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 flex flex-wrap gap-3 border-t border-red-100 pt-5">
                        <button
                          type="button"
                          disabled={
                            busy
                          }
                          onClick={() =>
                            restoreOrder(
                              order
                            )
                          }
                          className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-3 font-black text-white transition hover:bg-green-700 disabled:cursor-wait disabled:opacity-50"
                        >
                          {busy ? (
                            <Loader2
                              size={18}
                              className="animate-spin"
                            />
                          ) : (
                            <RotateCcw
                              size={18}
                            />
                          )}

                          {t.restore}
                        </button>

                        <button
                          type="button"
                          disabled={
                            busy
                          }
                          onClick={() =>
                            openPermanentDelete(
                              order
                            )
                          }
                          className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-3 font-black text-white transition hover:bg-red-700 disabled:opacity-50"
                        >
                          <Trash2
                            size={18}
                          />

                          {t.permanentDelete}
                        </button>
                      </div>
                    </article>
                  );
                }
              )}
            </div>
          )}
        </section>
      </div>

      {permanentDeleteOrder ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">
                  <Trash2
                    size={22}
                  />
                </div>

                <h2 className="mt-4 text-2xl font-black text-slate-950">
                  {t.permanentDelete}
                </h2>
              </div>

              <button
                type="button"
                onClick={
                  closePermanentDelete
                }
                className="rounded-xl bg-slate-100 p-2 text-slate-500 hover:bg-slate-200"
              >
                <X
                  size={20}
                />
              </button>
            </div>

            <div className="mt-5 rounded-xl bg-red-50 p-4 text-sm font-bold text-red-700">
              {t.modalWarning(
                permanentDeleteOrder.orderNumber
              )}
            </div>

            <form
              onSubmit={
                permanentlyDelete
              }
              className="mt-5"
            >
              <label className="block">
                <span className="text-sm font-black text-slate-700">
                  {t.passwordLabel}
                </span>

                <input
                  autoFocus
                  required
                  type="password"
                  value={
                    password
                  }
                  onChange={(
                    event
                  ) =>
                    setPassword(
                      event.target
                        .value
                    )
                  }
                  placeholder={t.passwordPlaceholder}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-red-500"
                />
              </label>

              <button
                type="submit"
                disabled={
                  actionOrderId ===
                  permanentDeleteOrder.id
                }
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-4 font-black text-white transition hover:bg-red-700 disabled:cursor-wait disabled:opacity-50"
              >
                {actionOrderId ===
                permanentDeleteOrder.id ? (
                  <>
                    <Loader2
                      size={19}
                      className="animate-spin"
                    />
                    {t.deleting}
                  </>
                ) : (
                  <>
                    <Trash2
                      size={19}
                    />
                    {t.permanentDelete}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </main>
  );
}
