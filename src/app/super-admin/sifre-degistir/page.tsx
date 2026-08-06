"use client";

import { useState } from "react";
import Link from "next/link";

export default function SuperAdminChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (newPassword.length < 8) {
      setError("Yeni şifre en az 8 karakter olmalıdır.");
      return;
    }

    if (newPassword !== repeatPassword) {
      setError("Yeni şifreler aynı değil.");
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
        setError(data.error || "Şifre değiştirilemedi.");
      } else {
        setSuccess("Şifre başarıyla değiştirildi.");
        setCurrentPassword("");
        setNewPassword("");
        setRepeatPassword("");
      }
    } catch {
      setError("Beklenmeyen bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6 lg:p-10">
      <div className="mx-auto max-w-xl">
        <Link
          href="/super-admin"
          className="mb-6 inline-block font-bold text-sky-600"
        >
          ← Super Admin
        </Link>

        <div className="rounded-3xl bg-white p-8 shadow">
          <h1 className="text-3xl font-black">
            🔐 Şifre Değiştir
          </h1>

          <form
            onSubmit={submit}
            className="mt-8 space-y-5"
          >
            <input
              type="password"
              placeholder="Mevcut Şifre"
              value={currentPassword}
              onChange={(e)=>setCurrentPassword(e.target.value)}
              className="w-full rounded-xl border p-3"
              required
            />

            <input
              type="password"
              placeholder="Yeni Şifre"
              value={newPassword}
              onChange={(e)=>setNewPassword(e.target.value)}
              className="w-full rounded-xl border p-3"
              required
            />

            <input
              type="password"
              placeholder="Yeni Şifre Tekrar"
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
              {loading ? "Kaydediliyor..." : "Şifreyi Değiştir"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
