"use client";

import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";

export default function SuperAdminChangePasswordPage() {
  const { language } = useLanguage();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const t =
    language === "de"
      ? {
          back: "Super Admin",
          title: "Passwort ändern",
          currentPassword: "Aktuelles Passwort",
          newPassword: "Neues Passwort",
          repeatPassword: "Neues Passwort wiederholen",
          saving: "Wird gespeichert...",
          submit: "Passwort ändern",
          tooShort: "Das neue Passwort muss mindestens 8 Zeichen lang sein.",
          mismatch: "Die neuen Passwörter stimmen nicht überein.",
          changeFailed: "Passwort konnte nicht geändert werden.",
          changeSuccess: "Passwort wurde erfolgreich geändert.",
          unexpectedError: "Ein unerwarteter Fehler ist aufgetreten.",
        }
      : {
          back: "Super Admin",
          title: "Şifre Değiştir",
          currentPassword: "Mevcut Şifre",
          newPassword: "Yeni Şifre",
          repeatPassword: "Yeni Şifre Tekrar",
          saving: "Kaydediliyor...",
          submit: "Şifreyi Değiştir",
          tooShort: "Yeni şifre en az 8 karakter olmalıdır.",
          mismatch: "Yeni şifreler aynı değil.",
          changeFailed: "Şifre değiştirilemedi.",
          changeSuccess: "Şifre başarıyla değiştirildi.",
          unexpectedError: "Beklenmeyen bir hata oluştu.",
        };

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (newPassword.length < 8) {
      setError(t.tooShort);
      return;
    }

    if (newPassword !== repeatPassword) {
      setError(t.mismatch);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/super-admin/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword: repeatPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t.changeFailed);
      } else {
        setSuccess(t.changeSuccess);
        setCurrentPassword("");
        setNewPassword("");
        setRepeatPassword("");
      }
    } catch {
      setError(t.unexpectedError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="rounded-3xl bg-white p-8 shadow">
          <h1 className="text-3xl font-black">
            🔐 {t.title}
          </h1>

          <form
            onSubmit={submit}
            className="mt-8 space-y-5"
          >
            <input
              type="password"
              placeholder={t.currentPassword}
              value={currentPassword}
              onChange={(e)=>setCurrentPassword(e.target.value)}
              className="w-full rounded-xl border p-3"
              required
            />

            <input
              type="password"
              placeholder={t.newPassword}
              value={newPassword}
              onChange={(e)=>setNewPassword(e.target.value)}
              className="w-full rounded-xl border p-3"
              required
            />

            <input
              type="password"
              placeholder={t.repeatPassword}
              value={repeatPassword}
              onChange={(e)=>setRepeatPassword(e.target.value)}
              className="w-full rounded-xl border p-3"
              required
            />

            {error && (
              <div className="rounded-xl bg-red-100 p-3 font-bold text-red-700">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-xl bg-green-100 p-3 font-bold text-green-700">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-slate-900 py-3 font-bold text-white"
            >
              {loading ? t.saving : t.submit}
            </button>
          </form>
        </div>
      </div>
  );
}
