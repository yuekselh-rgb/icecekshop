"use client";

import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { useLanguage } from "@/context/LanguageContext";
import { Loader2, Mail } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const { language } = useLanguage();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const t =
    language === "de"
      ? {
          eyebrow: "Mein Konto",
          title: "Passwort vergessen",
          description:
            "Geben Sie Ihre registrierte E-Mail-Adresse ein, wir senden Ihnen einen Bestätigungscode.",
          emailLabel: "E-Mail",
          submit: "Code senden",
          submitting: "Wird gesendet...",
          successMessage:
            "Der Bestätigungscode wurde an Ihre E-Mail-Adresse gesendet.",
          genericError: "Ein Fehler ist aufgetreten.",
          backToLogin: "Zurück zur Anmeldung",
        }
      : {
          eyebrow: "Hesabım",
          title: "Şifremi Unuttum",
          description:
            "Kayıtlı e-posta adresinizi girin, size bir doğrulama kodu gönderelim.",
          emailLabel: "E-posta",
          submit: "Kod Gönder",
          submitting: "Gönderiliyor...",
          successMessage: "Doğrulama kodu e-posta adresinize gönderildi.",
          genericError: "Bir hata oluştu.",
          backToLogin: "Giriş sayfasına dön",
        };

  async function sendCode() {
    setLoading(true);
    setMessage("");

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();

    setLoading(false);

    if (!res.ok) {
      setMessage(data.error || t.genericError);
      return;
    }

    setMessage(t.successMessage);

    setTimeout(() => {
      window.location.href =
        "/sifre-sifirla?email=" + encodeURIComponent(email);
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

            <label className="mt-8 block">
              <span className="text-sm font-bold text-slate-700">
                {t.emailLabel} *
              </span>

              <div className="relative mt-2">
                <Mail
                  size={19}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="email"
                  className="w-full rounded-xl border border-slate-200 py-3 pl-12 pr-4 outline-none focus:border-orange-500"
                  placeholder="mail@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </label>

            <button
              onClick={sendCode}
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

            {message ? (
              <p className="mt-4 text-center text-sm font-semibold text-slate-600">
                {message}
              </p>
            ) : null}

            <p className="mt-6 text-center text-sm text-slate-500">
              <Link href="/giris" className="font-bold text-orange-500">
                {t.backToLogin}
              </Link>
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
