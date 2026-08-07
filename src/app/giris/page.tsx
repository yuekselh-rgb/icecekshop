"use client";

import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { useLanguage } from "@/context/LanguageContext";
import { Loader2, LockKeyhole, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const { language } = useLanguage();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [unverifiedEmail, setUnverifiedEmail] = useState("");

  const t =
    language === "de"
      ? {
          eyebrow: "Mein Konto",
          title: "Anmelden",
          description:
            "Melden Sie sich an, um Ihre Bestellungen und Pfandrückgaben zu verwalten.",
          email: "E-Mail",
          password: "Passwort",
          login: "Anmelden",
          loading: "Anmeldung läuft...",
          noAccount: "Noch kein Konto?",
          register: "Jetzt registrieren",
          genericError: "Die Anmeldung ist fehlgeschlagen.",
          forgotPassword: "Passwort vergessen",
          verifyNow: "Jetzt E-Mail bestätigen",
        }
      : {
          eyebrow: "Hesabım",
          title: "Giriş Yap",
          description:
            "Siparişlerinizi ve Pfand iadelerinizi yönetmek için hesabınıza giriş yapın.",
          email: "E-posta",
          password: "Şifre",
          login: "Giriş Yap",
          loading: "Giriş yapılıyor...",
          noAccount: "Henüz hesabınız yok mu?",
          register: "Kayıt Ol",
          genericError: "Giriş yapılamadı.",
          forgotPassword: "Şifremi unuttum",
          verifyNow: "Şimdi e-postanı doğrula",
        };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setUnverifiedEmail("");
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password: formData.get("password"),
          language,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t.genericError);

        if (data.code === "EMAIL_NOT_VERIFIED") {
          setUnverifiedEmail(email);
        }

        return;
      }

      if (data.user.role === "SUPER_ADMIN") {
        router.push("/super-admin");
        router.refresh();
        return;
      }

      if (data.user.role === "ADMIN") {
        router.push("/admin");
        router.refresh();
        return;
      }

      if (data.user.role === "DRIVER") {
        router.push("/");
        router.refresh();
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError(t.genericError);
    } finally {
      setIsLoading(false);
    }
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

            <form
              action="/api/auth/login"
              method="post"
              onSubmit={handleSubmit}
              className="mt-8 space-y-5"
            >
              <label className="block">
                <span className="text-sm font-bold text-slate-700">
                  {t.email} *
                </span>

                <div className="relative mt-2">
                  <Mail
                    size={19}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    required
                    name="email"
                    type="email"
                    className="w-full rounded-xl border border-slate-200 py-3 pl-12 pr-4 outline-none focus:border-orange-500"
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-sm font-bold text-slate-700">
                  {t.password} *
                </span>

                <div className="relative mt-2">
                  <LockKeyhole
                    size={19}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    required
                    name="password"
                    type="password"
                    className="w-full rounded-xl border border-slate-200 py-3 pl-12 pr-4 outline-none focus:border-orange-500"
                  />
                </div>
              </label>

              {error ? (
                <div className="rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-600">
                  {error}

                  {unverifiedEmail ? (
                    <Link
                      href={`/email-dogrula?email=${encodeURIComponent(unverifiedEmail)}`}
                      className="mt-2 block font-bold underline"
                    >
                      {t.verifyNow}
                    </Link>
                  ) : null}
                </div>
              ) : null}

              <div className="text-right">
                <Link
                  href="/sifremi-unuttum"
                  className="text-sm font-semibold text-orange-500 hover:underline"
                >
                  {t.forgotPassword}
                </Link>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 py-4 font-black text-white transition hover:bg-orange-600 disabled:bg-orange-300"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    {t.loading}
                  </>
                ) : (
                  t.login
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              {t.noAccount}{" "}
              <Link href="/kayit" className="font-bold text-orange-500">
                {t.register}
              </Link>
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
