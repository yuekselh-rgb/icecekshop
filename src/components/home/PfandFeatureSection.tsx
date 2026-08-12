"use client";

import { useLanguage } from "@/context/LanguageContext";
import { aleo } from "@/lib/fonts";
import { PfandIllustration } from "@/components/home/illustrations";
import Link from "next/link";
import { useState } from "react";

export default function PfandFeatureSection() {
  const { language } = useLanguage();
  const [activeIndex, setActiveIndex] = useState(0);

  const t =
    language === "de"
      ? {
          eyebrow: "Pfand",
          title: "Das Leergut wird zum sauberen Geschäft",
          description:
            "Verfolgen Sie Ihren Pfand online und geben Sie Flaschen und Kästen ohne Aufwand zurück. Wir holen das Leergut bei der nächsten Lieferung einfach wieder mit.",
          cta: "Zum Pfand-Service",
          steps: [
            {
              title: "Kontostand immer im Blick",
              description:
                "Ihr Pfandkonto zeigt genau, was noch offen ist. Kein Rätselraten mehr über leere Kästen im Keller.",
            },
            {
              title: "Rückgabe ohne Schleppen",
              description:
                "Stellen Sie das Leergut bereit. Unser Fahrer nimmt es mit und schreibt es Ihrem Konto gut.",
            },
            {
              title: "Weniger Papierkram für Betriebe",
              description:
                "Für die Gastronomie führen wir die Pfandbuchhaltung digital. Das spart Zeit im hektischen Alltag.",
            },
          ],
        }
      : {
          eyebrow: "Pfand",
          title: "Boş kaplar artık dertsiz",
          description:
            "Pfand bakiyenizi online takip edin, şişe ve kasalarınızı zahmetsizce iade edin. Boş kapları bir sonraki teslimatta bizzat alıyoruz.",
          cta: "Pfand hizmetine git",
          steps: [
            {
              title: "Bakiyeniz her an gözünüzün önünde",
              description:
                "Pfand hesabınız neyin açık olduğunu tam olarak gösterir. Kilerdeki boş kasalarla ilgili tahmin yürütmeye gerek yok.",
            },
            {
              title: "Taşımadan iade edin",
              description:
                "Boş kapları hazır bulundurun. Şoförümüz alır ve hesabınıza işler.",
            },
            {
              title: "İşletmeler için daha az evrak işi",
              description:
                "Gastronomi işletmeleri için Pfand takibini dijital olarak yürütüyoruz. Yoğun günlerde zaman kazandırır.",
            },
          ],
        };

  return (
    <section className="bg-biscay-lightest px-4 py-16 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto mb-12 max-w-lg text-center">
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
            href="/login"
            className="mt-6 inline-flex items-center justify-center rounded-full border border-neutral-lighter bg-white px-6 py-3 font-bold text-neutral-darkest transition hover:border-biscay"
          >
            {t.cta}
          </Link>
        </div>

        <div className="grid overflow-hidden border border-neutral-lighter bg-white lg:grid-cols-2">
          <PfandIllustration className="min-h-[240px] w-full" />

          <div className="flex flex-col justify-center p-2 sm:p-4">
            {t.steps.map((step, index) => {
              const active = index === activeIndex;

              return (
                <button
                  key={step.title}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={`border-b border-neutral-lighter px-6 py-5 text-left transition last:border-b-0 ${
                    active ? "" : "opacity-50 hover:opacity-80"
                  }`}
                >
                  <h3
                    className={`text-lg font-black ${active ? "text-biscay" : "text-neutral-darkest"}`}
                  >
                    {step.title}
                  </h3>

                  {active ? (
                    <p className="mt-2.5 text-sm leading-6 text-neutral-dark">
                      {step.description}
                    </p>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
