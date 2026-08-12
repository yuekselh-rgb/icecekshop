"use client";

import { useLanguage } from "@/context/LanguageContext";
import { aleo } from "@/lib/fonts";
import { ArrowRight, Store } from "lucide-react";
import Link from "next/link";

export default function CtaSection() {
  const { language } = useLanguage();

  const t =
    language === "de"
      ? {
          title: "Bereit für Ihre nächste Lieferung?",
          description:
            "Ob privater Haushalt oder Gastronomiebetrieb — bei uns finden Sie das passende Angebot.",
          privateOrder: "Für Privatkunden bestellen",
          gastroAccount: "Gastronomie-Konto eröffnen",
        }
      : {
          title: "Bir sonraki teslimata hazır mısınız?",
          description:
            "İster özel hane ister gastronomi işletmesi olun, size uygun teklifi burada bulacaksınız.",
          privateOrder: "Özel müşteri olarak sipariş ver",
          gastroAccount: "Gastronomi hesabı aç",
        };

  return (
    <section className="px-4 py-16 lg:px-8">
      <div className="mx-auto max-w-4xl text-center">
        <h2
          className={`${aleo.className} text-3xl font-semibold tracking-tight text-biscay-darkest sm:text-4xl`}
        >
          {t.title}
        </h2>

        <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-neutral-dark">
          {t.description}
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/products"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-biscay px-6 py-3.5 font-bold text-white transition hover:bg-biscay-dark"
          >
            {t.privateOrder}
            <ArrowRight size={19} />
          </Link>

          <Link
            href="/register"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-neutral-lighter px-6 py-3.5 font-bold text-biscay-darkest transition hover:border-biscay"
          >
            <Store size={19} />
            {t.gastroAccount}
          </Link>
        </div>
      </div>
    </section>
  );
}
