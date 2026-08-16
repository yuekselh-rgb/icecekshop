"use client";

import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { useLanguage } from "@/context/LanguageContext";
import {
  buildOrderReceiptHtml,
  fetchReceiptCompany,
  getDeliveryQrCode,
  hasNavigableDeliveryAddress,
} from "@/lib/order-receipt";
import { FileDown, Loader2, Package } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type OrderStatus =
  | "NEW"
  | "CONFIRMED"
  | "PREPARING"
  | "READY"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";

type OrderItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  pfand: number;
};

type Order = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  createdAt: string;
  subtotal: number;
  deliveryFee: number;
  pfandAmount: number;
  totalAmount: number;
  openPaymentAmount: number;
  deliveryAddress: string;
  customerNote: string | null;
  confirmationToken: string | null;
  confirmedAt: string | null;

  pfandReturnAmount: number;

  pfandReturnItems: Array<{
    id: string;
    name: string;
    quantity: number;
    originalQuantity: number;
    quantityDifference: number;
    unitAmount: number;
    totalAmount: number;
    amountDifference: number;
  }>;

  driver: {
    firstName: string | null;
    lastName: string | null;
    email: string;
  } | null;

  user: {
    email: string;
    firstName: string | null;
    lastName: string | null;
    companyName: string | null;
    phone: string | null;
  };

  items: OrderItem[];
};

const statusLabels: Record<OrderStatus, { tr: string; de: string }> = {
  NEW: { tr: "Yeni", de: "Neu" },
  CONFIRMED: { tr: "Onaylandı", de: "Bestätigt" },
  PREPARING: { tr: "Hazırlanıyor", de: "Wird vorbereitet" },
  READY: { tr: "Hazır", de: "Bereit" },
  OUT_FOR_DELIVERY: { tr: "Teslimatta", de: "Unterwegs" },
  DELIVERED: { tr: "Teslim Edildi", de: "Geliefert" },
  CANCELLED: { tr: "İptal Edildi", de: "Storniert" },
};

