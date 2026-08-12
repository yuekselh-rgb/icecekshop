"use client";

import { useLanguage } from "@/context/LanguageContext";

const GOOGLE_REVIEWS_URL = "https://maps.app.goo.gl/SF989gBzK53neWSa7";

/*
 * Echte 5-Sterne-Google-Rezensionen (vom Kunden per Screenshot bestätigt).
 * Rezensionstext bleibt Originalwortlaut, nur ins Türkische übersetzt.
 */
export default function TestimonialsSection() {
  const { language } = useLanguage();

  const t =
    language === "de"
      ? {
          title: "Kundenstimmen",
          subtitle: "5-Sterne-Bewertungen von echten Kunden auf Google.",
          viewAll: "Alle Bewertungen auf Google ansehen",
          reviews: [
            {
              quote:
                "Problemlose Lieferung und großes Sortiment an Getränken alles gut geordnet!",
              name: "Mahmut Kaplan",
              meta: "Google-Rezension · vor 3 Jahren",
            },
            {
              quote:
                "Große Auswahl an Getränken und die Mitarbeiterinnen sind sehr freundlich.",
              name: "Tarkan",
              meta: "Google-Rezension · vor 1 Jahr",
            },
            {
              quote:
                "Sehr freundliches Personal und eine sehr große Auswahl an leckeren Getränken zum besten Preis. Top! Auf Wunsch wird auch geliefert. Höchst zufrieden!",
              name: "Yassine Bouraguba",
              meta: "Google-Rezension · vor 3 Jahren",
            },
          ],
        }
      : {
          title: "Müşteri Yorumları",
          subtitle: "Google'daki gerçek müşterilerimizden 5 yıldızlı yorumlar.",
          viewAll: "Google'daki tüm yorumları görüntüle",
          reviews: [
            {
              quote:
                "Sorunsuz teslimat ve geniş içecek çeşidi, her şey düzenli!",
              name: "Mahmut Kaplan",
              meta: "Google Yorumu · 3 yıl önce",
            },
            {
              quote:
                "Geniş içecek seçeneği ve çalışanlar çok güler yüzlü.",
              name: "Tarkan",
              meta: "Google Yorumu · 1 yıl önce",
            },
            {
              quote:
                "Çok güler yüzlü personel ve en uygun fiyata çok geniş, lezzetli içecek seçeneği. Harika! İsteğe bağlı teslimat da yapılıyor. Son derece memnunum!",
              name: "Yassine Bouraguba",
              meta: "Google Yorumu · 3 yıl önce",
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
                <p className="text-sm text-[#505253]">{review.meta}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <a
            href={GOOGLE_REVIEWS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-[#05090A] underline"
          >
            {t.viewAll} ›
          </a>
        </div>
      </div>
    </section>
  );
}
