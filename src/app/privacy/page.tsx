"use client";

import { openCookieSettings } from "@/components/CookieConsentBanner";
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
  metaPixelId?: string | null;
  tiktokPixelId?: string | null;
};

export default function PrivacyPolicyPage() {
  const { language } = useLanguage();

  const [settings, setSettings] = useState<CompanySettings>({});

  useEffect(() => {
    fetch("/api/company-settings", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setSettings(d.settings || {}))
      .catch(() => {});
  }, []);

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
          title: "Datenschutzerklärung",
          intro:
            "Der Schutz Ihrer persönlichen Daten ist uns wichtig. Nachfolgend informieren wir Sie darüber, welche Daten wir bei der Nutzung unseres Onlineshops erheben und wie wir diese verarbeiten.",
          sections: [
            {
              heading: "1. Verantwortlicher",
              body: `Verantwortlicher im Sinne der Datenschutz-Grundverordnung (DSGVO) ist ${companyName}${
                addressLine ? `, ${addressLine}` : ""
              }${settings.email ? `. E-Mail: ${settings.email}` : ""}${
                settings.phone ? `, Telefon: ${settings.phone}` : ""
              }.`,
            },
            {
              heading: "2. Erhebung und Verarbeitung von Daten",
              body: "Wir erheben personenbezogene Daten (z. B. Name, Anschrift, E-Mail-Adresse, Telefonnummer, Bestelldaten), wenn Sie ein Kundenkonto anlegen, eine Bestellung aufgeben oder uns kontaktieren. Diese Daten werden ausschließlich zur Vertragsabwicklung, Kundenbetreuung und – soweit gesetzlich vorgeschrieben – zur Erfüllung steuerlicher Aufbewahrungspflichten verarbeitet.",
            },
            {
              heading: "3. Rechtsgrundlage",
              body: "Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung), Art. 6 Abs. 1 lit. c DSGVO (gesetzliche Verpflichtung, z. B. Aufbewahrungsfristen) sowie ggf. Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an einem funktionierenden Bestellsystem).",
            },
            {
              heading: "4. Lokale Speicherung im Browser",
              body: "Für die Funktion des Warenkorbs und Ihrer Spracheinstellung nutzen wir den lokalen Speicher (Local Storage) Ihres Browsers. Diese Daten verbleiben auf Ihrem Gerät und werden nicht an uns übertragen, bis Sie eine Bestellung abschließen.",
            },
            {
              heading: "5. Cookies",
              body: `Beim Besuch unseres Onlineshops verwenden wir Cookies. Notwendige Cookies sind für den Betrieb der Website erforderlich (z. B. Warenkorb, Anmeldung, Spracheinstellung) und können nicht deaktiviert werden. Analyse-Cookies helfen uns zu verstehen, wie die Website genutzt wird. Marketing-Cookies setzen wir ein, um Ihnen relevantere Angebote zu zeigen${
                settings.metaPixelId || settings.tiktokPixelId
                  ? ` — konkret binden wir ${[
                      settings.metaPixelId
                        ? "das Meta-Pixel (Facebook/Instagram)"
                        : null,
                      settings.tiktokPixelId ? "das TikTok-Pixel" : null,
                    ]
                      .filter(Boolean)
                      .join(" und ")} ein, das den Besuch unserer Seite an den jeweiligen Anbieter übermittelt${
                      settings.metaPixelId
                        ? ". Über den automatischen erweiterten Abgleich von Meta können zusätzlich Ort, Postleitzahl und Land (vor der Übertragung gehasht) an Meta übermittelt werden, um Werbeanzeigen besser zuzuordnen"
                        : ""
                    }`
                  : ""
              }. Beide Kategorien setzen wir nur mit Ihrer Einwilligung ein, die Sie beim ersten Besuch über unseren Cookie-Banner erteilen oder ablehnen.${
                settings.metaPixelId || settings.tiktokPixelId
                  ? ""
                  : " Aktuell sind keine Analyse- oder Marketing-Cookies aktiv im Einsatz."
              } Ihre Auswahl können Sie jederzeit ändern.`,
              cookieSettingsButton: true,
            },
            {
              heading: "6. Weitergabe an Dritte",
              body: "Eine Weitergabe Ihrer Daten erfolgt nur, soweit dies zur Auftragsabwicklung notwendig ist (z. B. an mit der Zustellung beauftragte Fahrer) oder wir gesetzlich dazu verpflichtet sind. Ihre Daten werden nicht zu Werbezwecken an Dritte verkauft.",
            },
            {
              heading: "7. Speicherdauer",
              body: "Wir speichern personenbezogene Daten nur so lange, wie es für die genannten Zwecke erforderlich ist bzw. gesetzliche Aufbewahrungsfristen (z. B. handels- und steuerrechtliche Vorgaben) dies verlangen.",
            },
            {
              heading: "8. Ihre Rechte",
              body: "Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit sowie Widerspruch gegen die Verarbeitung Ihrer personenbezogenen Daten. Wenden Sie sich hierzu an die oben genannte Kontaktadresse. Ihnen steht zudem ein Beschwerderecht bei der zuständigen Datenschutzaufsichtsbehörde zu.",
            },
          ],
          cookieSettingsButtonLabel: "Cookie-Einstellungen ändern",
          notice:
            "Hinweis: Dies ist ein allgemeiner Text und ersetzt keine individuelle Rechtsberatung. Bitte lassen Sie diese Datenschutzerklärung von einem Rechtsanwalt oder Datenschutzbeauftragten auf Vollständigkeit prüfen (u. a. hinsichtlich eingesetzter Zahlungsdienstleister, Analyse- oder Marketing-Tools).",
        }
      : {
          eyebrow: "Yasal",
          title: "Gizlilik Politikası",
          intro:
            "Kişisel verilerinizin korunması bizim için önemlidir. Aşağıda, online mağazamızı kullanırken hangi verileri topladığımızı ve bunları nasıl işlediğimizi açıklıyoruz.",
          sections: [
            {
              heading: "1. Veri Sorumlusu",
              body: `Avrupa Genel Veri Koruma Tüzüğü (GDPR/DSGVO) anlamında veri sorumlusu ${companyName}${
                addressLine ? `, ${addressLine}` : ""
              }${settings.email ? `. E-posta: ${settings.email}` : ""}${
                settings.phone ? `, Telefon: ${settings.phone}` : ""
              }'dir.`,
            },
            {
              heading: "2. Veri Toplama ve İşleme",
              body: "Bir müşteri hesabı oluşturduğunuzda, sipariş verdiğinizde veya bizimle iletişime geçtiğinizde kişisel verilerinizi (ör. ad, adres, e-posta adresi, telefon numarası, sipariş bilgileri) topluyoruz. Bu veriler yalnızca sözleşmenin yerine getirilmesi, müşteri hizmetleri ve yasal olarak öngörülen saklama yükümlülüklerinin yerine getirilmesi amacıyla işlenir.",
            },
            {
              heading: "3. Hukuki Dayanak",
              body: "İşleme, GDPR Madde 6(1)(b) (sözleşmenin ifası), Madde 6(1)(c) (yasal yükümlülük, örn. saklama süreleri) ve gerektiğinde Madde 6(1)(f) (işleyen bir sipariş sistemine yönelik meşru menfaat) hükümlerine dayanmaktadır.",
            },
            {
              heading: "4. Tarayıcıda Yerel Depolama",
              body: "Sepet işlevi ve dil tercihiniz için tarayıcınızın yerel depolama alanını (Local Storage) kullanıyoruz. Bu veriler cihazınızda kalır ve siz bir sipariş tamamlayana kadar bize aktarılmaz.",
            },
            {
              heading: "5. Çerezler",
              body: `Online mağazamızı ziyaret ettiğinizde çerezler kullanıyoruz. Zorunlu çerezler web sitesinin çalışması için gereklidir (ör. sepet, giriş, dil tercihi) ve devre dışı bırakılamaz. Analiz çerezleri web sitesinin nasıl kullanıldığını anlamamıza yardımcı olur. Pazarlama çerezlerini size daha uygun teklifler göstermek için kullanıyoruz${
                settings.metaPixelId || settings.tiktokPixelId
                  ? ` — somut olarak ${[
                      settings.metaPixelId
                        ? "Meta Pixel'ini (Facebook/Instagram)"
                        : null,
                      settings.tiktokPixelId ? "TikTok Pixel'ini" : null,
                    ]
                      .filter(Boolean)
                      .join(" ve ")} kullanıyoruz${
                      settings.metaPixelId
                        ? ". Meta'nın otomatik gelişmiş eşleştirmesi ile, reklamları daha iyi eşleştirmek amacıyla şehir, posta kodu ve ülke bilgileri de (aktarılmadan önce hashlenerek) Meta'ya iletilebilir"
                        : ""
                    }`
                  : ""
              }. Her iki kategoriyi de yalnızca ilk ziyaretinizde çerez banner'ımız üzerinden verdiğiniz veya reddettiğiniz izinle kullanırız.${
                settings.metaPixelId || settings.tiktokPixelId
                  ? ""
                  : " Şu anda aktif olarak kullanılan analiz veya pazarlama çerezi bulunmamaktadır."
              } Seçiminizi istediğiniz zaman değiştirebilirsiniz.`,
              cookieSettingsButton: true,
            },
            {
              heading: "6. Üçüncü Taraflarla Paylaşım",
              body: "Verileriniz yalnızca siparişin işlenmesi için gerekli olduğunda (ör. teslimatla görevli şoförlerle) veya yasal olarak zorunlu olduğumuzda paylaşılır. Verileriniz reklam amacıyla üçüncü taraflara satılmaz.",
            },
            {
              heading: "7. Saklama Süresi",
              body: "Kişisel verileri yalnızca belirtilen amaçlar için gerekli olduğu sürece veya yasal saklama süreleri (ör. ticari ve vergisel gereklilikler) gerektirdiği sürece saklıyoruz.",
            },
            {
              heading: "8. Haklarınız",
              body: "Kişisel verilerinizle ilgili bilgi alma, düzeltme, silme, işlemeyi kısıtlama, veri taşınabilirliği ve işlemeye itiraz etme hakkına sahipsiniz. Bu haklarınızı kullanmak için yukarıdaki iletişim adresine başvurabilirsiniz. Ayrıca yetkili veri koruma denetim makamına şikayette bulunma hakkınız da bulunmaktadır.",
            },
          ],
          cookieSettingsButtonLabel: "Çerez Ayarlarını Değiştir",
          notice:
            "Not: Bu genel bir metindir ve bireysel hukuki danışmanlığın yerini tutmaz. Lütfen bu gizlilik politikasının eksiksizliğini (kullanılan ödeme hizmet sağlayıcıları, analiz veya pazarlama araçları dahil) bir avukat veya veri koruma görevlisine kontrol ettirin.",
        };

  return (
    <main className="min-h-screen bg-[#f7f7f5]">
      <Header />

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
          <p className="leading-6 text-slate-600">{t.intro}</p>

          {t.sections.map((section) => (
            <div key={section.heading}>
              <h2 className="text-lg font-black text-slate-950">
                {section.heading}
              </h2>

              <p className="mt-3 leading-6 text-slate-600">{section.body}</p>

              {"cookieSettingsButton" in section &&
              section.cookieSettingsButton ? (
                <button
                  type="button"
                  onClick={openCookieSettings}
                  className="mt-4 rounded-full border border-slate-300 px-4 py-2 text-sm font-bold text-slate-950 transition hover:border-slate-950"
                >
                  {t.cookieSettingsButtonLabel}
                </button>
              ) : null}
            </div>
          ))}

          <p className="border-t border-slate-100 pt-6 text-xs leading-5 text-slate-400">
            {t.notice}
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}
