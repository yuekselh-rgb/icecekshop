"use client";

import { useLanguage } from "@/context/LanguageContext";
import { aleo } from "@/lib/fonts";
import { GastroIllustration } from "@/components/home/illustrations";
import Link from "next/link";
import { useState } from "react";

export default function GastroFeatureSection() {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState(0);

  const t =
    language === "de"
      ? {
          eyebrow: "Gastro",
          title: "Preise für Profis",
          description:
            "Registrierte Betriebe kaufen zu Großhandelskonditionen. Der Einkauf rechnet sich vom ersten Kasten an.",
          register: "Registrieren",
          tag: "Exklusiv",
          tabs: [
            {
              label: "Restaurants",
              title: "Ihr direkter Draht zum Großhandel",
              description:
                "Kein Zwischenhändler, keine versteckten Kosten. Nur der reine Preis für die Ware, die Ihr Restaurant braucht.",
            },
            {
              label: "Bars",
              title: "Der richtige Ausschank zum richtigen Preis",
              description:
                "Softdrinks, Bier, Wein und Spirituosen zu Großhandelskonditionen für Ihre Bar.",
            },
            {
              label: "Imbisse & Dönerläden",
              title: "Schnell nachbestellt, schnell geliefert",
              description:
                "Kurze Lieferzeiten, damit Ihnen an einem stressigen Tag nichts ausgeht.",
            },
          ],
          cta: "Anmelden",
        }
      : {
          eyebrow: "Gastronomi",
          title: "Profesyoneller için fiyatlar",
          description:
            "Kayıtlı işletmeler toptan koşullarla alışveriş yapar. İlk kasadan itibaren avantajlıdır.",
          register: "Kayıt ol",
          tag: "Ayrıcalıklı",
          tabs: [
            {
              label: "Restoranlar",
              title: "Toptancıya doğrudan hattınız",
              description:
                "Aracı yok, gizli maliyet yok. Restoranınızın ihtiyacı olan ürün için sadece gerçek fiyat.",
            },
            {
              label: "Barlar",
              title: "Doğru fiyata doğru servis",
              description:
                "Barınız için gazlı içecek, bira, şarap ve içkilerde toptan koşullar.",
            },
            {
              label: "Büfe & Dönerciler",
              title: "Hızlı sipariş, hızlı teslimat",
              description:
                "Yoğun bir günde elinizde ürün eksik kalmasın diye kısa teslimat süreleri.",
            },
          ],
          cta: "Giriş yap",
        };

  const current = t.tabs[activeTab];

  return (
    <section className="px-4 py-16 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto mb-10 max-w-lg text-center">
          <p className="font-bold text-neutral-darkest">{t.eyebrow}</p>
          <h2
            className={`${aleo.className} mt-3 text-3xl font-semibold text-neutral-darkest sm:text-4xl`}
          >
            {t.title}
          </h2>
          <p className="mt-4 text-base leading-7 text-neutral-dark">
            {t.description}
          </p>

          <Link
            href="/register"
            className="mt-6 inline-flex items-center justify-center rounded-full bg-biscay px-6 py-3 font-bold text-white transition hover:bg-biscay-dark"
          >
            {t.register}
          </Link>
        </div>

        <div className="mb-8 flex flex-wrap items-center justify-center gap-6 border-b border-neutral-lighter">
          {t.tabs.map((tab, index) => {
            const active = index === activeTab;

            return (
              <button
                key={tab.label}
                type="button"
                onClick={() => setActiveTab(index)}
                className={`-mb-px border-b-2 px-1 pb-3.5 text-sm font-bold transition ${
                  active
                    ? "border-biscay text-neutral-darkest"
                    : "border-transparent text-neutral-dark hover:text-neutral-darkest"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="grid overflow-hidden border border-neutral-lighter bg-white lg:grid-cols-2">
          <div className="flex flex-col justify-center p-8 lg:p-12">
            <p className="text-sm font-bold text-neutral-dark">{t.tag}</p>
            <h3 className="mt-2 text-2xl font-black text-neutral-darkest">
              {current.title}
            </h3>
            <p className="mt-3 text-base leading-7 text-neutral-dark">
              {current.description}
            </p>

            <Link
              href="/login"
              className="mt-6 inline-flex w-fit items-center justify-center rounded-full border border-neutral-lighter px-6 py-3 font-bold text-neutral-darkest transition hover:border-biscay"
            >
              {t.cta}
            </Link>
          </div>

          <GastroIllustration className="min-h-[260px] w-full" />
        </div>
      </div>
    </section>
  );
}
