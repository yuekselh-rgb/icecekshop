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

export type ReceiptCompany = {
  companyName: string;
  logoUrl: string | null;
  street: string | null;
  houseNumber: string | null;
  postalCode: string | null;
  city: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  legalForm: string | null;
  taxNumber: string | null;
  vatId: string | null;
  commercialRegister: string | null;
  registerCourt: string | null;
  bankName: string | null;
  accountHolder: string | null;
  iban: string | null;
  bic: string | null;
  footerText: string | null;
};

const emptyReceiptCompany: ReceiptCompany = {
  companyName: "",
  logoUrl: null,
  street: null,
  houseNumber: null,
  postalCode: null,
  city: null,
  country: null,
  phone: null,
  email: null,
  website: null,
  legalForm: null,
  taxNumber: null,
  vatId: null,
  commercialRegister: null,
  registerCourt: null,
  bankName: null,
  accountHolder: null,
  iban: null,
  bic: null,
  footerText: null,
};

export async function fetchReceiptCompany(): Promise<ReceiptCompany> {
  try {
    const response = await fetch("/api/company-settings");
    const data = await response.json();
    const settings = data.settings || {};

    return {
      companyName: settings.companyName || "",
      logoUrl: settings.logoUrl || null,
      street: settings.street || null,
      houseNumber: settings.houseNumber || null,
      postalCode: settings.postalCode || null,
      city: settings.city || null,
      country: settings.country || null,
      phone: settings.phone || null,
      email: settings.email || null,
      website: settings.website || null,
      legalForm: settings.legalForm || null,
      taxNumber: settings.taxNumber || null,
      vatId: settings.vatId || null,
      commercialRegister: settings.commercialRegister || null,
      registerCourt: settings.registerCourt || null,
      bankName: settings.bankName || null,
      accountHolder: settings.accountHolder || null,
      iban: settings.iban || null,
      bic: settings.bic || null,
      footerText: settings.footerText || null,
    };
  } catch {
    return emptyReceiptCompany;
  }
}

const receiptStatusLabels: Record<ReceiptOrderStatus, { de: string; tr: string }> = {
  NEW: { de: "Neu", tr: "Yeni" },
  CONFIRMED: { de: "Bestätigt", tr: "Onaylandı" },
  PREPARING: { de: "Wird vorbereitet", tr: "Hazırlanıyor" },
  READY: { de: "Bereit", tr: "Hazır" },
  OUT_FOR_DELIVERY: { de: "Unterwegs", tr: "Teslimata Çıktı" },
  DELIVERED: { de: "Geliefert", tr: "Teslim Edildi" },
  CANCELLED: { de: "Storniert", tr: "İptal Edildi" },
};

/*
 * Bar-Satışı-Bestellungen ohne echte Lieferadresse (Verkauf direkt an
 * der Theke) markieren deliveryAddress mit diesem Platzhalter-Präfix.
 * Offene Bar-Verkäufe MIT echter Lieferadresse (z. B. an ein
 * Restaurant/einen Imbiss) sollen aber navigierbar bleiben.
 */
function isPlaceholderDeliveryAddress(deliveryAddress: string) {
  return (
    deliveryAddress.startsWith("Barverkauf") ||
    deliveryAddress.startsWith("Bar Satışı") ||
    deliveryAddress.startsWith("DEPODAN TESLİM")
  );
}

