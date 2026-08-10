"use client";

import Link from "next/link";
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowUpFromLine,
  ClipboardList,
  Loader2,
  PackageCheck,
  Plus,
  Printer,
  Save,
  Trash2,
  Warehouse,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";

type LogType = "IN" | "OUT";

type WarehouseItem = {
  id?: string;
  itemName: string;
  quantity: string;
  unit: string;
  note: string;
};

type WarehouseLog = {
  id: string;
  type: LogType;
  companyName: string | null;
  driverName: string | null;
  vehiclePlate: string | null;
  deliveryNoteNo: string | null;
  destination: string | null;
  contactPerson: string | null;
  note: string | null;
  createdAt: string;
  items: Array<{
    id: string;
    itemName: string;
    quantity: number;
    unit: string;
    note: string | null;
  }>;
};

const emptyItem: WarehouseItem = {
  itemName: "",
  quantity: "",
  unit: "PALET",
  note: "",
};

const unitOptions = [
  "PALET",
  "KOLİ",
  "KASA",
  "KARTON",
  "PAKET",
  "ADET",
  "KG",
  "LİTRE",
  "TON",
];

export default function AdminWarehousePage() {
  const { language } = useLanguage();

  const t =
    language === "de"
      ? {
          adminPanel: "Admin-Panel",
          mainMenu: "Hauptmenü",
          pageTitle: "Unabhängige Lagerbuchungen",
          pageDescription:
            "Erfassen Sie ein- und ausgehende Waren völlig unabhängig vom bestehenden Produkt-, Bestell-, Fahrer- und Kassensystem.",
          loadLogsError: "Lagerbuchungen konnten nicht geladen werden.",
          createLogError: "Lagerbuchung konnte nicht erstellt werden.",
          createLogSuccess: "Buchung erfolgreich erstellt.",
          deleteLogError: "Lagerbuchung konnte nicht gelöscht werden.",
          deleteLogSuccess: "Lagerbuchung gelöscht.",
          print: "PDF / Drucken",
          incomingTitle: "Wareneingang",
          incomingDesc:
            "Erfassen Sie, wer die Ware gebracht hat – Firma, Fahrer, Kennzeichen und eingehende Artikel.",
          outgoingTitle: "Warenausgang",
          outgoingDesc:
            "Erfassen Sie, wer die Ware abgeholt hat, wohin sie ging, Kennzeichen und ausgehende Artikel.",
          stockTitle: "Lagerbestand",
          stockDesc:
            "Zeigt an, wie viel von welcher Ware im unabhängigen Lager noch vorhanden ist.",
          historyTitle: "Buchungsverlauf",
          historyDesc: "Zeigt alle Eingangs- und Ausgangsbuchungen an.",
          incomingRecord: "EINGANGSBUCHUNG",
          outgoingRecord: "AUSGANGSBUCHUNG",
          incomingInfo: "Informationen zum Wareneingang",
          outgoingInfo: "Informationen zum Warenausgang",
          companyPerson: "Firma / Person",
          driverNameLabel: "Name des Fahrers",
          vehiclePlateLabel: "Kennzeichen",
          deliveryNoteNoLabel: "Lieferscheinnummer",
          receivedBy: "Empfangen von",
          handedOverBy: "Übergeben von",
          origin: "Herkunftsort",
          destination: "Zielort",
          items: "Warenpositionen",
          addItem: "Artikel hinzufügen",
          itemName: "Warenname *",
          quantity: "Menge *",
          unit: "Einheit *",
          lineNote: "Zeilenbeschreibung",
          generalNote: "Allgemeine Beschreibung",
          saveIncoming: "Wareneingang speichern",
          saveOutgoing: "Warenausgang speichern",
          itemVarietyCount: "Erfasste Warenarten",
          hasStock: "Mit Bestand",
          calculation: "Berechnung",
          calcFormula: "Eingang − Ausgang",
          calculatingStock: "Lagerbestand wird berechnet...",
          noStockRecords: "Es liegen noch keine unabhängigen Lagerbuchungen vor.",
          currentStockTitle: "Aktueller unabhängiger Lagerbestand",
          currentStockDesc:
            "Die laufende Summe aller Eingangs- und Ausgangsbuchungen.",
          tableItemName: "Warenname",
          totalIn: "Gesamt Eingang",
          totalOut: "Gesamt Ausgang",
          currentRemaining: "Aktuell verbleibend",
          unitColumn: "Einheit",
          unitTotalsTitle: "Gesamtsummen je Einheit",
          incomingLabel: "Eingang:",
          outgoingLabel: "Ausgang:",
          remainingLabel: "Verbleibend:",
          negativeNote:
            "Negative Werte bedeuten, dass die erfassten Ausgänge die Eingänge übersteigen. Unterschiedliche Einheiten werden nicht zusammengerechnet.",
          searchPlaceholder:
            "Firma, Fahrer, Kennzeichen, Lieferschein oder Ware suchen...",
          filterAll: "Alle",
          filterIncomingOnly: "Nur Eingänge",
          filterOutgoingOnly: "Nur Ausgänge",
          loadingRecords: "Buchungen werden geladen...",
          noRecordsFound: "Keine Buchung gefunden.",
          incomingBadge: "WARENEINGANG",
          outgoingBadge: "WARENAUSGANG",
          companyNotSpecified: "Firma / Person nicht angegeben",
          delete: "Löschen",
          driverLabel: "Fahrer",
          plateLabel: "Kennzeichen",
          deliveryNoteLabel: "Lieferschein",
          receivedByLabel: "Empfangen von",
          handedOverByLabel: "Übergeben von",
          noteLabel: "Beschreibung",
          tableGoodsHeader: "Ware",
          tableQuantityHeader: "Menge",
          tableUnitHeader: "Einheit",
          tableNoteHeader: "Beschreibung",
          incomingBookingWord: "Wareneingangsbuchung",
          outgoingBookingWord: "Warenausgangsbuchung",
        }
      : {
          adminPanel: "Admin Paneli",
          mainMenu: "Ana Menü",
          pageTitle: "Bağımsız Depo Kayıtları",
          pageDescription:
            "Gelen ve giden malları mevcut ürün, sipariş, şoför ve kasa sisteminden tamamen bağımsız şekilde kaydedin.",
          loadLogsError: "Depo kayıtları yüklenemedi.",
          createLogError: "Depo kaydı oluşturulamadı.",
          createLogSuccess: "Kayıt başarıyla oluşturuldu.",
          deleteLogError: "Depo kaydı silinemedi.",
          deleteLogSuccess: "Depo kaydı silindi.",
          print: "PDF / Yazdır",
          incomingTitle: "Mal Girişi",
          incomingDesc: "Kim getirdi, firma, şoför, plaka ve gelen malları kaydedin.",
          outgoingTitle: "Mal Çıkışı",
          outgoingDesc: "Kim götürdü, nereye götürdü, plaka ve çıkan malları kaydedin.",
          stockTitle: "Depo Mevcudu",
          stockDesc:
            "Bağımsız depoda hangi maldan ne kadar kaldığını görüntüleyin.",
          historyTitle: "Kayıt Geçmişi",
          historyDesc: "Bütün giriş ve çıkış kayıtlarını görüntüleyin.",
          incomingRecord: "GİRİŞ KAYDI",
          outgoingRecord: "ÇIKIŞ KAYDI",
          incomingInfo: "Gelen Mal Bilgileri",
          outgoingInfo: "Giden Mal Bilgileri",
          companyPerson: "Firma / Kişi",
          driverNameLabel: "Şoför Adı",
          vehiclePlateLabel: "Araç Plakası",
          deliveryNoteNoLabel: "İrsaliye Numarası",
          receivedBy: "Teslim Alan Kişi",
          handedOverBy: "Teslim Eden Kişi",
          origin: "Geldiği Yer",
          destination: "Gideceği Yer",
          items: "Mal Kalemleri",
          addItem: "Mal Ekle",
          itemName: "Mal Adı *",
          quantity: "Miktar *",
          unit: "Birim *",
          lineNote: "Satır Açıklaması",
          generalNote: "Genel Açıklama",
          saveIncoming: "Mal Girişini Kaydet",
          saveOutgoing: "Mal Çıkışını Kaydet",
          itemVarietyCount: "Kayıtlı Mal Çeşidi",
          hasStock: "Mevcudu Bulunan",
          calculation: "Hesaplama",
          calcFormula: "Giriş − Çıkış",
          calculatingStock: "Depo mevcudu hesaplanıyor...",
          noStockRecords: "Henüz bağımsız depo kaydı bulunmuyor.",
          currentStockTitle: "Güncel Bağımsız Depo Mevcudu",
          currentStockDesc: "Bütün giriş ve çıkış kayıtlarının anlık toplamıdır.",
          tableItemName: "Mal Adı",
          totalIn: "Toplam Giren",
          totalOut: "Toplam Çıkan",
          currentRemaining: "Şu Anda Kalan",
          unitColumn: "Birim",
          unitTotalsTitle: "Birim Bazında Genel Toplamlar",
          incomingLabel: "Giren:",
          outgoingLabel: "Çıkan:",
          remainingLabel: "Kalan:",
          negativeNote:
            "Negatif miktarlar, kayıtlı çıkışın girişten fazla olduğunu gösterir. Farklı birimler birbirine eklenmez.",
          searchPlaceholder: "Firma, şoför, plaka, irsaliye veya mal ara...",
          filterAll: "Tümü",
          filterIncomingOnly: "Sadece Girişler",
          filterOutgoingOnly: "Sadece Çıkışlar",
          loadingRecords: "Kayıtlar yükleniyor...",
          noRecordsFound: "Kayıt bulunamadı.",
          incomingBadge: "MAL GİRİŞİ",
          outgoingBadge: "MAL ÇIKIŞI",
          companyNotSpecified: "Firma / kişi belirtilmedi",
          delete: "Sil",
          driverLabel: "Şoför",
          plateLabel: "Plaka",
          deliveryNoteLabel: "İrsaliye",
          receivedByLabel: "Teslim Alan",
          handedOverByLabel: "Teslim Eden",
          noteLabel: "Açıklama",
          tableGoodsHeader: "Mal",
          tableQuantityHeader: "Miktar",
          tableUnitHeader: "Birim",
          tableNoteHeader: "Açıklama",
          incomingBookingWord: "mal giriş",
          outgoingBookingWord: "mal çıkış",
        };

  const [mode, setMode] = useState<
    "HOME" | "FORM" | "HISTORY" | "STOCK"
  >("HOME");
  const [type, setType] = useState<LogType>("IN");

  const [companyName, setCompanyName] = useState("");
  const [driverName, setDriverName] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [deliveryNoteNo, setDeliveryNoteNo] = useState("");
  const [destination, setDestination] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [note, setNote] = useState("");
  const [items, setItems] = useState<WarehouseItem[]>([{ ...emptyItem }]);

  const [logs, setLogs] = useState<WarehouseLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingLogId, setDeletingLogId] = useState("");
  const [canDeleteWarehouseLog, setCanDeleteWarehouseLog] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [lastSavedLogId, setLastSavedLogId] = useState("");

  const [search, setSearch] = useState("");
  const [historyType, setHistoryType] = useState<"ALL" | LogType>("ALL");

  async function loadLogs() {
    setLoadingLogs(true);
    setError("");

    try {
      const response = await fetch("/api/admin/warehouse-logs", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t.loadLogsError);
        return;
      }

      setLogs(data.logs || []);
      setCanDeleteWarehouseLog(Boolean(data.canDeleteWarehouseLog));
    } catch {
      setError(t.loadLogsError);
    } finally {
      setLoadingLogs(false);
    }
  }

  useEffect(() => {
    if (
      (mode === "FORM" ||
        mode === "HISTORY" ||
        mode === "STOCK") &&
      logs.length === 0
    ) {
      loadLogs();
    }
  }, [mode, logs.length]);

  function openForm(nextType: LogType) {
    setType(nextType);
    setMode("FORM");
    setError("");
    setSuccess("");
    setLastSavedLogId("");
  }

  function resetForm() {
    setCompanyName("");
    setDriverName("");
    setVehiclePlate("");
    setDeliveryNoteNo("");
    setDestination("");
    setContactPerson("");
    setNote("");
    setItems([{ ...emptyItem }]);
  }

  function updateItem(
    index: number,
    key: keyof WarehouseItem,
    value: string,
  ) {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [key]: value,
            }
          : item,
      ),
    );
  }

  function addItem() {
    setItems((current) => [...current, { ...emptyItem }]);
  }

  function removeItem(index: number) {
    setItems((current) => {
      if (current.length === 1) {
        return current;
      }

      return current.filter((_, itemIndex) => itemIndex !== index);
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/admin/warehouse-logs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type,
          companyName,
          driverName,
          vehiclePlate,
          deliveryNoteNo,
          destination,
          contactPerson,
          note,
          items,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t.createLogError);
        return;
      }

      setSuccess(data.message || t.createLogSuccess);
      setLastSavedLogId(data.log.id);
      setLogs((current) => [
        data.log,
        ...current.filter((log) => log.id !== data.log.id),
      ]);
      resetForm();
    } catch {
      setError(t.createLogError);
    } finally {
      setSaving(false);
    }
  }

  async function deleteWarehouseLog(log: WarehouseLog) {
    const companyLabel = log.companyName || t.companyNotSpecified;

    const confirmMessage =
      language === "de"
        ? `Soll die ${
            log.type === "IN" ? t.incomingBookingWord : t.outgoingBookingWord
          } von "${companyLabel}" endgültig gelöscht werden?\n\nDiese Aktion kann nicht rückgängig gemacht werden.`
        : `${companyLabel} kaydına ait ${
            log.type === "IN" ? t.incomingBookingWord : t.outgoingBookingWord
          } kaydı kalıcı olarak silinsin mi?\n\nBu işlem geri alınamaz.`;

    const confirmed = window.confirm(confirmMessage);

    if (!confirmed) {
      return;
    }

    setDeletingLogId(log.id);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `/api/admin/warehouse-logs/${log.id}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t.deleteLogError);
        return;
      }

      setLogs((current) =>
        current.filter((item) => item.id !== log.id),
      );

      setSuccess(data.message || t.deleteLogSuccess);
    } catch {
      setError(t.deleteLogError);
    } finally {
      setDeletingLogId("");
    }
  }

  const suggestions = useMemo(() => {
    function unique(values: Array<string | null | undefined>) {
      return Array.from(
        new Set(
          values
            .map((value) => String(value || "").trim())
            .filter(Boolean),
        ),
      ).sort((a, b) => a.localeCompare(b, "tr"));
    }

    return {
      companies: unique(logs.map((log) => log.companyName)),
      drivers: unique(logs.map((log) => log.driverName)),
      plates: unique(logs.map((log) => log.vehiclePlate)),
      deliveryNotes: unique(logs.map((log) => log.deliveryNoteNo)),
      contacts: unique(logs.map((log) => log.contactPerson)),
      destinations: unique(logs.map((log) => log.destination)),
      itemNames: unique(
        logs.flatMap((log) => log.items.map((item) => item.itemName)),
      ),
    };
  }, [logs]);

  const warehouseBalances = useMemo(() => {
    const balanceMap = new Map<
      string,
      {
        itemName: string;
        unit: string;
        incoming: number;
        outgoing: number;
        current: number;
      }
    >();

    for (const log of logs) {
      for (const item of log.items) {
        const cleanName = item.itemName.trim();
        const cleanUnit = item.unit.trim().toLocaleUpperCase("tr-TR");

        const key = `${cleanName.toLocaleLowerCase("tr-TR")}::${cleanUnit}`;

        const current = balanceMap.get(key) || {
          itemName: cleanName,
          unit: cleanUnit,
          incoming: 0,
          outgoing: 0,
          current: 0,
        };

        if (log.type === "IN") {
          current.incoming += item.quantity;
        } else {
          current.outgoing += item.quantity;
        }

        current.current = current.incoming - current.outgoing;

        balanceMap.set(key, current);
      }
    }

    return Array.from(balanceMap.values()).sort((a, b) =>
      a.itemName.localeCompare(b.itemName, "tr"),
    );
  }, [logs]);

  const totalWarehouseProductCount = warehouseBalances.filter(
    (item) => Math.abs(item.current) > 0.000001,
  ).length;

  const warehouseTotalsByUnit = useMemo(() => {
    const totals = new Map<
      string,
      {
        unit: string;
        incoming: number;
        outgoing: number;
        current: number;
      }
    >();

    for (const item of warehouseBalances) {
      const total = totals.get(item.unit) || {
        unit: item.unit,
        incoming: 0,
        outgoing: 0,
        current: 0,
      };

      total.incoming += item.incoming;
      total.outgoing += item.outgoing;
      total.current += item.current;

      totals.set(item.unit, total);
    }

    return Array.from(totals.values()).sort((a, b) =>
      a.unit.localeCompare(b.unit, "tr"),
    );
  }, [warehouseBalances]);

  const filteredLogs = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("tr");

    return logs.filter((log) => {
      if (historyType !== "ALL" && log.type !== historyType) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const searchable = [
        log.companyName,
        log.driverName,
        log.vehiclePlate,
        log.deliveryNoteNo,
        log.destination,
        log.contactPerson,
        log.note,
        ...log.items.flatMap((item) => [
          item.itemName,
          item.unit,
          item.note,
        ]),
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("tr");

      return searchable.includes(normalizedSearch);
    });
  }, [logs, search, historyType]);

  return (
    <main className="min-h-screen bg-slate-100 p-4 lg:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 font-bold text-slate-600 transition hover:text-orange-500"
          >
            <ArrowLeft size={18} />
            {t.adminPanel}
          </Link>

          {mode !== "HOME" ? (
            <button
              type="button"
              onClick={() => {
                setMode("HOME");
                setError("");
                setSuccess("");
              }}
              className="rounded-xl bg-white px-4 py-2 font-bold text-slate-700 shadow-sm"
            >
              {t.mainMenu}
            </button>
          ) : null}
        </div>

        <section className="mt-4 rounded-[24px] bg-slate-950 p-5 text-white sm:p-6">
          <Warehouse size={26} className="text-orange-400" />

          <h1 className="mt-3 text-3xl font-black">
            {t.pageTitle}
          </h1>

          <p className="mt-2 max-w-3xl text-sm text-slate-400">
            {t.pageDescription}
          </p>
        </section>

        {error ? (
          <div className="mt-6 rounded-2xl bg-red-50 p-4 font-bold text-red-600">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-green-50 p-4 font-bold text-green-700">
            <span>{success}</span>

            {lastSavedLogId ? (
              <Link
                href={`/admin/stock/print/${lastSavedLogId}?lang=${language}`}
                target="_blank"
                className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white"
              >
                <Printer size={18} />
                {t.print}
              </Link>
            ) : null}
          </div>
        ) : null}

        {mode === "HOME" ? (
          <section className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <button
              type="button"
              onClick={() => openForm("IN")}
              className="rounded-[28px] bg-green-600 p-7 text-left text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <ArrowDownToLine size={30} />

              <h2 className="mt-5 text-2xl font-black">{t.incomingTitle}</h2>

              <p className="mt-2 text-green-50">
                {t.incomingDesc}
              </p>
            </button>

            <button
              type="button"
              onClick={() => openForm("OUT")}
              className="rounded-[28px] bg-red-600 p-7 text-left text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <ArrowUpFromLine size={30} />

              <h2 className="mt-5 text-2xl font-black">{t.outgoingTitle}</h2>

              <p className="mt-2 text-red-50">
                {t.outgoingDesc}
              </p>
            </button>

            <button
              type="button"
              onClick={() => setMode("STOCK")}
              className="rounded-[28px] bg-blue-600 p-7 text-left text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <PackageCheck size={30} />

              <h2 className="mt-5 text-2xl font-black">
                {t.stockTitle}
              </h2>

              <p className="mt-2 text-blue-50">
                {t.stockDesc}
              </p>
            </button>

            <button
              type="button"
              onClick={() => setMode("HISTORY")}
              className="rounded-[28px] bg-white p-7 text-left text-slate-950 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <ClipboardList size={30} className="text-orange-500" />

              <h2 className="mt-5 text-2xl font-black">
                {t.historyTitle}
              </h2>

              <p className="mt-2 text-slate-500">
                {t.historyDesc}
              </p>
            </button>
          </section>
        ) : null}

        {mode === "FORM" ? (
          <form
            onSubmit={handleSubmit}
            className="mt-5 rounded-[22px] bg-white p-4 shadow-sm sm:p-5"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p
                  className={`font-black ${
                    type === "IN" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {type === "IN" ? t.incomingRecord : t.outgoingRecord}
                </p>

                <h2 className="mt-1 text-2xl font-black text-slate-950">
                  {type === "IN" ? t.incomingInfo : t.outgoingInfo}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setMode("HOME")}
                className="rounded-xl bg-slate-100 p-2 text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-4 grid gap-x-3 gap-y-2 md:grid-cols-3">
              <Input
                label={t.companyPerson}
                value={companyName}
                onChange={setCompanyName}
                listId="warehouse-companies"
                suggestions={suggestions.companies}
              />

              <Input
                label={t.driverNameLabel}
                value={driverName}
                onChange={setDriverName}
                listId="warehouse-drivers"
                suggestions={suggestions.drivers}
              />

              <Input
                label={t.vehiclePlateLabel}
                value={vehiclePlate}
                onChange={setVehiclePlate}
                listId="warehouse-plates"
                suggestions={suggestions.plates}
              />

              <Input
                label={t.deliveryNoteNoLabel}
                value={deliveryNoteNo}
                onChange={setDeliveryNoteNo}
                listId="warehouse-delivery-notes"
                suggestions={suggestions.deliveryNotes}
              />

              <Input
                label={type === "IN" ? t.receivedBy : t.handedOverBy}
                value={contactPerson}
                onChange={setContactPerson}
                listId="warehouse-contacts"
                suggestions={suggestions.contacts}
              />

              <Input
                label={type === "IN" ? t.origin : t.destination}
                value={destination}
                onChange={setDestination}
                listId="warehouse-destinations"
                suggestions={suggestions.destinations}
              />
            </div>

            <div className="mt-5">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-lg font-black text-slate-950">
                  {t.items}
                </h3>

                <button
                  type="button"
                  onClick={addItem}
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-3 py-2 text-sm font-bold text-white"
                >
                  <Plus size={18} />
                  {t.addItem}
                </button>
              </div>

              <div className="mt-3 space-y-3">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="grid gap-2 rounded-xl border border-slate-200 p-2.5 md:grid-cols-[2fr_0.7fr_0.8fr_1.4fr_auto]"
                  >
                    <Input
                      label={t.itemName}
                      value={item.itemName}
                      onChange={(value) =>
                        updateItem(index, "itemName", value)
                      }
                      listId={`warehouse-items-${index}`}
                      suggestions={suggestions.itemNames}
                    />

                    <Input
                      label={t.quantity}
                      type="number"
                      step="0.001"
                      value={item.quantity}
                      onChange={(value) =>
                        updateItem(index, "quantity", value)
                      }
                    />

                    <label className="block">
                      <span className="text-xs font-bold text-slate-700">
                        {t.unit}
                      </span>

                      <select
                        value={item.unit}
                        onChange={(event) =>
                          updateItem(index, "unit", event.target.value)
                        }
                        className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-2.5 text-sm outline-none focus:border-orange-500"
                      >
                        {unitOptions.map((unit) => (
                          <option key={unit} value={unit}>
                            {unit}
                          </option>
                        ))}
                      </select>
                    </label>

                    <Input
                      label={t.lineNote}
                      value={item.note}
                      onChange={(value) =>
                        updateItem(index, "note", value)
                      }
                    />

                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        disabled={items.length === 1}
                        className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-500 disabled:opacity-30"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <label className="mt-4 block">
              <span className="text-xs font-bold text-slate-700">
                {t.generalNote}
              </span>

              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={2}
                className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-2.5 text-sm outline-none focus:border-orange-500"
              />
            </label>

            <button
              type="submit"
              disabled={saving}
              className={`mt-4 inline-flex items-center gap-2 rounded-xl px-5 py-3 font-black text-white disabled:opacity-60 ${
                type === "IN" ? "bg-green-600" : "bg-red-600"
              }`}
            >
              {saving ? (
                <Loader2 size={19} className="animate-spin" />
              ) : (
                <Save size={19} />
              )}

              {type === "IN" ? t.saveIncoming : t.saveOutgoing}
            </button>
          </form>
        ) : null}

        {mode === "STOCK" ? (
          <section className="mt-7">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <p className="text-xs font-black uppercase text-slate-400">
                  {t.itemVarietyCount}
                </p>

                <p className="mt-2 text-3xl font-black text-slate-950">
                  {warehouseBalances.length}
                </p>
              </div>

              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <p className="text-xs font-black uppercase text-slate-400">
                  {t.hasStock}
                </p>

                <p className="mt-2 text-3xl font-black text-green-600">
                  {totalWarehouseProductCount}
                </p>
              </div>

              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <p className="text-xs font-black uppercase text-slate-400">
                  {t.calculation}
                </p>

                <p className="mt-2 font-black text-slate-950">
                  {t.calcFormula}
                </p>
              </div>
            </div>

            {loadingLogs ? (
              <div className="mt-5 flex items-center justify-center gap-3 rounded-2xl bg-white p-10 font-bold text-slate-500">
                <Loader2 className="animate-spin" />
                {t.calculatingStock}
              </div>
            ) : warehouseBalances.length === 0 ? (
              <div className="mt-5 rounded-2xl bg-white p-10 text-center font-bold text-slate-500">
                {t.noStockRecords}
              </div>
            ) : (
              <div className="mt-5 overflow-hidden rounded-[24px] bg-white shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 p-5">
                  <div>
                    <h2 className="text-2xl font-black text-slate-950">
                      {t.currentStockTitle}
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      {t.currentStockDesc}
                    </p>
                  </div>

                  <Link
                    href={`/admin/stock/current/print?lang=${language}`}
                    target="_blank"
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white transition hover:bg-orange-500"
                  >
                    <Printer size={17} />
                    {t.print}
                  </Link>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px] text-left">
                    <thead className="bg-slate-950 text-sm text-white">
                      <tr>
                        <th className="px-5 py-3">{t.tableItemName}</th>
                        <th className="px-5 py-3 text-right">
                          {t.totalIn}
                        </th>
                        <th className="px-5 py-3 text-right">
                          {t.totalOut}
                        </th>
                        <th className="px-5 py-3 text-right">
                          {t.currentRemaining}
                        </th>
                        <th className="px-5 py-3">{t.unitColumn}</th>
                      </tr>
                    </thead>

                    <tbody>
                      {warehouseBalances.map((item) => (
                        <tr
                          key={`${item.itemName}-${item.unit}`}
                          className="border-b border-slate-100"
                        >
                          <td className="px-5 py-3 font-black text-slate-950">
                            {item.itemName}
                          </td>

                          <td className="px-5 py-3 text-right font-bold text-green-600">
                            {item.incoming.toLocaleString("tr-TR", {
                              maximumFractionDigits: 3,
                            })}
                          </td>

                          <td className="px-5 py-3 text-right font-bold text-red-600">
                            {item.outgoing.toLocaleString("tr-TR", {
                              maximumFractionDigits: 3,
                            })}
                          </td>

                          <td
                            className={`px-5 py-3 text-right text-lg font-black ${
                              item.current < 0
                                ? "text-red-600"
                                : item.current === 0
                                  ? "text-slate-400"
                                  : "text-blue-600"
                            }`}
                          >
                            {item.current.toLocaleString("tr-TR", {
                              maximumFractionDigits: 3,
                            })}
                          </td>

                          <td className="px-5 py-3 font-bold text-slate-600">
                            {item.unit}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="border-t border-slate-200 bg-slate-50 p-5">
                  <h3 className="text-lg font-black text-slate-950">
                    {t.unitTotalsTitle}
                  </h3>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {warehouseTotalsByUnit.map((total) => (
                      <div
                        key={total.unit}
                        className="rounded-xl border border-slate-200 bg-white p-4"
                      >
                        <p className="text-sm font-black text-slate-950">
                          {total.unit}
                        </p>

                        <div className="mt-2 space-y-1 text-sm">
                          <p>
                            {t.incomingLabel}{" "}
                            <strong className="text-green-600">
                              {total.incoming.toLocaleString("tr-TR", {
                                maximumFractionDigits: 3,
                              })}
                            </strong>
                          </p>

                          <p>
                            {t.outgoingLabel}{" "}
                            <strong className="text-red-600">
                              {total.outgoing.toLocaleString("tr-TR", {
                                maximumFractionDigits: 3,
                              })}
                            </strong>
                          </p>

                          <p>
                            {t.remainingLabel}{" "}
                            <strong className="text-blue-600">
                              {total.current.toLocaleString("tr-TR", {
                                maximumFractionDigits: 3,
                              })}
                            </strong>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <p className="mt-4 text-xs font-bold text-slate-500">
                    {t.negativeNote}
                  </p>
                </div>
              </div>
            )}
          </section>
        ) : null}

        {mode === "HISTORY" ? (
          <section className="mt-7">
            <div className="rounded-[28px] bg-white p-6 shadow-sm">
              <div className="grid gap-4 md:grid-cols-[1fr_auto]">
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={t.searchPlaceholder}
                  className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-orange-500"
                />

                <select
                  value={historyType}
                  onChange={(event) =>
                    setHistoryType(
                      event.target.value as "ALL" | LogType,
                    )
                  }
                  className="rounded-xl border border-slate-200 px-4 py-3 outline-none"
                >
                  <option value="ALL">{t.filterAll}</option>
                  <option value="IN">{t.filterIncomingOnly}</option>
                  <option value="OUT">{t.filterOutgoingOnly}</option>
                </select>
              </div>
            </div>

            {loadingLogs ? (
              <div className="mt-6 flex items-center justify-center gap-3 rounded-2xl bg-white p-10 font-bold text-slate-500">
                <Loader2 className="animate-spin" />
                {t.loadingRecords}
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="mt-6 rounded-2xl bg-white p-10 text-center font-bold text-slate-500">
                {t.noRecordsFound}
              </div>
            ) : (
              <div className="mt-6 space-y-5">
                {filteredLogs.map((log) => (
                  <article
                    key={log.id}
                    className="overflow-hidden rounded-[28px] bg-white shadow-sm"
                  >
                    <div
                      className={`p-5 text-white ${
                        log.type === "IN" ? "bg-green-600" : "bg-red-600"
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-black">
                            {log.type === "IN"
                              ? t.incomingBadge
                              : t.outgoingBadge}
                          </p>

                          <h3 className="mt-1 text-2xl font-black">
                            {log.companyName || t.companyNotSpecified}
                          </h3>
                        </div>

                        <time className="font-bold">
                          {new Date(log.createdAt).toLocaleString("tr-TR")}
                        </time>
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="mb-5 flex flex-wrap justify-end gap-2">
                        <Link
                          href={`/admin/stock/print/${log.id}?lang=${language}`}
                          target="_blank"
                          className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white transition hover:bg-orange-500"
                        >
                          <Printer size={17} />
                          {t.print}
                        </Link>

                        {canDeleteWarehouseLog ? (
                          <button
                            type="button"
                            onClick={() => deleteWarehouseLog(log)}
                            disabled={deletingLogId === log.id}
                            className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-black text-red-600 transition hover:bg-red-600 hover:text-white disabled:opacity-50"
                          >
                            {deletingLogId === log.id ? (
                              <Loader2 size={17} className="animate-spin" />
                            ) : (
                              <Trash2 size={17} />
                            )}
                            {t.delete}
                          </button>
                        ) : null}
                      </div>

                      <div className="grid gap-3 text-sm md:grid-cols-3">
                        <Info label={t.driverLabel} value={log.driverName} />
                        <Info label={t.plateLabel} value={log.vehiclePlate} />
                        <Info
                          label={t.deliveryNoteLabel}
                          value={log.deliveryNoteNo}
                        />
                        <Info
                          label={
                            log.type === "IN"
                              ? t.receivedByLabel
                              : t.handedOverByLabel
                          }
                          value={log.contactPerson}
                        />
                        <Info
                          label={log.type === "IN" ? t.origin : t.destination}
                          value={log.destination}
                        />
                        <Info label={t.noteLabel} value={log.note} />
                      </div>

                      <div className="mt-6 overflow-x-auto">
                        <table className="w-full min-w-[650px] text-left">
                          <thead>
                            <tr className="border-b border-slate-200 text-sm text-slate-500">
                              <th className="px-3 py-3">
                                {t.tableGoodsHeader}
                              </th>
                              <th className="px-3 py-3">
                                {t.tableQuantityHeader}
                              </th>
                              <th className="px-3 py-3">
                                {t.tableUnitHeader}
                              </th>
                              <th className="px-3 py-3">
                                {t.tableNoteHeader}
                              </th>
                            </tr>
                          </thead>

                          <tbody>
                            {log.items.map((item) => (
                              <tr
                                key={item.id}
                                className="border-b border-slate-100"
                              >
                                <td className="px-3 py-3 font-black">
                                  {item.itemName}
                                </td>
                                <td className="px-3 py-3">
                                  {item.quantity.toLocaleString("tr-TR", {
                                    maximumFractionDigits: 3,
                                  })}
                                </td>
                                <td className="px-3 py-3">{item.unit}</td>
                                <td className="px-3 py-3 text-slate-500">
                                  {item.note || "-"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        ) : null}
      </div>
    </main>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  step,
  listId,
  suggestions = [],
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  step?: string;
  listId?: string;
  suggestions?: string[];
}) {
  return (
    <label className="block">
      <span className="text-xs font-bold text-slate-700">{label}</span>

      <input
        type={type}
        step={step}
        list={listId}
        autoComplete="off"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-2.5 text-sm outline-none focus:border-orange-500"
      />

      {listId && suggestions.length > 0 ? (
        <datalist id={listId}>
          {suggestions.map((suggestion) => (
            <option key={suggestion} value={suggestion} />
          ))}
        </datalist>
      ) : null}
    </label>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-xs font-black uppercase text-slate-400">
        {label}
      </p>

      <p className="mt-1 font-bold text-slate-800">{value || "-"}</p>
    </div>
  );
}
