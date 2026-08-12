"use client";

import { useLanguage } from "@/context/LanguageContext";
import { useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function PfandSection() {
  const { language } = useLanguage();
  const [active, setActive] = useState(0);

  const t =
    language === "de"
      ? {
          eyebrow: "Pfand",
          title: "Das Leergut wird zum sauberen Geschäft",
          description:
            "Verfolgen Sie Ihren Pfand online und geben Sie Flaschen und Kästen ohne Aufwand zurück.",
          cta: "Zum Pfandkonto",
          more: "Mehr",
          tabs: [
            {
              title: "Kontostand immer im Blick",
              text: "Ihr Pfandkonto zeigt genau, was noch offen ist. Kein Rätselraten mehr über leere Kästen im Keller.",
            },
            {
              title: "Rückgabe ohne Schleppen",
              text: "Stellen Sie das Leergut bereit. Unser Fahrer nimmt es mit und schreibt es Ihrem Konto gut.",
            },
            {
              title: "Weniger Papierkram für Betriebe",
              text: "Für die Gastronomie führen wir die Pfandbuchhaltung digital. Das spart Zeit und Nerven im hektischen Alltag.",
            },
          ],
        }
      : {
          eyebrow: "Pfand",
          title: "Boş kap iadesi artık dertsiz",
          description:
            "Pfand bakiyenizi çevrimiçi takip edin, şişe ve kasaları kolayca iade edin.",
          cta: "Pfand Hesabına Git",
          more: "İncele",
          tabs: [
            {
              title: "Bakiyeniz her an gözünüzün önünde",
              text: "Pfand hesabınız ne kadar iade bekleniyor tam olarak gösterir.",
            },
            {
              title: "Taşımadan iade",
              text: "Boş kapları hazırlayın, şoförümüz alsın ve hesabınıza işlensin.",
            },
            {
              title: "İşletmeler için daha az evrak işi",
              text: "Gastronomi için Pfand takibini dijitalleştiriyoruz.",
            },
          ],
        };

  return (
    // Relume layout-492: centered eyebrow+heading+CTA, split tabs/content layout
    <section className="bg-[#E8ECEF] px-4 py-16 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto mb-12 max-w-lg text-center lg:mb-20">
          <p className="mb-3 font-semibold text-[#05090A]">{t.eyebrow}</p>
          <h2 className="text-3xl font-medium sm:text-4xl lg:text-5xl">{t.title}</h2>
          <p className="mt-4 text-base text-[#05090A] sm:text-lg">{t.description}</p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/pfand"
              className="rounded-full border border-[#05090a26] px-6 py-2.5 font-bold text-[#05090A] transition hover:bg-white"
            >
              {t.cta}
            </Link>
          </div>
        </div>

        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div className="flex items-center justify-center border border-[#05090a26] bg-[#05090A] p-10 text-white lg:min-h-[22rem]">
            <p className="text-2xl font-medium leading-snug">
              {t.tabs[active].title}
            </p>
          </div>

          <div>
            {t.tabs.map((tab, index) => (
              <button
                key={tab.title}
                type="button"
                onClick={() => setActive(index)}
                className={`block w-full border-b border-[#05090a26] py-6 text-left transition ${
                  active === index ? "opacity-100" : "opacity-40"
                }`}
              >
                <h3 className="flex items-center gap-2 text-xl font-medium text-[#05090A]">
                  {tab.title}
                  <ChevronRight size={18} className={active === index ? "" : "hidden"} />
                </h3>

                {active === index ? (
                  <p className="mt-3 text-[#05090A]">{tab.text}</p>
                ) : null}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