export function hasNavigableDeliveryAddress(order: {
  orderNumber: string;
  deliveryAddress: string;
}) {
  return (
    Boolean(order.deliveryAddress) &&
    !isPlaceholderDeliveryAddress(order.deliveryAddress)
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

export function renderCompanyHeader(company: ReceiptCompany, language: "de" | "tr") {
  const addressLine = [
    [company.street, company.houseNumber].filter(Boolean).join(" "),
    [company.postalCode, company.city].filter(Boolean).join(" "),
    company.country,
  ]
    .filter(Boolean)
    .map((line) => escapeHtml(line as string))
    .join("<br />");

  const contactParts = [
    company.phone,
    company.email,
    company.website,
  ].filter(Boolean) as string[];

  const taxParts = [
    company.taxNumber
      ? `${language === "de" ? "Steuernr." : "Vergi No"}: ${escapeHtml(company.taxNumber)}`
      : null,
    company.vatId ? `USt-IdNr.: ${escapeHtml(company.vatId)}` : null,
  ].filter(Boolean) as string[];

  return `
    <div class="company">
      ${
        company.logoUrl
          ? `<img class="company-logo" src="${escapeHtml(company.logoUrl)}" alt="${escapeHtml(company.companyName)}" />`
          : `<div class="company-name">${escapeHtml(company.companyName || "")}</div>`
      }

      ${addressLine ? `<div class="company-line">${addressLine}</div>` : ""}

      ${contactParts.length ? `<div class="company-line">${contactParts.map((part) => escapeHtml(part)).join(" · ")}</div>` : ""}

      ${taxParts.length ? `<div class="company-line company-tax">${taxParts.join(" · ")}</div>` : ""}
    </div>
  `;
}

export function renderLegalFooter(company: ReceiptCompany, language: "de" | "tr") {
  const registerParts = [
    company.legalForm,
    company.commercialRegister
      ? `${language === "de" ? "Registergericht" : "Sicil Mahkemesi"}: ${escapeHtml(company.registerCourt || "")} · ${escapeHtml(company.commercialRegister)}`
      : null,
  ].filter(Boolean) as string[];

  const bankParts = [
    company.bankName ? escapeHtml(company.bankName) : null,
    company.accountHolder ? escapeHtml(company.accountHolder) : null,
    company.iban ? `IBAN ${escapeHtml(company.iban)}` : null,
    company.bic ? `BIC ${escapeHtml(company.bic)}` : null,
  ].filter(Boolean) as string[];

  if (
    registerParts.length === 0 &&
    bankParts.length === 0 &&
    !company.footerText
  ) {
    return "";
  }

  return `
    <footer class="legal-footer">
      ${registerParts.length ? `<div>${registerParts.join(" · ")}</div>` : ""}
      ${bankParts.length ? `<div>${bankParts.join(" · ")}</div>` : ""}
      ${company.footerText ? `<div>${escapeHtml(company.footerText)}</div>` : ""}
    </footer>
  `;
}

export const receiptStyleSheet = `
            @page {
              size: A4;
              margin: 14mm 12mm;
            }

            * {
              box-sizing: border-box;
            }

            body {
              font-family: Arial, Helvetica, sans-serif;
              font-size: 12px;
              line-height: 1.4;
              color: #0f172a;
              margin: 0;
              padding: 10mm;
            }

            .letterhead {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              gap: 24px;
              padding-bottom: 12px;
              border-bottom: 2px solid #0f172a;
            }

            .company-logo {
              max-height: 46px;
              max-width: 200px;
              object-fit: contain;
              margin-bottom: 6px;
            }

            .company-name {
              font-size: 16px;
              font-weight: 800;
              margin-bottom: 3px;
            }

            .company-line {
              font-size: 10.5px;
              color: #475569;
              line-height: 1.5;
            }

            .company-tax {
              color: #64748b;
            }

            .doc-meta {
              text-align: right;
              min-width: 210px;
            }

            .doc-title {
              font-size: 20px;
              font-weight: 800;
              letter-spacing: 0.5px;
              margin-bottom: 8px;
              text-transform: uppercase;
            }

            .meta-table {
              margin-left: auto;
              border-collapse: collapse;
              font-size: 11px;
            }

            .meta-table td {
              padding: 1.5px 0 1.5px 14px;
              text-align: right;
              white-space: nowrap;
            }

            .meta-table td:first-child {
              color: #64748b;
              padding-left: 0;
            }

            .parties {
              display: flex;
              gap: 28px;
              margin-top: 16px;
            }

            .party {
              flex: 1;
              min-width: 0;
            }

            .party-label {
              font-size: 9.5px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.4px;
              color: #64748b;
              margin-bottom: 3px;
            }

            .party-body {
              font-size: 11.5px;
              line-height: 1.5;
            }

            .address-with-qr {
              display: flex;
              align-items: flex-start;
              justify-content: space-between;
              gap: 10px;
            }

            .address {
              white-space: pre-line;
              margin: 0;
            }

            .qr-block {
              text-align: center;
              flex-shrink: 0;
            }

            .qr-block img {
              display: block;
            }

            .qr-block p {
              margin: 2px 0 0;
              font-size: 8.5px;
              color: #64748b;
            }

            .note-block {
              margin-top: 10px;
              padding: 6px 10px;
              background: #f8fafc;
              border-radius: 6px;
              font-size: 11px;
            }

            .note-block .party-label {
              margin-bottom: 2px;
            }

            table.items {
              width: 100%;
              border-collapse: collapse;
              margin-top: 16px;
              font-size: 11px;
            }

            table.items thead {
              display: table-header-group;
            }

            table.items th {
              text-align: left;
              padding: 5px 6px;
              border-bottom: 1.5px solid #0f172a;
              font-size: 9.5px;
              text-transform: uppercase;
              letter-spacing: 0.3px;
              color: #334155;
            }

            table.items td {
              padding: 4px 6px;
              border-bottom: 1px solid #e2e8f0;
              vertical-align: top;
            }

            table.items tr {
              page-break-inside: avoid;
            }

            table.items th.num,
            table.items td.num {
              text-align: right;
              white-space: nowrap;
              font-variant-numeric: tabular-nums;
            }

            .totals {
              margin-top: 10px;
              max-width: 300px;
              margin-left: auto;
              font-size: 11.5px;
            }

            .row {
              display: flex;
              justify-content: space-between;
              padding: 3px 0;
            }

            .total {
              border-top: 1.5px solid #0f172a;
              margin-top: 6px;
              padding-top: 6px;
              font-size: 14px;
              font-weight: 800;
            }

            .pfand-return-detail {
              margin-top: 6px;
              margin-bottom: 8px;
              padding: 8px 10px;
              background: #f0fdf4;
              border-radius: 6px;
              font-size: 10.5px;
            }

            .pfand-return-detail .party-label {
              color: #166534;
              margin-bottom: 4px;
            }

            .pfand-return-row {
              display: flex;
              justify-content: space-between;
              gap: 16px;
              padding: 2px 0;
            }

            .legal-footer {
              margin-top: 24px;
              padding-top: 8px;
              border-top: 1px solid #e2e8f0;
              font-size: 9px;
              color: #64748b;
              line-height: 1.6;
            }
`;

export function buildOrderReceiptHtml(
  order: ReceiptOrder,
  deliveryQrCode: string | null,
  language: "de" | "tr",
  company: ReceiptCompany = emptyReceiptCompany,
) {
  return `
      <!doctype html>
      <html lang="${language === "de" ? "de" : "tr"}">
        <head>
          <meta charset="utf-8" />
          <title>${escapeHtml(order.orderNumber)}</title>

          <style>${receiptStyleSheet}</style>
        </head>

        <body>
          <header class="letterhead">
            ${renderCompanyHeader(company, language)}

            <div class="doc-meta">
              <div class="doc-title">${language === "de" ? "Lieferschein" : "İrsaliye"}</div>

              <table class="meta-table">
                <tr>
                  <td>${language === "de" ? "Nr." : "No"}</td>
                  <td><strong>${escapeHtml(order.orderNumber)}</strong></td>
                </tr>

                <tr>
                  <td>${language === "de" ? "Datum" : "Tarih"}</td>
                  <td>${new Date(order.createdAt).toLocaleString("de-DE")}</td>
                </tr>

                <tr>
                  <td>Status</td>
                  <td>${receiptStatusLabels[order.status][language]}</td>
                </tr>

                <tr>
                  <td>${language === "de" ? "Fahrer" : "Şoför"}</td>
                  <td>
                    ${
                      order.driver
                        ? escapeHtml(
                            `${order.driver.firstName || ""} ${order.driver.lastName || ""}`.trim() ||
                              order.driver.email,
                          )
                        : language === "de" ? "Nicht zugewiesen" : "Atanmadı"
                    }
                  </td>
                </tr>
              </table>
            </div>
          </header>

          <div class="parties">
            <div class="party">
              <div class="party-label">${language === "de" ? "Kunde" : "Müşteri"}</div>

              <div class="party-body">
                ${order.user.companyName ? `${escapeHtml(order.user.companyName)}<br />` : ""}
                ${escapeHtml(order.user.firstName || "")} ${escapeHtml(order.user.lastName || "")}<br />
                ${escapeHtml(order.user.email)}<br />
                ${escapeHtml(order.user.phone || "")}
              </div>
            </div>

            <div class="party">
              <div class="party-label">${language === "de" ? "Lieferadresse" : "Teslimat Adresi"}</div>

              <div class="party-body address-with-qr">
                <p class="address">${escapeHtml(order.deliveryAddress)}</p>

                ${
                  deliveryQrCode
                    ? `
                      <div class="qr-block">
                        <img src="${deliveryQrCode}" width="86" height="86" alt="${language === "de" ? "QR-Code für Google Maps" : "Google Maps için QR kodu"}" />
                        <p>${language === "de" ? "Google Maps" : "Google Maps"}</p>
                      </div>
                    `
                    : ""
                }
              </div>
            </div>
          </div>

          ${
            order.customerNote
              ? `
                <div class="note-block">
                  <div class="party-label">${language === "de" ? "Kundennotiz" : "Müşteri Notu"}</div>
                  <div>${escapeHtml(order.customerNote)}</div>
                </div>
              `
              : ""
          }

          <table class="items">
            <thead>
              <tr>
                <th>${language === "de" ? "Produkt" : "Ürün"}</th>
                <th class="num">${language === "de" ? "Menge" : "Adet"}</th>
                <th class="num">${language === "de" ? "Stückpreis" : "Birim fiyat"}</th>
                <th class="num">${language === "de" ? "Pfand" : "Pfand"}</th>
                <th class="num">${language === "de" ? "Gesamt" : "Toplam"}</th>
              </tr>
            </thead>

            <tbody>
              ${order.items
                .map(
                  (item) => `
                    <tr>
                      <td>${escapeHtml(item.name)}</td>
                      <td class="num">${item.quantity}</td>
                      <td class="num">${item.price.toFixed(2)} €</td>
                      <td class="num">${(item.pfand * item.quantity).toFixed(2)} €</td>
                      <td class="num">
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
              <span>${language === "de" ? "Zwischensumme" : "Ara Toplam"}</span>
              <strong>${order.subtotal.toFixed(2)} €</strong>
            </div>

            ${
              order.pfandAmount > 0
                ? `
                  <div class="row">
                    <span>${language === "de" ? "Produktpfand" : "Ürün Pfandı"}</span>
                    <strong>${order.pfandAmount.toFixed(2)} €</strong>
                  </div>
                `
                : ""
            }

            ${
              order.pfandReturnAmount > 0
                ? `
                  <div class="row">
                    <span>${language === "de" ? "Pfandrückgabe" : "Pfand İadesi"}</span>
                    <strong style="color:#15803d;">-${order.pfandReturnAmount.toFixed(2)} €</strong>
                  </div>

                  ${
                    order.pfandReturnItems.length > 0
                      ? `
                        <div class="pfand-return-detail">
                          <div class="party-label">${language === "de" ? "Zurückgegebenes Pfand" : "İade edilen Pfand"}</div>

                          ${order.pfandReturnItems
                            .map(
                              (item) => `
                                <div class="pfand-return-row">
                                  <span>
                                    <strong>${escapeHtml(item.name)}</strong><br />
                                    <span style="font-size:9.5px; color:#64748b;">
                                      ${language === "de" ? "Kunde" : "Müşteri"}: ${item.originalQuantity}
                                      → ${language === "de" ? "Fahrer" : "Şoför"}: ${item.quantity}
                                      ${
                                        item.quantityDifference !== 0
                                          ? ` · ${language === "de" ? "Differenz" : "Fark"}: ${item.quantityDifference > 0 ? "+" : ""}${item.quantityDifference}`
                                          : ""
                                      }
                                    </span>
                                  </span>

                                  <span style="text-align:right;">
                                    <strong>-${item.totalAmount.toFixed(2)} €</strong>

                                    ${
                                      item.amountDifference !== 0
                                        ? `
                                          <br />
                                          <span style="font-size:9.5px; font-weight:700; color:${item.amountDifference < 0 ? "#b45309" : "#15803d"};">
                                            ${language === "de" ? "Differenz" : "Fark"}: ${item.amountDifference > 0 ? "+" : ""}${item.amountDifference.toFixed(2)} €
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
              <strong>${order.deliveryFee.toFixed(2)} €</strong>
            </div>

            <div class="row total">
              <span>${language === "de" ? "Gesamt" : "Toplam"}</span>
              <strong>${order.totalAmount.toFixed(2)} €</strong>
            </div>
          </div>

          ${renderLegalFooter(company, language)}
        </body>
      </html>
    `;
}

export async function printOrderSilently(
  order: ReceiptOrder,
  language: "de" | "tr",
) {
  const [deliveryQrCode, company] = await Promise.all([
    hasNavigableDeliveryAddress(order) ? getDeliveryQrCode(order) : Promise.resolve(null),
    fetchReceiptCompany(),
  ]);

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
  frameDocument.write(buildOrderReceiptHtml(order, deliveryQrCode, language, company));
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
