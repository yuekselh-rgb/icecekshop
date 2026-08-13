"use client";

import {
  ChevronDown,
  Loader2,
  PackageCheck,
  Printer,
  Trash2,
  Truck,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { escapeHtml } from "@/lib/html-escape";
import QRCode from "qrcode";

type OrderStatus =
  | "NEW"
  | "CONFIRMED"
  | "PREPARING"
  | "READY"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";

type PaymentStatus = "OPEN" | "PAID";

type StaffUser = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  role: "ADMIN" | "SUPER_ADMIN";
  name: string;
};

type Driver = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phone: string | null;
};

type Order = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;

  subtotal: number;
  deliveryFee: number;
  pfandAmount: number;
  totalAmount: number;

  approvedPaymentAmount?: number;
  openPaymentAmount?: number;

  deliveryAddress: string;
  customerNote: string | null;

  createdAt: string;
  assignedAt: string | null;
  outForDeliveryAt: string | null;
  deliveredAt: string | null;
  paidAt: string | null;

  driverId: string | null;
  driver: Driver | null;

  user: {
    firstName: string | null;
    lastName: string | null;
    companyName: string | null;
    email: string;
    phone: string | null;
  };

  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    pfand: number;
  }>;

  pfandReturns: Array<{
    id: string;
    totalAmount: number;
    approvedAmount: number | null;
    status: string;

    items: Array<{
      id: string;
      name: string;
      quantity: number;
      approvedQuantity: number | null;
      unitAmount: number;
      totalAmount: number;
      approvedTotal: number | null;
    }>;
  }>;
};

const statusLabels: Record<OrderStatus, { de: string; tr: string }> = {
  NEW: { de: "Neu", tr: "Yeni" },
  CONFIRMED: { de: "Bestätigt", tr: "Onaylandı" },
  PREPARING: { de: "Wird vorbereitet", tr: "Hazırlanıyor" },
  READY: { de: "Bereit", tr: "Hazır" },
  OUT_FOR_DELIVERY: { de: "Unterwegs", tr: "Teslimata Çıktı" },
  DELIVERED: { de: "Geliefert", tr: "Teslim Edildi" },
  CANCELLED: { de: "Storniert", tr: "İptal Edildi" },
};

