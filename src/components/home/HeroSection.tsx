"use client";

import { useLanguage } from "@/context/LanguageContext";
import { aleo } from "@/lib/fonts";
import { ArrowRight, Check, Home, Store } from "lucide-react";
import Link from "next/link";

export default function HeroSection() {
  const { language } = useLanguage();

  const t =
    language === "de"
      ? {
          badge: "Getränke, Verpackungen und Reinigungsprodukte",
          title: "Wir bringen alles, was Sie brauchen, direkt zu Ihnen.",
          description:
            "Bestellen Sie Getränke, Verpackungen und Reinigungsprodukte bequem für Ihr Zuhause oder Ihren Betrieb. Wir bereiten Ihre Bestellung vor und liefern sie direkt an Ihre Adresse.",
          shop: "Jetzt einkaufen",
          login: "Anmelden",
          fastDelivery: "Schnelle Lieferung",
          secureOrder: "Sichere Bestellung",
          pfandTracking: "Pfandrückgabe verfolgen",
          deliveryOptions: "Lieferoptionen",
          chooseDelivery: "Wählen Sie die passende Lieferung",
          homeDelivery: "Lieferung nach Hause",
          homeDeliveryDescription:
            "Wir liefern Ihre Bestellung direkt an Ihre Privatadresse.",
          businessDelivery: "Lieferung an den Betrieb",
          businessDeliveryDescription:
            "Regelmäßige Lieferung für Firmen und Gewerbekunden.",
          orderStatus: "Bestellstatus",
          doorDelivery: "Lieferung bis vor die Tür",
          active: "Aktiv",
          pfand: "Pfand",
          trackReturns: "Rückgaben einfach verfolgen",
        }
      : {
          badge: "İçecek, ambalaj ve temizlik ürünleri",
          title: "İhtiyacınız olan ürünleri kapınıza kadar getiriyoruz.",
          description:
            "Eviniz veya iş yeriniz için içecek, ambalaj ve temizlik ürünlerini kolayca sipariş edin. Siparişinizi hazırlayalım ve adresinize teslim edelim.",
          shop: "Alışverişe Başla",
          login: "Giriş Yap",
          fastDelivery: "Hızlı teslimat",
          secureOrder: "Güvenli sipariş",
          pfandTracking: "Pfand iade takibi",
          deliveryOptions: "Teslimat Seçenekleri",
          chooseDelivery: "Size uygun teslimatı seçin",
          homeDelivery: "Eve Teslimat",
          homeDeliveryDescription:
            "Siparişinizi doğrudan ev adresinize teslim ediyoruz.",
          businessDelivery: "İş Yerine Teslimat",
          businessDeliveryDescription:
            "Firma ve işletmeler için düzenli teslimat imkanı.",
          orderStatus: "Sipariş durumu",
          doorDelivery: "Kapınıza kadar teslimat",
          active: "Aktif",
          pfand: "Pfand",
          trackReturns: "İadelerinizi takip edin",
        };

  return (
    <section className="px-4 pb-8 pt-0 lg:px-8 lg:pb-12 lg:pt-0">
      <div className="mx-auto grid max-w-7xl overflow-hidden rounded-[24px] bg-biscay-darkest lg:grid-cols-[1.1fr_0.9fr]">
        <div className="relative flex flex-col justify-center overflow-hidden px-6 py-10 sm:px-8 lg:px-12 lg:py-14">
          <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-raw-sienna/10" />
          <div className="pointer-events-none absolute -bottom-32 right-0 h-80 w-80 rounded-full bg-fountain-blue/10" />

          <span className="relative mb-5 w-fit rounded-full bg-raw-sienna/15 px-4 py-2 text-sm font-bold text-raw-sienna-light">
            {t.badge}
          </span>

          <h1
            className={`${aleo.className} relative max-w-2xl text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl`}
          >
            {t.title}
          </h1>

          <p className="relative mt-6 max-w-xl text-base leading-7 text-biscay-lighter sm:text-lg">
            {t.description}
          </p>

          <div className="relative mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/products"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-raw-sienna px-6 py-3.5 font-bold text-white transition hover:bg-raw-sienna-dark"
            >
              {t.shop}
              <ArrowRight size={19} />
            </Link>

            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-full border border-white/20 px-6 py-3.5 font-bold text-white transition hover:border-white"
            >
              {t.login}
            </Link>
          </div>

          <div className="relative mt-8 flex flex-wrap gap-5 text-sm text-biscay-lighter">
            <span className="flex items-center gap-2">
              <Check size={17} className="text-fountain-blue" />
              {t.fastDelivery}
            </span>

            <span className="flex items-center gap-2">
              <Check size={17} className="text-fountain-blue" />
              {t.secureOrder}
            </span>

            <span className="flex items-center gap-2">
              <Check size={17} className="text-fountain-blue" />
              {t.pfandTracking}
            </span>
          </div>
        </div>

        <div className="relative flex min-h-[250px] items-center justify-center overflow-hidden bg-fountain-blue p-3 sm:p-4">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10" />
          <div className="absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-biscay-darkest/10" />

          <div className="relative w-full max-w-sm">
            <div className="rounded-3xl bg-white p-4 shadow-2xl">
              <p className="text-sm font-bold text-fountain-blue-dark">
                {t.deliveryOptions}
              </p>

              <h2
                className={`${aleo.className} mt-2 text-2xl font-semibold text-biscay-darkest`}
              >
                {t.chooseDelivery}
              </h2>

              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-4 rounded-2xl border border-neutral-lighter p-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-fountain-blue-lightest text-fountain-blue-dark">
                    <Home size={24} />
                  </div>

                  <div>
                    <h3 className="font-black text-biscay-darkest">
                      {t.homeDelivery}
                    </h3>
                    <p className="mt-1 text-sm text-neutral-dark">
                      {t.homeDeliveryDescription}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 rounded-2xl border border-neutral-lighter p-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-raw-sienna-lightest text-raw-sienna-dark">
                    <Store size={24} />
                  </div>

                  <div>
                    <h3 className="font-black text-biscay-darkest">
                      {t.businessDelivery}
                    </h3>
                    <p className="mt-1 text-sm text-neutral-dark">
                      {t.businessDeliveryDescription}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-2 rounded-2xl bg-biscay-darkest px-3 py-1 text-white">
                <p className="text-xs text-biscay-lighter">{t.orderStatus}</p>

                <div className="mt-1 flex items-center justify-between gap-2">
                  <span className="text-sm font-bold">{t.doorDelivery}</span>

                  <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs font-bold text-green-300">
                    {t.active}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-2 rounded-2xl bg-biscay-darkest px-3 py-1.5 text-white shadow-xl">
              <p className="text-xs text-biscay-lighter">{t.pfand}</p>
              <p className="mt-0.5 text-sm font-bold">{t.trackReturns}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
