"use client";

import { useLanguage } from "@/context/LanguageContext";

import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Loader2,
  PackageCheck,
  Printer,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type OrderStatus =
  | "NEW"
  | "CONFIRMED"
  | "PREPARING"
  | "READY"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";

type Driver = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phone: string | null;
};

type StaffUser = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  role: "ADMIN" | "SUPER_ADMIN";
  name: string;
};

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
  subtotal: number;
  deliveryFee: number;
  pfandAmount: number;

  pfandReturnId: string | null;

  pfandReturnStatus:
    | "PENDING"
    | "APPROVED"
    | "PAID_CASH"
    | "DEDUCTED_FROM_ORDER"
    | "CANCELLED"
    | null;

  pfandReturnAmount: number;

  pfandReturnItems: Array<{
    id: string;
    name: string;
    quantity: number;
    originalQuantity: number;
    approvedQuantity: number | null;
    quantityDifference: number;
    unitAmount: number;
    totalAmount: number;
    originalTotal: number;
    amountDifference: number;
  }>;

  totalAmount: number;
  deliveryAddress: string;
  customerNote: string | null;
  createdAt: string;
  driverId: string | null;
  assignedAt: string | null;
  outForDeliveryAt: string | null;
  deliveredAt: string | null;
  driver: Driver | null;
  paymentStatus: "OPEN" | "PAID";
  paidAt: string | null;

  driverPaymentReportedAt: string | null;
  driverPaymentReportedAmount: number | null;
  paymentApprovedAt: string | null;
  paymentApprovedById: string | null;

  approvedPaymentAmount: number;
  pendingPaymentAmount: number;
  openPaymentAmount: number;

  paymentHistory: Array<{
    id: string;
    amount: number;
    status: "PENDING" | "APPROVED" | "REJECTED";
    reporterRole: "DRIVER" | "ADMIN" | "SUPER_ADMIN";
    reportedAt: string;
    approvedAt: string | null;
    approvedById: string | null;
    driverId: string | null;
    note: string | null;
  }>;

  user: {
    role: "CUSTOMER" | "DEALER";
    email: string;
    firstName: string | null;
    lastName: string | null;
    companyName: string | null;
    phone: string | null;
    customerType: "PRIVATE" | "BUSINESS" | null;
  };

  items: OrderItem[];
};

