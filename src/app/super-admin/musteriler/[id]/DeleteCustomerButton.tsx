"use client";

import { useLanguage } from "@/context/LanguageContext";
import { Loader2, Trash2, X } from "lucide-react";
import { useState } from "react";

export default function DeleteCustomerButton({
  id,
  compact = false,
  onDeleted,
}: {
  id: string;
  compact?: boolean;
  onDeleted?: () => void;
}) {
  const { language } = useLanguage();

  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const t =
    language === "de"
      ? {
          delete: compact ? "Löschen" : "Kunde löschen",
          confirmQuestion: "Wirklich endgültig löschen?",
          confirmYes: "Ja, löschen",
          cancel: "Abbrechen",
          genericError: "Löschen fehlgeschlagen.",
        }
      : {
          delete: compact ? "Sil" : "Müşteriyi Sil",
          confirmQuestion: "Bu müşteri tamamen silinsin mi?",
          confirmYes: "Evet, sil",
          cancel: "Vazgeç",
          genericError: "Silinemedi.",
        };

  async function remove() {
    setDeleting(true);
    setError("");

    try {
      const res = await fetch("/api/super-admin/customers/" + id, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t.genericError);
        setDeleting(false);
        return;
      }

      if (onDeleted) {
        onDeleted();
      } else {
        window.location.href = "/super-admin/musteriler";
      }
    } catch {
      setError(t.genericError);
      setDeleting(false);
    }
  }

  const buttonSize = compact
    ? "rounded-lg px-3 py-2 text-sm"
    : "rounded-xl px-4 py-3";

  if (confirming) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        {error ? (
          <span className="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-600">
            {error}
          </span>
        ) : (
          <span className="text-sm font-bold text-red-600">
            {t.confirmQuestion}
          </span>
        )}

        <button
          type="button"
          onClick={remove}
          disabled={deleting}
          className={`flex items-center gap-2 font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 bg-red-600 ${buttonSize}`}
        >
          {deleting ? <Loader2 size={16} className="animate-spin" /> : null}
          {t.confirmYes}
        </button>

        <button
          type="button"
          onClick={() => {
            setConfirming(false);
            setError("");
          }}
          disabled={deleting}
          className={`flex items-center gap-2 font-bold text-slate-700 transition hover:bg-slate-200 bg-slate-100 ${buttonSize}`}
        >
          <X size={16} />
          {t.cancel}
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className={`flex items-center gap-2 font-bold text-white transition hover:bg-red-700 bg-red-600 ${buttonSize}`}
    >
      <Trash2 size={compact ? 16 : 18} />
      {t.delete}
    </button>
  );
}
