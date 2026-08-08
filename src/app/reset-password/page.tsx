"use client";

import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { useLanguage } from "@/context/LanguageContext";
import { Loader2, LockKeyhole } from "lucide-react";
import { FormEvent, useState } from "react";

export default function ResetPasswordPage() {
  const { language } = useLanguage();

  const email =
    typeof window === "undefined"
      ? ""
      : new URLSearchParams(window.location.search).get("email") || "";

  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const t =
    language === "de"
      ? {
          eyebrow: "Mein Konto",
          title: "Neues Passwort",
          description:
            "Geben Sie den Code aus Ihrer E-Mail und Ihr neues Passwort ein.",
          passwordPlaceholder: "Neues Passwort",
          submit: "Passwort ändern",
          submitting: "Wird gespeichert...",
          successMessage: "Ihr Passwort wurde erfolgreich geändert.",
          genericError: "Ein Fehler ist aufgetreten.",
        }
      : {
          eyebrow: "Hesabım",
          title: "Yeni Şifre",
          description: "E-postanıza gelen kodu ve yeni şifrenizi girin.",
          passwordPlaceholder: "Yeni şifre",
          submit: "Şifreyi Değiştir",
          submitting: "Kaydediliyor...",
          successMessage: "Şifreniz başarıyla değiştirildi.",
          genericError: "Bir hata oluştu.",
        };

  async function resetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        code,
        password,
      }),
    });

    const data = await res.json();

    setLoading(false);

    if (!res.ok) {
      setMessage(data.error || t.genericError);
      return;
    }

    setMessage(t.successMessage);

    setTimeout(() => {
      window.location.href = "/login";
    }, 1500);
  }

  return (
    <main className="min-h-screen bg-[#f7f7f5]">
      <Header />

      <section className="px-4 py-16 lg:px-8">
        <div className="mx-auto max-w-md">
          <div className="rounded-[32px] bg-white p-7 shadow-sm sm:p-10">
            <p className="font-bold text-orange-500">{t.eyebrow}</p>

            <h1 className="mt-2 text-4xl font-black text-slate-950">
              {t.title}
            </h1>

            <p className="mt-3 leading-6 text-slate-500">{t.description}</p>

            <form onSubmit={resetPassword}>
              <input
                required
                className="mt-8 w-full rounded-xl border border-slate-200 p-3 text-center text-2xl tracking-[8px] outline-none focus:border-orange-500"
                placeholder="123456"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />

              <div className="relative mt-4">
                <LockKeyhole
                  size={19}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  required
                  minLength={8}
                  type="password"
                  className="w-full rounded-xl border border-slate-200 py-3 pl-12 pr-4 outline-none focus:border-orange-500"
                  placeholder={t.passwordPlaceholder}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 py-4 font-black text-white transition hover:bg-orange-600 disabled:bg-orange-300"
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    {t.submitting}
                  </>
                ) : (
                  t.submit
                )}
              </button>
            </form>

            {message ? (
              <p className="mt-4 text-center text-sm font-semibold text-slate-600">
                {message}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