export default function MyOrdersPage() {
  const { language } = useLanguage();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const t =
    language === "de"
      ? {
          eyebrow: "Mein Konto",
          title: "Meine Bestellungen",
          description: "Übersicht über Ihre bisherigen Bestellungen und deren Status.",
          loading: "Bestellungen werden geladen...",
          loadError: "Bestellungen konnten nicht geladen werden.",
          loginRequired: "Bitte melden Sie sich an, um Ihre Bestellungen zu sehen.",
          empty: "Sie haben noch keine Bestellungen aufgegeben.",
          browseProducts: "Produkte durchsuchen",
          orderNumber: "Bestellnummer",
          items: "Artikel",
          total: "Gesamt",
          openAmount: "Offener Betrag",
          goToLogin: "Jetzt anmelden",
          openInvoicesTitle: "Offene Rechnungen",
          openInvoicesTotal: "Offener Gesamtbetrag",
          openInvoicesCount: (n: number) =>
            n === 1 ? "1 offene Bestellung" : `${n} offene Bestellungen`,
          downloadInvoice: "Rechnung herunterladen",
          popupBlocked:
            "Das Rechnungsfenster konnte nicht geöffnet werden. Bitte Popup-Blocker des Browsers prüfen.",
        }
      : {
          eyebrow: "Hesabım",
          title: "Siparişlerim",
          description: "Geçmiş siparişlerinizin ve durumlarının özeti.",
          loading: "Siparişler yükleniyor...",
          loadError: "Siparişler yüklenemedi.",
          loginRequired: "Siparişlerinizi görmek için giriş yapın.",
          empty: "Henüz bir sipariş vermediniz.",
          browseProducts: "Ürünlere Göz At",
          orderNumber: "Sipariş No",
          items: "Ürün",
          total: "Toplam",
          openAmount: "Açık Tutar",
          goToLogin: "Şimdi Giriş Yap",
          openInvoicesTitle: "Açık Faturalar",
          openInvoicesTotal: "Toplam Açık Tutar",
          openInvoicesCount: (n: number) =>
            n === 1 ? "1 açık sipariş" : `${n} açık sipariş`,
          downloadInvoice: "Faturayı indir",
          popupBlocked:
            "Fatura penceresi açılamadı. Lütfen tarayıcı popup engelleyicisini kontrol edin.",
        };

  const [unauthorized, setUnauthorized] = useState(false);

  useEffect(() => {
    async function loadOrders() {
      try {
        const response = await fetch("/api/orders/me");
        const data = await response.json();

        if (response.status === 401) {
          setUnauthorized(true);
          return;
        }

        if (!response.ok) {
          setError(data.error || t.loadError);
          return;
        }

        setOrders(data.orders || []);
      } catch {
        setError(t.loadError);
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openOrders = orders.filter((order) => order.openPaymentAmount > 0.009);

  const totalOpenAmount = Number(
    openOrders
      .reduce((sum, order) => sum + order.openPaymentAmount, 0)
      .toFixed(2),
  );

  async function downloadInvoice(order: Order) {
    const popup = window.open("", "_blank", "width=900,height=700");

    if (!popup) {
      setError(t.popupBlocked);
      return;
    }

    const [deliveryQrCode, company] = await Promise.all([
      hasNavigableDeliveryAddress(order) ? getDeliveryQrCode(order) : Promise.resolve(null),
      fetchReceiptCompany(),
    ]);

    popup.document.write(buildOrderReceiptHtml(order, deliveryQrCode, language, company));

    popup.document.close();
    popup.focus();

    setTimeout(() => {
      popup.print();
    }, 250);
  }

  return (
    <main className="min-h-screen bg-[#f7f7f5]">
      <Header />

      <section className="border-b border-slate-200 bg-white px-4 py-12 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <p className="font-bold text-orange-500">{t.eyebrow}</p>

          <h1 className="mt-2 text-4xl font-black text-slate-950 sm:text-5xl">
            {t.title}
          </h1>

          <p className="mt-4 max-w-2xl text-slate-600">{t.description}</p>
        </div>
      </section>

      <section className="px-4 py-10 lg:px-8">
        <div className="mx-auto max-w-4xl">
          {loading ? (
            <div className="flex items-center gap-3 rounded-[28px] bg-white p-7 font-bold text-slate-500">
              <Loader2 className="animate-spin" />
              {t.loading}
            </div>
          ) : unauthorized ? (
            <div className="rounded-[28px] bg-white p-10 text-center">
              <p className="font-bold text-slate-600">{t.loginRequired}</p>

              <Link
                href="/login"
                className="mt-6 inline-block rounded-xl bg-orange-500 px-6 py-3 font-black text-white transition hover:bg-orange-600"
              >
                {t.goToLogin}
              </Link>
            </div>
          ) : error ? (
            <div className="rounded-[28px] bg-red-50 p-7 text-center font-bold text-red-600">
              {error}
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center gap-4 rounded-[28px] bg-white p-12 text-center">
              <Package size={32} className="text-slate-300" />
              <p className="font-bold text-slate-500">{t.empty}</p>

              <Link
                href="/products"
                className="rounded-xl bg-orange-500 px-6 py-3 font-black text-white transition hover:bg-orange-600"
              >
                {t.browseProducts}
              </Link>
            </div>
          ) : (
            <div className="space-y-8">
              {openOrders.length > 0 ? (
                <div className="rounded-[28px] bg-red-50 p-6 sm:p-8">
                  <p className="text-xs font-black uppercase tracking-wide text-red-600">
                    {t.openInvoicesTitle}
                  </p>

                  <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <p className="text-3xl font-black text-red-700">
                        {totalOpenAmount.toFixed(2)} €
                      </p>

                      <p className="mt-1 text-sm font-bold text-red-600">
                        {t.openInvoicesCount(openOrders.length)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    {openOrders.map((order) => (
                      <div
                        key={order.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white px-4 py-3"
                      >
                        <div>
                          <p className="font-black text-slate-950">
                            {order.orderNumber}
                          </p>

                          <p className="text-xs text-slate-500">
                            {new Date(order.createdAt).toLocaleDateString(
                              "de-DE",
                            )}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <p className="font-black text-red-600">
                            {order.openPaymentAmount.toFixed(2)} €
                          </p>

                          <button
                            type="button"
                            onClick={() => downloadInvoice(order)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-950 px-3 py-2 text-xs font-black text-white transition hover:bg-slate-800"
                          >
                            <FileDown size={14} />
                            {t.downloadInvoice}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="space-y-4">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-[28px] bg-white p-6 shadow-sm sm:p-8"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold uppercase text-slate-400">
                          {t.orderNumber}
                        </p>

                        <p className="mt-1 text-lg font-black text-slate-950">
                          {order.orderNumber}
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          {new Date(order.createdAt).toLocaleString("de-DE")}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1.5 text-xs font-black ${
                          order.status === "DELIVERED"
                            ? "bg-green-100 text-green-700"
                            : order.status === "CANCELLED"
                              ? "bg-red-100 text-red-600"
                              : "bg-orange-100 text-orange-700"
                        }`}
                      >
                        {statusLabels[order.status][language]}
                      </span>
                    </div>

                    {order.confirmationToken && !order.confirmedAt ? (
                      <p className="mt-3 inline-flex rounded-full bg-amber-100 px-3 py-1.5 text-xs font-black text-amber-800">
                        {language === "de"
                          ? "Wartet auf Ihre Bestätigung per E-Mail-Link"
                          : "E-posta ile onayınızı bekliyor"}
                      </p>
                    ) : null}

                    <div className="mt-5 space-y-2 border-t border-slate-100 pt-4">
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex justify-between text-sm text-slate-600"
                        >
                          <span>
                            {item.quantity} × {item.name}
                          </span>

                          <span>
                            {(item.price * item.quantity).toFixed(2)} €
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-4">
                      {order.openPaymentAmount > 0 ? (
                        <div>
                          <p className="text-xs font-bold uppercase text-red-500">
                            {t.openAmount}
                          </p>

                          <p className="font-black text-red-600">
                            {order.openPaymentAmount.toFixed(2)} €
                          </p>
                        </div>
                      ) : (
                        <span />
                      )}

                      <div className="text-right">
                        <p className="text-xs font-bold uppercase text-slate-400">
                          {t.total}
                        </p>

                        <p className="text-xl font-black text-slate-950">
                          {order.totalAmount.toFixed(2)} €
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex justify-end border-t border-slate-100 pt-4">
                      <button
                        type="button"
                        onClick={() => downloadInvoice(order)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-200"
                      >
                        <FileDown size={14} />
                        {t.downloadInvoice}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
