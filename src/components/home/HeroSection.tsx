"use client";

import { useLanguage } from "@/context/LanguageContext";
import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";

function scrollToProducts(event: React.MouseEvent) {
  event.preventDefault();
  document.getElementById("produkte")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

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
        };

  return (
    // Relume header-98: full-bleed sharp-cornered dark panel, centered content, two pill CTAs
    <section className="px-4 pb-8 pt-8 lg:px-8 lg:pb-12 lg:pt-12">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-none bg-[#05090A]">
        <img
          src="/images/home/hero-lager.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-[#05090A]/75" />

        <div className="relative flex min-h-[26rem] flex-col items-center justify-center px-6 py-14 text-center sm:px-10 md:min-h-[32rem] md:py-20">
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
              onClick={scrollToProducts}
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
  );
}
