"use client";

import { useLanguage } from "@/context/LanguageContext";
import { Truck, PackageCheck, RotateCcw } from "lucide-react";
import Link from "next/link";

function scrollToProducts(event: React.MouseEvent) {
  event.preventDefault();
  document.getElementById("produkte")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function BenefitsSection() {
  const { language } = useLanguage();

  const t =
    language === "de"
      ? {
          eyebrow: "Vorteile",
          title: "Alles aus einer Hand",
          description:
            "Ein Partner für den ganzen Bedarf, von Getränken bis zum Reinigungsmittel.",
          bigTitle: "Das ganze Sortiment auf einen Blick",
          bigText:
            "Softdrinks, Bier, Wein und mehr für Zuhause und den Betrieb.",
          more: "Mehr",
          secureTitle: "Sichere Bestellung",
          secureText:
            "Ihre Bestell- und Kundendaten werden sicher verarbeitet.",
          pfandTitle: "Pfandrückgabe",
          pfandText:
            "Verfolgen Sie Ihre Kisten- und Flaschenrückgaben bequem in Ihrem Konto.",
        }
      : {
          eyebrow: "Avantajlar",
          title: "Tek elden her şey",
          description:
            "İçecekten temizlik malzemesine kadar tüm ihtiyaçlarınız için bir tek adres.",
          bigTitle: "Tüm ürün çeşitlerini bir arada bulun",
          bigText: "Ev ve iş yeriniz için içecek, bira, şarap ve daha fazlası.",
          more: "İncele",
          secureTitle: "Güvenli Sipariş",
          secureText: "Sipariş bilgileriniz güvenli şekilde saklanır.",
          pfandTitle: "Pfand İade Takibi",
          pfandText: "Kasa ve şişe iadelerinizi hesabınızdan takip edin.",
        };

  return (
    // Relume layout-369: light section, eyebrow+heading, 1 big card + 2 regular cards
    <section className="bg-[#E8ECEF] px-4 py-16 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto mb-12 max-w-lg text-center lg:mb-20">
          <p className="mb-3 font-semibold text-[#05090A]">{t.eyebrow}</p>
          <h2 className="text-3xl font-medium sm:text-4xl lg:text-5xl">{t.title}</h2>
          <p className="mt-4 text-base text-[#05090A] sm:text-lg">{t.description}</p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col justify-center border border-[#05090a26] bg-[#D1DAE0] p-6 sm:col-span-2 lg:col-span-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0AA0FA]">
              <Truck size={22} className="text-[#05090A]" />
            </div>
            <h3 className="mt-5 text-xl font-medium text-[#05090A]">{t.bigTitle}</h3>
            <p className="mt-2 text-[#05090A]">{t.bigText}</p>
            <Link href="/products" onClick={scrollToProducts} className="mt-4 w-fit font-medium text-[#05090A] underline">
              {t.more} ›
            </Link>
          </div>

          <div className="flex flex-col justify-center border border-[#05090a26] bg-[#D1DAE0] p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0AA0FA]">
              <PackageCheck size={22} className="text-[#05090A]" />
            </div>
            <h3 className="mt-5 text-xl font-medium text-[#05090A]">{t.secureTitle}</h3>
            <p className="mt-2 text-[#05090A]">{t.secureText}</p>
          </div>

          <div className="flex flex-col justify-center border border-[#05090a26] bg-[#D1DAE0] p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0AA0FA]">
              <RotateCcw size={22} className="text-[#05090A]" />
            </div>
            <h3 className="mt-5 text-xl font-medium text-[#05090A]">{t.pfandTitle}</h3>
            <p className="mt-2 text-[#05090A]">{t.pfandText}</p>
            <Link href="/pfand" className="mt-4 w-fit font-medium text-[#05090A] underline">
              {t.more} ›
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
