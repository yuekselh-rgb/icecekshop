"use client";

import { useLanguage } from "@/context/LanguageContext";

/*
 * Platzhalter-Kundenstimmen (wie im Relume-Template) — bitte vor dem
 * Go-Live durch echte Bewertungen eurer Kunden ersetzen.
 */
export default function TestimonialsSection() {
  const { language } = useLanguage();

  const t =
    language === "de"
      ? {
          title: "Kundenstimmen",
          subtitle: "Was die Leute sagen, die mit uns arbeiten.",
          reviews: [
            {
              quote:
                "Die Lieferung steht immer pünktlich vor der Tür. Bestellen ist in wenigen Minuten erledigt.",
              name: "M. Yıldız",
              role: "Privatkunde",
            },
            {
              quote:
                "Endlich ein Lieferant, der auch an Verpackung und Reinigungsmittel denkt. Eine Bestellung, alles erledigt.",
              name: "S. Aydın",
              role: "Imbissbetreiber",
            },
            {
              quote:
                "Das Online-Pfandkonto ist eine Wohltat. Ich sehe genau, was ich zurückbekomme.",
              name: "Familie Koç",
              role: "Privatkunden",
            },
          ],
        }
      : {
          title: "Müşteri Yorumları",
          subtitle: "Bizimle çalışan kişilerin görüşleri.",
          reviews: [
            {
              quote: "Teslimat her zaman zamanında kapıda. Sipariş vermek birkaç dakika sürüyor.",
              name: "M. Yıldız",
              role: "Bireysel Müşteri",
            },
            {
              quote: "Sonunda ambalaj ve temizlik malzemesini de düşünen bir tedarikçi. Tek siparişle her şey hazır.",
              name: "S. Aydın",
              role: "Büfe İşletmecisi",
            },
            {
              quote: "Online Pfand hesabı gerçekten rahatlatıcı. Ne kadar iade alacağımı tam olarak görüyorum.",
              name: "Koç Ailesi",
              role: "Bireysel Müşteri",
            },
          ],
        };

  return (
    // Relume testimonial-17: neutral-lightest section, 3-up card grid, 5 stars
    <section className="bg-[#F2F2F2] px-4 py-16 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto mb-12 max-w-lg text-center lg:mb-20">
          <h2 className="text-3xl font-medium sm:text-4xl lg:text-5xl">{t.title}</h2>
          <p className="mt-4 text-base text-[#05090A] sm:text-lg">{t.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {t.reviews.map((review) => (
            <div
              key={review.name}
              className="flex flex-col justify-between border border-[#05090a26] bg-white p-6 md:p-8"
            >
              <div className="mb-5 text-xl tracking-widest text-[#1B4965] md:mb-6">★★★★★</div>

              <p className="text-lg text-[#05090A]">"{review.quote}"</p>

              <div className="mt-6">
                <p className="font-semibold text-[#05090A]">{review.name}</p>
                <p className="text-sm text-[#505253]">{review.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
