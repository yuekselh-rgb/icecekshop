"use client";

import { useLanguage } from "@/context/LanguageContext";
import { Home, Store } from "lucide-react";
import Link from "next/link";

function scrollToProducts(event: React.MouseEvent) {
  event.preventDefault();
  document.getElementById("produkte")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function CtaSection() {
  const { language } = useLanguage();

  const t =
    language === "de"
      ? {
          home: { title: "Für zu Hause", text: "Der Wocheneinkauf an Getränken, bequem bis an die Wohnungstür geliefert.", cta: "Bestellen", more: "Mehr" },
          business: { title: "Für den Betrieb", text: "Großhandelspreise, flexible Lieferzeiten und digitale Pfandverwaltung.", cta: "Registrieren", more: "Mehr" },
        }
      : {
          home: { title: "Ev İçin", text: "Haftalık içecek alışverişiniz kapınıza kadar teslim edilir.", cta: "Sipariş Ver", more: "İncele" },
          business: { title: "İşletme İçin", text: "Toptan fiyatlar, esnek teslimat ve dijital Pfand yönetimi.", cta: "Kayıt Ol", more: "İncele" },
        };

  return (
    // Relume cta-36: two centered icon+text columns with dual CTAs
    <section className="bg-[#EAF2F8] px-4 py-16 lg:px-8 lg:py-24">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 md:grid-cols-2 lg:gap-16">
        <div className="flex flex-col items-center text-center">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-[#0E6FAE] md:mb-6">
            <Home size={22} className="text-white" />
          </div>
          <h2 className="text-3xl font-medium sm:text-4xl">{t.home.title}</h2>
          <p className="mt-4 text-[#05090A]">{t.home.text}</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <Link href="/products" onClick={scrollToProducts} className="rounded-full bg-[#0E6FAE] px-6 py-2.5 font-bold text-white transition hover:bg-[#0B5A8C]">
              {t.home.cta}
            </Link>
            <Link href="/products" onClick={scrollToProducts} className="rounded-full border border-[#05090a26] px-6 py-2.5 font-bold text-[#05090A]">
              {t.home.more}
            </Link>
          </div>
        </div>

        <div className="flex flex-col items-center text-center">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-[#0E6FAE] md:mb-6">
            <Store size={22} className="text-white" />
          </div>
          <h2 className="text-3xl font-medium sm:text-4xl">{t.business.title}</h2>
          <p className="mt-4 text-[#05090A]">{t.business.text}</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <Link href="/register" className="rounded-full bg-[#0E6FAE] px-6 py-2.5 font-bold text-white transition hover:bg-[#0B5A8C]">
              {t.business.cta}
            </Link>
            <Link href="/register" className="rounded-full border border-[#05090a26] px-6 py-2.5 font-bold text-[#05090A]">
              {t.business.more}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
