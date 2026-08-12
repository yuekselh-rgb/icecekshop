"use client";

import { useLanguage } from "@/context/LanguageContext";
import { aleo } from "@/lib/fonts";
import { HeroIllustration } from "@/components/home/illustrations";
import Link from "next/link";

export default function HeroSection() {
  const { language } = useLanguage();

  const t =
    language === "de"
      ? {
          badge: "Getränke, Verpackungen und Reinigungsprodukte",
          title: "Wir bringen alles, was Sie brauchen, direkt zu Ihnen.",
          description:
            "Bestellen Sie bequem für Ihr Zuhause oder Ihren Betrieb. Wir bereiten Ihre Bestellung vor und liefern sie direkt an Ihre Adresse.",
          shop: "Jetzt einkaufen",
          login: "Anmelden",
        }
      : {
          badge: "İçecek, ambalaj ve temizlik ürünleri",
          title: "İhtiyacınız olan ürünleri kapınıza kadar getiriyoruz.",
          description:
            "Eviniz veya iş yeriniz için kolayca sipariş verin. Siparişinizi hazırlayalım ve adresinize teslim edelim.",
          shop: "Alışverişe Başla",
          login: "Giriş Yap",
        };

  return (
    <section className="bg-biscay-lightest">
      <div className="mx-auto max-w-3xl px-4 pb-10 pt-16 text-center sm:px-8 lg:pt-20">
        <span className="mx-auto mb-5 inline-flex w-fit rounded-full bg-biscay/10 px-4 py-2 text-sm font-bold text-biscay">
          {t.badge}
        </span>

        <h1
          className={`${aleo.className} text-4xl font-semibold leading-tight text-neutral-darkest sm:text-5xl lg:text-6xl`}
        >
          {t.title}
        </h1>

        <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-neutral-dark sm:text-lg">
          {t.description}
        </p>

        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/products"
            className="inline-flex items-center justify-center rounded-full bg-biscay px-6 py-3.5 font-bold text-white transition hover:bg-biscay-dark"
          >
            {t.shop}
          </Link>

          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-full border border-neutral-lighter px-6 py-3.5 font-bold text-neutral-darkest transition hover:border-biscay"
          >
            {t.login}
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-0 sm:px-8">
        <HeroIllustration className="h-[220px] w-full sm:h-[280px] lg:h-[320px]" />
      </div>
    </section>
  );
}
