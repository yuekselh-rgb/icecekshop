"use client";

import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { useLanguage } from "@/context/LanguageContext";
import { useEffect, useState } from "react";

type CompanySettings = {
  companyName?: string | null;
  street?: string | null;
  houseNumber?: string | null;
  postalCode?: string | null;
  city?: string | null;
  country?: string | null;
  email?: string | null;
  phone?: string | null;
};

export default function TermsClient({
  initialSettings,
}: {
  initialSettings?: CompanySettings;
} = {}) {
  const { language } = useLanguage();

  const [settings, setSettings] = useState<CompanySettings>(
    initialSettings || {},
  );

  useEffect(() => {
    if (initialSettings) {
      return;
    }

    fetch("/api/company-settings", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setSettings(d.settings || {}))
      .catch(() => {});
  }, [initialSettings]);

  const companyName = settings.companyName || "—";

  const addressLine = [
    [settings.street, settings.houseNumber].filter(Boolean).join(" "),
    [settings.postalCode, settings.city].filter(Boolean).join(" "),
    settings.country,
  ]
    .filter(Boolean)
    .join(", ");

  const t =
    language === "de"
      ? {
          eyebrow: "Rechtliches",
          title: "Allgemeine Geschäftsbedingungen",
          sections: [
            {
              heading: "1. Geltungsbereich",
              body: `Diese Allgemeinen Geschäftsbedingungen gelten für alle Bestellungen, die Sie über den Onlineshop von ${companyName}${
                addressLine ? ` (${addressLine})` : ""
              } aufgeben.`,
            },
            {
              heading: "2. Vertragspartner und Vertragsschluss",
              body: "Der Kaufvertrag kommt mit dem Betreiber dieses Onlineshops zustande. Mit dem Absenden Ihrer Bestellung geben Sie ein verbindliches Angebot zum Kauf der ausgewählten Artikel ab. Der Vertrag kommt zustande, sobald wir Ihre Bestellung bestätigen bzw. die Ware ausliefern.",
            },
            {
              heading: "3. Preise und Pfand",
              body: "Alle angegebenen Preise verstehen sich in Euro inklusive der gesetzlichen Umsatzsteuer. Auf pfandpflichtige Artikel wird das Pfand zusätzlich zum Warenpreis ausgewiesen und beim Bestellvorgang gesondert angezeigt.",
            },
            {
              heading: "4. Lieferung",
              body: "Die Lieferung erfolgt an die von Ihnen angegebene Adresse. Voraussichtliche Liefertermine werden im Bestellprozess bzw. nach Auftragsbestätigung mitgeteilt. Teillieferungen sind möglich, sofern dies zumutbar ist.",
            },
            {
              heading: "5. Zahlung",
              body: "Die verfügbaren Zahlungsarten werden Ihnen im Bestellprozess angezeigt. Bei Fragen zur Zahlungsabwicklung kontaktieren Sie uns bitte über die im Impressum angegebenen Kontaktdaten.",
            },
            {
              heading: "6. Pfandrückgabe",
              body: "Leergut (Kisten, Flaschen) kann bei der nächsten Lieferung an den zustellenden Fahrer zurückgegeben werden. Die Pfandgutschrift erfolgt nach Prüfung der zurückgegebenen Menge und wird mit einer künftigen Bestellung verrechnet oder erstattet.",
            },
            {
              heading: "7. Widerrufsrecht",
              body: "Für Verbraucher gelten die gesetzlichen Widerrufsregelungen, soweit diese nicht aufgrund der Beschaffenheit der Ware (z. B. schnell verderbliche Getränke oder versiegelte Ware, die aus Gründen des Gesundheitsschutzes nach Öffnung nicht rückgabefähig ist) ausgeschlossen sind. Einzelheiten erhalten Sie auf Anfrage über unsere Kontaktdaten.",
            },
            {
              heading: "8. Haftung",
              body: "Wir haften unbeschränkt bei Vorsatz und grober Fahrlässigkeit sowie nach Maßgabe des Produkthaftungsgesetzes. Bei leichter Fahrlässigkeit haften wir nur bei Verletzung wesentlicher Vertragspflichten, begrenzt auf den vorhersehbaren, vertragstypischen Schaden.",
            },
            {
              heading: "9. Schlussbestimmungen",
              body: "Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts. Sollte eine Bestimmung dieser Bedingungen unwirksam sein, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.",
            },
          ],
          notice:
            "Hinweis: Dies ist ein allgemeiner Mustertext und ersetzt keine individuelle Rechtsberatung. Bitte lassen Sie diese Geschäftsbedingungen vor der produktiven Nutzung von einem Rechtsanwalt prüfen und an Ihr konkretes Geschäftsmodell (Zahlungsarten, Liefergebiete, Widerrufsausschlüsse) anpassen.",
        }
      : {
          eyebrow: "Yasal",
          title: "Kullanım Şartları",
          sections: [
            {
              heading: "1. Uygulama Alanı",
              body: `Bu Genel Şartlar ve Koşullar, ${companyName}${
                addressLine ? ` (${addressLine})` : ""
              } online mağazası üzerinden verdiğiniz tüm siparişler için geçerlidir.`,
            },
            {
              heading: "2. Sözleşme Tarafları ve Sözleşmenin Kurulması",
              body: "Satış sözleşmesi bu online mağazanın işletmecisi ile kurulur. Siparişinizi gönderdiğinizde, seçtiğiniz ürünleri satın almak için bağlayıcı bir teklif sunmuş olursunuz. Sözleşme, siparişinizi onayladığımızda veya malları teslim ettiğimizde kurulmuş olur.",
            },
            {
              heading: "3. Fiyatlar ve Pfand (Depozito)",
              body: "Belirtilen tüm fiyatlar Euro cinsindendir ve yasal KDV'yi içerir. Depozitoya tabi ürünlerde depozito, ürün fiyatına ek olarak gösterilir ve sipariş sürecinde ayrıca belirtilir.",
            },
            {
              heading: "4. Teslimat",
              body: "Teslimat, belirttiğiniz adrese yapılır. Tahmini teslimat süreleri sipariş sürecinde veya sipariş onayından sonra bildirilir. Makul olduğu ölçüde kısmi teslimatlar mümkündür.",
            },
            {
              heading: "5. Ödeme",
              body: "Kullanılabilir ödeme yöntemleri sipariş sürecinde size gösterilir. Ödeme işlemleriyle ilgili sorularınız için lütfen künye (Impressum) sayfasında belirtilen iletişim bilgilerinden bize ulaşın.",
            },
            {
              heading: "6. Pfand (Depozito) İadesi",
              body: "Boş kasa ve şişeler, bir sonraki teslimatta teslimatı yapan şoföre iade edilebilir. Depozito iadesi, iade edilen miktarın kontrolünden sonra yapılır ve gelecekteki bir siparişe mahsup edilir veya iade edilir.",
            },
            {
              heading: "7. Cayma Hakkı",
              body: "Tüketiciler için, malın niteliği gereği (ör. çabuk bozulabilir içecekler veya sağlık koruması nedeniyle açıldıktan sonra iade edilemeyen mühürlü ürünler) hariç tutulmadığı sürece yasal cayma hakkı düzenlemeleri geçerlidir. Ayrıntılar için iletişim bilgilerimiz üzerinden bize ulaşabilirsiniz.",
            },
            {
              heading: "8. Sorumluluk",
              body: "Kasıt ve ağır ihmal durumlarında ve Ürün Sorumluluğu Kanunu hükümleri uyarınca sınırsız sorumluyuz. Hafif ihmal durumunda yalnızca esaslı sözleşme yükümlülüklerinin ihlali halinde ve öngörülebilir, sözleşmeye özgü zararla sınırlı olarak sorumluyuz.",
            },
            {
              heading: "9. Nihai Hükümler",
              body: "Bu sözleşmeye, BM Satış Hukuku hariç olmak üzere Almanya Federal Cumhuriyeti hukuku uygulanır. Bu şartlardan herhangi birinin geçersiz olması halinde, diğer hükümlerin geçerliliği etkilenmez.",
            },
          ],
          notice:
            "Not: Bu genel bir örnek metindir ve bireysel hukuki danışmanlığın yerini tutmaz. Lütfen bu kullanım şartlarını üretim ortamında kullanmadan önce bir avukata kontrol ettirin ve somut iş modelinize (ödeme yöntemleri, teslimat bölgeleri, cayma hakkı istisnaları) uyarlayın.",
        };

  return (
    <main className="min-h-screen bg-[#f7f7f5]">
      <Header initialSettings={initialSettings} />

      <section className="border-b border-slate-200 bg-white px-4 py-12 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <p className="font-bold text-orange-500">{t.eyebrow}</p>

          <h1 className="mt-2 text-4xl font-black text-slate-950 sm:text-5xl">
            {t.title}
          </h1>
        </div>
      </section>

      <section className="px-4 py-12 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-8 rounded-[32px] bg-white p-7 sm:p-10">
          {t.sections.map((section) => (
            <div key={section.heading}>
              <h2 className="text-lg font-black text-slate-950">
                {section.heading}
              </h2>

              <p className="mt-3 leading-6 text-slate-600">{section.body}</p>
            </div>
          ))}

          <p className="border-t border-slate-100 pt-6 text-xs leading-5 text-slate-400">
            {t.notice}
          </p>
        </div>
      </section>

      <Footer initialSettings={initialSettings} />
    </main>
  );
}
