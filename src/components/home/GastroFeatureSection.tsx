"use client";

import { useLanguage } from "@/context/LanguageContext";
import { aleo } from "@/lib/fonts";
import { ArrowRight, Check, Store } from "lucide-react";
import Link from "next/link";

export default function GastroFeatureSection() {
  const { language } = useLanguage();

  const t =
    language === "de"
      ? {
          eyebrow: "Für Gastronomie",
          title: "Großhandelspreise für Restaurants, Bars und Imbisse.",
          description:
            "Registrieren Sie Ihren Betrieb und erhalten Sie Zugang zu Großhandelspreisen, regelmäßiger Belieferung und einem festen Ansprechpartner für Ihren Bedarf.",
          point1: "Sonderpreise ab der Registrierung",
          point2: "Regelmäßige Belieferung Ihres Betriebs",
          point3: "Übersicht über all Ihre Bestellungen",
          cta: "Gastronomie-Konto eröffnen",
        }
      : {
          eyebrow: "Gastronomi İçin",
          title: "Restoranlar, barlar ve büfeler için toptan fiyatlar.",
          description:
            "İşletmenizi kaydedin ve toptan fiyatlara, düzenli teslimata ve ihtiyaçlarınız için sabit bir irtibat kişisine erişim kazanın.",
          point1: "Kayıt olduğunuz andan itibaren özel fiyatlar",
          point2: "İşletmenize düzenli teslimat",
          point3: "Tüm siparişlerinizin tek yerden takibi",
          cta: "Gastronomi hesabı aç",
        };

  const points = [t.point1, t.point2, t.point3];

  return (
    <section className="px-4 py-16 lg:px-8">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[28px] bg-raw-sienna-darkest">
        <div className="grid items-center gap-10 px-6 py-12 sm:px-10 lg:grid-cols-[1fr_0.8fr] lg:px-14 lg:py-16">
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-raw-sienna text-white">
              <Store size={22} />
            </div>

            <p className="mt-5 font-bold text-raw-sienna-light">
              {t.eyebrow}
            </p>

            <h2
              className={`${aleo.className} mt-2 max-w-lg text-3xl font-semibold tracking-tight text-white sm:text-4xl`}
            >
              {t.title}
            </h2>

            <p className="mt-5 max-w-lg text-base leading-7 text-raw-sienna-lighter/80">
              {t.description}
            </p>

            <Link
              href="/register"
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 font-bold text-raw-sienna-darkest transition hover:bg-raw-sienna-lightest"
            >
              {t.cta}
              <ArrowRight size={19} />
            </Link>
          </div>

          <ul className="space-y-4">
            {points.map((point) => (
              <li
                key={point}
                className="flex items-start gap-3 rounded-2xl bg-white/5 p-4"
              >
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-raw-sienna text-white">
                  <Check size={14} />
                </span>
                <span className="font-bold text-white">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
