"use client";

import { useLanguage } from "@/context/LanguageContext";
import { extractReceiptFromFile } from "@/lib/receipt-ocr";
import {
  FileText,
  Loader2,
  Paperclip,
  Plus,
  Receipt,
  ScanText,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

type SupplierOption = {
  id: string;
  name: string;
};

type DeliveryItem = {
  id: string;
  productName: string;
  quantity: number;
  unit: string | null;
  unitPrice: number;
  totalPrice: number;
};

type DeliveryPayment = {
  id: string;
  amount: number;
  note: string | null;
  createdAt: string;
};

type Delivery = {
  id: string;
  deliveredAt: string;
  totalAmount: number;
  paidAmount: number;
  note: string | null;
  documentUrls: string[];
  createdAt: string;
  supplier: SupplierOption;
  items: DeliveryItem[];
  payments: DeliveryPayment[];
};

type FormItem = {
  productName: string;
  quantity: string;
  unit: string;
  unitPrice: string;
};

function emptyFormItem(): FormItem {
  return { productName: "", quantity: "", unit: "", unitPrice: "" };
}

function formatMoney(value: number) {
  return `${value.toFixed(2)} €`;
}

export default function SupplierDeliveriesPage() {
  const { language } = useLanguage();

  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [supplierId, setSupplierId] = useState("");
  const [showNewSupplier, setShowNewSupplier] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState("");
  const [creatingSupplier, setCreatingSupplier] = useState(false);

  const [deliveredAt, setDeliveredAt] = useState(
    () => new Date().toISOString().slice(0, 10),
  );
  const [items, setItems] = useState<FormItem[]>([emptyFormItem()]);
  const [initialPaidAmount, setInitialPaidAmount] = useState("");
  const [note, setNote] = useState("");
  const [documentUrls, setDocumentUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const [paymentInputs, setPaymentInputs] = useState<Record<string, string>>(
    {},
  );
  const [addingPaymentFor, setAddingPaymentFor] = useState<string | null>(
    null,
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [ocrRunning, setOcrRunning] = useState(false);
  const [ocrRawText, setOcrRawText] = useState("");
  const [showOcrText, setShowOcrText] = useState(false);
  const [ocrNotice, setOcrNotice] = useState("");

  const t =
    language === "de"
      ? {
          title: "Lieferungen",
          subtitle:
            "Wareneingänge vom Großhändler erfassen: welche Ware, wie viel bezahlt, wie viel Schuld offen ist — inklusive Beleg-Upload.",
          newDelivery: "Neue Lieferung erfassen",
          supplier: "Lieferant",
          selectSupplier: "Lieferant auswählen",
          newSupplier: "Neuer Lieferant",
          newSupplierName: "Firmenname",
          addSupplier: "Anlegen",
          cancel: "Abbrechen",
          date: "Lieferdatum",
          items: "Waren",
          productName: "Warenbezeichnung",
          quantity: "Menge",
          unit: "Einheit",
          unitPrice: "Einzelpreis",
          lineTotal: "Summe",
          addItem: "Position hinzufügen",
          removeItem: "Position entfernen",
          totalAmount: "Gesamtbetrag",
          initialPaid: "Bereits bezahlt (optional)",
          note: "Notiz (optional)",
          document: "Beleg hochladen (Foto/PDF)",
          documentHint: "JPG, PNG, WEBP oder PDF, max. 4 MB pro Datei.",
          uploading: "Wird hochgeladen...",
          save: "Lieferung speichern",
          saving: "Wird gespeichert...",
          loading: "Lieferungen werden geladen...",
          loadError: "Lieferungen konnten nicht geladen werden.",
          empty: "Noch keine Lieferungen erfasst.",
          paid: "Bezahlt",
          debt: "Offene Schuld",
          fullyPaid: "Vollständig bezahlt",
          addPayment: "Zahlung erfassen",
          paymentAmount: "Betrag",
          record: "Erfassen",
          payments: "Zahlungen",
          deleteDelivery: "Lieferung löschen",
          deletePayment: "Zahlung löschen",
          deleteDeliveryConfirm:
            "Diese Lieferung inkl. aller Positionen, Zahlungen und Belege endgültig löschen?",
          deletePaymentConfirm: "Diese Zahlung endgültig löschen?",
          openDocument: "Beleg öffnen",
          itemsRequired:
            "Bitte erfassen Sie mindestens eine Ware mit Menge und Preis.",
          supplierRequired: "Bitte wählen Sie einen Lieferanten aus.",
          ocrRunning: "Beleg wird gelesen (Texterkennung)...",
          ocrShowText: "Erkannten Text anzeigen",
          ocrHideText: "Erkannten Text ausblenden",
          ocrSupplierMatched: "Lieferant automatisch erkannt.",
          ocrSupplierNotMatched:
            "Kein bekannter Lieferant im Beleg gefunden — bitte manuell auswählen.",
          ocrTotalFilled:
            "Gesamtbetrag automatisch erkannt und als Position eingetragen — bitte prüfen und bei Bedarf in einzelne Waren aufteilen.",
          ocrItemsFilled:
            "Warenzeilen automatisch erkannt — bitte auf Richtigkeit prüfen.",
          ocrNothingFound:
            "Im Beleg konnten keine Beträge automatisch erkannt werden. Bitte manuell eintragen.",
          ocrDisclaimer:
            "Kostenlose Texterkennung im Browser, kein KI-Modell — Ergebnis unbedingt prüfen.",
          ocrTotalItemName: "Beleg-Gesamtbetrag (bitte aufteilen)",
        }
      : {
          title: "Teslimatlar",
          subtitle:
            "Toptancıdan gelen malları kaydedin: hangi mal, ne kadar ödendi, ne kadar borç kaldı — belge yükleme dahil.",
          newDelivery: "Yeni Teslimat Kaydet",
          supplier: "Toptancı",
          selectSupplier: "Toptancı seçin",
          newSupplier: "Yeni Toptancı",
          newSupplierName: "Firma Adı",
          addSupplier: "Oluştur",
          cancel: "Vazgeç",
          date: "Teslimat Tarihi",
          items: "Mallar",
          productName: "Mal Adı",
          quantity: "Miktar",
          unit: "Birim",
          unitPrice: "Birim Fiyat",
          lineTotal: "Toplam",
          addItem: "Satır Ekle",
          removeItem: "Satırı Kaldır",
          totalAmount: "Genel Toplam",
          initialPaid: "Şimdiden Ödenen (opsiyonel)",
          note: "Not (opsiyonel)",
          document: "Belge Yükle (Foto/PDF)",
          documentHint: "JPG, PNG, WEBP veya PDF, dosya başına en fazla 4 MB.",
          uploading: "Yükleniyor...",
          save: "Teslimatı Kaydet",
          saving: "Kaydediliyor...",
          loading: "Teslimatlar yükleniyor...",
          loadError: "Teslimatlar yüklenemedi.",
          empty: "Henüz teslimat kaydedilmedi.",
          paid: "Ödenen",
          debt: "Açık Borç",
          fullyPaid: "Tamamı Ödendi",
          addPayment: "Ödeme Kaydet",
          paymentAmount: "Tutar",
          record: "Kaydet",
          payments: "Ödemeler",
          deleteDelivery: "Teslimatı Sil",
          deletePayment: "Ödemeyi Sil",
          deleteDeliveryConfirm:
            "Bu teslimat; tüm kalemleri, ödemeleri ve belgeleriyle birlikte kalıcı olarak silinsin mi?",
          deletePaymentConfirm: "Bu ödeme kalıcı olarak silinsin mi?",
          openDocument: "Belgeyi Aç",
          itemsRequired: "Lütfen en az bir ürün, miktar ve fiyat girin.",
          supplierRequired: "Lütfen bir toptancı seçin.",
          ocrRunning: "Belge okunuyor (metin tanıma)...",
          ocrShowText: "Tanınan metni göster",
          ocrHideText: "Tanınan metni gizle",
          ocrSupplierMatched: "Toptancı otomatik olarak tanındı.",
          ocrSupplierNotMatched:
            "Belgede bilinen bir toptancı bulunamadı — lütfen manuel seçin.",
          ocrTotalFilled:
            "Genel toplam otomatik olarak tanındı ve satır olarak eklendi — lütfen kontrol edin ve gerekirse ayrı ürünlere bölün.",
          ocrItemsFilled:
            "Ürün satırları otomatik olarak tanındı — lütfen doğruluğunu kontrol edin.",
          ocrNothingFound:
            "Belgede otomatik olarak bir tutar tanınamadı. Lütfen manuel girin.",
          ocrDisclaimer:
            "Tarayıcıda ücretsiz metin tanıma, yapay zeka modeli değildir — sonucu mutlaka kontrol edin.",
          ocrTotalItemName: "Belge Genel Toplamı (lütfen bölün)",
        };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [suppliersRes, deliveriesRes] = await Promise.all([
        fetch("/api/admin/suppliers", { cache: "no-store" }),
        fetch("/api/super-admin/supplier-deliveries", { cache: "no-store" }),
      ]);

      const suppliersData = await suppliersRes.json();
      const deliveriesData = await deliveriesRes.json();

      if (!suppliersRes.ok || !deliveriesRes.ok) {
        setError(suppliersData.error || deliveriesData.error || t.loadError);
        return;
      }

      setSuppliers(suppliersData.suppliers || []);
      setDeliveries(deliveriesData.deliveries || []);
    } catch {
      setError(t.loadError);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateSupplier() {
    const name = newSupplierName.trim();

    if (!name) {
      return;
    }

    setCreatingSupplier(true);

    try {
      const response = await fetch("/api/admin/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      const data = await response.json();

      if (!response.ok) {
        setCreateError(data.error || t.loadError);
        return;
      }

      setSuppliers((current) => [...current, data.supplier]);
      setSupplierId(data.supplier.id);
      setNewSupplierName("");
      setShowNewSupplier(false);
    } catch {
      setCreateError(t.loadError);
    } finally {
      setCreatingSupplier(false);
    }
  }

  function updateItem(index: number, patch: Partial<FormItem>) {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item,
      ),
    );
  }

  function removeItem(index: number) {
    setItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  const computedTotal = items.reduce((sum, item) => {
    const quantity = Number(item.quantity);
    const unitPrice = Number(item.unitPrice);

    if (!Number.isFinite(quantity) || !Number.isFinite(unitPrice)) {
      return sum;
    }

    return sum + quantity * unitPrice;
  }, 0);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) {
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      setUploadError(
        language === "de"
          ? "Die Datei darf höchstens 4 MB groß sein."
          : "Dosya en fazla 4 MB olabilir.",
      );
      return;
    }

    setUploading(true);
    setUploadError("");

    try {
      const uploadData = new FormData();
      uploadData.append("file", file);

      const response = await fetch(
        "/api/super-admin/supplier-deliveries/upload",
        {
          method: "POST",
          body: uploadData,
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setUploadError(data.error || t.loadError);
        return;
      }

      setDocumentUrls((current) => [...current, data.documentUrl]);

      runOcrOnFile(file);
    } catch {
      setUploadError(t.loadError);
    } finally {
      setUploading(false);
    }
  }

  function isItemsFormEmpty(current: FormItem[]) {
    return (
      current.length === 1 &&
      !current[0].productName &&
      !current[0].quantity &&
      !current[0].unitPrice
    );
  }

  async function runOcrOnFile(file: File) {
    setOcrRunning(true);
    setOcrNotice("");

    try {
      const result = await extractReceiptFromFile(file, suppliers);

      setOcrRawText(result.rawText);

      const notices: string[] = [];

      if (result.matchedSupplierId) {
        const matchedId = result.matchedSupplierId;
        setSupplierId((current) => current || matchedId);
        notices.push(t.ocrSupplierMatched);
      } else {
        notices.push(t.ocrSupplierNotMatched);
      }

      if (result.suggestedItems.length > 0) {
        setItems((current) => {
          const mapped: FormItem[] = result.suggestedItems.map((item) => ({
            productName: item.productName,
            quantity: String(item.quantity),
            unit: "",
            unitPrice: item.unitPrice.toFixed(2),
          }));

          return isItemsFormEmpty(current) ? mapped : [...current, ...mapped];
        });
        notices.push(t.ocrItemsFilled);
      } else if (result.suggestedTotal !== null) {
        setItems((current) => {
          if (!isItemsFormEmpty(current)) {
            return current;
          }

          return [
            {
              productName: t.ocrTotalItemName,
              quantity: "1",
              unit: "",
              unitPrice: result.suggestedTotal!.toFixed(2),
            },
          ];
        });
        notices.push(t.ocrTotalFilled);
      } else {
        notices.push(t.ocrNothingFound);
      }

      setOcrNotice(notices.join(" "));
    } catch (error) {
      console.error("RECEIPT_OCR_ERROR", error);
      setOcrNotice(t.ocrNothingFound);
    } finally {
      setOcrRunning(false);
    }
  }

  function removeDocument(url: string) {
    setDocumentUrls((current) => current.filter((entry) => entry !== url));
  }

  async function handleCreateDelivery(event: FormEvent) {
    event.preventDefault();

    setCreateError("");

    if (!supplierId) {
      setCreateError(t.supplierRequired);
      return;
    }

    const validItems = items.filter(
      (item) =>
        item.productName.trim() &&
        Number(item.quantity) > 0 &&
        Number(item.unitPrice) >= 0,
    );

    if (validItems.length === 0) {
      setCreateError(t.itemsRequired);
      return;
    }

    setCreating(true);

    try {
      const response = await fetch("/api/super-admin/supplier-deliveries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId,
          deliveredAt,
          items: validItems.map((item) => ({
            productName: item.productName.trim(),
            quantity: Number(item.quantity),
            unit: item.unit.trim() || null,
            unitPrice: Number(item.unitPrice),
          })),
          initialPaidAmount: initialPaidAmount
            ? Number(initialPaidAmount)
            : 0,
          note: note.trim() || null,
          documentUrls,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setCreateError(data.error || t.loadError);
        return;
      }

      setSupplierId("");
      setDeliveredAt(new Date().toISOString().slice(0, 10));
      setItems([emptyFormItem()]);
      setInitialPaidAmount("");
      setNote("");
      setDocumentUrls([]);
      setOcrRawText("");
      setOcrNotice("");
      setShowOcrText(false);

      await loadData();
    } catch {
      setCreateError(t.loadError);
    } finally {
      setCreating(false);
    }
  }

  async function handleAddPayment(delivery: Delivery) {
    const raw = paymentInputs[delivery.id];
    const amount = Number(raw);

    if (!raw || !Number.isFinite(amount) || amount <= 0) {
      return;
    }

    setAddingPaymentFor(delivery.id);

    try {
      const response = await fetch(
        `/api/super-admin/supplier-deliveries/${delivery.id}/payments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t.loadError);
        return;
      }

      setDeliveries((current) =>
        current.map((entry) =>
          entry.id === delivery.id
            ? { ...entry, paidAmount: data.paidAmount, payments: data.payments }
            : entry,
        ),
      );

      setPaymentInputs((current) => ({ ...current, [delivery.id]: "" }));
    } finally {
      setAddingPaymentFor(null);
    }
  }

  async function handleDeletePayment(delivery: Delivery, paymentId: string) {
    if (!window.confirm(t.deletePaymentConfirm)) {
      return;
    }

    setDeletingId(paymentId);

    try {
      const response = await fetch(
        `/api/super-admin/supplier-deliveries/${delivery.id}/payments/${paymentId}`,
        { method: "DELETE" },
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t.loadError);
        return;
      }

      setDeliveries((current) =>
        current.map((entry) =>
          entry.id === delivery.id
            ? { ...entry, paidAmount: data.paidAmount, payments: data.payments }
            : entry,
        ),
      );
    } finally {
      setDeletingId(null);
    }
  }

  async function handleDeleteDelivery(delivery: Delivery) {
    if (!window.confirm(t.deleteDeliveryConfirm)) {
      return;
    }

    setDeletingId(delivery.id);

    try {
      const response = await fetch(
        `/api/super-admin/supplier-deliveries/${delivery.id}`,
        { method: "DELETE" },
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t.loadError);
        return;
      }

      setDeliveries((current) =>
        current.filter((entry) => entry.id !== delivery.id),
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
          <Receipt size={22} />
        </div>

        <div>
          <h1 className="text-3xl font-black text-slate-950">{t.title}</h1>
          <p className="text-sm text-slate-500">{t.subtitle}</p>
        </div>
      </div>

      <form
        onSubmit={handleCreateDelivery}
        className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <h2 className="text-lg font-black text-slate-950">
          {t.newDelivery}
        </h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-black uppercase text-slate-500">
              {t.supplier}
            </span>
            <select
              value={supplierId}
              onChange={(event) => setSupplierId(event.target.value)}
              className="rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-orange-500"
            >
              <option value="">{t.selectSupplier}</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-black uppercase text-slate-500">
              {t.date}
            </span>
            <input
              type="date"
              value={deliveredAt}
              onChange={(event) => setDeliveredAt(event.target.value)}
              className="rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-orange-500"
            />
          </label>
        </div>

        <div className="mt-3">
          {showNewSupplier ? (
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={newSupplierName}
                onChange={(event) => setNewSupplierName(event.target.value)}
                placeholder={t.newSupplierName}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-500"
              />
              <button
                type="button"
                onClick={handleCreateSupplier}
                disabled={creatingSupplier || !newSupplierName.trim()}
                className="rounded-xl bg-slate-950 px-3 py-2 text-sm font-black text-white disabled:opacity-60"
              >
                {creatingSupplier ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  t.addSupplier
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowNewSupplier(false);
                  setNewSupplierName("");
                }}
                className="text-sm font-bold text-slate-500 hover:text-slate-700"
              >
                {t.cancel}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowNewSupplier(true)}
              className="text-sm font-bold text-orange-500 hover:text-orange-600"
            >
              + {t.newSupplier}
            </button>
          )}
        </div>

        <div className="mt-5">
          <span className="text-xs font-black uppercase text-slate-500">
            {t.items}
          </span>

          <div className="mt-2 space-y-2">
            {items.map((item, index) => (
              <div
                key={index}
                className="grid gap-2 rounded-xl border border-slate-200 p-3 sm:grid-cols-[1fr_90px_90px_110px_90px_36px] sm:items-center"
              >
                <input
                  value={item.productName}
                  onChange={(event) =>
                    updateItem(index, { productName: event.target.value })
                  }
                  placeholder={t.productName}
                  className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-orange-500"
                />

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.quantity}
                  onChange={(event) =>
                    updateItem(index, { quantity: event.target.value })
                  }
                  placeholder={t.quantity}
                  className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-orange-500"
                />

                <input
                  value={item.unit}
                  onChange={(event) =>
                    updateItem(index, { unit: event.target.value })
                  }
                  placeholder={t.unit}
                  className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-orange-500"
                />

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.unitPrice}
                  onChange={(event) =>
                    updateItem(index, { unitPrice: event.target.value })
                  }
                  placeholder={t.unitPrice}
                  className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-orange-500"
                />

                <span className="text-sm font-black text-slate-700">
                  {Number.isFinite(Number(item.quantity)) &&
                  Number.isFinite(Number(item.unitPrice))
                    ? formatMoney(
                        Number(item.quantity) * Number(item.unitPrice),
                      )
                    : "—"}
                </span>

                <button
                  type="button"
                  aria-label={t.removeItem}
                  disabled={items.length <= 1}
                  onClick={() => removeItem(index)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-500 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setItems((current) => [...current, emptyFormItem()])}
            className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-orange-500 hover:text-orange-600"
          >
            <Plus size={16} />
            {t.addItem}
          </button>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
          <span className="font-bold text-slate-700">{t.totalAmount}</span>
          <span className="text-lg font-black text-slate-950">
            {formatMoney(computedTotal)}
          </span>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-black uppercase text-slate-500">
              {t.initialPaid}
            </span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={initialPaidAmount}
              onChange={(event) => setInitialPaidAmount(event.target.value)}
              className="rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-orange-500"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-black uppercase text-slate-500">
              {t.note}
            </span>
            <input
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-orange-500"
            />
          </label>
        </div>

        <div className="mt-4">
          <span className="text-xs font-black uppercase text-slate-500">
            {t.document}
          </span>

          <div className="mt-2 flex flex-wrap items-center gap-3">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:border-orange-400 hover:text-orange-600">
              {uploading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Upload size={16} />
              )}
              {uploading ? t.uploading : t.document}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={handleFileChange}
                disabled={uploading}
                className="hidden"
              />
            </label>

            {documentUrls.map((url) => (
              <span
                key={url}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600"
              >
                <Paperclip size={14} />
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2"
                >
                  {t.openDocument}
                </a>
                <button
                  type="button"
                  onClick={() => removeDocument(url)}
                  className="text-slate-400 hover:text-red-500"
                >
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>

          <p className="mt-1.5 text-xs text-slate-400">{t.documentHint}</p>

          {uploadError ? (
            <p className="mt-2 text-sm font-bold text-red-600">
              {uploadError}
            </p>
          ) : null}

          {ocrRunning ? (
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-500">
              <Loader2 size={14} className="animate-spin" />
              {t.ocrRunning}
            </div>
          ) : null}

          {!ocrRunning && ocrNotice ? (
            <div className="mt-3 rounded-xl bg-orange-50 px-3 py-2.5 text-xs text-orange-800">
              <div className="flex items-start gap-2">
                <ScanText size={14} className="mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold">{ocrNotice}</p>
                  <p className="mt-1 text-orange-700/80">{t.ocrDisclaimer}</p>

                  {ocrRawText ? (
                    <button
                      type="button"
                      onClick={() => setShowOcrText((current) => !current)}
                      className="mt-1.5 font-bold underline underline-offset-2"
                    >
                      {showOcrText ? t.ocrHideText : t.ocrShowText}
                    </button>
                  ) : null}

                  {showOcrText ? (
                    <pre className="mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap rounded-lg bg-white p-2 text-[11px] text-slate-600">
                      {ocrRawText}
                    </pre>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="mt-5">
          <button
            type="submit"
            disabled={creating}
            className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3 font-black text-white transition hover:bg-orange-600 disabled:opacity-60"
          >
            {creating ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Plus size={16} />
            )}
            {creating ? t.saving : t.save}
          </button>

          {createError ? (
            <p className="mt-3 text-sm font-bold text-red-600">
              {createError}
            </p>
          ) : null}
        </div>
      </form>

      {loading ? (
        <div className="flex items-center gap-3 rounded-2xl bg-white p-7 font-bold text-slate-500 shadow-sm">
          <Loader2 className="animate-spin" />
          {t.loading}
        </div>
      ) : error ? (
        <div className="rounded-2xl bg-red-50 p-5 font-bold text-red-600">
          {error}
        </div>
      ) : deliveries.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-white p-10 text-center shadow-sm">
          <Receipt size={28} className="text-slate-300" />
          <p className="font-bold text-slate-500">{t.empty}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {deliveries.map((delivery) => {
            const debt = Math.max(
              0,
              delivery.totalAmount - delivery.paidAmount,
            );

            return (
              <div
                key={delivery.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-black text-slate-950">
                      {delivery.supplier.name}
                    </h3>
                    <p className="text-xs font-bold text-slate-400">
                      {new Date(delivery.deliveredAt).toLocaleDateString(
                        language === "de" ? "de-DE" : "tr-TR",
                      )}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteDelivery(delivery)}
                    disabled={deletingId === delivery.id}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-red-50 px-3 py-2 text-xs font-black text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                  >
                    {deletingId === delivery.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                    {t.deleteDelivery}
                  </button>
                </div>

                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[420px] text-sm">
                    <thead>
                      <tr className="text-left text-[10px] font-black uppercase text-slate-400">
                        <th className="pb-1">{t.productName}</th>
                        <th className="pb-1">{t.quantity}</th>
                        <th className="pb-1">{t.unitPrice}</th>
                        <th className="pb-1 text-right">{t.lineTotal}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {delivery.items.map((item) => (
                        <tr key={item.id} className="border-t border-slate-100">
                          <td className="py-1.5 font-bold text-slate-700">
                            {item.productName}
                          </td>
                          <td className="py-1.5 text-slate-500">
                            {item.quantity}
                            {item.unit ? ` ${item.unit}` : ""}
                          </td>
                          <td className="py-1.5 text-slate-500">
                            {formatMoney(item.unitPrice)}
                          </td>
                          <td className="py-1.5 text-right font-bold text-slate-700">
                            {formatMoney(item.totalPrice)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {delivery.note ? (
                  <p className="mt-2 text-sm text-slate-500">
                    {delivery.note}
                  </p>
                ) : null}

                {delivery.documentUrls.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {delivery.documentUrls.map((url) => (
                      <a
                        key={url}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200"
                      >
                        <FileText size={14} />
                        {t.openDocument}
                      </a>
                    ))}
                  </div>
                ) : null}

                <div className="mt-4 grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-3">
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400">
                      {t.totalAmount}
                    </p>
                    <p className="mt-0.5 font-black text-slate-950">
                      {formatMoney(delivery.totalAmount)}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400">
                      {t.paid}
                    </p>
                    <p className="mt-0.5 font-black text-green-700">
                      {formatMoney(delivery.paidAmount)}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400">
                      {t.debt}
                    </p>
                    <p
                      className={`mt-0.5 font-black ${
                        debt > 0 ? "text-red-600" : "text-green-700"
                      }`}
                    >
                      {debt > 0 ? formatMoney(debt) : t.fullyPaid}
                    </p>
                  </div>
                </div>

                {delivery.payments.length > 0 ? (
                  <div className="mt-3 space-y-1.5">
                    <p className="text-[10px] font-black uppercase text-slate-400">
                      {t.payments}
                    </p>
                    {delivery.payments.map((payment) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm"
                      >
                        <span className="font-bold text-slate-700">
                          {formatMoney(payment.amount)}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-slate-400">
                            {new Date(payment.createdAt).toLocaleDateString(
                              language === "de" ? "de-DE" : "tr-TR",
                            )}
                          </span>
                          <button
                            type="button"
                            aria-label={t.deletePayment}
                            disabled={deletingId === payment.id}
                            onClick={() =>
                              handleDeletePayment(delivery, payment.id)
                            }
                            className="text-slate-400 hover:text-red-500"
                          >
                            {deletingId === payment.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <X size={14} />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}

                {debt > 0 ? (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      max={debt}
                      placeholder={t.paymentAmount}
                      value={paymentInputs[delivery.id] || ""}
                      onChange={(event) =>
                        setPaymentInputs((current) => ({
                          ...current,
                          [delivery.id]: event.target.value,
                        }))
                      }
                      className="w-32 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-500"
                    />
                    <button
                      type="button"
                      disabled={addingPaymentFor === delivery.id}
                      onClick={() => handleAddPayment(delivery)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white transition hover:bg-slate-800 disabled:opacity-60"
                    >
                      {addingPaymentFor === delivery.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        t.record
                      )}
                    </button>
                    <span className="text-xs text-slate-400">
                      {t.addPayment}
                    </span>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
