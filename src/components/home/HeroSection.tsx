"use client";

import { useLanguage } from "@/context/LanguageContext";
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

      <div className="mx-auto grid max-w-7xl overflow-hidden rounded-[24px] bg-slate-950 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col justify-center px-6 py-8 sm:px-8 lg:px-10 lg:py-10">
          <span className="mb-5 w-fit rounded-full bg-sky-500/15 px-4 py-2 text-sm font-bold text-sky-400">
            {t.badge}
          </span>

          <h1 className="max-w-2xl text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">
            {t.title}
          </h1>

          <p className="mt-6 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
            {t.description}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/urunler"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-500 px-6 py-3.5 font-bold text-white transition hover:bg-sky-600"
            >
              {t.shop}
              <ArrowRight size={19} />
            </Link>

            <Link
              href="/giris"
              className="inline-flex items-center justify-center rounded-xl border border-slate-700 px-6 py-3.5 font-bold text-white transition hover:border-white"
            >
              {t.login}
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap gap-5 text-sm text-slate-300">
            <span className="flex items-center gap-2">
              <Check size={17} className="text-sky-400" />
              {t.fastDelivery}
            </span>

            <span className="flex items-center gap-2">
              <Check size={17} className="text-sky-400" />
              {t.secureOrder}
            </span>

            <span className="flex items-center gap-2">
              <Check size={17} className="text-sky-400" />
              {t.pfandTracking}
            </span>
          </div>
        </div>

        <div className="relative flex min-h-[250px] items-center justify-center overflow-hidden bg-sky-500 p-3 sm:p-4">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10" />
          <div className="absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-slate-950/10" />

          <div className="relative w-full max-w-sm">
            <div className="rounded-3xl bg-white p-4 shadow-2xl">
              <p className="text-sm font-bold text-sky-500">
                {t.deliveryOptions}
              </p>

              <h2 className="mt-2 text-2xl font-black text-slate-950">
                {t.chooseDelivery}
              </h2>

              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-4 rounded-2xl border border-slate-200 p-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-500">
                    <Home size={24} />
                  </div>

                  <div>
                    <h3 className="font-black text-slate-950">
                      {t.homeDelivery}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {t.homeDeliveryDescription}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 rounded-2xl border border-slate-200 p-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-950">
                    <Store size={24} />
                  </div>

                  <div>
                    <h3 className="font-black text-slate-950">
                      {t.businessDelivery}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {t.businessDeliveryDescription}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-2 rounded-2xl bg-slate-950 px-3 py-1 text-white">
                <p className="text-xs text-slate-400">
                  {t.orderStatus}
                </p>

                <div className="mt-1 flex items-center justify-between gap-2">
                  <span className="text-sm font-bold">
                    {t.doorDelivery}
                  </span>

                  <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs font-bold text-green-300">
                    {t.active}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-2 rounded-2xl bg-slate-950 px-3 py-1.5 text-white shadow-xl">
              <p className="text-xs text-slate-400">
                {t.pfand}
              </p>
              <p className="mt-0.5 text-sm font-bold">
                {t.trackReturns}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
