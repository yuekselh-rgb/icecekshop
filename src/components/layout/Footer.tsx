"use client";

import { useLanguage } from "@/context/LanguageContext";
import { Globe, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Footer({
  initialSettings,
}: {
  initialSettings?: any;
} = {}) {

const { language } = useLanguage();

const [settings,setSettings]=useState<any>(initialSettings || {});

useEffect(()=>{
  /*
   * initialSettings zaten sunucudan geldiyse (ör. anasayfada)
   * mount anında aynı veriyi tekrar istemeye gerek yok.
   */
  if (initialSettings) {
    return;
  }

fetch("/api/company-settings")
.then(r=>r.json())
.then(d=>setSettings(d.settings||{}))
.catch(()=>{});
},[initialSettings]);


  const t =
    language === "de"
      ? {
          description:
            "Ihre moderne Plattform für die einfache Bestellung von Getränken, Verpackungen und Reinigungsprodukten.",
          contact: "Kontakt",
          country: "Deutschland",
          rights: "Alle Rechte vorbehalten.",
          privacy: "Datenschutz",
          terms: "Nutzungsbedingungen",
          imprint: "Impressum",
          companyInfo: "Firmendaten",
          companyType: "Rechtsform",
          managingDirector: "Geschäftsführer",
          commercialRegister: "Handelsregister",
          registerCourt: "Registergericht",
          taxNumber: "Steuernummer",
          vatId: "USt-IdNr.",
          bank: "Bank",
          accountHolder: "Kontoinhaber",
          iban: "IBAN",
          bic: "BIC",
        }
      : {
          description:
            "İçecek, ambalaj ve temizlik ürünlerini kolayca sipariş edebileceğiniz modern alışveriş platformu.",
          contact: "İletişim",
          country: "Almanya",
          rights: "Tüm hakları saklıdır.",
          privacy: "Gizlilik",
          terms: "Kullanım Şartları",
          imprint: "Künye",
          companyInfo: "Firma Bilgileri",
          companyType: "Firma Türü",
          managingDirector: "Şirket Müdürü",
          commercialRegister: "Ticaret Sicili",
          registerCourt: "Ticaret Mahkemesi",
          taxNumber: "Vergi Numarası",
          vatId: "KDV Numarası",
          bank: "Banka",
          accountHolder: "Hesap Sahibi",
          iban: "IBAN",
          bic: "BIC",
        };

  return (
    <footer className="bg-[#E8ECEF] px-4 py-12 text-[#05090A] lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-12 border-t border-[#05090a26] pt-12 lg:grid-cols-[2.2fr_1fr]">

        <div>
          <h3 className="font-black">{t.companyInfo}</h3>

          <div className="mt-4 grid grid-cols-2 gap-x-10 gap-y-5 md:grid-cols-3 xl:grid-cols-4 text-sm text-[#505253]">
            {settings.legalForm && (

<div>
  <span className="text-[9px] uppercase tracking-wider text-[#828484]">{t.companyType}:</span><br />
  <span className="text-[13px] font-medium leading-tight text-[#05090A]">{settings.legalForm}</span>
</div>

)}

            {settings.managingDirector && (

<div>
  <span className="text-[9px] uppercase tracking-wider text-[#828484]">{t.managingDirector}:</span><br />
  <span className="text-[13px] font-medium leading-tight text-[#05090A]">{settings.managingDirector}</span>
</div>

)}

            {settings.commercialRegister && (

<div>
  <span className="text-[9px] uppercase tracking-wider text-[#828484]">{t.commercialRegister}:</span><br />
  <span className="text-[13px] font-medium leading-tight text-[#05090A]">{settings.commercialRegister}</span>
</div>

)}

            {settings.registerCourt && (

<div>
  <span className="text-[9px] uppercase tracking-wider text-[#828484]">{t.registerCourt}:</span><br />
  <span className="text-[13px] font-medium leading-tight text-[#05090A]">{settings.registerCourt}</span>
</div>

)}

            {settings.taxNumber && (

<div>
  <span className="text-[9px] uppercase tracking-wider text-[#828484]">{t.taxNumber}:</span><br />
  <span className="text-[13px] font-medium leading-tight text-[#05090A]">{settings.taxNumber}</span>
</div>

)}

            {settings.vatId && (

<div>
  <span className="text-[9px] uppercase tracking-wider text-[#828484]">{t.vatId}:</span><br />
  <span className="text-[13px] font-medium leading-tight text-[#05090A]">{settings.vatId}</span>
</div>

)}
          
            {settings.bankName && (
<div>
  <span className="text-[9px] uppercase tracking-wider text-[#828484]">{t.bank}:</span><br />
  <span className="text-[13px] font-medium leading-tight text-[#05090A]">{settings.bankName}</span>
</div>
)}

            {settings.accountHolder && (
<div>
  <span className="text-[9px] uppercase tracking-wider text-[#828484]">{t.accountHolder}:</span><br />
  <span className="text-[13px] font-medium leading-tight text-[#05090A]">{settings.accountHolder}</span>
</div>
)}

            {settings.iban && (
<div>
  <span className="text-[9px] uppercase tracking-wider text-[#828484]">{t.iban}:</span><br />
  <span className="text-[13px] font-medium leading-tight text-[#05090A]">{settings.iban}</span>
</div>
)}

            {settings.bic && (
<div>
  <span className="text-[9px] uppercase tracking-wider text-[#828484]">{t.bic}:</span><br />
  <span className="text-[13px] font-medium leading-tight text-[#05090A]">{settings.bic}</span>
</div>
)}
</div>
        </div>

        <div>
          <h3 className="font-black">{t.contact}</h3>

          <div className="mt-4 space-y-4 text-sm text-[#505253]">
            <div className="flex items-start gap-3">
              <Phone size={18} className="text-[#1B4965]" />
              <span>{settings.phone || "+49 000 000 00 00"}</span>
            </div>

            <div className="flex items-start gap-3">
              <Mail size={18} className="text-[#1B4965]" />
              <span>{settings.email || "info@firma.de"}</span>
            </div>

            {settings.whatsapp ? (
              <div className="flex items-start gap-3">
                <MessageCircle size={18} className="text-green-600" />
                <span>{settings.whatsapp}</span>
              </div>
            ) : null}

            {settings.website ? (
              <div className="flex items-start gap-3">
                <Globe size={18} className="text-[#1B4965]" />
                <a
                  href={settings.website}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[#1B4965]"
                >
                  {settings.website}
                </a>
              </div>
            ) : null}

            {(settings.address || settings.country) ? (
              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-[#1B4965]" />
                <span>
                  {[settings.address, settings.country]
                    .filter(Boolean)
                    .join(", ")}
                </span>
              </div>
            ) : null}

            {settings.instagram ||
            settings.facebook ||
            settings.linkedin ||
            settings.tiktok ||
            settings.twitter ? (
              <div className="flex flex-wrap gap-3 pt-1">
                {settings.instagram ? (
                  <a
                    href={settings.instagram}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-[#05090a26] px-3 py-1.5 text-xs font-bold hover:border-[#1B4965] hover:text-[#1B4965]"
                  >
                    Instagram
                  </a>
                ) : null}

                {settings.facebook ? (
                  <a
                    href={settings.facebook}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-[#05090a26] px-3 py-1.5 text-xs font-bold hover:border-[#1B4965] hover:text-[#1B4965]"
                  >
                    Facebook
                  </a>
                ) : null}

                {settings.linkedin ? (
                  <a
                    href={settings.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-[#05090a26] px-3 py-1.5 text-xs font-bold hover:border-[#1B4965] hover:text-[#1B4965]"
                  >
                    LinkedIn
                  </a>
                ) : null}

                {settings.tiktok ? (
                  <a
                    href={settings.tiktok}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-[#05090a26] px-3 py-1.5 text-xs font-bold hover:border-[#1B4965] hover:text-[#1B4965]"
                  >
                    TikTok
                  </a>
                ) : null}

                {settings.twitter ? (
                  <a
                    href={settings.twitter}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-[#05090a26] px-3 py-1.5 text-xs font-bold hover:border-[#1B4965] hover:text-[#1B4965]"
                  >
                    X
                  </a>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mx-auto mt-10 flex max-w-7xl flex-col gap-3 border-t border-[#05090a26] pt-6 text-sm text-[#828484] sm:flex-row sm:items-center sm:justify-between">
        <p>{settings.copyrightText || `© 2026. ${t.rights}`}</p>

        <div className="flex gap-5">
          <Link href="/impressum" className="hover:text-[#05090A]">{t.imprint}</Link>

          <Link href="/privacy" className="hover:text-[#05090A]">{t.privacy}</Link>

          <Link href="/terms" className="hover:text-[#05090A]">{t.terms}</Link>
        </div>
      </div>
    </footer>
  );
}