type Permissions = {
  viewOrders: boolean;
  updateOrder: boolean;
  approveCustomerPayment: boolean;
  deleteOrder: boolean;
  printOrder: boolean;
  viewOrderReport: boolean;
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

const allStatuses = Object.keys(statusLabels) as OrderStatus[];

export default function AdminOrdersPage() {
  const { language } = useLanguage();

  const t =
    language === "de"
      ? {
          ordersLoadError: "Bestellungen konnten nicht geladen werden.",
          permissionsLoadError: "Berechtigungen konnten nicht geladen werden.",
          driversLoadError: "Fahrerliste konnte nicht geladen werden.",
          staffLoadError: "Personalliste konnte nicht geladen werden",
          title: "Bestellverwaltung",
          activeOrders: "Aktive Bestellungen",
          deliveredOrders: "Gelieferte Bestellungen",
          openOrders: "Offene Zahlungen",
          paidOrders: "Bezahlte Bestellungen",
          allOrders: "Alle Bestellungen",
          allStaff: "Gesamtes Personal",
          dailyReport: "Tagesbericht",
        }
      : {
          ordersLoadError: "Siparişler yüklenemedi.",
          permissionsLoadError: "Yetkiler yüklenemedi.",
          driversLoadError: "Şoför listesi yüklenemedi.",
          staffLoadError: "Personal konnte nicht geladen werden.",
          title: "Sipariş Yönetimi",
          activeOrders: "Aktive Bestellungen",
          deliveredOrders: "Gelieferte Bestellungen",
          openOrders: "Ödemesi Açık Siparişler",
          paidOrders: "Parası Ödenen Siparişler",
          allOrders: "Alle Bestellungen",
          allStaff: "Gesamtes Personal",
          dailyReport: "Gün Gün Rapor",
        };

  const [orders, setOrders] = useState<Order[]>([]);

  const [drivers, setDrivers] = useState<Driver[]>([]);

  const [staff, setStaff] = useState<StaffUser[]>([]);

  const [permissions, setPermissions] = useState<Permissions | null>(null);

  const [loading, setLoading] = useState(true);

  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const [dealerPfandOrderId, setDealerPfandOrderId] = useState<string | null>(
    null,
  );

  const [dealerPfandSaving, setDealerPfandSaving] = useState(false);

  /*
   * Şoförün teslim ettiği Pfand için admin son kontrolü.
   * Anahtar: PfandReturnItem ID
   * Değer: Adminin fiziksel olarak saydığı adet
   */
  const [adminPfandOrderId, setAdminPfandOrderId] = useState<string | null>(
    null,
  );

  const [adminPfandSaving, setAdminPfandSaving] = useState(false);

  const [adminPfandValues, setAdminPfandValues] = useState<
    Record<string, string>
  >({});

  const [dealerPfandValues, setDealerPfandValues] = useState<
    Record<string, string>
  >({
    "0.08": "",
    "0.15": "",
    "0.25": "",
    "3.30": "",
  });

  const [showPaidReport, setShowPaidReport] = useState(true);

  const [showOpenReport, setShowOpenReport] = useState(true);

  const [orderView, setOrderView] = useState<
    "ACTIVE" | "DELIVERED" | "ALL" | "OPEN" | "PAID"
  >("ACTIVE");

  const [reportMode, setReportMode] = useState<"DAY" | "RANGE" | "ALL">("DAY");

  const [reportDate, setReportDate] = useState("");

  const [reportStartDate, setReportStartDate] = useState("");

  const [reportEndDate, setReportEndDate] = useState("");

  const [reportDriverId, setReportDriverId] = useState("ALL");

  const loadData = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }

    try {
      const [ordersResponse, meResponse, driversResponse, staffResponse] =
        await Promise.all([
          fetch("/api/admin/orders"),
          fetch("/api/admin/me"),
          fetch("/api/admin/drivers"),
          fetch("/api/admin/staff"),
        ]);

      const ordersData = await ordersResponse.json();

      const meData = await meResponse.json();

      const driversData = await driversResponse.json();

      const staffData = await staffResponse.json();

      if (!ordersResponse.ok) {
        setError(ordersData.error || t.ordersLoadError);
        return;
      }

      if (!meResponse.ok) {
        setError(meData.error || t.permissionsLoadError);
        return;
      }

      if (!driversResponse.ok) {
        setError(driversData.error || t.driversLoadError);
        return;
      }

      if (!staffResponse.ok) {
        setError(staffData.error || t.staffLoadError);
        return;
      }
      setOrders(ordersData.orders);

      setDrivers(driversData.drivers);

      setStaff(staffData.staff || []);

      setPermissions(meData.permissions);
    } catch {
      setError("Siparişler yüklenirken hata oluştu.");
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadData();

    const interval = window.setInterval(() => {
      loadData(true);
    }, 10000);

    return () => {
      window.clearInterval(interval);
    };
  }, [loadData]);

  async function changeStatus(order: Order, status: OrderStatus) {
    if (status === order.status) {
      return;
    }

    if (status === "CANCELLED") {
      const confirmed = window.confirm(
        `${order.orderNumber} numaralı sipariş iptal edilsin mi?\n\nSipariş ürünleri stoğa geri eklenecektir.`,
      );

      if (!confirmed) {
        return;
      }
    }

    if (order.status === "CANCELLED" && status !== "CANCELLED") {
      const confirmed = window.confirm(
        "İptal edilmiş sipariş yeniden açılsın mı?\n\nÜrün stokları tekrar düşülecektir.",
      );

      if (!confirmed) {
        return;
      }
    }

    setUpdatingOrderId(order.id);

    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Sipariş güncellenemedi.");
        return;
      }

      setOrders((current) =>
        current.map((currentOrder) =>
          currentOrder.id === order.id ? data.order : currentOrder,
        ),
      );

      setSuccess(data.message || "Sipariş güncellendi.");
    } catch {
      setError("Sipariş güncellenirken hata oluştu.");
    } finally {
      setUpdatingOrderId(null);
    }
  }

  function resetDealerPfandForm() {
    setDealerPfandValues({
      "0.08": "",
      "0.15": "",
      "0.25": "",
      "3.30": "",
    });
  }

  function getDealerPfandTotal() {
    const values = [
      {
        key: "0.08",
        unitAmount: 0.08,
      },
      {
        key: "0.15",
        unitAmount: 0.15,
      },
      {
        key: "0.25",
        unitAmount: 0.25,
      },
      {
        key: "3.30",
        unitAmount: 3.3,
      },
    ];

    return Number(
      values
        .reduce((total, item) => {
          const quantity = Number(dealerPfandValues[item.key] || 0);

          return total + quantity * item.unitAmount;
        }, 0)
        .toFixed(2),
    );
  }

  function openAdminPfandCheck(order: Order) {
    if (!order.pfandReturnId || order.pfandReturnStatus !== "PENDING") {
      return;
    }

    setAdminPfandOrderId((current) => (current === order.id ? null : order.id));

    setAdminPfandValues(
      Object.fromEntries(
        order.pfandReturnItems.map((item) => [
          item.id,
          String(item.originalQuantity),
        ]),
      ),
    );
  }

  function getAdminPfandQuantity(itemId: string, fallback: number) {
    const value = adminPfandValues[itemId];

    if (value === undefined || value === "") {
      return fallback;
    }

    const quantity = Number(value);

    return Number.isInteger(quantity) && quantity >= 0 ? quantity : 0;
  }

  function getAdminCheckedPfandTotal(order: Order) {
    return Number(
      order.pfandReturnItems
        .reduce(
          (total, item) =>
            total +
            getAdminPfandQuantity(item.id, item.originalQuantity) *
              item.unitAmount,
          0,
        )
        .toFixed(2),
    );
  }

  async function approveDriverPfand(order: Order) {
    if (!order.pfandReturnId) {
      setError("Doğrulanacak Pfand kaydı bulunamadı.");
      return;
    }

    const approvedItems = order.pfandReturnItems.map((item) => ({
      id: item.id,

      approvedQuantity: getAdminPfandQuantity(item.id, item.originalQuantity),
    }));

    const invalidItem = approvedItems.find(
      (item) =>
        !Number.isInteger(item.approvedQuantity) ||
        item.approvedQuantity < 0 ||
        item.approvedQuantity > 9999,
    );

    if (invalidItem) {
      setError("Admin tarafından sayılan Pfand adetlerinden biri geçersiz.");
      return;
    }

    if (approvedItems.every((item) => item.approvedQuantity === 0)) {
      setError("Depoya alınacak en az bir Pfand adedi girin.");
      return;
    }

    setAdminPfandSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `/api/admin/pfand-returns/${order.pfandReturnId}`,
        {
          method: "PATCH",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            status: "APPROVED",
            approvedItems,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Şoförün Pfand teslimi doğrulanamadı.");
        return;
      }

      setSuccess(
        data.message || "Şoförün getirdiği Pfand doğrulandı ve depoya alındı.",
      );

      setAdminPfandOrderId(null);
      setAdminPfandValues({});

      await loadData(true);
    } catch {
      setError("Şoförün Pfand teslimi doğrulanırken hata oluştu.");
    } finally {
      setAdminPfandSaving(false);
    }
  }

  async function saveDealerPfand(order: Order) {
    setDealerPfandSaving(true);
    setError("");
    setSuccess("");

    try {
      const items = [
        {
          key: "0.08",
          quantity: Number(dealerPfandValues["0.08"] || 0),
        },
        {
          key: "0.15",
          quantity: Number(dealerPfandValues["0.15"] || 0),
        },
        {
          key: "0.25",
          quantity: Number(dealerPfandValues["0.25"] || 0),
        },
        {
          key: "3.30",
          quantity: Number(dealerPfandValues["3.30"] || 0),
        },
      ];

      const invalidItem = items.find(
        (item) =>
          !Number.isInteger(item.quantity) ||
          item.quantity < 0 ||
          item.quantity > 9999,
      );

      if (invalidItem) {
        setError("Pfand adetleri sıfır veya pozitif tam sayı olmalıdır.");
        return;
      }

      if (items.every((item) => item.quantity === 0)) {
        setError("En az bir Pfand adedi girin.");
        return;
      }

      const response = await fetch(
        `/api/admin/orders/${order.id}/dealer-pfand`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            items,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Bayi Pfand girişi kaydedilemedi.");
        return;
      }

      setSuccess(data.message || "Bayi Pfand girişi kaydedildi.");

      setDealerPfandOrderId(null);
      resetDealerPfandForm();

      await loadData(true);
    } catch {
      setError("Bayi Pfand girişi kaydedilirken hata oluştu.");
    } finally {
      setDealerPfandSaving(false);
    }
  }

  async function changePaymentStatus(
    order: Order,
    paymentStatus: "OPEN" | "PAID",
  ) {
    setUpdatingOrderId(order.id);

    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          paymentStatus,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Ödeme durumu güncellenemedi.");
        return;
      }

      /*
       * PATCH cevabındaki order nesnesi hesaplanan
       * approvedPaymentAmount, pendingPaymentAmount ve
       * openPaymentAmount alanlarını taşımayabilir.
       *
       * Eksik nesneyi state'e yazmak yerine admin siparişlerini
       * tam GET API cevabıyla yeniden yüklüyoruz.
       */
      await loadData(true);

      setSuccess(
        paymentStatus === "PAID"
          ? "Şoförün getirdiği para onaylandı ve Gerçek Kasa'ya alındı."
          : "Ödeme tekrar açıldı ve ilgili kasa hareketi kaldırıldı.",
      );
    } catch {
      setError("Ödeme durumu güncellenirken hata oluştu.");
    } finally {
      setUpdatingOrderId(null);
    }
  }

  async function assignDriver(order: Order, driverId: string) {
    setUpdatingOrderId(order.id);

    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          driverId: driverId || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Şoför atanamadı.");
        return;
      }

      setOrders((current) =>
        current.map((currentOrder) =>
          currentOrder.id === order.id ? data.order : currentOrder,
        ),
      );

      setSuccess(data.message || "Şoför atandı.");
    } catch {
      setError("Şoför atanırken hata oluştu.");
    } finally {
      setUpdatingOrderId(null);
    }
  }

  async function deleteOrder(order: Order) {
    const confirmed = window.confirm(
      `${order.orderNumber} numaralı sipariş listeden kaldırılsın mı?\n\nBu işlem siparişi veritabanından kalıcı olarak silmez.`,
    );

    if (!confirmed) {
      return;
    }

    setUpdatingOrderId(order.id);

    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/admin/orders/${order.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Sipariş silinemedi.");
        return;
      }

      setOrders((current) =>
        current.filter((currentOrder) => currentOrder.id !== order.id),
      );

      setSuccess(data.message || "Sipariş listeden kaldırıldı.");
    } catch {
      setError("Sipariş silinirken hata oluştu.");
    } finally {
      setUpdatingOrderId(null);
    }
  }

  function printOrder(order: Order) {
    const popup = window.open("", "_blank", "width=900,height=700");

    if (!popup) {
      setError(
        "Yazdırma penceresi açılamadı. Tarayıcı popup engelini kontrol edin.",
      );
      return;
    }

    popup.document.write(`
      <!doctype html>
      <html lang="tr">
        <head>
          <meta charset="utf-8" />
          <title>${order.orderNumber}</title>

          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 32px;
              color: #0f172a;
            }

            h1 {
              margin-bottom: 4px;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 24px;
            }

            th,
            td {
              border-bottom: 1px solid #ddd;
              padding: 10px;
              text-align: left;
            }

            .totals {
              margin-top: 24px;
              max-width: 360px;
              margin-left: auto;
            }

            .row {
              display: flex;
              justify-content: space-between;
              padding: 6px 0;
            }

            .address {
              white-space: pre-line;
              line-height: 1.6;
            }

            .total {
              border-top: 2px solid #0f172a;
              margin-top: 8px;
              padding-top: 12px;
              font-size: 18px;
            }
          </style>
        </head>

        <body>
          <h1>
            Sipariş
            ${order.orderNumber}
          </h1>

          <p>
            Tarih:
            ${new Date(order.createdAt).toLocaleString("de-DE")}
          </p>

          <p>
            ${language === "de" ? "Status" : "Durum"}:
            ${statusLabels[order.status][language]}
          </p>

          <p>
            <strong>${language === "de" ? "Fahrer" : "Şoför"}</strong>
            ${
              order.driver
                ? `${order.driver.firstName || ""} ${order.driver.lastName || ""}`.trim() ||
                  order.driver.email
                : language === "de" ? "Nicht zugewiesen" : "Atanmadı"
            }
          </p>

          <h2>${language === "de" ? "Kunde" : "Müşteri"}</h2>

          <p>
            ${order.user.companyName ? `${order.user.companyName}<br />` : ""}

            ${order.user.firstName || ""}
            ${order.user.lastName || ""}<br />

            ${order.user.email}<br />

            ${order.user.phone || ""}
          </p>

          <h2>${language === "de" ? "Lieferadresse" : "Teslimat Adresi"}</h2>

          <p class="address">
            ${order.deliveryAddress}
          </p>

          ${
            order.customerNote
              ? `
                <h2>${language === "de" ? "Kundennotiz" : "Müşteri Notu"}</h2>
                <p>${order.customerNote}</p>
              `
              : ""
          }

          <table>
            <thead>
              <tr>
                <th>${language === "de" ? "Produkt" : "Ürün"}</th>
                <th>${language === "de" ? "Menge" : "Adet"}</th>
                <th>${language === "de" ? "Stückpreis" : "Birim fiyat"}</th>
                <th>${language === "de" ? "Pfand" : "Pfand"}</th>
                <th>${language === "de" ? "Gesamt" : "Toplam"}</th>
              </tr>
            </thead>

            <tbody>
              ${order.items
                .map(
                  (item) => `
                    <tr>
                      <td>
                        ${item.name}
                      </td>

                      <td>
                        ${item.quantity}
                      </td>

                      <td>
                        ${item.price.toFixed(2)} €
                      </td>

                      <td>
                        ${(item.pfand * item.quantity).toFixed(2)} €
                      </td>

                      <td>
                        ${(
                          (Number(item.price) + Number(item.pfand || 0)) *
                          item.quantity
                        ).toFixed(2)} €
                      </td>
                    </tr>
                  `,
                )
                .join("")}
            </tbody>
          </table>

          <div class="totals">
            <div class="row">
              <span>
                Ara Toplam
              </span>

              <strong>
                ${order.subtotal.toFixed(2)} €
              </strong>
            </div>

            ${
              order.pfandAmount > 0
                ? `
                  <div class="row">
                    <span>${language === "de" ? "Produktpfand" : "Ürün Pfandı"}</span>

                    <strong>
                      ${order.pfandAmount.toFixed(2)} €
                    </strong>
                  </div>
                `
                : ""
            }

            ${
              order.pfandReturnAmount > 0
                ? `
                  <div class="row">
                    <span>Pfandrückgabe</span>

                    <strong style="color:#15803d;">
                      -${order.pfandReturnAmount.toFixed(2)} €
                    </strong>
                  </div>

                  ${
                    order.pfandReturnItems.length > 0
                      ? `
                        <div style="
                          margin-top: 8px;
                          margin-bottom: 12px;
                          padding: 10px 12px;
                          background: #f0fdf4;
                          border-radius: 8px;
                        ">
                          <strong style="
                            display:block;
                            margin-bottom:6px;
                            color:#166534;
                          ">
                            İade edilen Pfand
                          </strong>

                          ${order.pfandReturnItems
                            .map(
                              (item) => `
                                <div style="
                                  display:flex;
                                  justify-content:space-between;
                                  gap:20px;
                                  padding:3px 0;
                                  font-size:13px;
                                ">
                                  <span>
                                    <strong>${item.name}</strong><br />

                                    <span style="
                                      font-size:11px;
                                      color:#64748b;
                                    ">
                                      Müşteri:
                                      ${item.originalQuantity}
                                      → Şoför:
                                      ${item.quantity}

                                      ${
                                        item.quantityDifference !== 0
                                          ? ` · Fark: ${item.quantityDifference > 0 ? "+" : ""}${item.quantityDifference}`
                                          : ""
                                      }
                                    </span>
                                  </span>

                                  <span style="text-align:right;">
                                    <strong>
                                      -${item.totalAmount.toFixed(2)} €
                                    </strong>

                                    ${
                                      item.amountDifference !== 0
                                        ? `
                                          <br />
                                          <span style="
                                            font-size:11px;
                                            font-weight:700;
                                            color:${
                                              item.amountDifference < 0
                                                ? "#b45309"
                                                : "#15803d"
                                            };
                                          ">
                                            Fark:
                                            ${item.amountDifference > 0 ? "+" : ""}
                                            ${item.amountDifference.toFixed(2)} €
                                          </span>
                                        `
                                        : ""
                                    }
                                  </span>
                                </div>
                              `,
                            )
                            .join("")}
                        </div>
                      `
                      : ""
                  }
                `
                : ""
            }

            <div class="row">
              <span>${language === "de" ? "Lieferung" : "Teslimat"}</span>

              <strong>
                ${order.deliveryFee.toFixed(2)} €
              </strong>
            </div>

            <div class="row total">
              <span>${language === "de" ? "Gesamt" : "Toplam"}</span>

              <strong>
                ${order.totalAmount.toFixed(2)} €
              </strong>
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

  function getEffectiveOrderTotal(order: Order) {
    return Number(Math.max(0, Number(order.totalAmount || 0)).toFixed(2));
  }

  function isBarSale(order: Order) {
    return order.orderNumber.startsWith("BAR-");
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
      getCustomerNoteValue(
        order,
        language === "de" ? "Verkäufer:" : "Satışı yapan:",
      ) || (language === "de" ? "Unbekanntes Personal" : "Bilinmeyen Personel")
    );
  }

  function getBarPaymentMethod(order: Order) {
    return (
      getCustomerNoteValue(order, language === "de" ? "Zahlung:" : "Ödeme:") ||
      (order.paymentStatus === "PAID" ? "Ödendi" : "Açık Hesap")
    );
  }

  function getReportActorName(order: Order) {
    if (isBarSale(order)) {
      return getBarSellerName(order);
    }

    if (order.driver) {
      return (
        `${order.driver.firstName ?? ""} ${order.driver.lastName ?? ""}`.trim() ||
        order.driver.email
      );
    }

    return "";
  }

  function getOrderReportDate(order: Order) {
    const value =
      order.paidAt ||
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

  const reportActivityOrders = useMemo(() => {
    const result = orders.filter(
      (order) =>
        order.status !== "CANCELLED" &&
        (isBarSale(order) || Boolean(order.driverId && order.driver)) &&
        Boolean(getOrderReportDate(order)),
    );

    return result;
  }, [orders]);

  const reportDateOptions = useMemo(() => {
    const result = new Set<string>();

    for (const order of reportActivityOrders) {
      const date = getOrderReportDate(order);

      if (date) {
        result.add(getLocalDateKey(date));
      }
    }

    return Array.from(result).sort((first, second) =>
      second.localeCompare(first),
    );
  }, [reportActivityOrders]);

  const todayReportDate = getLocalDateKey(new Date());

  const latestReportDate = reportDateOptions[0] || todayReportDate;

  /*
   * Günlük rapor varsayılan olarak her zaman bugünü gösterir.
   * Sistemde bugün işlem yoksa eski bir gün otomatik açılmaz.
   */
  const effectiveReportDate = reportDate || todayReportDate;

  const effectiveReportStartDate = reportStartDate || todayReportDate;

  const effectiveReportEndDate = reportEndDate || todayReportDate;

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
        name: `${name} · Şoför`,
      });
    }

    // Kayıtlı bütün Admin ve Super Admin hesapları
    for (const person of staff) {
      const name = person.name.trim() || person.email;

      people.set(`bar:${name}`, {
        id: `bar:${name}`,
        name: `${name} · ${
          person.role === "SUPER_ADMIN" ? "Super Admin" : "Admin"
        }`,
      });
    }

    // Geçmişte satış yapan fakat artık kayıtlı olmayan kişiler
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
          name: `${seller} · Bar Satışı`,
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
          const date = getOrderReportDate(order);

          if (!date) {
            return false;
          }

          const dateKey = getLocalDateKey(date);

          /*
           * Günlük kasa sadece seçilen günün gerçek hareketlerini gösterir.
           * Önceki günlerden kalan açık siparişler yeni güne taşınmaz.
           *
           * Tüm zamanlar seçildiğinde bütün kayıtlar gösterilir.
           * Tarih aralığında ise yalnızca seçilen aralıktaki hareketler gelir.
           */
          const dateMatches =
            reportMode === "ALL"
              ? true
              : reportMode === "RANGE"
                ? dateKey >= effectiveReportStartDate &&
                  dateKey <= effectiveReportEndDate
                : dateKey === effectiveReportDate;

          const personMatches =
            reportDriverId === "ALL"
              ? true
              : reportDriverId.startsWith("driver:")
                ? !isBarSale(order) &&
                  order.driverId === reportDriverId.slice("driver:".length)
                : reportDriverId.startsWith("bar:")
                  ? isBarSale(order) &&
                    getBarSellerName(order) ===
                      reportDriverId.slice("bar:".length)
                  : false;

          return dateMatches && personMatches;
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
      effectiveReportStartDate,
      effectiveReportEndDate,
      reportDriverId,
    ],
  );

  const paidReportOrders = useMemo(
    () =>
      selectedReportOrders.filter((order) => order.paymentStatus === "PAID"),
    [selectedReportOrders],
  );

  /*
   * Bu liste yalnızca seçilen rapor tarihindeki açık siparişleri içerir.
   * Günlük rapor, tarih aralığı ve personel filtrelerinde kullanılır.
   */
  const selectedOpenReportOrders = useMemo(
    () =>
      selectedReportOrders.filter((order) => order.paymentStatus === "OPEN"),
    [selectedReportOrders],
  );

  /*
   * "Ödemesi Açık Kalanlar" bölümü seçilen günün raporu değildir.
   * Geçmiş günlerden kalanlar ve şoför atanmamış siparişler dahil,
   * ödemesi hâlâ açık olan bütün siparişleri gösterir.
   *
   * Günlük kasa ve şoför raporu selectedReportOrders ile çalışmaya devam eder.
   */
  const openReportOrders = useMemo(
    () =>
      orders
        .filter(
          (order) =>
            order.status !== "CANCELLED" && order.paymentStatus === "OPEN",
        )
        .sort(
          (first, second) =>
            new Date(second.createdAt).getTime() -
            new Date(first.createdAt).getTime(),
        ),
    [orders],
  );

  const allOpenPaymentAmount = useMemo(
    () =>
      Number(
        openReportOrders
          .reduce((total, order) => total + getEffectiveOrderTotal(order), 0)
          .toFixed(2),
      ),
    [openReportOrders],
  );

  /*
   * Yalnızca bugün oluşturulmuş ve ödeme durumu hâlâ açık olan
   * siparişlerin toplamı.
   *
   * Bu tutar ertesi gün otomatik olarak 0,00 €'dan başlayacaktır.
   * Eski açık ödemeler "Açık Ödeme Toplamı" kartında kalmaya devam eder.
   */
  const todayOpenPaymentAmount = useMemo(
    () =>
      Number(
        orders
          .filter((order) => {
            if (
              order.status === "CANCELLED" ||
              order.paymentStatus !== "OPEN"
            ) {
              return false;
            }

            const createdDate = new Date(order.createdAt);

            if (Number.isNaN(createdDate.getTime())) {
              return false;
            }

            return getLocalDateKey(createdDate) === todayReportDate;
          })
          .reduce((total, order) => total + getEffectiveOrderTotal(order), 0)
          .toFixed(2),
      ),
    [orders, todayReportDate],
  );

  const reportSummary = useMemo(() => {
    const totalAmount = selectedReportOrders.reduce(
      (total, order) => total + getEffectiveOrderTotal(order),
      0,
    );

    const paidAmount = paidReportOrders.reduce(
      (total, order) => total + getEffectiveOrderTotal(order),
      0,
    );

    const openAmount = selectedOpenReportOrders.reduce(
      (total, order) => total + getEffectiveOrderTotal(order),
      0,
    );

    const visitCount = selectedReportOrders.filter(
      (order) =>
        !isBarSale(order) &&
        (Boolean(order.outForDeliveryAt || order.deliveredAt) ||
          order.status === "OUT_FOR_DELIVERY" ||
          order.status === "DELIVERED"),
    ).length;

    const deliveredCount = selectedReportOrders.filter(
      (order) =>
        !isBarSale(order) &&
        (order.status === "DELIVERED" || Boolean(order.deliveredAt)),
    ).length;

    return {
      orderCount: selectedReportOrders.length,

      visitCount,

      deliveredCount,

      paidCount: paidReportOrders.length,

      openCount: selectedOpenReportOrders.length,

      totalAmount: Number(totalAmount.toFixed(2)),

      paidAmount: Number(paidAmount.toFixed(2)),

      openAmount: Number(openAmount.toFixed(2)),
    };
  }, [selectedReportOrders, paidReportOrders, selectedOpenReportOrders]);

  /*
   * Üst özet bölümünde geçmiş kasa toplamı gösterilmez.
   * Yalnızca tahsil edilen ve hâlâ açık olan ödeme tutarları gösterilir.
   */
  const cashSummary = {
    paid: reportSummary.paidAmount,

    open: reportSummary.openAmount,
  };

  const reportDailyRows = useMemo(() => {
    type DailyRow = {
      rowKey: string;
      dateKey: string;
      dateLabel: string;
      actorName: string;
      orderCount: number;
      paidCount: number;
      openCount: number;
      paidAmount: number;
      openAmount: number;
      totalAmount: number;
    };

    const grouped = new Map<string, DailyRow>();

    for (const order of selectedReportOrders) {
      const originalDate = getOrderReportDate(order);

      if (!originalDate) {
        continue;
      }

      const date =
        reportMode === "DAY" && effectiveReportDate
          ? new Date(`${effectiveReportDate}T12:00:00`)
          : originalDate;

      const dateKey =
        reportMode === "DAY" ? effectiveReportDate : getLocalDateKey(date);

      const rawActorName = getReportActorName(order);

      const actorName = isBarSale(order)
        ? `Bar: ${rawActorName || (language === "de" ? "Unbekanntes Personal" : "Bilinmeyen Personel")}`
        : rawActorName || "Atanmamış";

      /*
       * Aynı tarih ve aynı personelin işlemleri bir satırda toplanır.
       * Farklı personeller aynı gün içinde ayrı satırlarda gösterilir.
       */
      const rowKey = `${dateKey}::${actorName}`;

      const current = grouped.get(rowKey) || {
        rowKey,
        dateKey,

        dateLabel: date.toLocaleDateString("de-DE"),

        actorName,

        orderCount: 0,
        paidCount: 0,
        openCount: 0,
        paidAmount: 0,
        openAmount: 0,
        totalAmount: 0,
      };

      const amount = getEffectiveOrderTotal(order);

      current.orderCount += 1;

      current.totalAmount += amount;

      if (order.paymentStatus === "PAID") {
        current.paidCount += 1;

        current.paidAmount += amount;
      } else {
        current.openCount += 1;

        current.openAmount += amount;
      }

      grouped.set(rowKey, current);
    }

    return Array.from(grouped.values())
      .map((row) => ({
        ...row,

        paidAmount: Number(row.paidAmount.toFixed(2)),

        openAmount: Number(row.openAmount.toFixed(2)),

        totalAmount: Number(row.totalAmount.toFixed(2)),
      }))
      .sort((first, second) => {
        const dateCompare = second.dateKey.localeCompare(first.dateKey);

        if (dateCompare !== 0) {
          return dateCompare;
        }

        return first.actorName.localeCompare(second.actorName, "tr");
      });
  }, [selectedReportOrders, reportMode, effectiveReportDate]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="flex items-center gap-3 font-bold text-slate-600">
          <Loader2 className="animate-spin" />
          Siparişler yükleniyor...
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
          <PackageCheck size={30} className="text-orange-400" />

          <h1 className="mt-4 text-4xl font-black">{t.title}</h1>

          <p className="mt-3 text-slate-400">
            Yeni ve geçmiş siparişleri görüntüleyin, durumlarını değiştirin ve
            yazdırın.
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

        {permissions?.viewOrderReport ? (
          <section className="mt-6 rounded-[28px] bg-white p-5 shadow-sm">
            <div>
              <h2 className="text-xl font-black text-slate-950">
                {language === "de" ? "Fahrer- und Kassenbericht" : "Şoför Sipariş ve Tahsilat Raporu"}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {language === "de" ? "Bestellungen und Zahlungen für einen Tag, einen Zeitraum oder alle Zeiten anzeigen." : "Tek gün, tarih aralığı veya tüm zamanlar için sipariş ve tahsilat durumlarını görüntüleyin."}
              </p>
            </div>

            <div className="mt-4 rounded-2xl bg-slate-50 p-4">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setReportMode("DAY");

                    setReportDriverId("ALL");
                  }}
                  className={`rounded-xl px-4 py-2 text-sm font-black ${
                    reportMode === "DAY"
                      ? "bg-orange-500 text-white"
                      : "bg-white text-slate-700"
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
                  className={`rounded-xl px-4 py-2 text-sm font-black ${
                    reportMode === "RANGE"
                      ? "bg-slate-950 text-white"
                      : "bg-white text-slate-700"
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
                  className={`rounded-xl px-4 py-2 text-sm font-black ${
                    reportMode === "ALL"
                      ? "bg-green-600 text-white"
                      : "bg-white text-slate-700"
                  }`}
                >
                  {language === "de" ? "Alle" : "Tüm Zamanlar"}
                </button>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-3">
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
                    {language === "de" ? "Personal" : "Personel"}
                  </span>

                  <select
                    value={reportDriverId}
                    onChange={(event) => setReportDriverId(event.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-950 outline-none focus:border-orange-500"
                  >
                    <option value="ALL">{t.allStaff}</option>

                    {reportPersonOptions.map((person) => (
                      <option key={person.id} value={person.id}>
                        {person.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <div className="mb-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-green-50 p-5">
                <p className="text-xs font-black uppercase text-green-700">
                  {language === "de" ? "Eingenommen" : "Tahsil Edilen"}
                </p>

                <p className="mt-2 text-3xl font-black text-green-900">
                  {cashSummary.paid.toLocaleString("de-DE", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  €
                </p>

                <p className="mt-1 text-xs font-bold text-green-700">
                  {language === "de" ? "Gesamt bezahlt" : "Seçilen rapora göre ödenen toplam"}
                </p>
              </div>

              <div className="rounded-2xl bg-amber-50 p-5">
                <p className="text-xs font-black uppercase text-amber-700">
                  {language === "de" ? "Heute offen" : "Bugün Verilen Açık"}
                </p>

                <p className="mt-2 text-3xl font-black text-amber-900">
                  {todayOpenPaymentAmount.toLocaleString("de-DE", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  €
                </p>

                <p className="mt-1 text-xs font-bold text-amber-700">
                  {language === "de" ? "Heute erstellt und noch offen" : "Bugün oluşturulan ve hâlâ ödenmemiş siparişler"}
                </p>
              </div>

              <div className="rounded-2xl bg-red-50 p-5">
                <p className="text-xs font-black uppercase text-red-700">
                  {language === "de" ? "Offene Zahlungen" : "Açık Ödeme Toplamı"}
                </p>

                <p className="mt-2 text-3xl font-black text-red-900">
                  {cashSummary.open.toLocaleString("de-DE", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  €
                </p>

                <p className="mt-1 text-xs font-bold text-red-700">
                  {language === "de" ? "Alle offenen Bestellungen" : "Geçmiş günler dahil ödenmemiş bütün siparişler"}
                </p>
              </div>
            </div>

            <div className="mt-4 grid items-stretch gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="min-h-[86px] rounded-xl bg-slate-950 px-4 py-3 text-white">
                <p className="text-[10px] font-black uppercase leading-tight text-slate-400">
                  {language === "de" ? "Bestellungen" : "Sipariş Sayısı"}
                </p>

                <p className="mt-1 text-lg font-black leading-none">
                  {reportSummary.orderCount}
                </p>
              </div>

              <div className="min-h-[86px] rounded-xl bg-orange-50 px-4 py-3">
                <p className="text-[10px] font-black uppercase leading-tight text-orange-700">
                  {language === "de" ? "Gesamtbetrag" : "Toplam Tutar"}
                </p>

                <p className="mt-1 text-lg font-black leading-none text-orange-900">
                  {reportSummary.totalAmount.toFixed(2)} €
                </p>
              </div>

              <div className="min-h-[86px] rounded-xl bg-blue-50 px-4 py-3">
                <p className="text-[10px] font-black uppercase leading-tight text-blue-700">
                  {language === "de" ? "Geliefert" : "Teslim Etti"}
                </p>

                <p className="mt-1 text-lg font-black leading-none text-blue-900">
                  {reportSummary.deliveredCount}
                </p>
              </div>

              <div className="min-h-[86px] rounded-xl bg-green-50 px-4 py-3">
                <p className="text-[10px] font-black uppercase leading-tight text-green-700">
                  {language === "de" ? "Ödendi" : "Parası Alındı"}
                </p>

                <p className="mt-1 text-lg font-black leading-none text-green-900">
                  {reportSummary.paidCount}
                </p>
              </div>

              <div className="min-h-[86px] rounded-xl bg-red-50 px-4 py-3">
                <p className="text-[10px] font-black uppercase leading-tight text-red-700">
                  {language === "de" ? "Offen" : "Ödeme Açık"}
                </p>

                <p className="mt-1 text-lg font-black leading-none text-red-900">
                  {reportSummary.openCount}
                </p>
              </div>

              <div className="rounded-xl bg-red-50 px-3 py-2.5">
                <p className="text-[10px] font-black uppercase leading-tight text-red-700">
                  {language === "de" ? "Offener Betrag" : "Açık Tutar"}
                </p>

                <p className="mt-1 text-lg font-black leading-none text-red-900">
                  {reportSummary.openAmount.toFixed(2)} €
                </p>
              </div>
            </div>

            <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
              <div className="bg-slate-100 px-4 py-3">
                <h3 className="font-black text-slate-950">{t.dailyReport}</h3>
              </div>

              {reportDailyRows.length === 0 ? (
                <p className="p-4 text-sm text-slate-500">
                  Seçilen rapor için sipariş bulunmuyor.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-[820px] w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs font-black uppercase text-slate-500">
                        <th className="px-4 py-2">{language === "de" ? "Datum" : "Tarih"}</th>

                        <th className="px-4 py-2">{language === "de" ? "Fahrer / Verkäufer" : "Şoför / Satışı Yapan"}</th>
                        <th className="px-4 py-2 text-center">{language === "de" ? "Bestellung" : "Sipariş"}</th>
                        <th className="px-4 py-2 text-center">{language === "de" ? "Ödendi" : "Ödendi"}</th>
                        <th className="px-4 py-2 text-center">{language === "de" ? "Offen" : "Açık"}</th>
                        <th className="px-4 py-2 text-right">{language === "de" ? "Eingenommen" : "Tahsil Edilen"}</th>
                        <th className="px-4 py-2 text-right">{language === "de" ? "Offener Betrag" : "Açık Tutar"}</th>
                        <th className="px-4 py-2 text-right">{language === "de" ? "Gesamt" : "Toplam"}</th>
                      </tr>
                    </thead>

                    <tbody>
                      {reportDailyRows.map((row) => (
                        <tr
                          key={row.rowKey}
                          className="border-t border-slate-200"
                        >
                          <td className="px-4 py-2 font-black">
                            {row.dateLabel}
                          </td>

                          <td className="px-4 py-2">{row.actorName}</td>
                          <td className="px-4 py-2 text-center">
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
                          <td className="px-4 py-2 text-right font-black">
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
                      {language === "de" ? "Ödendie Bestellungen" : "Parası Alınanlar"}
                    </h3>

                    <p className="mt-0.5 text-xs font-bold text-green-700">
                      {showPaidReport ? language === "de" ? "Liste schließen" : "Listeyi kapat" : language === "de" ? "Liste öffnen" : "Listeyi aç"}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <strong className="text-green-800">
                      {reportSummary.paidAmount.toFixed(2)} €
                    </strong>

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
                      {language === "de" ? "Keine bezahlten Bestellungen." : "Tahsil edilmiş sipariş bulunmuyor."}
                    </p>
                  ) : (
                    <div className="divide-y divide-green-100">
                      {paidReportOrders.map((order) => (
                        <div
                          key={order.id}
                          className="grid gap-2 p-4 sm:grid-cols-[1fr_auto]"
                        >
                          <div>
                            <p className="text-xs font-black text-orange-500">
                              {order.orderNumber}
                            </p>

                            <p className="font-black text-slate-950">
                              {isBarSale(order)
                                ? language === "de" ? `Barverkauf · ${getBarSellerName(order)}` : `Bar Satışı · ${getBarSellerName(order)}`
                                : order.user.companyName ||
                                  `${order.user.firstName || ""} ${order.user.lastName || ""}`.trim() ||
                                  order.user.email}
                            </p>

                            {isBarSale(order) ? (
                              <p className="mt-1 text-xs font-bold text-slate-500">
                                Ödeme: {getBarPaymentMethod(order)} ·{" "}
                                {order.items
                                  .map(
                                    (item) => `${item.name} × ${item.quantity}`,
                                  )
                                  .join(", ")}
                              </p>
                            ) : null}
                          </div>

                          <strong className="text-green-700">
                            {getEffectiveOrderTotal(order).toFixed(2)} €
                          </strong>
                        </div>
                      ))}
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
                      {language === "de" ? "Offene Bestellungen" : "Ödemesi Açık Kalanlar"}
                    </h3>

                    <p className="mt-0.5 text-xs font-bold text-red-700">
                      {showOpenReport ? language === "de" ? "Liste schließen" : "Listeyi kapat" : language === "de" ? "Liste öffnen" : "Listeyi aç"}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <strong className="text-red-800">
                      {reportSummary.openAmount.toFixed(2)} €
                    </strong>

                    <ChevronDown
                      size={20}
                      className={`text-red-800 transition-transform ${
                        showOpenReport ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </button>

                {showOpenReport ? (
                  selectedOpenReportOrders.length === 0 ? (
                    <p className="p-4 text-sm text-slate-500">
                      {language === "de" ? "Keine offenen Zahlungen." : "Açık ödeme bulunmuyor."}
                    </p>
                  ) : (
                    <div className="divide-y divide-red-100">
                      {selectedOpenReportOrders.map((order) => (
                        <div
                          key={order.id}
                          className="grid gap-2 p-4 sm:grid-cols-[1fr_auto]"
                        >
                          <div>
                            <p className="text-xs font-black text-orange-500">
                              {order.orderNumber}
                            </p>

                            <p className="font-black text-slate-950">
                              {isBarSale(order)
                                ? language === "de" ? `Barverkauf · ${getBarSellerName(order)}` : `Bar Satışı · ${getBarSellerName(order)}`
                                : order.user.companyName ||
                                  `${order.user.firstName || ""} ${order.user.lastName || ""}`.trim() ||
                                  order.user.email}
                            </p>

                            {isBarSale(order) ? (
                              <p className="mt-1 text-xs font-bold text-slate-500">
                                Ödeme: {getBarPaymentMethod(order)} ·{" "}
                                {order.items
                                  .map(
                                    (item) => `${item.name} × ${item.quantity}`,
                                  )
                                  .join(", ")}
                              </p>
                            ) : null}
                          </div>

                          <strong className="text-red-700">
                            {getEffectiveOrderTotal(order).toFixed(2)} €
                          </strong>
                        </div>
                      ))}
                    </div>
                  )
                ) : null}
              </div>
            </div>
          </section>
        ) : null}

        <section className="mt-8 rounded-[28px] bg-white p-6 shadow-sm">
          <div className="mb-6">
            <div>
              <h2 className="text-2xl font-black text-slate-950">
                {orderView === "ACTIVE"
                  ? t.activeOrders
                  : orderView === "DELIVERED"
                    ? t.deliveredOrders
                    : orderView === "OPEN"
                      ? t.openOrders
                      : orderView === "PAID"
                        ? t.paidOrders
                        : t.allOrders}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Siparişleri durum veya ödeme durumuna göre filtreleyin.
              </p>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setOrderView("ACTIVE")}
                className={`rounded-xl px-4 py-2 text-sm font-black transition ${
                  orderView === "ACTIVE"
                    ? "bg-slate-950 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {language === "de" ? "Aktive Bestellungen" : "Aktif Siparişler"}
              </button>

              <button
                type="button"
                onClick={() => setOrderView("DELIVERED")}
                className={`rounded-xl px-4 py-2 text-sm font-black transition ${
                  orderView === "DELIVERED"
                    ? "bg-green-600 text-white"
                    : "bg-green-50 text-green-700 hover:bg-green-100"
                }`}
              >
                {language === "de" ? "Gelieferte Bestellungen" : "Teslim Edilen Siparişler"}
              </button>

              <button
                type="button"
                onClick={() => setOrderView("ALL")}
                className={`rounded-xl px-4 py-2 text-sm font-black transition ${
                  orderView === "ALL"
                    ? "bg-orange-500 text-white"
                    : "bg-orange-50 text-orange-700 hover:bg-orange-100"
                }`}
              >
                {language === "de" ? "Alle" : "Tümü"}
              </button>

              <button
                type="button"
                onClick={() => setOrderView("OPEN")}
                className={`rounded-xl px-4 py-2 text-sm font-black transition ${
                  orderView === "OPEN"
                    ? "bg-red-600 text-white"
                    : "bg-red-50 text-red-700 hover:bg-red-100"
                }`}
              >
                {language === "de" ? "Offene Zahlungen" : "Ödeme Açık"}
              </button>

              <button
                type="button"
                onClick={() => setOrderView("PAID")}
                className={`rounded-xl px-4 py-2 text-sm font-black transition ${
                  orderView === "PAID"
                    ? "bg-green-600 text-white"
                    : "bg-green-50 text-green-700 hover:bg-green-100"
                }`}
              >
                {language === "de" ? "Bezahlt" : "Parası Ödendi"}
              </button>
            </div>
          </div>

          {orders.filter((order) => {
            if (orderView === "ACTIVE") {
              return order.status !== "DELIVERED";
            }

            if (orderView === "DELIVERED") {
              return order.status === "DELIVERED";
            }

            if (orderView === "OPEN") {
              return order.paymentStatus === "OPEN";
            }

            if (orderView === "PAID") {
              return order.paymentStatus === "PAID";
            }

            return true;
          }).length === 0 ? (
            <p className="text-slate-500">
              {orderView === "ACTIVE"
                ? language === "de"
                  ? "Keine aktiven Bestellungen."
                  : "Aktif sipariş bulunmuyor."
                : orderView === "DELIVERED"
                  ? "Teslim edilmiş sipariş bulunmuyor."
                  : orderView === "OPEN"
                    ? "Ödemesi açık sipariş bulunmuyor."
                    : orderView === "PAID"
                      ? "Parası ödenmiş sipariş bulunmuyor."
                      : language === "de" ? "Keine Bestellungen gefunden." : "Sipariş bulunmuyor."}
            </p>
          ) : (
            <div className="space-y-4">
              {orders
                .filter((order) => {
                  if (orderView === "ACTIVE") {
                    return order.status !== "DELIVERED";
                  }

                  if (orderView === "DELIVERED") {
                    return order.status === "DELIVERED";
                  }

                  if (orderView === "OPEN") {
                    return order.paymentStatus === "OPEN";
                  }

                  if (orderView === "PAID") {
                    return order.paymentStatus === "PAID";
                  }

                  return true;
                })
                .map((order) => {
                  const expanded = expandedOrderId === order.id;

                  const updating = updatingOrderId === order.id;

                  return (
                    <article
                      key={order.id}
                      className={`overflow-hidden rounded-2xl border ${
                        order.status === "CANCELLED"
                          ? "border-red-200 bg-red-50/30"
                          : "border-slate-200"
                      }`}
                    >
                      <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center">
                        <div className="flex-1">
                          <p className="text-sm font-bold text-orange-500">
                            {order.orderNumber}
                          </p>

                          <h2 className="mt-1 text-lg font-black text-slate-950">
                            {order.user.companyName ||
                              `${order.user.firstName || ""} ${order.user.lastName || ""}`}
                          </h2>

                          <p className="mt-1 text-sm text-slate-500">
                            {new Date(order.createdAt).toLocaleString("de-DE")}
                          </p>

                          <p className="mt-2 text-sm font-bold text-slate-700">
                            {language === "de" ? "Fahrer:" : "Şoför:"}{" "}
                            <span className="font-black text-slate-950">
                              {order.driver
                                ? `${order.driver.firstName || ""} ${order.driver.lastName || ""}`.trim() ||
                                  order.driver.email
                                : language === "de" ? "Nicht zugewiesen" : "Atanmadı"}
                            </span>
                          </p>
                        </div>

                        <div className="min-w-52">
                          <p className="mb-1 text-sm font-bold text-slate-500">
                            {language === "de" ? "Status" : "Durum"}
                          </p>

                          {permissions?.updateOrder &&
                          order.status !== "DELIVERED" ? (
                            <select
                              value={order.status}
                              disabled={updating}
                              onChange={(event) =>
                                changeStatus(
                                  order,
                                  event.target.value as OrderStatus,
                                )
                              }
                              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-bold text-slate-950 outline-none focus:border-orange-500 disabled:cursor-wait disabled:bg-slate-100"
                            >
                              {allStatuses.map((status) => (
                                <option key={status} value={status}>
                                  {statusLabels[status][language]}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <p className="font-black text-slate-950">
                              {statusLabels[order.status][language]}
                            </p>
                          )}
                        </div>

                        <div className="min-w-52">
                          <p className="mb-1 text-sm font-bold text-slate-500">
                            Şoför
                          </p>

                          {permissions?.updateOrder &&
                          order.status !== "DELIVERED" ? (
                            <select
                              value={order.driverId || ""}
                              disabled={updating}
                              onChange={(event) =>
                                assignDriver(order, event.target.value)
                              }
                              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-bold text-slate-950 outline-none focus:border-orange-500 disabled:cursor-wait disabled:bg-slate-100"
                            >
                              <option value="">{language === "de" ? "Kein Fahrer zugewiesen" : "Şoför atanmadı"}</option>

                              {drivers.map((driver) => (
                                <option key={driver.id} value={driver.id}>
                                  {`${driver.firstName || ""} ${driver.lastName || ""}`.trim() ||
                                    driver.email}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <p className="font-black text-slate-950">
                              {order.driver
                                ? `${order.driver.firstName || ""} ${order.driver.lastName || ""}`.trim()
                                : language === "de" ? "Kein Fahrer zugewiesen" : "Şoför atanmadı"}
                            </p>
                          )}
                        </div>

                        <div className="min-w-52">
                          <p className="mb-1 text-sm font-bold text-slate-500">
                            Ödeme
                          </p>

                          {order.openPaymentAmount <= 0.009 ? (
                            <>
                              <p className="font-black text-green-700">
                                {language === "de" ? "Bezahlt" : "Hesap Kapandı"}
                              </p>

                              <p className="mt-1 text-xs font-bold text-green-600">
                                {language === "de"
  ? "Keine offene Restforderung vorhanden"
  : "Siparişin açık bakiyesi bulunmuyor"}
                              </p>

                              <div className="mt-2 rounded-xl bg-green-50 px-3 py-2">
                                <p className="text-xs font-bold text-green-700">
                                  {language === "de"
  ? "Insgesamt eingenommen"
  : "Toplam tahsil edilen"}
                                </p>

                                <p className="text-base font-black text-green-800">
                                  {order.approvedPaymentAmount.toLocaleString(
                                    "de-DE",
                                    {
                                      style: "currency",
                                      currency: "EUR",
                                    },
                                  )}
                                </p>
                              </div>
                            </>
                          ) : order.driverPaymentReportedAt ? (
                            <>
                              <p className="font-black text-amber-600">
                                {language === "de"
                                  ? "Fahrer hat das Geld erhalten"
                                  : "Şoför Parayı Aldı"}
                              </p>

                              <p className="mt-1 text-xs font-bold text-amber-700">
                                {language === "de"
                                  ? "Wartet auf Freigabe der Kasse"
                                  : "Admin kasa onayı bekleniyor"}
                              </p>

                              {order.driverPaymentReportedAmount !== null ? (
                                <div className="mt-2 rounded-xl bg-amber-50 px-3 py-2">
                                  <p className="text-xs font-bold text-amber-700">
                                    {language === "de"
                                      ? "Ausstehender Betrag"
                                      : "Onay bekleyen tutar"}
                                  </p>

                                  <p className="text-base font-black text-amber-900">
                                    {order.driverPaymentReportedAmount.toLocaleString(
                                      "de-DE",
                                      {
                                        style: "currency",
                                        currency: "EUR",
                                      },
                                    )}
                                  </p>
                                </div>
                              ) : null}

                              <div className="mt-2 rounded-xl bg-red-50 px-3 py-2">
                                <p className="text-xs font-bold text-red-700">
                                  {language === "de"
                                    ? "Offener Restbetrag"
                                    : "Siparişte kalan açık tutar"}
                                </p>

                                <p className="text-lg font-black text-red-700">
                                  {Number(
                                    order.openPaymentAmount ??
                                      Math.max(
                                        0,
                                        Number(order.totalAmount || 0) -
                                          Number(
                                            order.approvedPaymentAmount || 0,
                                          ),
                                      ),
                                  ).toLocaleString("de-DE", {
                                    style: "currency",
                                    currency: "EUR",
                                  })}
                                </p>
                              </div>

                              {order.approvedPaymentAmount > 0 ? (
                                <p className="mt-2 text-xs font-bold text-green-700">
                                  Daha önce onaylanan:{" "}
                                  {order.approvedPaymentAmount.toLocaleString(
                                    "de-DE",
                                    {
                                      style: "currency",
                                      currency: "EUR",
                                    },
                                  )}
                                </p>
                              ) : null}

                              {permissions?.approveCustomerPayment ? (
                                <button
                                  type="button"
                                  disabled={updating}
                                  onClick={() =>
                                    changePaymentStatus(order, "PAID")
                                  }
                                  className="mt-2 w-full rounded-xl bg-green-600 px-3 py-2 text-sm font-black text-white transition hover:bg-green-700 disabled:opacity-50"
                                >
                                  {updating
                                    ? "Onaylanıyor..."
                                    : language === "de" ? language === "de" ? "Zahlung bestätigen und in die Kasse übernehmen" : "Parayı Onayla ve Kasaya Al" : "Parayı Onayla ve Kasaya Al"}
                                </button>
                              ) : (
                                <p className="mt-2 rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-500">
                                  Tahsilat onay yetkiniz bulunmuyor
                                </p>
                              )}
                            </>
                          ) : (
                            <>
                              <p className="font-black text-red-600">
                                {language === "de" ? "Offene Zahlungen" : "Ödeme Açık"}
                              </p>

                              <div className="mt-2 rounded-xl bg-red-50 px-3 py-2">
                                <p className="text-xs font-bold text-red-700">
                                  Kalan açık tutar
                                </p>

                                <p className="text-lg font-black text-red-700">
                                  {Number(
                                    order.openPaymentAmount ??
                                      Math.max(
                                        0,
                                        Number(order.totalAmount || 0) -
                                          Number(
                                            order.approvedPaymentAmount || 0,
                                          ),
                                      ),
                                  ).toLocaleString("de-DE", {
                                    style: "currency",
                                    currency: "EUR",
                                  })}
                                </p>
                              </div>

                              {order.approvedPaymentAmount > 0 ? (
                                <p className="mt-2 text-xs font-bold text-green-700">
                                  Şimdiye kadar ödenen:{" "}
                                  {order.approvedPaymentAmount.toLocaleString(
                                    "de-DE",
                                    {
                                      style: "currency",
                                      currency: "EUR",
                                    },
                                  )}
                                </p>
                              ) : (
                                <p className="mt-1 text-xs font-bold text-slate-500">
                                  Henüz onaylanmış ödeme bulunmuyor
                                </p>
                              )}
                            </>
                          )}
                        </div>

                        <div>
                          <p className="text-sm font-bold text-slate-500">
                            Toplam
                          </p>

                          <p className="font-black text-slate-950">
                            {order.totalAmount.toFixed(2)} €
                          </p>
                        </div>

                        <div className="flex shrink-0 gap-2">
                          {permissions?.printOrder ? (
                            <button
                              type="button"
                              aria-label={language === "de" ? "Bestellung drucken" : "Siparişi yazdır"}
                              onClick={() => printOrder(order)}
                              className="rounded-xl bg-slate-950 p-3 text-white transition hover:bg-orange-500"
                            >
                              <Printer size={18} />
                            </button>
                          ) : null}

                          <button
                            type="button"
                            aria-label={language === "de" ? "Bestelldetails öffnen" : "Sipariş detayını aç"}
                            onClick={() =>
                              setExpandedOrderId(expanded ? null : order.id)
                            }
                            className="rounded-xl bg-slate-100 p-3 text-slate-700"
                          >
                            {expanded ? (
                              <ChevronUp size={18} />
                            ) : (
                              <ChevronDown size={18} />
                            )}
                          </button>

                          {permissions?.deleteOrder ? (
                            <button
                              type="button"
                              aria-label={language === "de" ? "Bestellung aus Liste entfernen" : "Siparişi listeden kaldır"}
                              disabled={updating}
                              onClick={() => deleteOrder(order)}
                              className="rounded-xl bg-red-50 p-3 text-red-500 transition hover:bg-red-100 disabled:opacity-50"
                            >
                              {updating ? (
                                <Loader2 size={18} className="animate-spin" />
                              ) : (
                                <Trash2 size={18} />
                              )}
                            </button>
                          ) : null}
                        </div>
                      </div>

                      {expanded ? (
                        <div className="border-t border-slate-200 bg-slate-50 p-5">
                          <div className="grid gap-6 lg:grid-cols-2">
                            <div>
                              <h3 className="font-black text-slate-950">
                                Ürünler
                              </h3>

                              <div className="mt-3 space-y-3">
                                {order.items.map((item) => (
                                  <div
                                    key={item.id}
                                    className="flex justify-between gap-4 rounded-xl bg-white p-4"
                                  >
                                    <div>
                                      <p className="font-bold">{item.name}</p>

                                      <p className="mt-1 text-sm text-slate-500">
                                        {item.quantity} ×{" "}
                                        {item.price.toFixed(2)} €
                                      </p>

                                      {item.pfand > 0 ? (
                                        <p className="mt-1 text-xs font-semibold text-orange-500">
                                          Pfand:{" "}
                                          {(item.pfand * item.quantity).toFixed(
                                            2,
                                          )}{" "}
                                          €
                                        </p>
                                      ) : null}
                                    </div>

                                    <strong>
                                      {(
                                        item.quantity *
                                        (Number(item.price) +
                                          Number(item.pfand || 0))
                                      ).toFixed(2)}{" "}
                                      €
                                    </strong>
                                  </div>
                                ))}
                              </div>

                              <div className="mt-5 space-y-2 rounded-xl bg-white p-4 text-sm">
                                <div className="flex justify-between">
                                  <span>{language === "de" ? "Zwischensumme" : "Ara Toplam"}</span>

                                  <strong>{order.subtotal.toFixed(2)} €</strong>
                                </div>

                                <div className="flex justify-between">
                                  <span>{language === "de" ? "Pfand" : "Pfand"}</span>

                                  <strong>
                                    {order.pfandAmount.toFixed(2)} €
                                  </strong>
                                </div>

                                <div className="flex justify-between">
                                  <span>{language === "de" ? "Lieferung" : "Teslimat"}</span>

                                  <strong>
                                    {order.deliveryFee.toFixed(2)} €
                                  </strong>
                                </div>

                                {order.pfandReturnAmount > 0 ? (
                                  <div className="flex justify-between text-green-700">
                                    <span>
                                      {order.user.role === "DEALER"
                                        ? language === "de" ? "Pfandrückgabe des Händlers" : "Bayi Pfand İadesi"
                                        : language === "de" ? "Pfandrückgabe" : "Pfand İadesi"}
                                    </span>

                                    <strong>
                                      -{order.pfandReturnAmount.toFixed(2)} €
                                    </strong>
                                  </div>
                                ) : null}

                                <div className="flex justify-between border-t border-slate-200 pt-2 text-base">
                                  <span className="font-black">{language === "de" ? "Gesamt" : "Toplam"}</span>

                                  <strong>
                                    {order.totalAmount.toFixed(2)} €
                                  </strong>
                                </div>
                              </div>

                              {order.user.role === "DEALER" ? (
                                <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4">
                                  <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                      <h3 className="font-black text-slate-950">
                                        Bayi Pfand Teslimi
                                      </h3>

                                      <p className="mt-1 text-xs text-slate-600">
                                        Bayinin getirdiği Pfandları sayın. Tutar
                                        sipariş hesabından otomatik düşecektir.
                                      </p>
                                    </div>

                                    {order.pfandReturnAmount > 0 ? (
                                      <span className="rounded-full bg-green-600 px-3 py-1.5 text-xs font-black text-white">
                                        {order.pfandReturnAmount.toFixed(2)} €
                                        düşüldü
                                      </span>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setDealerPfandOrderId((current) =>
                                            current === order.id
                                              ? null
                                              : order.id,
                                          );

                                          resetDealerPfandForm();
                                        }}
                                        className="rounded-xl bg-green-600 px-4 py-2 text-sm font-black text-white transition hover:bg-green-700"
                                      >
                                        {dealerPfandOrderId === order.id
                                          ? language === "de" ? "Pfandeingabe schließen" : "Pfand Girişini Kapat"
                                          : language === "de" ? "Pfand eingeben" : "Pfand Gir"}
                                      </button>
                                    )}
                                  </div>

                                  {order.pfandReturnAmount > 0 ? (
                                    <div className="mt-3 rounded-lg bg-white p-3 text-sm">
                                      <div className="flex justify-between">
                                        <span className="text-slate-600">
                                          Siparişten düşülen Pfand
                                        </span>

                                        <strong className="text-green-700">
                                          -
                                          {order.pfandReturnAmount.toLocaleString(
                                            "de-DE",
                                            {
                                              style: "currency",
                                              currency: "EUR",
                                            },
                                          )}
                                        </strong>
                                      </div>

                                      <div className="mt-2 flex justify-between border-t border-slate-100 pt-2">
                                        <span className="font-bold text-slate-700">
                                          Kalan ödeme
                                        </span>

                                        <strong className="text-slate-950">
                                          {order.totalAmount.toLocaleString(
                                            "de-DE",
                                            {
                                              style: "currency",
                                              currency: "EUR",
                                            },
                                          )}
                                        </strong>
                                      </div>
                                    </div>
                                  ) : null}

                                  {dealerPfandOrderId === order.id &&
                                  order.pfandReturnAmount <= 0 ? (
                                    <div className="mt-4">
                                      <div className="grid gap-3 sm:grid-cols-2">
                                        {[
                                          {
                                            key: "0.08",
                                            label: "0,08 € Pfand",
                                          },
                                          {
                                            key: "0.15",
                                            label: "0,15 € Pfand",
                                          },
                                          {
                                            key: "0.25",
                                            label: "0,25 € Pfand",
                                          },
                                          {
                                            key: "3.30",
                                            label: "3,30 € Kasa",
                                          },
                                        ].map((pfandType) => (
                                          <label
                                            key={pfandType.key}
                                            className="rounded-xl bg-white p-3"
                                          >
                                            <span className="text-xs font-black text-slate-700">
                                              {pfandType.label}
                                            </span>

                                            <input
                                              type="number"
                                              min="0"
                                              max="9999"
                                              step="1"
                                              inputMode="numeric"
                                              value={
                                                dealerPfandValues[
                                                  pfandType.key
                                                ] || ""
                                              }
                                              onChange={(event) =>
                                                setDealerPfandValues(
                                                  (current) => ({
                                                    ...current,

                                                    [pfandType.key]:
                                                      event.target.value.replace(
                                                        /\D/g,
                                                        "",
                                                      ),
                                                  }),
                                                )
                                              }
                                              placeholder={language === "de" ? "Menge" : "Adet"}
                                              className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 font-bold outline-none focus:border-green-500"
                                            />
                                          </label>
                                        ))}
                                      </div>

                                      <div className="mt-4 rounded-xl bg-white p-4">
                                        <div className="flex justify-between">
                                          <span className="font-bold text-slate-600">
                                            Getirilen Pfand
                                          </span>

                                          <strong className="text-green-700">
                                            {getDealerPfandTotal().toLocaleString(
                                              "de-DE",
                                              {
                                                style: "currency",
                                                currency: "EUR",
                                              },
                                            )}
                                          </strong>
                                        </div>

                                        <div className="mt-2 flex justify-between border-t border-slate-100 pt-2">
                                          <span className="font-black text-slate-950">
                                            Kalan ödeme
                                          </span>

                                          <strong className="text-slate-950">
                                            {Math.max(
                                              0,
                                              order.totalAmount -
                                                getDealerPfandTotal(),
                                            ).toLocaleString("de-DE", {
                                              style: "currency",
                                              currency: "EUR",
                                            })}
                                          </strong>
                                        </div>
                                      </div>

                                      <button
                                        type="button"
                                        disabled={
                                          dealerPfandSaving ||
                                          getDealerPfandTotal() <= 0
                                        }
                                        onClick={() => saveDealerPfand(order)}
                                        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 font-black text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                                      >
                                        {dealerPfandSaving ? (
                                          <>
                                            <Loader2
                                              size={18}
                                              className="animate-spin"
                                            />
                                            Pfand kaydediliyor...
                                          </>
                                        ) : (
                                          language === "de" ? "Pfand ins Lager übernehmen und verrechnen" : "Pfandı Depoya Al ve Hesaptan Düş"
                                        )}
                                      </button>
                                    </div>
                                  ) : null}
                                </div>
                              ) : null}

                              {order.user.role !== "DEALER" &&
                              order.pfandReturnId &&
                              order.pfandReturnItems.length > 0 ? (
                                <div
                                  className={`mt-5 rounded-xl border p-4 ${
                                    order.pfandReturnStatus === "PENDING"
                                      ? "border-amber-200 bg-amber-50"
                                      : "border-green-200 bg-green-50"
                                  }`}
                                >
                                  <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                      <h3 className="font-black text-slate-950">
                                        Şoför Pfand Son Kontrolü
                                      </h3>

                                      <p className="mt-1 text-xs text-slate-600">
                                        Şoförün bildirdiği adetleri depoya gelen
                                        gerçek Pfand ile karşılaştırın.
                                      </p>
                                    </div>

                                    {order.pfandReturnStatus === "PENDING" ? (
                                      <button
                                        type="button"
                                        disabled={adminPfandSaving}
                                        onClick={() =>
                                          openAdminPfandCheck(order)
                                        }
                                        className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-black text-white transition hover:bg-amber-600 disabled:opacity-50"
                                      >
                                        {adminPfandOrderId === order.id
                                          ? language === "de" ? "Prüfung schließen" : "Kontrolü Kapat"
                                          : language === "de" ? "Pfandrückgabe prüfen" : "Gelen Pfandı Kontrol Et"}
                                      </button>
                                    ) : (
                                      <span className="rounded-full bg-green-600 px-3 py-1.5 text-xs font-black text-white">
                                        Admin Doğruladı
                                      </span>
                                    )}
                                  </div>

                                  <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
                                    <div className="grid grid-cols-[minmax(0,1fr)_90px_90px_85px] gap-2 bg-slate-100 px-3 py-2 text-[10px] font-black uppercase text-slate-500">
                                      <span>{language == "de" ? "Pfandtyp" : "Pfand Türü"}</span>

                                      <span className="text-center">{language === "de" ? "Fahrer" : "Şoför"}</span>

                                      <span className="text-center">{language === "de" ? "Administrator" : "Admin"}</span>

                                      <span className="text-right">{language === "de" ? "Betrag" : "Tutar"}</span>
                                    </div>

                                    {order.pfandReturnItems.map((item) => {
                                      const adminQuantity =
                                        order.pfandReturnStatus === "PENDING"
                                          ? getAdminPfandQuantity(
                                              item.id,
                                              item.originalQuantity,
                                            )
                                          : item.quantity;

                                      const quantityDifference =
                                        adminQuantity - item.originalQuantity;

                                      return (
                                        <div
                                          key={item.id}
                                          className="grid grid-cols-[minmax(0,1fr)_90px_90px_85px] items-center gap-2 border-t border-slate-200 px-3 py-2"
                                        >
                                          <div className="min-w-0">
                                            <p className="truncate text-xs font-black text-slate-950">
                                              {item.name}
                                            </p>

                                            <p className="text-[10px] text-slate-500">
                                              Birim:{" "}
                                              {item.unitAmount.toFixed(2)} €
                                            </p>
                                          </div>

                                          <div className="text-center">
                                            <span className="inline-flex min-w-10 justify-center rounded-lg bg-slate-100 px-2 py-1 text-xs font-black text-slate-800">
                                              {item.originalQuantity}
                                            </span>
                                          </div>

                                          <div className="text-center">
                                            {order.pfandReturnStatus ===
                                            "PENDING" ? (
                                              <input
                                                type="number"
                                                min="0"
                                                max="9999"
                                                step="1"
                                                inputMode="numeric"
                                                disabled={adminPfandSaving}
                                                value={
                                                  adminPfandValues[item.id] ??
                                                  String(item.originalQuantity)
                                                }
                                                onChange={(event) =>
                                                  setAdminPfandValues(
                                                    (current) => ({
                                                      ...current,

                                                      [item.id]:
                                                        event.target.value.replace(
                                                          /\D/g,
                                                          "",
                                                        ),
                                                    }),
                                                  )
                                                }
                                                className="w-16 rounded-lg border border-slate-200 px-2 py-1.5 text-center text-xs font-black outline-none focus:border-amber-500 disabled:bg-slate-100"
                                              />
                                            ) : (
                                              <span className="inline-flex min-w-10 justify-center rounded-lg bg-green-100 px-2 py-1 text-xs font-black text-green-800">
                                                {item.quantity}
                                              </span>
                                            )}

                                            {quantityDifference !== 0 ? (
                                              <p
                                                className={`mt-1 text-[9px] font-black ${
                                                  quantityDifference < 0
                                                    ? "text-red-600"
                                                    : "text-green-700"
                                                }`}
                                              >
                                                Fark:{" "}
                                                {quantityDifference > 0
                                                  ? "+"
                                                  : ""}
                                                {quantityDifference}
                                              </p>
                                            ) : null}
                                          </div>

                                          <div className="text-right">
                                            <p className="text-xs font-black text-slate-950">
                                              {(
                                                adminQuantity * item.unitAmount
                                              ).toFixed(2)}{" "}
                                              €
                                            </p>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>

                                  {order.pfandReturnStatus === "PENDING" &&
                                  adminPfandOrderId === order.id ? (
                                    <div className="mt-4">
                                      <div className="rounded-xl bg-white p-4">
                                        <div className="flex justify-between gap-4">
                                          <span className="text-sm font-bold text-slate-600">
                                            Şoförün bildirdiği
                                          </span>

                                          <strong className="text-slate-950">
                                            {order.pfandReturnItems
                                              .reduce(
                                                (total, item) =>
                                                  total +
                                                  item.originalQuantity *
                                                    item.unitAmount,
                                                0,
                                              )
                                              .toLocaleString("de-DE", {
                                                style: "currency",
                                                currency: "EUR",
                                              })}
                                          </strong>
                                        </div>

                                        <div className="mt-2 flex justify-between gap-4">
                                          <span className="text-sm font-bold text-slate-600">
                                            Adminin saydığı
                                          </span>

                                          <strong className="text-green-700">
                                            {getAdminCheckedPfandTotal(
                                              order,
                                            ).toLocaleString("de-DE", {
                                              style: "currency",
                                              currency: "EUR",
                                            })}
                                          </strong>
                                        </div>

                                        <div className="mt-2 flex justify-between gap-4 border-t border-slate-100 pt-2">
                                          <span className="font-black text-slate-950">
                                            Fark
                                          </span>

                                          <strong
                                            className={
                                              getAdminCheckedPfandTotal(order) -
                                                order.pfandReturnItems.reduce(
                                                  (total, item) =>
                                                    total +
                                                    item.originalQuantity *
                                                      item.unitAmount,
                                                  0,
                                                ) <
                                              0
                                                ? "text-red-600"
                                                : "text-green-700"
                                            }
                                          >
                                            {(
                                              getAdminCheckedPfandTotal(order) -
                                              order.pfandReturnItems.reduce(
                                                (total, item) =>
                                                  total +
                                                  item.originalQuantity *
                                                    item.unitAmount,
                                                0,
                                              )
                                            ).toLocaleString("de-DE", {
                                              style: "currency",
                                              currency: "EUR",
                                              signDisplay: "always",
                                            })}
                                          </strong>
                                        </div>
                                      </div>

                                      <button
                                        type="button"
                                        disabled={
                                          adminPfandSaving ||
                                          getAdminCheckedPfandTotal(order) <= 0
                                        }
                                        onClick={() =>
                                          approveDriverPfand(order)
                                        }
                                        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 font-black text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                                      >
                                        {adminPfandSaving ? (
                                          <>
                                            <Loader2
                                              size={18}
                                              className="animate-spin"
                                            />
                                            Pfand doğrulanıyor...
                                          </>
                                        ) : (
                                          language === "de" ? "Pfand bestätigen und ins Lager übernehmen" : "Pfandı Doğrula ve Depoya Al"
                                        )}
                                      </button>
                                    </div>
                                  ) : null}
                                </div>
                              ) : null}
                            </div>

                            <div>
                              <h3 className="font-black text-slate-950">
                                Müşteri
                              </h3>

                              <div className="mt-3 rounded-xl bg-white p-4 leading-7 text-slate-600">
                                <p className="font-bold text-slate-950">
                                  {order.user.companyName ||
                                    `${order.user.firstName || ""} ${order.user.lastName || ""}`}
                                </p>

                                <p>{order.user.email}</p>

                                <p>{order.user.phone || "-"}</p>
                              </div>

                              <h3 className="mt-5 font-black text-slate-950">
                                Teslimat Bilgileri
                              </h3>

                              <p className="mt-3 whitespace-pre-line rounded-xl bg-white p-4 leading-7 text-slate-600">
                                {order.deliveryAddress}
                              </p>

                              {order.customerNote ? (
                                <>
                                  <h3 className="mt-5 font-black text-slate-950">
                                    Müşteri Notu
                                  </h3>

                                  <p className="mt-2 rounded-xl bg-white p-4 text-slate-600">
                                    {order.customerNote}
                                  </p>
                                </>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </article>
                  );
                })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
