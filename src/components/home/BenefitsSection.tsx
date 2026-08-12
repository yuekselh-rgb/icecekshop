"use client";

import { useLanguage } from "@/context/LanguageContext";
import { aleo } from "@/lib/fonts";
import {
  DeliveryIllustration,
  DrinksIllustration,
  PackagingIllustration,
} from "@/components/home/illustrations";
import { ArrowRight } from "lucide-react";

export default function BenefitsSection() {
  const { language } = useLanguage();

  const t =
    language === "de"
      ? {
          eyebrow: "Vorteile",
          title: "Alles fließt aus einer Hand",
          description:
            "Ein Partner für den ganzen Bedarf, vom Kasten bis zum Putzmittel.",
          tag1: "Sortiment",
          title1: "Die ganze Welt der Getränke auf einen Blick",
          desc1: "Softdrinks, Bier, Wein und Spirituosen für jeden Geschmack.",
          tag2: "Komplett",
          title2: "Mehr als nur Flaschen",
          desc2: "Verpackungen und Reinigungsmittel gleich mitbestellen.",
          tag3: "Flexibel",
          title3: "Haus- und Gastrobelieferung",
          desc3: "Privat oder gewerblich — wir liefern nach Ihrem Bedarf.",
          more: "Mehr",
        }
      : {
          eyebrow: "Avantajlar",
          title: "Her şey tek elden",
          description: "Kasadan temizlik malzemesine, tüm ihtiyacınız için tek adres.",
          tag1: "Sortiman",
          title1: "İçecek dünyasının tamamı bir bakışta",
          desc1: "Her damak zevkine uygun gazlı içecek, bira, şarap ve içki.",
          tag2: "Eksiksiz",
          title2: "Sadece şişeden ibaret değil",
          desc2: "Ambalaj ve temizlik ürünlerini de aynı siparişle alın.",
          tag3: "Esnek",
          title3: "Eve ve işletmeye teslimat",
          desc3: "İster özel ister ticari, ihtiyacınıza göre teslim ediyoruz.",
          more: "Devamı",
        };

  return (
    <section className="px-4 py-16 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto mb-12 max-w-lg text-center">
          <p className="font-bold text-neutral-darkest">{t.eyebrow}</p>
          <h2
            className={`${aleo.className} mt-3 text-3xl font-semibold text-neutral-darkest sm:text-4xl`}
          >
            {t.title}
          </h2>
          <p className="mt-4 text-base text-neutral-dark">{t.description}</p>
        </div>

        <div className="grid gap-5 lg:grid-cols-4">
          <div className="flex flex-col overflow-hidden border border-neutral-lighter bg-white lg:col-span-2 lg:flex-row">
            <div className="flex flex-1 flex-col justify-center p-7">
              <p className="text-sm font-bold text-neutral-dark">{t.tag1}</p>
              <h3 className="mt-2 text-xl font-black text-neutral-darkest">
                {t.title1}
              </h3>
              <p className="mt-2 text-sm leading-6 text-neutral-dark">
                {t.desc1}
              </p>
              <span className="mt-4 inline-flex w-fit items-center gap-1.5 font-bold text-neutral-darkest">
                {t.more}
                <ArrowRight size={16} />
              </span>
            </div>
            <DrinksIllustration className="min-h-[160px] w-full lg:w-2/5" />
          </div>

          <div className="flex flex-col overflow-hidden border border-neutral-lighter bg-white">
            <div className="flex-1 p-7">
              <p className="text-sm font-bold text-neutral-dark">{t.tag2}</p>
              <h3 className="mt-2 text-xl font-black text-neutral-darkest">
                {t.title2}
              </h3>
              <p className="mt-2 text-sm leading-6 text-neutral-dark">
                {t.desc2}
              </p>
              <span className="mt-4 inline-flex w-fit items-center gap-1.5 font-bold text-neutral-darkest">
                {t.more}
                <ArrowRight size={16} />
              </span>
            </div>
            <PackagingIllustration className="min-h-[140px] w-full" />
          </div>

          <div className="flex flex-col overflow-hidden border border-neutral-lighter bg-white">
            <div className="flex-1 p-7">
              <p className="text-sm font-bold text-neutral-dark">{t.tag3}</p>
              <h3 className="mt-2 text-xl font-black text-neutral-darkest">
                {t.title3}
              </h3>
              <p className="mt-2 text-sm leading-6 text-neutral-dark">
                {t.desc3}
              </p>
              <span className="mt-4 inline-flex w-fit items-center gap-1.5 font-bold text-neutral-darkest">
                {t.more}
                <ArrowRight size={16} />
              </span>
            </div>
            <DeliveryIllustration className="min-h-[140px] w-full" />
          </div>
        </div>
      </div>
    </section>
  );
}
