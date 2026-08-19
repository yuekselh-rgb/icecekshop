"use client";

import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { useLanguage } from "@/context/LanguageContext";
import { useEffect, useState } from "react";

type CompanySettings = {
  companyName?: string | null;
  legalForm?: string | null;
  managingDirector?: string | null;
  street?: string | null;
  houseNumber?: string | null;
  postalCode?: string | null;
  city?: string | null;
  country?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  taxNumber?: string | null;
  vatId?: string | null;
  commercialRegister?: string | null;
  registerCourt?: string | null;
};

export default function ImpressumClient({
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

  const t =
    language === "de"
      ? {
          eyebrow: "Rechtliches",
          title: "Impressum",
          section1: "Angaben gemäß § 5 TMG",
          managingDirector: "Geschäftsführer",
          legalForm: "Rechtsform",
          contact: "Kontakt",
          phone: "Telefon",
          email: "E-Mail",
          website: "Website",
          register: "Registereintrag",
          commercialRegister: "Handelsregister",
          registerCourt: "Registergericht",
          taxInfo: "Umsatzsteuer- / Steuerangaben",
          taxNumber: "Steuernummer",
          vatId: "Umsatzsteuer-Identifikationsnummer gemäß § 27 a UStG",
          disputeTitle: "Verbraucherstreitbeilegung",
          disputeText:
            "Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen. Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit, die Sie unter",
          disputeTextEnd: "finden.",
          notice:
            "Hinweis: Diese Angaben werden automatisch aus den hinterlegten Firmeneinstellungen übernommen. Bitte lassen Sie den Inhalt dieser Seite von einem Rechtsanwalt prüfen.",
        }
      : {
          eyebrow: "Yasal",
          title: "Künye (Impressum)",
          section1: "§ 5 TMG (Alman Telemedya Kanunu) uyarınca bilgiler",
          managingDirector: "Şirket Müdürü",
          legalForm: "Firma Türü",
          contact: "İletişim",
          phone: "Telefon",
          email: "E-posta",
          website: "Web sitesi",
          register: "Ticaret Sicili Kaydı",
          commercialRegister: "Ticaret Sicili",
          registerCourt: "Ticaret Mahkemesi",
          taxInfo: "Vergi Bilgileri",
          taxNumber: "Vergi Numarası",
          vatId: "§ 27a UStG uyarınca KDV Kimlik Numarası",
          disputeTitle: "Tüketici Uyuşmazlık Çözümü",
          disputeText:
            "Bir tüketici hakem heyeti önündeki uyuşmazlık çözüm prosedürlerine katılmaya istekli veya yükümlü değiliz. Avrupa Komisyonu, çevrimiçi uyuşmazlık çözümü (OS) için bir platform sunmaktadır, buna şuradan ulaşabilirsiniz:",
          disputeTextEnd: "adresinden ulaşabilirsiniz.",
          notice:
            "Not: Bu bilgiler otomatik olarak sistemde kayıtlı firma ayarlarından alınmaktadır. Lütfen bu sayfanın içeriğini bir avukata kontrol ettirin.",
        };

  const addressLine = [settings.street, settings.houseNumber]
    .filter(Boolean)
    .join(" ");

  const cityLine = [settings.postalCode, settings.city]
    .filter(Boolean)
    .join(" ");

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
          <div>
            <h2 className="text-lg font-black text-slate-950">
              {t.section1}
            </h2>

            <div className="mt-3 space-y-1 text-slate-600">
              <p className="font-bold text-slate-900">
                {settings.companyName || "—"}
              </p>

              {settings.legalForm ? (
                <p>
                  {t.legalForm}: {settings.legalForm}
                </p>
              ) : null}

              {addressLine ? <p>{addressLine}</p> : null}
              {cityLine ? <p>{cityLine}</p> : null}
              {settings.country ? <p>{settings.country}</p> : null}

              {settings.managingDirector ? (
                <p className="pt-2">
                  {t.managingDirector}: {settings.managingDirector}
                </p>
              ) : null}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-black text-slate-950">
              {t.contact}
            </h2>

            <div className="mt-3 space-y-1 text-slate-600">
              {settings.phone ? (
                <p>
                  {t.phone}: {settings.phone}
                </p>
              ) : null}

              {settings.email ? (
                <p>
                  {t.email}: {settings.email}
                </p>
              ) : null}

              {settings.website ? (
                <p>
                  {t.website}: {settings.website}
                </p>
              ) : null}
            </div>
          </div>

          {settings.commercialRegister || settings.registerCourt ? (
            <div>
              <h2 className="text-lg font-black text-slate-950">
                {t.register}
              </h2>

              <div className="mt-3 space-y-1 text-slate-600">
                {settings.commercialRegister ? (
                  <p>
                    {t.commercialRegister}: {settings.commercialRegister}
                  </p>
                ) : null}

                {settings.registerCourt ? (
                  <p>
                    {t.registerCourt}: {settings.registerCourt}
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}

          {settings.taxNumber || settings.vatId ? (
            <div>
              <h2 className="text-lg font-black text-slate-950">
                {t.taxInfo}
              </h2>

              <div className="mt-3 space-y-1 text-slate-600">
                {settings.taxNumber ? (
                  <p>
                    {t.taxNumber}: {settings.taxNumber}
                  </p>
                ) : null}

                {settings.vatId ? (
                  <p>
                    {t.vatId}: {settings.vatId}
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}

          <div>
            <h2 className="text-lg font-black text-slate-950">
              {t.disputeTitle}
            </h2>

            <p className="mt-3 leading-6 text-slate-600">
              {t.disputeText}{" "}
              <a
                href="https://ec.europa.eu/consumers/odr/"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-orange-500 hover:underline"
              >
                ec.europa.eu/consumers/odr
              </a>{" "}
              {t.disputeTextEnd}
            </p>
          </div>

          <p className="border-t border-slate-100 pt-6 text-xs leading-5 text-slate-400">
            {t.notice}
          </p>
        </div>
      </section>

      <Footer initialSettings={initialSettings} />
    </main>
  );
}
