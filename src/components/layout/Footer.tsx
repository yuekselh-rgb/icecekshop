"use client";

import { useLanguage } from "@/context/LanguageContext";
import { Globe, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Footer() {
  
const { language } = useLanguage();

const [settings,setSettings]=useState<any>({});

useEffect(()=>{
fetch("/api/company-settings",{cache:"no-store"})
.then(r=>r.json())
.then(d=>setSettings(d.settings||{}))
.catch(()=>{});
},[]);


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
    <footer className="bg-slate-950 px-4 py-12 text-white lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[2.2fr_1fr]">

        <div>
          <h3 className="font-black">{t.companyInfo}</h3>

          <div className="mt-4 grid grid-cols-2 gap-x-10 gap-y-5 md:grid-cols-3 xl:grid-cols-4 text-sm text-slate-300">
            {settings.legalForm && (

<div>
  <span className="text-[9px] uppercase tracking-wider text-slate-500">{t.companyType}:</span><br />
  <span className="text-[13px] font-medium leading-tight text-white">{settings.legalForm}</span>
</div>

)}

            {settings.managingDirector && (

<div>
  <span className="text-[9px] uppercase tracking-wider text-slate-500">{t.managingDirector}:</span><br />
  <span className="text-[13px] font-medium leading-tight text-white">{settings.managingDirector}</span>
</div>

)}

            {settings.commercialRegister && (

<div>
  <span className="text-[9px] uppercase tracking-wider text-slate-500">{t.commercialRegister}:</span><br />
  <span className="text-[13px] font-medium leading-tight text-white">{settings.commercialRegister}</span>
</div>

)}

            {settings.registerCourt && (

<div>
  <span className="text-[9px] uppercase tracking-wider text-slate-500">{t.registerCourt}:</span><br />
  <span className="text-[13px] font-medium leading-tight text-white">{settings.registerCourt}</span>
</div>

)}

            {settings.taxNumber && (

<div>
  <span className="text-[9px] uppercase tracking-wider text-slate-500">{t.taxNumber}:</span><br />
  <span className="text-[13px] font-medium leading-tight text-white">{settings.taxNumber}</span>
</div>

)}

            {settings.vatId && (

<div>
  <span className="text-[9px] uppercase tracking-wider text-slate-500">{t.vatId}:</span><br />
  <span className="text-[13px] font-medium leading-tight text-white">{settings.vatId}</span>
</div>

)}
          
            {settings.bankName && (
<div>
  <span className="text-[9px] uppercase tracking-wider text-slate-500">{t.bank}:</span><br />
  <span className="text-[13px] font-medium leading-tight text-white">{settings.bankName}</span>
</div>
)}

            {settings.accountHolder && (
<div>
  <span className="text-[9px] uppercase tracking-wider text-slate-500">{t.accountHolder}:</span><br />
  <span className="text-[13px] font-medium leading-tight text-white">{settings.accountHolder}</span>
</div>
)}

            {settings.iban && (
<div>
  <span className="text-[9px] uppercase tracking-wider text-slate-500">{t.iban}:</span><br />
  <span className="text-[13px] font-medium leading-tight text-white">{settings.iban}</span>
</div>
)}

            {settings.bic && (
<div>
  <span className="text-[9px] uppercase tracking-wider text-slate-500">{t.bic}:</span><br />
  <span className="text-[13px] font-medium leading-tight text-white">{settings.bic}</span>
</div>
)}
</div>
        </div>

        <div>
          <h3 className="font-black">{t.contact}</h3>

          <div className="mt-4 space-y-4 text-sm text-slate-400">
            <div className="flex items-start gap-3">
              <Phone size={18} className="text-sky-500" />
              <span>{settings.phone || "+49 000 000 00 00"}</span>
            </div>

            <div className="flex items-start gap-3">
              <Mail size={18} className="text-sky-500" />
              <span>{settings.email || "info@firma.de"}</span>
            </div>

            {settings.whatsapp ? (
              <div className="flex items-start gap-3">
                <MessageCircle size={18} className="text-green-500" />
                <span>{settings.whatsapp}</span>
              </div>
            ) : null}

            {settings.website ? (
              <div className="flex items-start gap-3">
                <Globe size={18} className="text-sky-500" />
                <a
                  href={settings.website}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white"
                >
                  {settings.website}
                </a>
              </div>
            ) : null}

            {(settings.address || settings.country) ? (
              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-sky-500" />
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
                    className="rounded-full border border-slate-700 px-3 py-1.5 text-xs font-bold hover:border-sky-500 hover:text-white"
                  >
                    Instagram
                  </a>
                ) : null}

                {settings.facebook ? (
                  <a
                    href={settings.facebook}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-slate-700 px-3 py-1.5 text-xs font-bold hover:border-sky-500 hover:text-white"
                  >
                    Facebook
                  </a>
                ) : null}

                {settings.linkedin ? (
                  <a
                    href={settings.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-slate-700 px-3 py-1.5 text-xs font-bold hover:border-sky-500 hover:text-white"
                  >
                    LinkedIn
                  </a>
                ) : null}

                {settings.tiktok ? (
                  <a
                    href={settings.tiktok}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-slate-700 px-3 py-1.5 text-xs font-bold hover:border-sky-500 hover:text-white"
                  >
                    TikTok
                  </a>
                ) : null}

                {settings.twitter ? (
                  <a
                    href={settings.twitter}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-slate-700 px-3 py-1.5 text-xs font-bold hover:border-sky-500 hover:text-white"
                  >
                    X
                  </a>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mx-auto mt-10 flex max-w-7xl flex-col gap-3 border-t border-slate-800 pt-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <p>{settings.copyrightText || `© 2026. ${t.rights}`}</p>

        <div className="flex gap-5">
          <Link href="/impressum">{t.imprint}</Link>

          <Link href="/privacy">{t.privacy}</Link>

          <Link href="/terms">{t.terms}</Link>
        </div>
      </div>
    </footer>
  );
}
