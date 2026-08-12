"use client";

import { useLanguage } from "@/context/LanguageContext";
import { aleo } from "@/lib/fonts";
import { Home, Store } from "lucide-react";
import Link from "next/link";

export default function CtaSection() {
  const { language } = useLanguage();

  const t =
    language === "de"
      ? {
          homeTitle: "Für zu Hause",
          homeDescription:
            "Der Wocheneinkauf an Getränken, bequem bis an die Wohnungstür geliefert. Inklusive Leergutabholung.",
          homeCta: "Bestellen",
          gastroTitle: "Für den Betrieb",
          gastroDescription:
            "Großhandelspreise, flexible Lieferzeiten und digitale Pfandverwaltung für Ihren Ausschank.",
          gastroCta: "Registrieren",
          more: "Mehr",
        }
      : {
          homeTitle: "Ev için",
          homeDescription:
            "Haftalık içecek alışverişiniz, kapınıza kadar rahatça teslim. Boş kap toplama dahil.",
          homeCta: "Sipariş ver",
          gastroTitle: "İşletme için",
          gastroDescription:
            "Toptan fiyatlar, esnek teslimat saatleri ve dijital Pfand yönetimi.",
          gastroCta: "Kayıt ol",
          more: "Devamı",
        };

  return (
    <section className="bg-neutral-lightest px-4 py-16 lg:px-8">
      <div className="mx-auto grid max-w-5xl gap-12 sm:grid-cols-2">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-biscay-lightest text-biscay">
            <Home size={22} />
          </div>

          <h2
            className={`${aleo.className} mt-5 text-2xl font-semibold text-neutral-darkest`}
          >
            {t.homeTitle}
          </h2>

          <p className="mt-3 text-sm leading-6 text-neutral-dark">
            {t.homeDescription}
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/products"
              className="inline-flex items-center justify-center rounded-full bg-biscay px-6 py-3 font-bold text-white transition hover:bg-biscay-dark"
            >
              {t.homeCta}
            </Link>
            <Link
              href="/products"
              className="inline-flex items-center justify-center rounded-full border border-neutral-lighter bg-white px-6 py-3 font-bold text-neutral-darkest transition hover:border-biscay"
            >
              {t.more}
            </Link>
          </div>
        </div>

        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-biscay-lightest text-biscay">
            <Store size={22} />
          </div>

          <h2
            className={`${aleo.className} mt-5 text-2xl font-semibold text-neutral-darkest`}
          >
            {t.gastroTitle}
          </h2>

          <p className="mt-3 text-sm leading-6 text-neutral-dark">
            {t.gastroDescription}
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-full bg-biscay px-6 py-3 font-bold text-white transition hover:bg-biscay-dark"
            >
              {t.gastroCta}
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-full border border-neutral-lighter bg-white px-6 py-3 font-bold text-neutral-darkest transition hover:border-biscay"
            >
              {t.more}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
