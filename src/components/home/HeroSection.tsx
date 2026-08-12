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
    <>
      {/* Hero — matches Relume header-98: full-bleed sharp-cornered dark
          panel, centered badge/title/description, two pill CTAs */}
      <section className="px-4 pb-0 pt-8 lg:px-8 lg:pt-12">
        <div className="mx-auto max-w-7xl rounded-none bg-[#05090A]">
          <div className="flex min-h-[26rem] flex-col items-center justify-center px-6 py-14 text-center sm:px-10 md:min-h-[30rem] md:py-20">
            <span className="mb-5 w-fit rounded-full bg-[#5F7F93]/20 px-4 py-2 text-sm font-bold text-[#91CBDA] md:mb-6">
              {t.badge}
            </span>

            <h1 className="max-w-2xl text-4xl font-medium leading-tight text-white sm:text-5xl lg:text-6xl">
              {t.title}
            </h1>

            <p className="mt-6 max-w-xl text-base leading-7 text-[#B4B5B5] sm:text-lg">
              {t.description}
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/products"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 font-bold text-[#05090A] transition hover:bg-[#D9DADA]"
              >
                {t.shop}
                <ArrowRight size={19} />
              </Link>

              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/5 px-6 py-3.5 font-bold text-white backdrop-blur transition hover:bg-white/15"
              >
                {t.login}
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-5 text-sm text-[#B4B5B5]">
              <span className="flex items-center gap-2">
                <Check size={17} className="text-[#91CBDA]" />
                {t.fastDelivery}
              </span>

              <span className="flex items-center gap-2">
                <Check size={17} className="text-[#91CBDA]" />
                {t.secureOrder}
              </span>

              <span className="flex items-center gap-2">
                <Check size={17} className="text-[#91CBDA]" />
                {t.pfandTracking}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Delivery options — matches Relume layout-503/492 card rhythm:
          centered eyebrow+heading, then a sharp-cornered split card */}
      <section className="px-4 py-16 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-12 max-w-lg text-center lg:mb-16">
            <p className="font-semibold text-[#05090A]">{t.deliveryOptions}</p>
            <h2 className="mt-3 text-3xl font-medium text-[#05090A] sm:text-4xl">
              {t.chooseDelivery}
            </h2>
          </div>

          <div className="grid overflow-hidden rounded-none border border-[#05090a26] bg-[#F2F2F2] md:grid-cols-2">
            <div className="flex items-start gap-4 border-b border-[#05090a26] p-8 md:border-b-0 md:border-r">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-none bg-[#E8ECEF] text-[#1B4965]">
                <Home size={24} />
              </div>

              <div>
                <h3 className="font-medium text-[#05090A]">{t.homeDelivery}</h3>
                <p className="mt-1 text-sm text-[#505253]">
                  {t.homeDeliveryDescription}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-8">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-none bg-white text-[#05090A]">
                <Store size={24} />
              </div>

              <div>
                <h3 className="font-medium text-[#05090A]">{t.businessDelivery}</h3>
                <p className="mt-1 text-sm text-[#505253]">
                  {t.businessDeliveryDescription}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-none bg-[#05090A] px-5 py-4 text-white">
              <p className="text-xs text-[#828484]">{t.orderStatus}</p>

              <div className="mt-1 flex items-center justify-between gap-2">
                <span className="text-sm font-bold">{t.doorDelivery}</span>

                <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs font-bold text-green-300">
                  {t.active}
                </span>
              </div>
            </div>

            <div className="rounded-none bg-[#05090A] px-5 py-4 text-white">
              <p className="text-xs text-[#828484]">{t.pfand}</p>
              <p className="mt-1 text-sm font-bold">{t.trackReturns}</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