export default function SuperAdminOrdersPage() {
  const { language } = useLanguage();

  const [orders, setOrders] = useState<Order[]>([]);

  const [drivers, setDrivers] = useState<Driver[]>([]);

  const [staff, setStaff] = useState<StaffUser[]>([]);

  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const [paymentAmountInputs, setPaymentAmountInputs] = useState<
    Record<string, string>
  >({});

  const [settlingOrderId, setSettlingOrderId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [deliveryFilter, setDeliveryFilter] = useState<
    "ALL" | "ACTIVE" | "DELIVERED"
  >("ALL");

  const [paymentFilter, setPaymentFilter] = useState<"ALL" | "OPEN" | "PAID">(
    "ALL",
  );

  const [reportMode, setReportMode] = useState<"DAY" | "RANGE" | "ALL">("DAY");

  const [reportDate, setReportDate] = useState("");

  const [reportStartDate, setReportStartDate] = useState("");

  const [reportEndDate, setReportEndDate] = useState("");

  const [reportDriverId, setReportDriverId] = useState("ALL");

  const [showPaidReport, setShowPaidReport] = useState(true);

  const [showOpenReport, setShowOpenReport] = useState(true);

  const updatingRef = useRef(false);

  async function loadOrders(silent = false) {
    if (silent && updatingRef.current) {
      return;
    }

    if (!silent) {
      setLoading(true);
    }

    try {
      const [response, driversResponse, staffResponse] = await Promise.all([
        fetch("/api/super-admin/orders"),
        fetch("/api/super-admin/drivers"),
        fetch("/api/admin/staff"),
      ]);

      const data = await response.json();

      const driversData = await driversResponse.json();

      const staffData = await staffResponse.json();

      if (!response.ok) {
        setError(
          data.error ||
            (language === "de"
              ? "Bestellungen konnten nicht geladen werden."
              : "Siparişler yüklenemedi."),
        );
        return;
      }

      if (!driversResponse.ok) {
        setError(
          driversData.error ||
            (language === "de"
              ? "Fahrerliste konnte nicht geladen werden."
              : "Şoför listesi yüklenemedi."),
        );
        return;
      }

      if (!staffResponse.ok) {
        setError(
          staffData.error ||
            (language === "de"
              ? "Personalliste konnte nicht geladen werden."
              : "Personel listesi yüklenemedi."),
        );
        return;
      }

      setOrders(data.orders);

      setDrivers(
        driversData.drivers || driversData.soforler || driversData.users || [],
      );

      setStaff(staffData.staff || []);
    } catch {
      setError(
        language === "de"
          ? "Beim Laden der Bestellungen ist ein Fehler aufgetreten."
          : "Siparişler yüklenirken hata oluştu.",
      );
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }

  async function changeStatus(order: Order, status: OrderStatus) {
    if (status === order.status) {
      return;
    }

    updatingRef.current = true;

    setUpdatingOrderId(order.id);
    setError("");

    try {
      const response = await fetch("/api/super-admin/orders/update", {
        method: "PATCH",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          orderId: order.id,
          status,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            (language === "de"
              ? "Bestellstatus konnte nicht geändert werden."
              : "Sipariş durumu değiştirilemedi."),
        );
        return;
      }

      setOrders((current) =>
        current.map((currentOrder) =>
          currentOrder.id === order.id
            ? {
                ...currentOrder,
                ...data.order,
              }
            : currentOrder,
        ),
      );
    } catch {
      setError(
        language === "de"
          ? "Bestellstatus konnte nicht geändert werden."
          : "Sipariş durumu değiştirilemedi.",
      );
    } finally {
      updatingRef.current = false;

      setUpdatingOrderId(null);
    }
  }

  async function assignDriver(order: Order, driverId: string) {
    if (driverId === (order.driverId || "")) {
      return;
    }

    updatingRef.current = true;

    setUpdatingOrderId(order.id);
    setError("");

    try {
      const response = await fetch("/api/super-admin/orders/update", {
        method: "PATCH",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          orderId: order.id,
          driverId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            (language === "de"
              ? "Fahrer konnte nicht geändert werden."
              : "Şoför değiştirilemedi."),
        );
        return;
      }

      setOrders((current) =>
        current.map((currentOrder) =>
          currentOrder.id === order.id
            ? {
                ...currentOrder,
                ...data.order,
              }
            : currentOrder,
        ),
      );
    } catch {
      setError(
        language === "de"
          ? "Fahrer konnte nicht geändert werden."
          : "Şoför değiştirilemedi.",
      );
    } finally {
      updatingRef.current = false;

      setUpdatingOrderId(null);
    }
  }

  async function printOrder(order: Order) {
    const popup = window.open("", "_blank", "width=1000,height=900");

    if (!popup) {
      setError(
        language === "de"
          ? "Druckfenster konnte nicht geöffnet werden."
          : "Yazdırma penceresi açılamadı.",
      );
      return;
    }

    const deliveryQrCode = hasNavigableDeliveryAddress(order)
      ? await getDeliveryQrCode(order)
      : null;

    const pfandReturn = order.pfandReturns?.[0];

    const pfandReturnAmount = pfandReturn
      ? Number(pfandReturn.approvedAmount ?? pfandReturn.totalAmount)
      : 0;

    popup.document.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${escapeHtml(order.orderNumber)}</title>

          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 28px;
              color: #0f172a;
              background: #ffffff;
            }

            h1 {
              margin: 0;
              font-size: 26px;
              line-height: 1.2;
            }

            h2 {
              margin-top: 24px;
              margin-bottom: 8px;
              font-size: 18px;
            }

            .order-header {
              display: grid;
              grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
              gap: 28px;
              border: 1px solid #e2e8f0;
              border-radius: 14px;
              padding: 18px 20px;
              margin-bottom: 22px;
              background: #f8fafc;
            }

            .order-left {
              min-width: 0;
            }

            .order-number {
              font-size: 20px;
              line-height: 1.25;
              font-weight: 800;
              margin-bottom: 14px;
            }

            .customer-name {
              font-size: 16px;
              font-weight: 800;
              margin-bottom: 6px;
            }

            .address {
              white-space: pre-line;
              font-size: 13px;
              line-height: 1.5;
              color: #334155;
            }

            .order-right {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 12px 20px;
              align-content: start;
            }

            .info-item {
              min-width: 0;
            }

            .info-label {
              display: block;
              margin-bottom: 3px;
              font-size: 10px;
              font-weight: 700;
              text-transform: uppercase;
              color: #64748b;
            }

            .info-value {
              font-size: 13px;
              font-weight: 700;
              color: #0f172a;
              word-break: break-word;
            }

            .paid {
              color: #15803d;
            }

            .open-payment {
              color: #dc2626;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 12px;
            }

            th, td {
              border-bottom: 1px solid #e2e8f0;
              text-align: left;
              padding: 10px 8px;
            }

            th {
              background: #f8fafc;
            }

            .totals {
              margin-top: 24px;
              margin-left: auto;
              width: 360px;
            }

            .row {
              display: flex;
              justify-content: space-between;
              padding: 6px 0;
            }

            .total {
              border-top: 2px solid #0f172a;
              margin-top: 8px;
              padding-top: 12px;
              font-size: 20px;
              font-weight: bold;
            }

            .green {
              color: #15803d;
            }

            .address {
              white-space: pre-line;
            }
          </style>
        </head>

        <body>
          <section class="order-header">
            <div class="order-left">
              <div class="order-number">
                ${language === "de" ? "Bestellung" : "Sipariş"} ${escapeHtml(order.orderNumber)}
              </div>

              <div class="customer-name">
                ${escapeHtml(
                  order.user.companyName ||
                    `${order.user.firstName || ""} ${order.user.lastName || ""}`.trim() ||
                    "-",
                )}
              </div>

              <div class="address">
                ${escapeHtml(order.deliveryAddress || "-")}
              </div>

              ${
                deliveryQrCode
                  ? `
                    <div style="margin-top:12px; text-align:center; width:120px;">
                      <img src="${deliveryQrCode}" width="110" height="110" alt="${language === "de" ? "QR-Code für Google Maps" : "Google Maps için QR kodu"}" />
                      <p style="margin:4px 0 0; font-size:10px; color:#64748b;">
                        ${language === "de" ? "In Google Maps öffnen" : "Google Maps'te aç"}
                      </p>
                    </div>
                  `
                  : ""
              }
            </div>

            <div class="order-right">
              <div class="info-item">
                <span class="info-label">
                  ${language === "de" ? "Datum" : "Tarih"}
                </span>

                <span class="info-value">
                  ${new Date(order.createdAt).toLocaleString("de-DE")}
                </span>
              </div>

              <div class="info-item">
                <span class="info-label">
                  ${language === "de" ? "Status" : "Durum"}
                </span>

                <span class="info-value">
                  ${statusLabels[order.status][language]}
                </span>
              </div>

              <div class="info-item">
                <span class="info-label">
                  ${language === "de" ? "Personal" : "Personel"}
                </span>

                <span class="info-value">
                  ${
                    order.driver
                      ? escapeHtml(
                          `${order.driver.firstName || ""} ${order.driver.lastName || ""}`.trim() ||
                            order.driver.email,
                        )
                      : language === "de"
                        ? "Nicht zugewiesen"
                        : "Atanmadı"
                  }
                </span>
              </div>

              <div class="info-item">
                <span class="info-label">
                  ${language === "de" ? "Zahlung" : "Ödeme"}
                </span>

                <span class="info-value ${
                  order.paymentStatus === "PAID" ? "paid" : "open-payment"
                }">
                  ${
                    order.paymentStatus === "PAID"
                      ? language === "de"
                        ? "Bezahlt"
                        : "Parası Ödendi"
                      : language === "de"
                        ? "Zahlung offen"
                        : "Ödeme Açık"
                  }
                </span>
              </div>

              <div class="info-item">
                <span class="info-label">
                  Telefon
                </span>

                <span class="info-value">
                  ${escapeHtml(order.user.phone || "-")}
                </span>
              </div>
            </div>
          </section>

          ${
            order.customerNote
              ? `
                <h2>${language === "de" ? "Kundennotiz" : "Müşteri Notu"}</h2>
                <p>${escapeHtml(order.customerNote)}</p>
              `
              : ""
          }

          <h2>${language === "de" ? "Produkte" : "Ürünler"}</h2>

          <table>
            <thead>
              <tr>
                <th>${language === "de" ? "Produkt" : "Ürün"}</th>
                <th>${language === "de" ? "Menge" : "Adet"}</th>
                <th>${language === "de" ? "Stückpreis" : "Birim Fiyat"}</th>
                <th>${language === "de" ? "Pfand" : "Depozito"}</th>
                <th>${language === "de" ? "Gesamt" : "Toplam"}</th>
              </tr>
            </thead>

            <tbody>
              ${order.items
                .map(
                  (item) => `
                    <tr>
                      <td>${escapeHtml(item.name)}</td>
                      <td>${item.quantity}</td>
                      <td>${Number(item.price).toFixed(2)} €</td>
                      <td>${(Number(item.pfand) * item.quantity).toFixed(
                        2,
                      )} €</td>
                      <td>${(
                        (Number(item.price) + Number(item.pfand)) *
                        item.quantity
                      ).toFixed(2)} €</td>
                    </tr>
                  `,
                )
                .join("")}
            </tbody>
          </table>

          ${
            pfandReturn && pfandReturn.items.length > 0
              ? `
                <h2>${language === "de" ? "Pfandrückgabe / Leergut" : "Depozito İadesi"}</h2>

                <table>
                  <thead>
                    <tr>
                      <th>${language === "de" ? "Pfandtyp" : "Pfand Türü"}</th>
                      <th>${language === "de" ? "Menge" : "Adet"}</th>
                      <th>${language === "de" ? "Einheit" : "Birim"}</th>
                      <th>${language === "de" ? "Gesamt" : "Toplam"}</th>
                    </tr>
                  </thead>

                  <tbody>
                    ${pfandReturn.items
                      .map(
                        (item) => `
                          <tr>
                            <td>${escapeHtml(item.name)}</td>
                            <td>${item.quantity}</td>
                            <td>${Number(item.unitAmount).toFixed(2)} €</td>
                            <td>${Number(item.totalAmount).toFixed(2)} €</td>
                          </tr>
                        `,
                      )
                      .join("")}
                  </tbody>
                </table>
              `
              : ""
          }

          <div class="totals">
            <div class="row">
              <span>${language === "de" ? "Zwischensumme" : "Ara Toplam"}</span>
              <strong>${Number(order.subtotal).toFixed(2)} €</strong>
            </div>

            ${
              Number(order.pfandAmount) > 0
                ? `
                  <div class="row">
                    <span>${language === "de" ? "Produktpfand" : "Ürün Pfandı"}</span>
                    <strong>${Number(order.pfandAmount).toFixed(2)} €</strong>
                  </div>
                `
                : ""
            }

            ${
              pfandReturnAmount > 0
                ? `
                  <div class="row green">
                    <span>${language === "de" ? "Pfandrückgabe" : "Depozito İadesi"}</span>
                    <strong>-${pfandReturnAmount.toFixed(2)} €</strong>
                  </div>
                `
                : ""
            }

            <div class="row">
              <span>${language === "de" ? "Liefergebühr" : "Teslimat Ücreti"}</span>
              <strong>${Number(order.deliveryFee).toFixed(2)} €</strong>
            </div>

            <div class="row total">
              <span>${language === "de" ? "Gesamt" : "Toplam"}</span>
              <strong>${Number(order.totalAmount).toFixed(2)} €</strong>
            </div>
          </div>
        </body>
      </html>
    `);

    popup.document.close();
    popup.focus();

    setTimeout(() => {
      popup.print();
    }, 250);
  }

  async function deleteOrder(order: Order) {
    const confirmed = window.confirm(
      language === "de"
        ? `Soll die Bestellung ${order.orderNumber} in den Papierkorb verschoben werden?`
        : `${order.orderNumber} numaralı sipariş çöp kutusuna taşınsın mı?`,
    );

    if (!confirmed) {
      return;
    }

    setError("");

    try {
      const response = await fetch(`/api/super-admin/orders/${order.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            (language === "de"
              ? "Bestellung konnte nicht gelöscht werden."
              : "Sipariş silinemedi."),
        );
        return;
      }

      setOrders((current) =>
        current.filter((currentOrder) => currentOrder.id !== order.id),
      );
    } catch {
      setError(
        language === "de"
          ? "Beim Löschen der Bestellung ist ein Fehler aufgetreten."
          : "Sipariş silinirken hata oluştu.",
      );
    }
  }

  async function settlePayment(order: Order, amount: number) {
    setSettlingOrderId(order.id);

    setError("");

    try {
      const response = await fetch(
        `/api/super-admin/orders/${order.id}/settle-payment`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            amount,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            (language === "de"
              ? "Zahlung konnte nicht erfasst werden."
              : "Ödeme kaydedilemedi."),
        );
        return;
      }

      setPaymentAmountInputs((current) => {
        const next = { ...current };
        delete next[order.id];
        return next;
      });

      await loadOrders(true);
    } catch {
      setError(
        language === "de"
          ? "Beim Erfassen der Zahlung ist ein Fehler aufgetreten."
          : "Ödeme kaydedilirken hata oluştu.",
      );
    } finally {
      setSettlingOrderId(null);
    }
  }

  useEffect(() => {
    loadOrders();

    const interval = window.setInterval(() => {
      loadOrders(true);
    }, 10000);

    return () => window.clearInterval(interval);
  }, []);

  function getEffectiveOrderTotal(order: Order) {
    const pfandReturn = order.pfandReturns[0];

    const pfandReturnAmount = pfandReturn
      ? Number(pfandReturn.approvedAmount ?? pfandReturn.totalAmount)
      : 0;

    return Number(
      Math.max(
        0,
        order.subtotal +
          order.pfandAmount +
          order.deliveryFee -
          pfandReturnAmount,
      ).toFixed(2),
    );
  }

  const filteredOrders = useMemo(
    () =>
      orders.filter((order) => {
        const deliveryMatches =
          deliveryFilter === "ALL"
            ? true
            : deliveryFilter === "DELIVERED"
              ? order.status === "DELIVERED"
              : order.status !== "DELIVERED" && order.status !== "CANCELLED";

        const paymentMatches =
          paymentFilter === "ALL"
            ? true
            : order.paymentStatus === paymentFilter;

        return deliveryMatches && paymentMatches;
      }),
    [orders, deliveryFilter, paymentFilter],
  );

  const dailyStats = useMemo(() => {
    const today = new Date();

    const todaysOrders = orders.filter((order) => {
      const orderDate = new Date(order.createdAt);

      return (
        orderDate.getFullYear() === today.getFullYear() &&
        orderDate.getMonth() === today.getMonth() &&
        orderDate.getDate() === today.getDate() &&
        order.status !== "CANCELLED"
      );
    });

    const turnover = todaysOrders.reduce(
      (total, order) => total + order.totalAmount,
      0,
    );

    const paid = todaysOrders.reduce(
      (total, order) =>
        order.paymentStatus === "PAID" ? total + order.totalAmount : total,
      0,
    );

    return {
      orderCount: todaysOrders.length,

      turnover: Number(turnover.toFixed(2)),

      paid: Number(paid.toFixed(2)),
    };
  }, [orders]);

  function getReportActivityDate(order: Order) {
    const value =
      order.deliveredAt ||
      order.outForDeliveryAt ||
      order.assignedAt ||
      order.createdAt;

    const date = new Date(value);

    return Number.isNaN(date.getTime()) ? null : date;
  }

  function getLocalDateKey(date: Date) {
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");
  }

  function isBarSale(order: Order) {
    return order.orderNumber.startsWith("BAR-");
  }

  /*
   * Bar-Satışı-Bestellungen ohne echte Lieferadresse (Verkauf direkt
   * an der Theke) markieren deliveryAddress mit diesem Platzhalter-
   * Präfix. Offene Bar-Verkäufe MIT echter Lieferadresse sollen aber
   * navigierbar bleiben (z. B. Lieferung an ein Restaurant/Imbiss).
   */
  function hasNavigableDeliveryAddress(order: Order) {
    return (
      Boolean(order.deliveryAddress) &&
      !order.deliveryAddress.startsWith("Barverkauf") &&
      !order.deliveryAddress.startsWith("Bar Satışı") &&
      !order.deliveryAddress.startsWith("DEPODAN TESLİM")
    );
  }

  function getMapsQuery(order: Order) {
    return order.deliveryAddress
      .split("\n")
      .filter(
        (line) => !line.startsWith("Telefon:") && !line.startsWith("Kat:") && !line.startsWith("Zil:"),
      )
      .join(", ");
  }

  async function getDeliveryQrCode(order: Order) {
    const redirectUrl = `${window.location.origin}/api/maps-redirect?address=${encodeURIComponent(getMapsQuery(order))}`;

    try {
      return await QRCode.toDataURL(redirectUrl, {
        width: 160,
        margin: 1,
      });
    } catch {
      return null;
    }
  }

  function getCustomerNoteValue(order: Order, label: string) {
    if (!order.customerNote) {
      return "";
    }

    const normalizedLabel = label.toLocaleLowerCase("tr-TR");

    const line = order.customerNote
      .split("\n")
      .find((item) =>
        item.trim().toLocaleLowerCase("tr-TR").startsWith(normalizedLabel),
      );

    if (!line) {
      return "";
    }

    const separatorIndex = line.indexOf(":");

    return separatorIndex >= 0 ? line.slice(separatorIndex + 1).trim() : "";
  }

  function getBarSellerName(order: Order) {
    return (
      getCustomerNoteValue(order, "Satışı yapan:") ||
      (language === "de" ? "Unbekannter Mitarbeiter" : "Bilinmeyen Personel")
    );
  }

  function getReportActorName(order: Order) {
    if (isBarSale(order)) {
      return getBarSellerName(order);
    }

    if (order.driver) {
      return (
        `${order.driver.firstName || ""} ${order.driver.lastName || ""}`.trim() ||
        order.driver.email
      );
    }

    return language === "de" ? "Nicht zugewiesen" : "Atanmamış";
  }

  function matchesSelectedReportPerson(order: Order) {
    if (reportDriverId === "ALL") {
      return true;
    }

    if (reportDriverId.startsWith("driver:")) {
      return (
        !isBarSale(order) &&
        order.driverId === reportDriverId.slice("driver:".length)
      );
    }

    if (reportDriverId.startsWith("bar:")) {
      return (
        isBarSale(order) &&
        getBarSellerName(order) === reportDriverId.slice("bar:".length)
      );
    }

    return false;
  }

  function getOrderReportDate(order: Order) {
    const value =
      order.paymentStatus === "PAID"
        ? order.paidAt ||
          order.deliveredAt ||
          order.outForDeliveryAt ||
          order.assignedAt ||
          order.createdAt
        : order.deliveredAt ||
          order.outForDeliveryAt ||
          order.assignedAt ||
          order.createdAt;

    const date = new Date(value);

    return Number.isNaN(date.getTime()) ? null : date;
  }

  const reportActivityOrders = useMemo(
    () =>
      orders.filter((order) => {
        if (order.status === "CANCELLED") {
          return false;
        }

        if (!isBarSale(order) && (!order.driverId || !order.driver)) {
          return false;
        }

        return Boolean(getOrderReportDate(order));
      }),
    [orders],
  );

  const reportDateKeys = useMemo(() => {
    const keys = new Set<string>();

    for (const order of reportActivityOrders) {
      const date = getOrderReportDate(order);

      if (!date) {
        continue;
      }

      keys.add(getLocalDateKey(date));
    }

    return Array.from(keys).sort();
  }, [reportActivityOrders]);

  const todayDateKey = getLocalDateKey(new Date());

  const effectiveReportDate =
    reportDate || reportDateKeys[reportDateKeys.length - 1] || todayDateKey;

  const effectiveReportStartDate =
    reportStartDate || reportDateKeys[0] || todayDateKey;

  const effectiveReportEndDate =
    reportEndDate || reportDateKeys[reportDateKeys.length - 1] || todayDateKey;

  const normalizedReportStartDate =
    effectiveReportStartDate <= effectiveReportEndDate
      ? effectiveReportStartDate
      : effectiveReportEndDate;

  const normalizedReportEndDate =
    effectiveReportStartDate <= effectiveReportEndDate
      ? effectiveReportEndDate
      : effectiveReportStartDate;

  function matchesReportPeriod(order: Order) {
    if (reportMode === "ALL") {
      return true;
    }

    const date = getOrderReportDate(order);

    if (!date) {
      return false;
    }

    const dateKey = getLocalDateKey(date);

    if (reportMode === "DAY") {
      /*
       * Açık alacaklar seçilen güne kadar
       * birikimli görünür.
       */
      if (order.paymentStatus === "OPEN") {
        return dateKey <= effectiveReportDate;
      }

      return dateKey === effectiveReportDate;
    }

    return (
      dateKey >= normalizedReportStartDate && dateKey <= normalizedReportEndDate
    );
  }

  const reportPersonOptions = useMemo(() => {
    const people = new Map<
      string,
      {
        id: string;
        name: string;
      }
    >();

    // Kayıtlı bütün şoförler
    for (const driver of drivers) {
      const name =
        `${driver.firstName || ""} ${driver.lastName || ""}`.trim() ||
        driver.email;

      people.set(`driver:${driver.id}`, {
        id: `driver:${driver.id}`,
        name: `${name} · ${language === "de" ? "Fahrer" : "Şoför"}`,
      });
    }

    // Kayıtlı bütün Admin ve Super Admin hesapları
    for (const person of staff) {
      const name = person.name.trim() || person.email;

      const displayName =
        person.role === "SUPER_ADMIN" &&
        name.toLocaleLowerCase("tr-TR") === "super admin"
          ? "Super Admin"
          : `${name} · ${
              person.role === "SUPER_ADMIN" ? "Super Admin" : "Admin"
            }`;

      people.set(`bar:${name}`, {
        id: `bar:${name}`,
        name: displayName,
      });
    }

    // Eski bar satış kayıtlarındaki personeller
    for (const order of reportActivityOrders) {
      if (!isBarSale(order)) {
        continue;
      }

      const seller = getBarSellerName(order).trim();

      if (!seller) {
        continue;
      }

      const key = `bar:${seller}`;

      if (!people.has(key)) {
        people.set(key, {
          id: key,
          name: `${seller} · ${language === "de" ? "Barverkauf" : "Bar Satışı"}`,
        });
      }
    }

    return Array.from(people.values()).sort((first, second) =>
      first.name.localeCompare(second.name, "tr"),
    );
  }, [drivers, staff, reportActivityOrders]);

  const selectedReportOrders = useMemo(
    () =>
      reportActivityOrders
        .filter((order) => {
          const periodMatches = matchesReportPeriod(order);

          const personMatches = matchesSelectedReportPerson(order);

          return periodMatches && personMatches;
        })
        .sort((first, second) => {
          const firstDate = getOrderReportDate(first)?.getTime() || 0;

          const secondDate = getOrderReportDate(second)?.getTime() || 0;

          return secondDate - firstDate;
        }),
    [
      reportActivityOrders,
      reportMode,
      effectiveReportDate,
      normalizedReportStartDate,
      normalizedReportEndDate,
      reportDriverId,
    ],
  );

  const paidReportOrders = useMemo(
    () =>
      selectedReportOrders.filter((order) => order.paymentStatus === "PAID"),
    [selectedReportOrders],
  );

  const openReportOrders = useMemo(
    () =>
      selectedReportOrders.filter((order) => order.paymentStatus === "OPEN"),
    [selectedReportOrders],
  );

  const reportSummary = useMemo(() => {
    const paidAmount = paidReportOrders.reduce(
      (total, order) => total + getEffectiveOrderTotal(order),
      0,
    );

    const openAmount = openReportOrders.reduce(
      (total, order) => total + getEffectiveOrderTotal(order),
      0,
    );

    const deliveredCount = selectedReportOrders.filter(
      (order) => order.status === "DELIVERED",
    ).length;

    return {
      visitCount: selectedReportOrders.length,

      deliveredCount,

      paidCount: paidReportOrders.length,

      openCount: openReportOrders.length,

      paidAmount: Number(paidAmount.toFixed(2)),

      openAmount: Number(openAmount.toFixed(2)),

      totalAmount: Number((paidAmount + openAmount).toFixed(2)),
    };
  }, [selectedReportOrders, paidReportOrders, openReportOrders]);

  const superAdminCashSummary = useMemo(() => {
    const selectedMonth = effectiveReportDate.slice(0, 7);

    let dailyPaid = 0;
    let dailyOpen = 0;
    let monthlyPaid = 0;
    let monthlyOpen = 0;

    for (const order of reportActivityOrders) {
      const orderDate = getOrderReportDate(order);

      if (!orderDate) {
        continue;
      }

      const personMatches = matchesSelectedReportPerson(order);

      if (!personMatches) {
        continue;
      }

      const orderDateKey = getLocalDateKey(orderDate);

      const orderMonthKey = orderDateKey.slice(0, 7);

      const amount = getEffectiveOrderTotal(order);

      if (orderDateKey === effectiveReportDate) {
        if (order.paymentStatus === "PAID") {
          dailyPaid += amount;
        } else {
          dailyOpen += amount;
        }
      }

      if (orderMonthKey === selectedMonth) {
        if (order.paymentStatus === "PAID") {
          monthlyPaid += amount;
        } else {
          monthlyOpen += amount;
        }
      }
    }

    return {
      dailyPaid: Number(dailyPaid.toFixed(2)),

      dailyOpen: Number(dailyOpen.toFixed(2)),

      dailyTotal: Number((dailyPaid + dailyOpen).toFixed(2)),

      monthlyPaid: Number(monthlyPaid.toFixed(2)),

      monthlyOpen: Number(monthlyOpen.toFixed(2)),

      monthlyTotal: Number((monthlyPaid + monthlyOpen).toFixed(2)),
    };
  }, [reportActivityOrders, effectiveReportDate, reportDriverId]);

  const reportDailyRows = useMemo(() => {
    type DailyReportRow = {
      dateKey: string;
      dateLabel: string;
      driverName: string;
      orderCount: number;
      paidCount: number;
      openCount: number;
      paidAmount: number;
      openAmount: number;
      totalAmount: number;
    };

    /*
     * Tek Gün modunda yalnızca seçilen günün
     * gerçek kayıtlarını günlük tabloda göster.
     *
     * Açık bakiyeler üst özet ve açık siparişler
     * listesinde birikimli kalabilir; fakat burada
     * önceki günler ayrı satır olarak görünmez.
     */
    const dailySourceOrders =
      reportMode === "DAY"
        ? reportActivityOrders.filter((order) => {
            const date = getOrderReportDate(order);

            if (!date) {
              return false;
            }

            const personMatches = matchesSelectedReportPerson(order);

            return (
              getLocalDateKey(date) === effectiveReportDate && personMatches
            );
          })
        : selectedReportOrders;

    const grouped = new Map<string, DailyReportRow>();

    for (const order of dailySourceOrders) {
      const date = getOrderReportDate(order);

      if (!date) {
        continue;
      }

      const dateKey = getLocalDateKey(date);

      const driverName = getReportActorName(order);

      const groupKey = `${dateKey}_${driverName}`;

      const current = grouped.get(groupKey) || {
        driverName,
        dateKey,

        dateLabel: date.toLocaleDateString("de-DE"),

        orderCount: 0,
        paidCount: 0,
        openCount: 0,
        paidAmount: 0,
        openAmount: 0,
        totalAmount: 0,
      };

      const orderTotal = getEffectiveOrderTotal(order);

      current.orderCount += 1;

      current.totalAmount += orderTotal;

      if (order.paymentStatus === "PAID") {
        current.paidCount += 1;

        current.paidAmount += orderTotal;
      } else {
        current.openCount += 1;

        current.openAmount += orderTotal;
      }

      grouped.set(groupKey, current);
    }

    return Array.from(grouped.values())
      .map((row) => ({
        ...row,

        paidAmount: Number(row.paidAmount.toFixed(2)),

        openAmount: Number(row.openAmount.toFixed(2)),

        totalAmount: Number(row.totalAmount.toFixed(2)),
      }))
      .sort((first, second) => second.dateKey.localeCompare(first.dateKey));
  }, [
    reportMode,
    reportActivityOrders,
    selectedReportOrders,
    effectiveReportDate,
    reportDriverId,
  ]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 font-bold text-slate-600">
          <Loader2 className="animate-spin" />
          {language === "de" ? "Bestellungen werden geladen..." : "Siparişler yükleniyor..."}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl">
      <section className="rounded-[32px] bg-slate-950 p-7 text-white sm:p-10">
          <PackageCheck size={30} className="text-orange-400" />

          <h1 className="mt-4 text-4xl font-black">{language === "de" ? "Alle Bestellungen" : "Tüm Siparişler"}</h1>

          <p className="mt-3 text-slate-400">
            {language === "de"
              ? "Alle Bestellungen, Fahrerinformationen und Zahlungsstatus einsehen."
              : "Tüm siparişleri, şoför bilgilerini ve ödeme durumlarını görüntüleyin."}
          </p>
        </section>

        {error ? (
          <div className="mt-6 rounded-2xl bg-red-50 p-5 font-bold text-red-600">
            {error}
          </div>
        ) : null}

        <section className="mt-6 grid grid-cols-2 items-start gap-2 lg:grid-cols-5">
          <div className="self-start rounded-xl bg-slate-950 px-4 py-3 text-white shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
              {language === "de" ? "Tageskasse Gesamt" : "Günlük Toplam Kasa"}
            </p>

            <p className="mt-1 text-xl font-black leading-none">
              {superAdminCashSummary.dailyTotal.toFixed(2)} €
            </p>

            <p className="mt-2 text-[10px] font-bold text-slate-400">
              {language === "de" ? "Bezahlt + offen" : "Ödenmiş + açık"}
            </p>
          </div>

          <div className="self-start rounded-xl bg-green-50 px-4 py-3 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-wide text-green-700">
              {language === "de" ? "Täglich Eingenommen" : "Günlük Tahsil Edilen"}
            </p>

            <p className="mt-1 text-xl font-black leading-none text-green-900">
              {superAdminCashSummary.dailyPaid.toFixed(2)} €
            </p>
          </div>

          <div className="self-start rounded-xl bg-red-50 px-4 py-3 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-wide text-red-700">
              {language === "de" ? "Täglicher Offener Betrag" : "Günlük Açık Tutar"}
            </p>

            <p className="mt-1 text-xl font-black leading-none text-red-900">
              {superAdminCashSummary.dailyOpen.toFixed(2)} €
            </p>
          </div>

          <div className="self-start rounded-xl bg-blue-50 px-4 py-3 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-wide text-blue-700">
              {language === "de" ? "Monatskasse" : "Aylık Kasa"}
            </p>

            <p className="mt-1 text-xl font-black leading-none text-blue-950">
              {superAdminCashSummary.monthlyTotal.toFixed(2)} €
            </p>

            <p className="mt-2 text-[10px] font-bold text-blue-700">
              {language === "de" ? "Bezahlt + offen" : "Ödenmiş + açık"}
            </p>
          </div>

          <div className="self-start rounded-xl bg-orange-50 px-4 py-3 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-wide text-orange-700">
              {language === "de" ? "Monatlicher Offener Betrag" : "Aylık Açık Tutar"}
            </p>

            <p className="mt-1 text-xl font-black leading-none text-orange-900">
              {superAdminCashSummary.monthlyOpen.toFixed(2)} €
            </p>
          </div>
        </section>

        <section className="mt-6 rounded-[28px] bg-white p-5 shadow-sm">
          <div>
            <h2 className="text-xl font-black text-slate-950">
              {language === "de"
                ? "Personal-Bestell- und Inkassobericht"
                : "Personel Sipariş ve Tahsilat Raporu"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {language === "de"
                ? "Bericht für einen einzelnen Tag, einen Zeitraum oder alle Zeiten anzeigen."
                : "Tek gün, tarih aralığı veya tüm zamanlar için rapor görüntüleyin."}
            </p>
          </div>

          <div className="mt-5 rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-black uppercase text-slate-500">
              {language === "de" ? "Berichtstyp" : "Rapor Türü"}
            </p>

            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setReportMode("DAY");

                  setReportDriverId("ALL");
                }}
                className={`rounded-xl px-4 py-2 text-2xl font-black transition ${
                  reportMode === "DAY"
                    ? "bg-orange-500 text-white"
                    : "bg-white text-slate-700 hover:bg-orange-50"
                }`}
              >
                {language === "de" ? "Ein Tag" : "Tek Gün"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setReportMode("RANGE");

                  setReportDriverId("ALL");
                }}
                className={`rounded-xl px-4 py-2 text-2xl font-black transition ${
                  reportMode === "RANGE"
                    ? "bg-slate-950 text-white"
                    : "bg-white text-slate-700 hover:bg-slate-100"
                }`}
              >
                {language === "de" ? "Zeitraum" : "Tarih Aralığı"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setReportMode("ALL");

                  setReportDriverId("ALL");
                }}
                className={`rounded-xl px-4 py-2 text-2xl font-black transition ${
                  reportMode === "ALL"
                    ? "bg-green-600 text-white"
                    : "bg-white text-slate-700 hover:bg-green-50"
                }`}
              >
                {language === "de" ? "Alle Zeiten" : "Tüm Zamanlar"}
              </button>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {reportMode === "DAY" ? (
                <label>
                  <span className="text-xs font-black uppercase text-slate-500">
                    {language === "de" ? "Datum" : "Tarih"}
                  </span>

                  <input
                    type="date"
                    value={effectiveReportDate}
                    onChange={(event) => {
                      setReportDate(event.target.value);

                      setReportDriverId("ALL");
                    }}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-950 outline-none focus:border-orange-500"
                  />
                </label>
              ) : null}

              {reportMode === "RANGE" ? (
                <>
                  <label>
                    <span className="text-xs font-black uppercase text-slate-500">
                      {language === "de" ? "Startdatum" : "Başlangıç Tarihi"}
                    </span>

                    <input
                      type="date"
                      value={effectiveReportStartDate}
                      onChange={(event) => {
                        setReportStartDate(event.target.value);

                        setReportDriverId("ALL");
                      }}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-950 outline-none focus:border-orange-500"
                    />
                  </label>

                  <label>
                    <span className="text-xs font-black uppercase text-slate-500">
                      {language === "de" ? "Enddatum" : "Bitiş Tarihi"}
                    </span>

                    <input
                      type="date"
                      value={effectiveReportEndDate}
                      onChange={(event) => {
                        setReportEndDate(event.target.value);

                        setReportDriverId("ALL");
                      }}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-950 outline-none focus:border-orange-500"
                    />
                  </label>
                </>
              ) : null}

              <label>
                <span className="text-xs font-black uppercase text-slate-500">
                  {language === "de" ? "Fahrer" : "Şoför"}
                </span>

                <select
                  value={reportDriverId}
                  onChange={(event) => setReportDriverId(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-950 outline-none focus:border-orange-500"
                >
                  <option value="ALL">{language === "de" ? "Gesamtes Personal" : "Tüm Personel"}</option>

                  {reportPersonOptions.map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div
            className="mt-5 grid gap-4"
            style={{
              gridTemplateColumns: "repeat(4, minmax(170px, 1fr))",
            }}
          >
            <div className="rounded-2xl bg-slate-950 px-5 py-5 text-white">
              <p className="text-xs font-black uppercase leading-none text-slate-400">
                {language === "de" ? "Bestellungen Gesamt" : "Toplam Sipariş"}
              </p>

              <p className="mt-0.5 text-2xl font-black leading-none">
                {reportSummary.totalAmount.toFixed(2)} €
              </p>
            </div>

            <div className="rounded-2xl bg-slate-100 px-5 py-5">
              <p className="text-xs font-black uppercase leading-none text-slate-500">
                {language === "de" ? "Zum Kunden gefahren" : "Müşteriye Gitti"}
              </p>

              <p className="mt-0.5 text-2xl font-black leading-none text-slate-950">
                {reportSummary.visitCount}
              </p>
            </div>

            <div className="rounded-2xl bg-blue-50 px-5 py-5">
              <p className="text-xs font-black uppercase leading-none text-blue-700">
                {language === "de" ? "Geliefert" : "Teslim Etti"}
              </p>

              <p className="mt-0.5 text-2xl font-black leading-none text-blue-900">
                {reportSummary.deliveredCount}
              </p>
            </div>

            <div className="rounded-2xl bg-green-50 px-5 py-5">
              <p className="text-xs font-black uppercase leading-none text-green-700">
                {language === "de" ? "Bezahlt Erhalten" : "Parası Alındı"}
              </p>

              <p className="mt-0.5 text-2xl font-black leading-none text-green-900">
                {reportSummary.paidCount}
              </p>
            </div>

            <div className="rounded-2xl bg-red-50 px-5 py-5">
              <p className="text-xs font-black uppercase leading-none text-red-700">
                {language === "de" ? "Zahlung Offen" : "Ödeme Açık"}
              </p>

              <p className="mt-0.5 text-2xl font-black leading-none text-red-900">
                {reportSummary.openCount}
              </p>
            </div>

            <div className="rounded-2xl bg-green-50 px-5 py-5">
              <p className="text-xs font-black uppercase leading-none text-green-700">
                {language === "de" ? "Eingenommen" : "Tahsil Edilen"}
              </p>

              <p className="mt-0.5 text-2xl font-black leading-none text-green-900">
                {reportSummary.paidAmount.toFixed(2)} €
              </p>
            </div>

            <div className="rounded-2xl bg-red-50 px-5 py-5">
              <p className="text-xs font-black uppercase leading-none text-red-700">
                {language === "de" ? "Offener Betrag" : "Açık Tutar"}
              </p>

              <p className="mt-0.5 text-2xl font-black leading-none text-red-900">
                {reportSummary.openAmount.toFixed(2)} €
              </p>
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
            <div className="bg-slate-100 px-4 py-3">
              <h3 className="font-black text-slate-950">{language === "de" ? "Tagesbericht" : "Gün Gün Rapor"}</h3>
            </div>

            {reportDailyRows.length === 0 ? (
              <p className="p-4 text-sm text-slate-500">
                {language === "de"
                  ? "Für den ausgewählten Bericht gibt es keine Bestellungen."
                  : "Seçilen rapor için sipariş bulunmuyor."}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-[820px] w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs font-black uppercase text-slate-500">
                      <th className="px-4 py-2">{language === "de" ? "Datum" : "Tarih"}</th>

                      <th className="px-4 py-2">{language === "de" ? "Fahrer" : "Şoför"}</th>

                      <th className="px-4 py-2 text-center">{language === "de" ? "Bestellung" : "Sipariş"}</th>

                      <th className="px-4 py-2 text-center">{language === "de" ? "Bezahlt" : "Ödendi"}</th>

                      <th className="px-4 py-2 text-center">{language === "de" ? "Offen" : "Açık"}</th>

                      <th className="px-4 py-2 text-right">{language === "de" ? "Eingenommen" : "Tahsil Edilen"}</th>

                      <th className="px-4 py-2 text-right">{language === "de" ? "Offener Betrag" : "Açık Tutar"}</th>

                      <th className="px-4 py-2 text-right">{language === "de" ? "Gesamt" : "Toplam"}</th>
                    </tr>
                  </thead>

                  <tbody>
                    {reportDailyRows.map((row) => (
                      <tr
                        key={`${row.dateKey}::${row.driverName}`}
                        className="border-t border-slate-200"
                      >
                        <td className="px-4 py-2 font-black text-slate-950">
                          {row.dateLabel}
                        </td>

                        <td className="px-4 py-2 font-bold">
                          {row.driverName}
                        </td>

                        <td className="px-4 py-2 text-center font-bold">
                          {row.orderCount}
                        </td>

                        <td className="px-4 py-2 text-center font-black text-green-700">
                          {row.paidCount}
                        </td>

                        <td className="px-4 py-2 text-center font-black text-red-600">
                          {row.openCount}
                        </td>

                        <td className="px-4 py-2 text-right font-black text-green-700">
                          {row.paidAmount.toFixed(2)} €
                        </td>

                        <td className="px-4 py-2 text-right font-black text-red-600">
                          {row.openAmount.toFixed(2)} €
                        </td>

                        <td className="px-4 py-2 text-right font-black text-slate-950">
                          {row.totalAmount.toFixed(2)} €
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-2">
            <div className="overflow-hidden rounded-2xl border border-green-200">
              <button
                type="button"
                onClick={() => setShowPaidReport((current) => !current)}
                aria-expanded={showPaidReport}
                className="flex w-full items-center justify-between bg-green-50 px-4 py-3 text-left transition hover:bg-green-100"
              >
                <div>
                  <h3 className="font-black text-green-900">
                    {language === "de" ? "Bezahlt Erhalten" : "Parası Alınanlar"}
                  </h3>

                  <p className="mt-0.5 text-xs font-bold text-green-700">
                    {showPaidReport
                      ? language === "de"
                        ? "Liste schließen"
                        : "Listeyi kapat"
                      : language === "de"
                        ? "Liste öffnen"
                        : "Listeyi aç"}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-black text-green-800">
                    {reportSummary.paidAmount.toFixed(2)} €
                  </span>

                  <ChevronDown
                    size={20}
                    className={`text-green-800 transition-transform ${
                      showPaidReport ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </button>

              {showPaidReport ? (
                paidReportOrders.length === 0 ? (
                  <p className="p-4 text-sm text-slate-500">
                    {language === "de"
                      ? "Keine eingenommenen Bestellungen vorhanden."
                      : "Tahsil edilmiş sipariş bulunmuyor."}
                  </p>
                ) : (
                  <div className="divide-y divide-green-100">
                    {paidReportOrders.map((order) => {
                      const customerName =
                        order.user.companyName ||
                        `${order.user.firstName || ""} ${order.user.lastName || ""}`.trim() ||
                        order.user.email;

                      return (
                        <div
                          key={order.id}
                          className="grid gap-2 p-4 sm:grid-cols-[1fr_auto]"
                        >
                          <div>
                            <p className="text-xs font-black text-orange-500">
                              {order.orderNumber}
                            </p>

                            <p className="font-black text-slate-950">
                              {customerName}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {language === "de" ? "Zahlung:" : "Ödeme:"}{" "}
                              {order.paidAt
                                ? new Date(order.paidAt).toLocaleString("de-DE")
                                : language === "de"
                                  ? "Kein Zeitstempel"
                                  : "Zaman kaydı yok"}
                            </p>
                          </div>

                          <p className="font-black text-green-700">
                            {getEffectiveOrderTotal(order).toFixed(2)} €
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )
              ) : null}
            </div>

            <div className="overflow-hidden rounded-2xl border border-red-200">
              <button
                type="button"
                onClick={() => setShowOpenReport((current) => !current)}
                aria-expanded={showOpenReport}
                className="flex w-full items-center justify-between bg-red-50 px-4 py-3 text-left transition hover:bg-red-100"
              >
                <div>
                  <h3 className="font-black text-red-900">
                    {language === "de" ? "Offene Zahlungen" : "Ödemesi Açık Kalanlar"}
                  </h3>

                  <p className="mt-0.5 text-xs font-bold text-red-700">
                    {showOpenReport
                      ? language === "de"
                        ? "Liste schließen"
                        : "Listeyi kapat"
                      : language === "de"
                        ? "Liste öffnen"
                        : "Listeyi aç"}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-black text-red-800">
                    {reportSummary.openAmount.toFixed(2)} €
                  </span>

                  <ChevronDown
                    size={20}
                    className={`text-red-800 transition-transform ${
                      showOpenReport ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </button>

              {showOpenReport ? (
                openReportOrders.length === 0 ? (
                  <p className="p-4 text-sm text-slate-500">
                    {language === "de"
                      ? "Keine offenen Zahlungen vorhanden."
                      : "Açık ödeme bulunmuyor."}
                  </p>
                ) : (
                  <div className="divide-y divide-red-100">
                    {openReportOrders.map((order) => {
                      const customerName =
                        order.user.companyName ||
                        `${order.user.firstName || ""} ${order.user.lastName || ""}`.trim() ||
                        order.user.email;

                      return (
                        <div
                          key={order.id}
                          className="grid gap-2 p-4 sm:grid-cols-[1fr_auto]"
                        >
                          <div>
                            <p className="text-xs font-black text-orange-500">
                              {order.orderNumber}
                            </p>

                            <p className="font-black text-slate-950">
                              {customerName}
                            </p>

                            <p className="mt-1 text-xs font-bold text-red-600">
                              {language === "de"
                                ? "Zahlung noch offen"
                                : "Ödeme hâlâ açık"}
                            </p>

                            <p className="mt-0.5 text-xs text-slate-500">
                              {language === "de" ? "Datum:" : "Tarih:"}{" "}
                              {new Date(
                                order.assignedAt || order.createdAt,
                              ).toLocaleString("de-DE")}
                            </p>
                          </div>

                          <p className="font-black text-red-700">
                            {getEffectiveOrderTotal(order).toFixed(2)} €
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )
              ) : null}
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[28px] bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setDeliveryFilter("ALL");

                setPaymentFilter("ALL");
              }}
              className={`rounded-xl px-4 py-2 text-2xl font-black transition ${
                deliveryFilter === "ALL" && paymentFilter === "ALL"
                  ? "bg-orange-500 text-white"
                  : "bg-orange-50 text-orange-700 hover:bg-orange-100"
              }`}
            >
              {language === "de" ? "Alle Bestellungen" : "Tüm Siparişler"}
            </button>

            <button
              type="button"
              onClick={() => {
                setDeliveryFilter("ACTIVE");

                setPaymentFilter("ALL");
              }}
              className={`rounded-xl px-4 py-2 text-2xl font-black transition ${
                deliveryFilter === "ACTIVE" && paymentFilter === "ALL"
                  ? "bg-slate-950 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {language === "de" ? "Aktive Bestellungen" : "Aktif Siparişler"}
            </button>

            <button
              type="button"
              onClick={() => {
                setDeliveryFilter("DELIVERED");

                setPaymentFilter("ALL");
              }}
              className={`rounded-xl px-4 py-2 text-2xl font-black transition ${
                deliveryFilter === "DELIVERED" && paymentFilter === "ALL"
                  ? "bg-green-600 text-white"
                  : "bg-green-50 text-green-700 hover:bg-green-100"
              }`}
            >
              {language === "de" ? "Gelieferte" : "Teslim Edilenler"}
            </button>

            <div className="mx-1 hidden h-8 w-px bg-slate-200 lg:block" />

            <button
              type="button"
              onClick={() => {
                setDeliveryFilter("ALL");

                setPaymentFilter("OPEN");
              }}
              className={`rounded-xl px-4 py-2 text-2xl font-black transition ${
                paymentFilter === "OPEN"
                  ? "bg-red-600 text-white"
                  : "bg-red-50 text-red-700 hover:bg-red-100"
              }`}
            >
              {language === "de" ? "Zahlung Offen" : "Ödeme Açık"}
            </button>

            <button
              type="button"
              onClick={() => {
                setDeliveryFilter("ALL");

                setPaymentFilter("PAID");
              }}
              className={`rounded-xl px-4 py-2 text-2xl font-black transition ${
                paymentFilter === "PAID"
                  ? "bg-green-600 text-white"
                  : "bg-green-50 text-green-700 hover:bg-green-100"
              }`}
            >
              {language === "de" ? "Bezahlt" : "Parası Ödendi"}
            </button>

            <Link
              href="/super-admin/trash"
              className="ml-0 inline-flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2 text-2xl font-black text-red-700 transition hover:bg-red-100 xl:ml-auto"
            >
              <Trash2 size={16} />
              {language === "de" ? "Papierkorb" : "Çöp Kutusu"}
            </Link>
          </div>

          {filteredOrders.length === 0 ? (
            <p className="mt-8 text-slate-500">
              {language === "de"
                ? "Für diesen Filter gibt es keine Bestellungen."
                : "Bu filtreye uygun sipariş bulunmuyor."}
            </p>
          ) : (
            <div className="mt-6 space-y-4">
              {filteredOrders.map((order) => {
                const customer =
                  order.user.companyName ||
                  `${order.user.firstName || ""} ${order.user.lastName || ""}`.trim();

                const driver = order.driver
                  ? `${order.driver.firstName || ""} ${order.driver.lastName || ""}`.trim() ||
                    order.driver.email
                  : language === "de"
                    ? "Nicht zugewiesen"
                    : "Atanmadı";

                return (
                  <article
                    key={order.id}
                    className="rounded-xl border border-slate-200 px-3 py-2.5"
                  >
                    <div className="grid items-start gap-2.5 md:grid-cols-2 xl:grid-cols-6">
                      <div className="xl:col-span-2">
                        <p className="text-base font-black leading-tight text-orange-500">
                          {order.orderNumber}
                        </p>

                        <h2 className="mt-0.5 text-sm font-black leading-tight text-slate-950">
                          {customer}
                        </h2>

                        <p className="mt-0.5 text-xs text-slate-500">
                          {new Date(order.createdAt).toLocaleString("de-DE")}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] font-bold uppercase text-slate-400">
                          {language === "de" ? "Status" : "Durum"}
                        </p>

                        <select
                          value={order.status}
                          disabled={updatingOrderId === order.id}
                          onChange={(event) =>
                            changeStatus(
                              order,
                              event.target.value as OrderStatus,
                            )
                          }
                          className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-bold text-slate-950 outline-none focus:border-orange-500 disabled:bg-slate-100"
                        >
                          {Object.entries(statusLabels).map(
                            ([value, label]) => (
                              <option key={value} value={value}>
                                {label[language]}
                              </option>
                            ),
                          )}
                        </select>
                      </div>

                      <div>
                        <p className="flex items-center gap-1 text-[10px] font-bold uppercase text-slate-400">
                          <Truck size={14} />
                          {language === "de" ? "Fahrer" : "Şoför"}
                        </p>

                        <select
                          value={order.driverId || ""}
                          disabled={updatingOrderId === order.id}
                          onChange={(event) =>
                            assignDriver(order, event.target.value)
                          }
                          className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-bold text-slate-950 outline-none focus:border-orange-500 disabled:bg-slate-100"
                        >
                          <option value="">{language === "de" ? "Kein Fahrer zugewiesen" : "Şoför atanmadı"}</option>

                          {drivers.map((driver) => (
                            <option key={driver.id} value={driver.id}>
                              {`${driver.firstName || ""} ${driver.lastName || ""}`.trim() ||
                                driver.email}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <p className="flex items-center gap-1 text-[10px] font-bold uppercase text-slate-400">
                          <WalletCards size={14} />
                          {language === "de" ? "Zahlung" : "Ödeme"}
                        </p>

                        <p
                          className={`mt-1 text-sm font-black ${
                            order.paymentStatus === "PAID"
                              ? "text-green-700"
                              : "text-red-600"
                          }`}
                        >
                          {order.paymentStatus === "PAID"
                            ? language === "de"
                              ? "Bezahlt"
                              : "Parası Ödendi"
                            : language === "de"
                              ? "Zahlung offen"
                              : "Ödeme Açık"}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] font-bold uppercase text-slate-400">
                          {language === "de" ? "Gesamt" : "Toplam"}
                        </p>

                        <p className="mt-0.5 text-sm font-black leading-none text-slate-950">
                          {order.totalAmount.toFixed(2)} €
                        </p>

                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            onClick={() => printOrder(order)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-950 px-2.5 py-1.5 text-sm font-black text-white transition hover:bg-orange-500"
                          >
                            <Printer size={16} />
                            {language === "de" ? "Drucken" : "Yazdır"}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setExpandedOrderId(
                                expandedOrderId === order.id ? null : order.id,
                              )
                            }
                            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-sm font-black text-slate-700"
                          >
                            {language === "de" ? "Detail" : "Detay"}
                            <ChevronDown
                              size={16}
                              className={`transition-transform ${
                                expandedOrderId === order.id ? "rotate-180" : ""
                              }`}
                            />
                          </button>

                          <button
                            type="button"
                            onClick={() => deleteOrder(order)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-2.5 py-1.5 text-sm font-black text-red-600 transition hover:bg-red-100"
                          >
                            <Trash2 size={16} />
                            {language === "de" ? "In den Papierkorb" : "Çöpe At"}
                          </button>
                        </div>
                      </div>
                    </div>

                    {expandedOrderId === order.id ? (
                      <div className="mt-3 space-y-3 border-t border-slate-200 pt-3">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <p className="text-[10px] font-bold uppercase text-slate-400">
                              {language === "de" ? "Lieferadresse" : "Teslimat Adresi"}
                            </p>

                            <p className="mt-1 whitespace-pre-line text-sm text-slate-700">
                              {order.deliveryAddress}
                            </p>
                          </div>

                          {order.customerNote ? (
                            <div>
                              <p className="text-[10px] font-bold uppercase text-slate-400">
                                {language === "de" ? "Kundennotiz" : "Müşteri Notu"}
                              </p>

                              <p className="mt-1 whitespace-pre-line text-sm text-slate-700">
                                {order.customerNote}
                              </p>
                            </div>
                          ) : null}
                        </div>

                        <div>
                          <p className="text-[10px] font-bold uppercase text-slate-400">
                            {language === "de" ? "Produkte" : "Ürünler"}
                          </p>

                          <div className="mt-1 divide-y divide-slate-100 rounded-lg border border-slate-100">
                            {order.items.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center justify-between gap-3 px-3 py-1.5 text-sm"
                              >
                                <span className="text-slate-700">
                                  {item.name} × {item.quantity}
                                </span>

                                <span className="font-bold text-slate-950">
                                  {(
                                    (item.price + item.pfand) *
                                    item.quantity
                                  ).toFixed(2)} €
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {order.paymentStatus === "OPEN" ? (
                          <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
                            <p className="text-[10px] font-bold uppercase text-orange-700">
                              {language === "de" ? "Zahlung erfassen" : "Ödeme kaydet"}
                            </p>

                            <p className="mt-1 text-xs text-orange-700">
                              {language === "de" ? "Offener Betrag" : "Açık tutar"}:{" "}
                              {(
                                order.openPaymentAmount ??
                                getEffectiveOrderTotal(order)
                              ).toFixed(2)} €
                            </p>

                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={
                                  paymentAmountInputs[order.id] ??
                                  (
                                    order.openPaymentAmount ??
                                    getEffectiveOrderTotal(order)
                                  ).toFixed(2)
                                }
                                onChange={(event) =>
                                  setPaymentAmountInputs((current) => ({
                                    ...current,
                                    [order.id]: event.target.value,
                                  }))
                                }
                                className="w-28 rounded-lg border border-orange-300 bg-white px-2.5 py-1.5 text-sm font-bold text-slate-950 outline-none focus:border-orange-500"
                              />

                              <button
                                type="button"
                                disabled={settlingOrderId === order.id}
                                onClick={() => {
                                  const raw =
                                    paymentAmountInputs[order.id] ??
                                    (
                                      order.openPaymentAmount ??
                                      getEffectiveOrderTotal(order)
                                    ).toFixed(2);

                                  const amount = Number(raw.replace(",", "."));

                                  if (!Number.isFinite(amount) || amount <= 0) {
                                    setError(
                                      language === "de"
                                        ? "Bitte geben Sie einen gültigen Betrag ein."
                                        : "Lütfen geçerli bir tutar girin.",
                                    );
                                    return;
                                  }

                                  settlePayment(order, amount);
                                }}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-1.5 text-sm font-black text-white transition hover:bg-orange-600 disabled:opacity-60"
                              >
                                {settlingOrderId === order.id
                                  ? language === "de"
                                    ? "Wird gespeichert..."
                                    : "Kaydediliyor..."
                                  : language === "de"
                                    ? "Als bezahlt erfassen"
                                    : "Ödendi olarak kaydet"}
                              </button>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
  );
}
