"use client";

import { useLanguage } from "@/context/LanguageContext";
import { aleo } from "@/lib/fonts";
import { ArrowRight, PackageSearch, RotateCcw, Wallet } from "lucide-react";
import Link from "next/link";

export default function PfandFeatureSection() {
  const { language } = useLanguage();

  const t =
    language === "de"
      ? {
          eyebrow: "Pfand-Rückgabe",
          title: "Pfand zurückgeben, ohne den Überblick zu verlieren.",
          description:
            "Melden Sie Ihre Flaschen- und Kastenrückgaben einfach über Ihr Konto an. Wir erfassen die Menge, rechnen den Betrag zusammen und Sie sehen jederzeit, was noch offen ist.",
          cta: "Jetzt anmelden",
          step1Title: "Rückgabe melden",
          step1Description: "Menge und Art des Pfands im Konto eintragen.",
          step2Title: "Wird geprüft",
          step2Description: "Wir gleichen die Rückgabe bei Lieferung ab.",
          step3Title: "Betrag gutgeschrieben",
          step3Description: "Der Pfandwert wird direkt verrechnet.",
        }
      : {
          eyebrow: "Pfand İadesi",
          title: "Pfand iadenizi kaybetmeden takip edin.",
          description:
            "Şişe ve kasa iadelerinizi hesabınız üzerinden kolayca bildirin. Miktarı kaydediyor, tutarı hesaplıyoruz ve neyin hâlâ açık olduğunu her an görebiliyorsunuz.",
          cta: "Şimdi giriş yap",
          step1Title: "İadeyi bildir",
          step1Description: "Pfand miktarını ve türünü hesaba girin.",
          step2Title: "Kontrol ediliyor",
          step2Description: "Teslimat sırasında iadeyi karşılaştırıyoruz.",
          step3Title: "Tutar hesaba geçiyor",
          step3Description: "Pfand tutarı doğrudan mahsup edilir.",
        };

  const steps = [
    {
      title: t.step1Title,
      description: t.step1Description,
      icon: PackageSearch,
    },
    {
      title: t.step2Title,
      description: t.step2Description,
      icon: RotateCcw,
    },
    {
      title: t.step3Title,
      description: t.step3Description,
      icon: Wallet,
    },
  ];

  return (
    <section className="bg-biscay-lightest px-4 py-16 lg:px-8">
      <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <p className="font-bold text-biscay">{t.eyebrow}</p>

          <h2
            className={`${aleo.className} mt-2 max-w-lg text-3xl font-semibold tracking-tight text-biscay-darkest sm:text-4xl`}
          >
            {t.title}
          </h2>

          <p className="mt-5 max-w-lg text-base leading-7 text-neutral-dark">
            {t.description}
          </p>

          <Link
            href="/login"
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-biscay px-6 py-3.5 font-bold text-white transition hover:bg-biscay-dark"
          >
            {t.cta}
            <ArrowRight size={19} />
          </Link>
        </div>

        <div className="space-y-3">
          {steps.map((step, index) => {
            const Icon = step.icon;

            return (
              <div
                key={step.title}
                className="flex items-center gap-4 rounded-2xl border border-biscay-lighter bg-white p-5"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-biscay-lightest text-biscay">
                  <Icon size={22} />
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-neutral">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <h3 className="font-black text-biscay-darkest">
                    {step.title}
                  </h3>
                  <p className="mt-0.5 text-sm text-neutral-dark">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
