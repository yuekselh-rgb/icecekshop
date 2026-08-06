"use client";

import { AlertTriangle, Loader2, RotateCcw, Trash2, X } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

const REQUIRED_CONFIRMATION = "NEHIR CAN";

type ResetResult = {
  deletedOrders: number;
  deletedCashMovements: number;
  deletedPfandReturns: number;
  deletedPfandWarehouseMovements: number;
  deletedDriverCashAdjustments: number;
  deletedDriverStockMovements: number;
  deletedStockMovements: number;
  resetDriverStocks: number;
};

const CONFIRM_TEXT = "NEHIR CAN";

export default function ResetSalesButton() {
  const { language } = useLanguage();

  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [result, setResult] = useState<ResetResult | null>(null);

  const confirmationValid = confirmation.trim() === REQUIRED_CONFIRMATION;

  function closeModal() {
    if (deleting) {
      return;
    }

    setOpen(false);
    setConfirmation("");
    setError("");
  }

  async function permanentlyDeleteAllSales() {
    if (!confirmationValid || deleting) {
      return;
    }

    setDeleting(true);
    setError("");
    setSuccess("");
    setResult(null);

    try {
      const response = await fetch("/api/super-admin/reset-sales", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          confirmation: confirmation.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Satışlar silinemedi.");
        return;
      }

      setSuccess(data.message || "Bütün satışlar kalıcı olarak silindi.");

      setResult(data.result || null);
      setConfirmation("");
    } catch {
      setError("Sunucuya ulaşılamadı. Satışlar silinemedi.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="mt-6 lg:absolute lg:right-8 lg:top-8 lg:mt-0 lg:w-[360px]">
        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-5 shadow-lg shadow-black/10 backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-red-500/20 p-2 text-red-300">
              <RotateCcw size={20} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-black uppercase tracking-wide text-red-300">
                Dönem sıfırlama
              </p>

              <p className="mt-1 text-sm font-bold text-white">
                Tüm satışları kalıcı sil
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setOpen(true);
              setError("");
              setSuccess("");
              setResult(null);
            }}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-black text-white transition hover:bg-red-500"
          >
            <Trash2 size={17} />
            Satışları Sıfırla
          </button>
        </div>
      </div>

      {open ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div className="max-h-[95vh] w-full max-w-xl overflow-y-auto rounded-[28px] bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-5 border-b border-slate-200 p-6">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-red-100 p-3 text-red-600">
                  <AlertTriangle size={28} />
                </div>

                <div>
                  <p className="text-sm font-black uppercase tracking-wide text-red-600">
                    Geri alınamaz işlem
                  </p>

                  <h2 className="mt-1 text-2xl font-black text-slate-950">
                    Bütün satışlar kalıcı olarak silinsin mi?
                  </h2>
                </div>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={deleting}
                className="rounded-xl bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5 p-6">
              <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
                <p className="font-black text-red-800">
                  Bu işlemden sonra kayıtlar hiçbir şekilde geri getirilemez.
                </p>

                <ul className="mt-3 space-y-1 text-sm font-semibold text-red-700">
                  <li>• {language==="de"?"Es wird kein Datenbank-Backup erstellt.":"Hiçbir veritabanı yedeği alınmayacak."}</li>
                  <li>• {language==="de"?"Bestellungen werden nicht in den Papierkorb verschoben.":"Siparişler çöp kutusuna taşınmayacak."}</li>
                  <li>• {language==="de"?"Barverkäufe werden dauerhaft gelöscht.":"Bar satışları kalıcı olarak silinecek."}</li>
                  <li>• {language==="de"?"Fahrzeugverkäufe der Fahrer werden dauerhaft gelöscht.":"Şoför araç satışları kalıcı olarak silinecek."}</li>
                  <li>• {language==="de"?"Offene Konten und Zahlungsdaten werden gelöscht.":"Açık hesap ve ödeme kayıtları silinecek."}</li>
                  <li>• {language==="de"?"Pfanddatensätze der Verkäufe werden gelöscht.":"Satışlara bağlı Pfand kayıtları silinecek."}</li>
                  <li>• {language==="de"?"Fahrerfahrzeugbestände werden zurückgesetzt.":"Şoför araç stokları sıfırlanacak."}</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
                <p className="font-black text-green-800">
                  Bu veriler korunacaktır
                </p>

                <ul className="mt-3 space-y-1 text-sm font-semibold text-green-700">
                  <li>✓ Ürünler korunacak</li>
                  <li>✓ Ana depo stokları korunacak</li>
                  <li>✓ Müşteriler korunacak</li>
                  <li>✓ Bayiler korunacak</li>
                  <li>✓ Adminler korunacak</li>
                  <li>✓ Şoförler korunacak</li>
                  <li>✓ Şirket ayarları korunacak</li>
                                  </ul>
              </div>

              <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
                <p className="font-black text-green-800">
                  Bu veriler korunacaktır
                </p>

                <ul className="mt-3 space-y-1 text-sm font-semibold text-green-700">
                  <li>✓ Ürünler korunacak</li>
                  <li>✓ Ana depo stokları korunacak</li>
                  <li>✓ Müşteriler korunacak</li>
                  <li>✓ Bayiler korunacak</li>
                  <li>✓ Adminler korunacak</li>
                  <li>✓ Şoförler korunacak</li>
                  <li>✓ Şirket ayarları korunacak</li>
                                  </ul>
              </div>

              {!success ? (
                <>
                  <div>
                    <label
                      htmlFor="permanent-sales-reset-confirmation"
                      className="text-sm font-black text-slate-700"
                    >
                      Devam etmek için aşağıdaki metni eksiksiz yazın:
                    </label>

                    <div className="mt-2 select-all rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white">
                      {REQUIRED_CONFIRMATION}
                    </div>

                    <input
                      id="permanent-sales-reset-confirmation"
                      value={confirmation}
                      onChange={(event) => setConfirmation(event.target.value)}
                      disabled={deleting}
                      autoComplete="off"
                      placeholder={language==="de"?"Bestätigungstext hier eingeben":"Onay metnini buraya yazın"}
                      className="mt-3 w-full rounded-xl border-2 border-slate-200 px-4 py-3 font-bold text-slate-950 outline-none transition focus:border-red-500 disabled:bg-slate-100"
                    />
                  </div>

                  {error ? (
                    <div className="rounded-xl bg-red-50 p-4 font-bold text-red-700">
                      {error}
                    </div>
                  ) : null}

                  <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={closeModal}
                      disabled={deleting}
                      className="rounded-xl bg-slate-100 px-5 py-3 font-black text-slate-700 transition hover:bg-slate-200 disabled:opacity-50"
                    >
                      Vazgeç
                    </button>

                    <button
                      type="button"
                      onClick={permanentlyDeleteAllSales}
                      disabled={!confirmationValid || deleting}
                      className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 font-black text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-red-300"
                    >
                      {deleting ? (
                        <>
                          <Loader2 size={19} className="animate-spin" />
                          Kalıcı olarak siliniyor...
                        </>
                      ) : (
                        <>
                          <Trash2 size={19} />
                          Kalıcı Olarak Sil
                        </>
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <div className="rounded-2xl bg-green-50 p-5">
                  <p className="font-black text-green-800">{success}</p>

                  {result ? (
                    <div className="mt-4 grid gap-2 text-sm font-semibold text-green-800 sm:grid-cols-2">
                      <p>Silinen sipariş: {result.deletedOrders}</p>
                      <p>
                        Silinen kasa hareketi: {result.deletedCashMovements}
                      </p>
                      <p>Silinen Pfand kaydı: {result.deletedPfandReturns}</p>
                      <p>
                        Silinen şoför satış hareketi:{" "}
                        {result.deletedDriverStockMovements}
                      </p>
                      <p>
                        Silinen ana stok hareketi:{" "}
                        {result.deletedStockMovements}
                      </p>
                      <p>
                        Sıfırlanan araç stok satırı: {result.resetDriverStocks}
                      </p>
                    </div>
                  ) : null}

                  <button
                    type="button"
                    onClick={closeModal}
                    className="mt-5 w-full rounded-xl bg-green-700 px-5 py-3 font-black text-white transition hover:bg-green-600"
                  >
                    Kapat
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
