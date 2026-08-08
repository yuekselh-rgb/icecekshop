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

  const t =
    language === "de"
      ? {
          periodResetLabel: "Periodenrücksetzung",
          resetAllSales: "Alle Verkäufe endgültig löschen",
          resetButton: "Verkäufe zurücksetzen",
          irreversibleAction: "Nicht rückgängig zu machende Aktion",
          confirmTitle:
            "Sollen wirklich alle Verkäufe endgültig gelöscht werden?",
          warningIntro:
            "Nach dieser Aktion können die Datensätze in keiner Weise wiederhergestellt werden.",
          preservedTitle: "Diese Daten bleiben erhalten",
          preservedItems: [
            "Produkte bleiben erhalten",
            "Hauptlagerbestände bleiben erhalten",
            "Kunden bleiben erhalten",
            "Händler bleiben erhalten",
            "Admins bleiben erhalten",
            "Fahrer bleiben erhalten",
            "Firmeneinstellungen bleiben erhalten",
          ],
          confirmInstruction:
            "Geben Sie zum Fortfahren den folgenden Text vollständig ein:",
          confirmPlaceholder: "Bestätigungstext hier eingeben",
          cancel: "Abbrechen",
          deleting: "Wird endgültig gelöscht...",
          permanentDelete: "Endgültig löschen",
          resultOrders: "Gelöschte Bestellungen",
          resultCashMovements: "Gelöschte Kassenbewegungen",
          resultPfandReturns: "Gelöschte Pfanddatensätze",
          resultDriverStockMovements: "Gelöschte Fahrzeugverkaufsbewegungen",
          resultStockMovements: "Gelöschte Hauptlagerbewegungen",
          resultResetDriverStocks: "Zurückgesetzte Fahrzeugbestandszeilen",
          downloadReport: "Periodenabschlussbericht herunterladen (PDF)",
          close: "Schließen",
          deleteError: "Verkäufe konnten nicht gelöscht werden.",
          deleteSuccess: "Alle Verkäufe wurden endgültig gelöscht.",
          serverError:
            "Der Server konnte nicht erreicht werden. Verkäufe konnten nicht gelöscht werden.",
          bullets: [
            "Es wird kein Datenbank-Backup erstellt.",
            "Bestellungen werden nicht in den Papierkorb verschoben.",
            "Barverkäufe werden dauerhaft gelöscht.",
            "Fahrzeugverkäufe der Fahrer werden dauerhaft gelöscht.",
            "Offene Konten und Zahlungsdaten werden gelöscht.",
            "Pfanddatensätze der Verkäufe werden gelöscht.",
            "Fahrerfahrzeugbestände werden zurückgesetzt.",
          ],
        }
      : {
          periodResetLabel: "Dönem sıfırlama",
          resetAllSales: "Tüm satışları kalıcı sil",
          resetButton: "Satışları Sıfırla",
          irreversibleAction: "Geri alınamaz işlem",
          confirmTitle: "Bütün satışlar kalıcı olarak silinsin mi?",
          warningIntro:
            "Bu işlemden sonra kayıtlar hiçbir şekilde geri getirilemez.",
          preservedTitle: "Bu veriler korunacaktır",
          preservedItems: [
            "Ürünler korunacak",
            "Ana depo stokları korunacak",
            "Müşteriler korunacak",
            "Bayiler korunacak",
            "Adminler korunacak",
            "Şoförler korunacak",
            "Şirket ayarları korunacak",
          ],
          confirmInstruction:
            "Devam etmek için aşağıdaki metni eksiksiz yazın:",
          confirmPlaceholder: "Onay metnini buraya yazın",
          cancel: "Vazgeç",
          deleting: "Kalıcı olarak siliniyor...",
          permanentDelete: "Kalıcı Olarak Sil",
          resultOrders: "Silinen sipariş",
          resultCashMovements: "Silinen kasa hareketi",
          resultPfandReturns: "Silinen Pfand kaydı",
          resultDriverStockMovements: "Silinen şoför satış hareketi",
          resultStockMovements: "Silinen ana stok hareketi",
          resultResetDriverStocks: "Sıfırlanan araç stok satırı",
          downloadReport: "Dönem sonu raporunu indir (PDF)",
          close: "Kapat",
          deleteError: "Satışlar silinemedi.",
          deleteSuccess: "Bütün satışlar kalıcı olarak silindi.",
          serverError: "Sunucuya ulaşılamadı. Satışlar silinemedi.",
          bullets: [
            "Hiçbir veritabanı yedeği alınmayacak.",
            "Siparişler çöp kutusuna taşınmayacak.",
            "Bar satışları kalıcı olarak silinecek.",
            "Şoför araç satışları kalıcı olarak silinecek.",
            "Açık hesap ve ödeme kayıtları silinecek.",
            "Satışlara bağlı Pfand kayıtları silinecek.",
            "Şoför araç stokları sıfırlanacak.",
          ],
        };

  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [result, setResult] = useState<ResetResult | null>(null);
  const [reportUrl, setReportUrl] = useState("");

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
        setError(data.error || t.deleteError);
        return;
      }

      setSuccess(data.message || t.deleteSuccess);

      setResult(data.result || null);
      setReportUrl(data.reportUrl || "");
      setConfirmation("");
    } catch {
      setError(t.serverError);
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
                {t.periodResetLabel}
              </p>

              <p className="mt-1 text-sm font-bold text-white">
                {t.resetAllSales}
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
            {t.resetButton}
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
                    {t.irreversibleAction}
                  </p>

                  <h2 className="mt-1 text-2xl font-black text-slate-950">
                    {t.confirmTitle}
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
                <p className="font-black text-red-800">{t.warningIntro}</p>

                <ul className="mt-3 space-y-1 text-sm font-semibold text-red-700">
                  {t.bullets.map((bullet) => (
                    <li key={bullet}>• {bullet}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
                <p className="font-black text-green-800">{t.preservedTitle}</p>

                <ul className="mt-3 space-y-1 text-sm font-semibold text-green-700">
                  {t.preservedItems.map((item) => (
                    <li key={item}>✓ {item}</li>
                  ))}
                </ul>
              </div>

              {!success ? (
                <>
                  <div>
                    <label
                      htmlFor="permanent-sales-reset-confirmation"
                      className="text-sm font-black text-slate-700"
                    >
                      {t.confirmInstruction}
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
                      placeholder={t.confirmPlaceholder}
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
                      {t.cancel}
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
                          {t.deleting}
                        </>
                      ) : (
                        <>
                          <Trash2 size={19} />
                          {t.permanentDelete}
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
                      <p>
                        {t.resultOrders}: {result.deletedOrders}
                      </p>
                      <p>
                        {t.resultCashMovements}: {result.deletedCashMovements}
                      </p>
                      <p>
                        {t.resultPfandReturns}: {result.deletedPfandReturns}
                      </p>
                      <p>
                        {t.resultDriverStockMovements}:{" "}
                        {result.deletedDriverStockMovements}
                      </p>
                      <p>
                        {t.resultStockMovements}:{" "}
                        {result.deletedStockMovements}
                      </p>
                      <p>
                        {t.resultResetDriverStocks}: {result.resetDriverStocks}
                      </p>
                    </div>
                  ) : null}

                  {reportUrl ? (
                    <a
                      href={reportUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-block font-bold text-green-800 underline"
                    >
                      {t.downloadReport}
                    </a>
                  ) : null}

                  <button
                    type="button"
                    onClick={closeModal}
                    className="mt-5 w-full rounded-xl bg-green-700 px-5 py-3 font-black text-white transition hover:bg-green-600"
                  >
                    {t.close}
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
