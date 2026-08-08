"use client";

import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { useLanguage } from "@/context/LanguageContext";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function VerifyEmailPage() {
  const router = useRouter();
  const { language } = useLanguage();

  const email =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("email") ?? ""
      : "";

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");

  const t =
    language === "de"
      ? {
          eyebrow: "Mein Konto",
          title: "E-Mail-Bestätigung",
          description: "Geben Sie den 6-stelligen Code aus Ihrer E-Mail ein.",
          verify: "Bestätigen",
          verifying: "Wird geprüft...",
          resend: "Code erneut senden",
          resending: "Wird gesendet...",
          successMessage: "E-Mail wurde bestätigt.",
          genericError: "Der Code konnte nicht bestätigt werden.",
          resendDone: "Vorgang abgeschlossen.",
        }
      : {
          eyebrow: "Hesabım",
          title: "E-posta Doğrulama",
          description: "Mail adresinize gelen 6 haneli kodu girin.",
          verify: "Doğrula",
          verifying: "Kontrol ediliyor...",
          resend: "Kodu tekrar gönder",
          resending: "Gönderiliyor...",
          successMessage: "E-posta doğrulandı.",
          genericError: "Kod doğrulanamadı.",
          resendDone: "İşlem tamamlandı.",
        };

  async function verify() {
    setLoading(true);
    setMessage("");

    const res = await fetch("/api/auth/verify-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        code,
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
      router.push("/login");
    }, 1500);
  }

  async function resendCode() {
    setSending(true);
    setMessage("");

    const res = await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
      }),
    });

    const data = await res.json();

    setSending(false);

    setMessage(data.message || data.error || t.resendDone);
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

            <input
              className="mt-8 w-full rounded-xl border border-slate-200 p-3 text-center text-2xl tracking-[10px] outline-none focus:border-orange-500"
              maxLength={6}
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />

            <button
              onClick={verify}
              disabled={loading}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 py-4 font-black text-white transition hover:bg-orange-600 disabled:bg-orange-300"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  {t.verifying}
                </>
              ) : (
                t.verify
              )}
            </button>

            <button
              onClick={resendCode}
              disabled={sending}
              className="mt-3 w-full rounded-xl border border-slate-200 py-3 font-semibold text-slate-700 transition hover:border-orange-500"
            >
              {sending ? t.resending : t.resend}
            </button>

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
