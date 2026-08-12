"use client";

import { useLanguage } from "@/context/LanguageContext";
import {
  Clock3,
  Headphones,
  PackageCheck,
  RotateCcw,
  Truck,
} from "lucide-react";

export default function BenefitsSection() {
  const { language } = useLanguage();

  const benefits =
    language === "de"
      ? [
          {
            title: "Schnelle Lieferung",
            description:
              "Wir liefern Ihre Bestellung schnell nach Hause oder in Ihren Betrieb.",
            icon: Truck,
          },
          {
            title: "Sichere Bestellung",
            description:
              "Ihre Bestell- und Kundendaten werden sicher verarbeitet.",
            icon: PackageCheck,
          },
          {
            title: "Pfandrückgabe",
            description:
              "Verfolgen Sie Ihre Kisten- und Flaschenrückgaben bequem in Ihrem Konto.",
            icon: RotateCcw,
          },
          {
            title: "Einfach bestellen",
            description:
              "Produkte auswählen und die Bestellung in wenigen Schritten abschließen.",
            icon: Clock3,
          },
          {
            title: "Kundenservice",
            description: "Wir unterstützen Sie vor und nach Ihrer Bestellung.",
            icon: Headphones,
          },
        ]
      : [
          {
            title: "Hızlı Teslimat",
            description:
              "Siparişlerinizi evinize veya iş yerinize hızlıca ulaştırıyoruz.",
            icon: Truck,
          },
          {
            title: "Güvenli Sipariş",
            description:
              "Sipariş bilgileriniz güvenli şekilde saklanır ve işlenir.",
            icon: PackageCheck,
          },
          {
            title: "Pfand İade Takibi",
            description:
              "Kasa ve şişe iadelerinizi hesabınızdan kolayca takip edin.",
            icon: RotateCcw,
          },
          {
            title: "Kolay Sipariş",
            description:
              "Ürünlerinizi seçin ve birkaç adımda siparişinizi tamamlayın.",
            icon: Clock3,
          },
          {
            title: "Müşteri Desteği",
            description:
              "Sipariş öncesinde ve sonrasında size destek oluyoruz.",
            icon: Headphones,
          },
        ];

  return (
    <section className="px-4 py-16 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-none border border-[#05090a26] bg-[#E8ECEF] px-6 py-10 sm:px-10 lg:px-12">
          <div className="mb-10">
            <p className="font-bold text-[#1B4965]">
              {language === "de"
                ? "Warum uns?"
                : "Neden bizi tercih etmelisiniz?"}
            </p>

            <h2 className="mt-2 max-w-2xl text-3xl font-medium tracking-tight text-[#05090A] sm:text-4xl">
              {language === "de"
                ? "Einfach einkaufen – von der Bestellung bis zur Lieferung"
                : "Siparişten teslimata kadar kolay alışveriş deneyimi"}
            </h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;

              return (
                <div
                  key={benefit.title}
                  className="rounded-none border border-[#05090a26] bg-white p-5"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1B4965] text-white">
                    <Icon size={23} />
                  </div>

                  <h3 className="mt-5 text-lg font-medium text-[#05090A]">
                    {benefit.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-[#505253]">
                    {benefit.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
