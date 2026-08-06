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
        setError(data.error || "Depo kayıtları yüklenemedi.");
        return;
      }

      setLogs(data.logs || []);
      setCanDeleteWarehouseLog(Boolean(data.canDeleteWarehouseLog));
    } catch {
      setError("Depo kayıtları yüklenemedi.");
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
        setError(data.error || "Depo kaydı oluşturulamadı.");
        return;
      }

      setSuccess(data.message || "Kayıt başarıyla oluşturuldu.");
      setLastSavedLogId(data.log.id);
      setLogs((current) => [
        data.log,
        ...current.filter((log) => log.id !== data.log.id),
      ]);
      resetForm();
    } catch {
      setError("Depo kaydı oluşturulamadı.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteWarehouseLog(log: WarehouseLog) {
    const typeLabel = log.type === "IN" ? "mal giriş" : "mal çıkış";

    const confirmed = window.confirm(
      `${log.companyName || "Firma / kişi belirtilmemiş"} kaydına ait ${typeLabel} kaydı kalıcı olarak silinsin mi?\n\nBu işlem geri alınamaz.`,
    );

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
        setError(data.error || "Depo kaydı silinemedi.");
        return;
      }

      setLogs((current) =>
        current.filter((item) => item.id !== log.id),
      );

      setSuccess(data.message || "Depo kaydı silindi.");
    } catch {
      setError("Depo kaydı silinemedi.");
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
            Admin Paneli
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
              Ana Menü
            </button>
          ) : null}
        </div>

        <section className="mt-4 rounded-[24px] bg-slate-950 p-5 text-white sm:p-6">
          <Warehouse size={26} className="text-orange-400" />

          <h1 className="mt-3 text-3xl font-black">
            Bağımsız Depo Kayıtları
          </h1>

          <p className="mt-2 max-w-3xl text-sm text-slate-400">
            Gelen ve giden malları mevcut ürün, sipariş, şoför ve kasa
            sisteminden tamamen bağımsız şekilde kaydedin.
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
                href={`/admin/stok/yazdir/${lastSavedLogId}`}
                target="_blank"
                className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white"
              >
                <Printer size={18} />
                PDF / Yazdır
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

              <h2 className="mt-5 text-2xl font-black">Mal Girişi</h2>

              <p className="mt-2 text-green-50">
                Kim getirdi, firma, şoför, plaka ve gelen malları kaydedin.
              </p>
            </button>

            <button
              type="button"
              onClick={() => openForm("OUT")}
              className="rounded-[28px] bg-red-600 p-7 text-left text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <ArrowUpFromLine size={30} />

              <h2 className="mt-5 text-2xl font-black">Mal Çıkışı</h2>

              <p className="mt-2 text-red-50">
                Kim götürdü, nereye götürdü, plaka ve çıkan malları kaydedin.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setMode("STOCK")}
              className="rounded-[28px] bg-blue-600 p-7 text-left text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <PackageCheck size={30} />

              <h2 className="mt-5 text-2xl font-black">
                Depo Mevcudu
              </h2>

              <p className="mt-2 text-blue-50">
                Bağımsız depoda hangi maldan ne kadar kaldığını görüntüleyin.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setMode("HISTORY")}
              className="rounded-[28px] bg-white p-7 text-left text-slate-950 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <ClipboardList size={30} className="text-orange-500" />

              <h2 className="mt-5 text-2xl font-black">
                Kayıt Geçmişi
              </h2>

              <p className="mt-2 text-slate-500">
                Bütün giriş ve çıkış kayıtlarını görüntüleyin.
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
                  {type === "IN" ? "GİRİŞ KAYDI" : "ÇIKIŞ KAYDI"}
                </p>

                <h2 className="mt-1 text-2xl font-black text-slate-950">
                  {type === "IN" ? "Gelen Mal Bilgileri" : "Giden Mal Bilgileri"}
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
                label="Firma / Kişi"
                value={companyName}
                onChange={setCompanyName}
                listId="warehouse-companies"
                suggestions={suggestions.companies}
              />

              <Input
                label="Şoför Adı"
                value={driverName}
                onChange={setDriverName}
                listId="warehouse-drivers"
                suggestions={suggestions.drivers}
              />

              <Input
                label="Araç Plakası"
                value={vehiclePlate}
                onChange={setVehiclePlate}
                listId="warehouse-plates"
                suggestions={suggestions.plates}
              />

              <Input
                label="İrsaliye Numarası"
                value={deliveryNoteNo}
                onChange={setDeliveryNoteNo}
                listId="warehouse-delivery-notes"
                suggestions={suggestions.deliveryNotes}
              />

              <Input
                label={type === "IN" ? "Teslim Alan Kişi" : "Teslim Eden Kişi"}
                value={contactPerson}
                onChange={setContactPerson}
                listId="warehouse-contacts"
                suggestions={suggestions.contacts}
              />

              <Input
                label={type === "IN" ? "Geldiği Yer" : "Gideceği Yer"}
                value={destination}
                onChange={setDestination}
                listId="warehouse-destinations"
                suggestions={suggestions.destinations}
              />
            </div>

            <div className="mt-5">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-lg font-black text-slate-950">
                  Mal Kalemleri
                </h3>

                <button
                  type="button"
                  onClick={addItem}
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-3 py-2 text-sm font-bold text-white"
                >
                  <Plus size={18} />
                  Mal Ekle
                </button>
              </div>

              <div className="mt-3 space-y-3">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="grid gap-2 rounded-xl border border-slate-200 p-2.5 md:grid-cols-[2fr_0.7fr_0.8fr_1.4fr_auto]"
                  >
                    <Input
                      label="Mal Adı *"
                      value={item.itemName}
                      onChange={(value) =>
                        updateItem(index, "itemName", value)
                      }
                      listId={`warehouse-items-${index}`}
                      suggestions={suggestions.itemNames}
                    />

                    <Input
                      label="Miktar *"
                      type="number"
                      step="0.001"
                      value={item.quantity}
                      onChange={(value) =>
                        updateItem(index, "quantity", value)
                      }
                    />

                    <label className="block">
                      <span className="text-xs font-bold text-slate-700">
                        Birim *
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
                      label="Satır Açıklaması"
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
                Genel Açıklama
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

              {type === "IN"
                ? "Mal Girişini Kaydet"
                : "Mal Çıkışını Kaydet"}
            </button>
          </form>
        ) : null}

        {mode === "STOCK" ? (
          <section className="mt-7">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <p className="text-xs font-black uppercase text-slate-400">
                  Kayıtlı Mal Çeşidi
                </p>

                <p className="mt-2 text-3xl font-black text-slate-950">
                  {warehouseBalances.length}
                </p>
              </div>

              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <p className="text-xs font-black uppercase text-slate-400">
                  Mevcudu Bulunan
                </p>

                <p className="mt-2 text-3xl font-black text-green-600">
                  {totalWarehouseProductCount}
                </p>
              </div>

              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <p className="text-xs font-black uppercase text-slate-400">
                  Hesaplama
                </p>

                <p className="mt-2 font-black text-slate-950">
                  Giriş − Çıkış
                </p>
              </div>
            </div>

            {loadingLogs ? (
              <div className="mt-5 flex items-center justify-center gap-3 rounded-2xl bg-white p-10 font-bold text-slate-500">
                <Loader2 className="animate-spin" />
                Depo mevcudu hesaplanıyor...
              </div>
            ) : warehouseBalances.length === 0 ? (
              <div className="mt-5 rounded-2xl bg-white p-10 text-center font-bold text-slate-500">
                Henüz bağımsız depo kaydı bulunmuyor.
              </div>
            ) : (
              <div className="mt-5 overflow-hidden rounded-[24px] bg-white shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 p-5">
                  <div>
                    <h2 className="text-2xl font-black text-slate-950">
                      Güncel Bağımsız Depo Mevcudu
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Bütün giriş ve çıkış kayıtlarının anlık toplamıdır.
                    </p>
                  </div>

                  <Link
                    href="/admin/stok/mevcut/yazdir"
                    target="_blank"
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white transition hover:bg-orange-500"
                  >
                    <Printer size={17} />
                    PDF / Yazdır
                  </Link>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px] text-left">
                    <thead className="bg-slate-950 text-sm text-white">
                      <tr>
                        <th className="px-5 py-3">Mal Adı</th>
                        <th className="px-5 py-3 text-right">
                          Toplam Giren
                        </th>
                        <th className="px-5 py-3 text-right">
                          Toplam Çıkan
                        </th>
                        <th className="px-5 py-3 text-right">
                          Şu Anda Kalan
                        </th>
                        <th className="px-5 py-3">Birim</th>
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
                    Birim Bazında Genel Toplamlar
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
                            Giren:{" "}
                            <strong className="text-green-600">
                              {total.incoming.toLocaleString("tr-TR", {
                                maximumFractionDigits: 3,
                              })}
                            </strong>
                          </p>

                          <p>
                            Çıkan:{" "}
                            <strong className="text-red-600">
                              {total.outgoing.toLocaleString("tr-TR", {
                                maximumFractionDigits: 3,
                              })}
                            </strong>
                          </p>

                          <p>
                            Kalan:{" "}
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
                    Negatif miktarlar, kayıtlı çıkışın girişten fazla olduğunu
                    gösterir. Farklı birimler birbirine eklenmez.
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
                  placeholder="Firma, şoför, plaka, irsaliye veya mal ara..."
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
                  <option value="ALL">Tümü</option>
                  <option value="IN">Sadece Girişler</option>
                  <option value="OUT">Sadece Çıkışlar</option>
                </select>
              </div>
            </div>

            {loadingLogs ? (
              <div className="mt-6 flex items-center justify-center gap-3 rounded-2xl bg-white p-10 font-bold text-slate-500">
                <Loader2 className="animate-spin" />
                Kayıtlar yükleniyor...
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="mt-6 rounded-2xl bg-white p-10 text-center font-bold text-slate-500">
                Kayıt bulunamadı.
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
                              ? "MAL GİRİŞİ"
                              : "MAL ÇIKIŞI"}
                          </p>

                          <h3 className="mt-1 text-2xl font-black">
                            {log.companyName || "Firma / kişi belirtilmedi"}
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
                          href={`/admin/stok/yazdir/${log.id}`}
                          target="_blank"
                          className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white transition hover:bg-orange-500"
                        >
                          <Printer size={17} />
                          PDF / Yazdır
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
                            Sil
                          </button>
                        ) : null}
                      </div>

                      <div className="grid gap-3 text-sm md:grid-cols-3">
                        <Info label="Şoför" value={log.driverName} />
                        <Info label="Plaka" value={log.vehiclePlate} />
                        <Info
                          label="İrsaliye"
                          value={log.deliveryNoteNo}
                        />
                        <Info
                          label={
                            log.type === "IN"
                              ? "Teslim Alan"
                              : "Teslim Eden"
                          }
                          value={log.contactPerson}
                        />
                        <Info
                          label={
                            log.type === "IN"
                              ? "Geldiği Yer"
                              : "Gideceği Yer"
                          }
                          value={log.destination}
                        />
                        <Info label="Açıklama" value={log.note} />
                      </div>

                      <div className="mt-6 overflow-x-auto">
                        <table className="w-full min-w-[650px] text-left">
                          <thead>
                            <tr className="border-b border-slate-200 text-sm text-slate-500">
                              <th className="px-3 py-3">Mal</th>
                              <th className="px-3 py-3">Miktar</th>
                              <th className="px-3 py-3">Birim</th>
                              <th className="px-3 py-3">Açıklama</th>
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
