"use client";

import { useLanguage } from "@/context/LanguageContext";
import { useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

const tabImages = [
  { src: "/images/home/gastro-restaurant.jpg", alt: "Restaurant" },
  { src: "/images/home/gastro-bar.jpg", alt: "Bar" },
  { src: "/images/home/gastro-imbiss.jpg", alt: "Imbiss" },
];

export default function GastroSection() {
  const { language } = useLanguage();
  const [active, setActive] = useState(0);

  const t =
    language === "de"
      ? {
          eyebrow: "Gastro",
          title: "Preise für Profis",
          description:
            "Registrierte Betriebe kaufen zu Großhandelskonditionen. Der Einkauf rechnet sich vom ersten Kasten an.",
          register: "Registrieren",
          more: "Mehr",
          cardEyebrow: "Exklusiv",
          cardTitle: "Ihr direkter Draht zum Großhandel",
          cardText:
            "Kein Zwischenhändler, keine versteckten Kosten. Nur der reine Preis für die Ware, die Ihr Laden braucht.",
          tabs: ["Restaurants", "Bars", "Imbisse"],
        }
      : {
          eyebrow: "Gastro",
          title: "Profesyoneller için fiyatlar",
          description:
            "Kayıtlı işletmeler toptan fiyatlarla alışveriş yapar. İlk kasadan itibaren avantajlıdır.",
          register: "Kayıt Ol",
          more: "İncele",
          cardEyebrow: "Özel",
          cardTitle: "Toptancıya doğrudan hattınız",
          cardText: "Aracı yok, gizli ücret yok. Sadece dükkanınızın ihtiyacı olan ürünün gerçek fiyatı.",
          tabs: ["Restoranlar", "Barlar", "Büfeler"],
        };

  return (
    // Relume layout-503: centered eyebrow+heading, pill tab row, single split card
    <section className="bg-white px-4 py-16 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto mb-12 max-w-lg text-center lg:mb-16">
          <p className="mb-3 font-semibold text-[#05090A]">{t.eyebrow}</p>
          <h2 className="text-3xl font-medium sm:text-4xl lg:text-5xl">{t.title}</h2>
          <p className="mt-4 text-base text-[#05090A] sm:text-lg">{t.description}</p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/register"
              className="rounded-full border border-[#05090a26] px-6 py-2.5 font-bold text-[#05090A] transition hover:bg-[#F2F2F2]"
            >
              {t.register}
            </Link>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <div className="mb-10 flex gap-6">
            {t.tabs.map((label, index) => (
              <button
                key={label}
                type="button"
                onClick={() => setActive(index)}
                className={`border-b-2 pb-2 font-medium text-[#05090A] transition ${
                  active === index ? "border-[#05090A]" : "border-transparent opacity-50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="grid w-full border border-[#05090a26] bg-[#F2F2F2] md:grid-cols-2 md:items-center">
            <div className="p-8 md:p-12">
              <p className="mb-3 font-semibold text-[#05090A]">{t.cardEyebrow}</p>
              <h3 className="text-2xl font-medium text-[#05090A] sm:text-3xl">{t.cardTitle}</h3>
              <p className="mt-4 text-[#05090A]">{t.cardText}</p>

              <div className="mt-6 flex items-center gap-4">
                <Link
                  href="/login"
                  className="rounded-full border border-[#05090a26] px-6 py-2.5 font-bold text-[#05090A] transition hover:bg-white"
                >
                  {t.register}
                </Link>
              </div>
            </div>

            <div className="relative aspect-square overflow-hidden bg-[#05090A] md:aspect-auto md:min-h-[18rem]">
              <img
                src={tabImages[active].src}
                alt={tabImages[active].alt}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
