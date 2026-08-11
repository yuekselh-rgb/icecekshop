import { escapeHtml } from "@/lib/html-escape";
import QRCode from "qrcode";

export type ReceiptOrderStatus =
  | "NEW"
  | "CONFIRMED"
  | "PREPARING"
  | "READY"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";

export type ReceiptOrder = {
  id: string;
  orderNumber: string;
  status: ReceiptOrderStatus;
  subtotal: number;
  deliveryFee: number;
  pfandAmount: number;
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

  totalAmount: number;
  deliveryAddress: string;
  customerNote: string | null;
  createdAt: string;

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

  items: Array<{
    name: string;
    quantity: number;
    price: number;
    pfand: number;
  }>;
};

const receiptStatusLabels: Record<ReceiptOrderStatus, { de: string; tr: string }> = {
  NEW: { de: "Neu", tr: "Yeni" },
  CONFIRMED: { de: "Bestätigt", tr: "Onaylandı" },
  PREPARING: { de: "Wird vorbereitet", tr: "Hazırlanıyor" },
  READY: { de: "Bereit", tr: "Hazır" },
  OUT_FOR_DELIVERY: { de: "Unterwegs", tr: "Teslimata Çıktı" },
  DELIVERED: { de: "Geliefert", tr: "Teslim Edildi" },
  CANCELLED: { de: "Storniert", tr: "İptal Edildi" },
};

function isBarSaleOrder(order: { orderNumber: string }) {
  return order.orderNumber.startsWith("BAR-");
}

export function hasNavigableDeliveryAddress(order: {
  orderNumber: string;
  deliveryAddress: string;
}) {
  return (
    !isBarSaleOrder(order) && !order.deliveryAddress.startsWith("DEPODAN TESLİM")
  );
}

export function getMapsQuery(order: { deliveryAddress: string }) {
  return order.deliveryAddress
    .split("\n")
    .filter(
      (line) =>
        !line.startsWith("Telefon:") &&
        !line.startsWith("Kat:") &&
        !line.startsWith("Zil:"),
    )
    .join(", ");
}

export async function getDeliveryQrCode(order: { deliveryAddress: string }) {
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

export function buildOrderReceiptHtml(
  order: ReceiptOrder,
  deliveryQrCode: string | null,
  language: "de" | "tr",
) {
  return `
      <!doctype html>
      <html lang="${language === "de" ? "de" : "tr"}">
        <head>
          <meta charset="utf-8" />
          <title>${escapeHtml(order.orderNumber)}</title>

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
            ${language === "de" ? "Bestellung" : "Sipariş"}
            ${escapeHtml(order.orderNumber)}
          </h1>

          <p>
            ${language === "de" ? "Datum" : "Tarih"}:
            ${new Date(order.createdAt).toLocaleString("de-DE")}
          </p>

          <p>
            ${language === "de" ? "Status" : "Durum"}:
            ${receiptStatusLabels[order.status][language]}
          </p>

          <p>
            <strong>${language === "de" ? "Fahrer" : "Şoför"}</strong>
            ${
              order.driver
                ? escapeHtml(
                    `${order.driver.firstName || ""} ${order.driver.lastName || ""}`.trim() ||
                      order.driver.email,
                  )
                : language === "de" ? "Nicht zugewiesen" : "Atanmadı"
            }
          </p>

          <h2>${language === "de" ? "Kunde" : "Müşteri"}</h2>

          <p>
            ${order.user.companyName ? `${escapeHtml(order.user.companyName)}<br />` : ""}

            ${escapeHtml(order.user.firstName || "")}
            ${escapeHtml(order.user.lastName || "")}<br />

            ${escapeHtml(order.user.email)}<br />

            ${escapeHtml(order.user.phone || "")}
          </p>

          <h2>${language === "de" ? "Lieferadresse" : "Teslimat Adresi"}</h2>

          <div style="display:flex; align-items:flex-start; gap:20px;">
            <p class="address" style="margin:0;">
              ${escapeHtml(order.deliveryAddress)}
            </p>

            ${
              deliveryQrCode
                ? `
                  <div style="text-align:center;">
                    <img src="${deliveryQrCode}" width="120" height="120" alt="${language === "de" ? "QR-Code für Google Maps" : "Google Maps için QR kodu"}" />
                    <p style="margin:4px 0 0; font-size:11px; color:#64748b;">
                      ${language === "de" ? "In Google Maps öffnen" : "Google Maps'te aç"}
                    </p>
                  </div>
                `
                : ""
            }
          </div>

          ${
            order.customerNote
              ? `
                <h2>${language === "de" ? "Kundennotiz" : "Müşteri Notu"}</h2>
                <p>${escapeHtml(order.customerNote)}</p>
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
                        ${escapeHtml(item.name)}
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
                ${language === "de" ? "Zwischensumme" : "Ara Toplam"}
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
                    <span>${language === "de" ? "Pfandrückgabe" : "Pfand İadesi"}</span>

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
                            ${language === "de" ? "Zurückgegebenes Pfand" : "İade edilen Pfand"}
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
                                    <strong>${escapeHtml(item.name)}</strong><br />

                                    <span style="
                                      font-size:11px;
                                      color:#64748b;
                                    ">
                                      ${language === "de" ? "Kunde" : "Müşteri"}:
                                      ${item.originalQuantity}
                                      → ${language === "de" ? "Fahrer" : "Şoför"}:
                                      ${item.quantity}

                                      ${
                                        item.quantityDifference !== 0
                                          ? ` · ${language === "de" ? "Differenz" : "Fark"}: ${item.quantityDifference > 0 ? "+" : ""}${item.quantityDifference}`
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
                                            ${language === "de" ? "Differenz" : "Fark"}:
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
    `;
}

export async function printOrderSilently(
  order: ReceiptOrder,
  language: "de" | "tr",
) {
  const deliveryQrCode = hasNavigableDeliveryAddress(order)
    ? await getDeliveryQrCode(order)
    : null;

  const iframe = document.createElement("iframe");

  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";

  document.body.appendChild(iframe);

  const frameDocument = iframe.contentDocument;

  if (!frameDocument) {
    iframe.remove();
    return;
  }

  frameDocument.open();
  frameDocument.write(buildOrderReceiptHtml(order, deliveryQrCode, language));
  frameDocument.close();

  function cleanup() {
    window.removeEventListener("afterprint", cleanup);
    iframe.remove();
  }

  iframe.onload = () => {
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    }, 250);
  };

  window.addEventListener("afterprint", cleanup);

  setTimeout(cleanup, 60000);
}
