"use client";

import {
  ArrowLeft,
  Building2,
  ImageIcon,
  Loader2,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";

type Settings = {
  companyName: string;
  companySubtitle: string;
  logoUrl: string;
  logoWidth: number;
  logoHeight: number;

  phone: string;
  whatsapp: string;
  email: string;
  website: string;

  address: string;
  country: string;

  footerText: string;
  copyrightText: string;

  legalForm: string;
  managingDirector: string;
  companyDescription: string;

  taxNumber: string;
  vatId: string;
  commercialRegister: string;
  registerCourt: string;

  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
  state: string;

  bankName: string;
  accountHolder: string;
  iban: string;
  bic: string;

  instagram: string;
  facebook: string;
  linkedin: string;
  tiktok: string;
  twitter: string;

  showOffers: boolean;

  minOrderValueEnabled: boolean;
  minOrderValue: string;

  autoPrintOrders: boolean;
};

const emptySettings: Settings = {
  companyName: "",
  companySubtitle: "",
  logoUrl: "",
  logoWidth: 260,
  logoHeight: 120,

  phone: "",
  whatsapp: "",
  email: "",
  website: "",

  address: "",
  country: "",

  footerText: "",
  copyrightText: "",

  legalForm: "",
  managingDirector: "",
  companyDescription: "",

  taxNumber: "",
  vatId: "",
  commercialRegister: "",
  registerCourt: "",

  street: "",
  houseNumber: "",
  postalCode: "",
  city: "",
  state: "",

  bankName: "",
  accountHolder: "",
  iban: "",
  bic: "",

  instagram: "",
  facebook: "",
  linkedin: "",
  tiktok: "",
  twitter: "",

  showOffers: true,

  minOrderValueEnabled: false,
  minOrderValue: "",

  autoPrintOrders: false,
};

export default function CompanySettingsPage() {
  const { language } = useLanguage();

  const [settings, setSettings] = useState<Settings>(emptySettings);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [uploading, setUploading] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await fetch("/api/super-admin/company-settings", {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          setError(
            data.error ||
              (language === "de"
                ? "Firmeneinstellungen konnten nicht geladen werden."
                : "Firma ayarları yüklenemedi."),
          );
          return;
        }

        setSettings({
          companyName: data.settings.companyName || "",
          companySubtitle: data.settings.companySubtitle || "",
          logoUrl: data.settings.logoUrl || "",
          logoWidth: data.settings.logoWidth ?? 260,
          logoHeight: data.settings.logoHeight ?? 120,

          phone: data.settings.phone || "",
          whatsapp: data.settings.whatsapp || "",
          email: data.settings.email || "",
          website: data.settings.website || "",

          address: data.settings.address || "",
          country: data.settings.country || "",

          footerText: data.settings.footerText || "",
          copyrightText: data.settings.copyrightText || "",

          legalForm: data.settings.legalForm || "",
          managingDirector: data.settings.managingDirector || "",
          companyDescription: data.settings.companyDescription || "",

          taxNumber: data.settings.taxNumber || "",
          vatId: data.settings.vatId || "",
          commercialRegister: data.settings.commercialRegister || "",
          registerCourt: data.settings.registerCourt || "",

          street: data.settings.street || "",
          houseNumber: data.settings.houseNumber || "",
          postalCode: data.settings.postalCode || "",
          city: data.settings.city || "",
          state: data.settings.state || "",

          bankName: data.settings.bankName || "",
          accountHolder: data.settings.accountHolder || "",
          iban: data.settings.iban || "",
          bic: data.settings.bic || "",

          instagram: data.settings.instagram || "",
          facebook: data.settings.facebook || "",
          linkedin: data.settings.linkedin || "",
          tiktok: data.settings.tiktok || "",
          twitter: data.settings.twitter || "",

          showOffers: data.settings.showOffers !== false,

          minOrderValueEnabled: Boolean(
            data.settings.minOrderValueEnabled,
          ),
          minOrderValue:
            data.settings.minOrderValue !== null &&
            data.settings.minOrderValue !== undefined
              ? String(data.settings.minOrderValue)
              : "",

          autoPrintOrders: Boolean(data.settings.autoPrintOrders),
        });
      } catch {
        setError(
          language === "de"
            ? "Firmeneinstellungen konnten nicht geladen werden."
            : "Firma ayarları yüklenemedi.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  async function handleLogoUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) {
      return;
    }

    setUploading(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();

      formData.append("file", file);

      const response = await fetch("/api/super-admin/company-logo-upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            (language === "de"
              ? "Logo konnte nicht hochgeladen werden."
              : "Logo yüklenemedi."),
        );
        return;
      }

      setSettings((current) => ({
        ...current,
        logoUrl: data.logoUrl,
      }));

      setSuccess(
        language === "de"
          ? "Logo hochgeladen. Speichern Sie die Einstellungen, um die Änderung abzuschließen."
          : "Logo yüklendi. Değişikliği tamamlamak için ayarları kaydedin.",
      );
    } catch {
      setError(
        language === "de"
          ? "Logo konnte nicht hochgeladen werden."
          : "Logo yüklenemedi.",
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleRemoveLogo() {
    const confirmed = window.confirm(
      language === "de"
        ? "Firmenlogo dauerhaft entfernen?"
        : "Firma logosu kalıcı olarak kaldırılsın mı?",
    );

    if (!confirmed) {
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/super-admin/company-settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...settings,
          logoUrl: "",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            (language === "de"
              ? "Logo konnte nicht entfernt werden."
              : "Logo kaldırılamadı."),
        );
        return;
      }

      setSettings({
        companyName: data.settings.companyName,
        companySubtitle: data.settings.companySubtitle || "",
        logoUrl: "",
        logoWidth: data.settings.logoWidth ?? 260,
        logoHeight: data.settings.logoHeight ?? 120,

        phone: data.settings.phone || "",
        whatsapp: data.settings.whatsapp || "",
        email: data.settings.email || "",
        website: data.settings.website || "",

        address: data.settings.address || "",
        country: data.settings.country || "",

        footerText: data.settings.footerText || "",
        copyrightText: data.settings.copyrightText || "",

        legalForm: data.settings.legalForm || "",
        managingDirector: data.settings.managingDirector || "",
        companyDescription: data.settings.companyDescription || "",

        taxNumber: data.settings.taxNumber || "",
        vatId: data.settings.vatId || "",
        commercialRegister: data.settings.commercialRegister || "",
        registerCourt: data.settings.registerCourt || "",

        street: data.settings.street || "",
        houseNumber: data.settings.houseNumber || "",
        postalCode: data.settings.postalCode || "",
        city: data.settings.city || "",
        state: data.settings.state || "",

        bankName: data.settings.bankName || "",
        accountHolder: data.settings.accountHolder || "",
        iban: data.settings.iban || "",
        bic: data.settings.bic || "",

        instagram: data.settings.instagram || "",
        facebook: data.settings.facebook || "",
        linkedin: data.settings.linkedin || "",
        tiktok: data.settings.tiktok || "",
        twitter: data.settings.twitter || "",

        showOffers: data.settings.showOffers !== false,

        minOrderValueEnabled: Boolean(
          data.settings.minOrderValueEnabled,
        ),
        minOrderValue:
          data.settings.minOrderValue !== null &&
          data.settings.minOrderValue !== undefined
            ? String(data.settings.minOrderValue)
            : "",

        autoPrintOrders: Boolean(data.settings.autoPrintOrders),
      });

      setSuccess(
        language === "de"
          ? "Firmenlogo wurde dauerhaft entfernt."
          : "Firma logosu kalıcı olarak kaldırıldı.",
      );
    } catch {
      setError(
        language === "de"
          ? "Beim Entfernen des Logos ist ein Fehler aufgetreten."
          : "Logo kaldırılırken hata oluştu.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/super-admin/company-settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            (language === "de"
              ? "Einstellungen konnten nicht gespeichert werden."
              : "Ayarlar kaydedilemedi."),
        );
        return;
      }

      setSettings({
        companyName: data.settings.companyName,
        companySubtitle: data.settings.companySubtitle || "",
        logoUrl: data.settings.logoUrl || "",
        logoWidth: data.settings.logoWidth ?? 260,
        logoHeight: data.settings.logoHeight ?? 120,

        phone: data.settings.phone || "",
        whatsapp: data.settings.whatsapp || "",
        email: data.settings.email || "",
        website: data.settings.website || "",

        address: data.settings.address || "",
        country: data.settings.country || "",

        footerText: data.settings.footerText || "",
        copyrightText: data.settings.copyrightText || "",

        legalForm: data.settings.legalForm || "",
        managingDirector: data.settings.managingDirector || "",
        companyDescription: data.settings.companyDescription || "",

        taxNumber: data.settings.taxNumber || "",
        vatId: data.settings.vatId || "",
        commercialRegister: data.settings.commercialRegister || "",
        registerCourt: data.settings.registerCourt || "",

        street: data.settings.street || "",
        houseNumber: data.settings.houseNumber || "",
        postalCode: data.settings.postalCode || "",
        city: data.settings.city || "",
        state: data.settings.state || "",

        bankName: data.settings.bankName || "",
        accountHolder: data.settings.accountHolder || "",
        iban: data.settings.iban || "",
        bic: data.settings.bic || "",

        instagram: data.settings.instagram || "",
        facebook: data.settings.facebook || "",
        linkedin: data.settings.linkedin || "",
        tiktok: data.settings.tiktok || "",
        twitter: data.settings.twitter || "",

        showOffers: data.settings.showOffers !== false,

        minOrderValueEnabled: Boolean(
          data.settings.minOrderValueEnabled,
        ),
        minOrderValue:
          data.settings.minOrderValue !== null &&
          data.settings.minOrderValue !== undefined
            ? String(data.settings.minOrderValue)
            : "",

        autoPrintOrders: Boolean(data.settings.autoPrintOrders),
      });

      setSuccess(
        language === "de"
          ? "Firmeneinstellungen erfolgreich gespeichert."
          : "Firma ayarları başarıyla kaydedildi.",
      );
    } catch {
      setError(
        language === "de"
          ? "Einstellungen konnten nicht gespeichert werden."
          : "Ayarlar kaydedilemedi.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="flex items-center gap-3 font-bold text-slate-600">
          <Loader2 className="animate-spin" />
          {language === "de"
            ? "Firmeneinstellungen werden geladen..."
            : "Firma ayarları yükleniyor..."}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 sm:p-6 lg:p-10">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/super-admin"
          className="inline-flex items-center gap-2 font-bold text-slate-600 transition hover:text-orange-500"
        >
          <ArrowLeft size={18} />
          {language === "de" ? "Super-Admin" : "Süper Admin"}
        </Link>

        <section className="mt-6 rounded-[32px] bg-slate-950 p-7 text-white sm:p-10">
          <Building2 size={32} className="text-orange-400" />

          <p className="mt-5 font-bold text-orange-400">{language === "de" ? "Systemeinstellungen" : "Sistem Ayarları"}</p>

          <h1 className="mt-2 text-4xl font-black">{language === "de" ? "Firmen- und Logoeinstellungen" : "Firma ve Logo Ayarları"}</h1>

          <p className="mt-3 max-w-2xl text-slate-400">
            {language === "de"
              ? "Ändern Sie hier den Firmennamen und das Logo. Das gespeicherte Logo erscheint automatisch auf der Startseite und im Footer."
              : "Firma adını ve logoyu buradan değiştirin. Kaydedilen logo ana sayfada ve footer bölümünde otomatik görünür."}
          </p>
        </section>

        {error ? (
          <div className="mt-6 rounded-2xl bg-red-50 p-4 font-bold text-red-600">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="mt-6 rounded-2xl bg-green-50 p-4 font-bold text-green-700">
            {success}
          </div>
        ) : null}

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-6 rounded-[32px] bg-white p-6 shadow-sm sm:p-8"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-bold text-slate-700">
                {language === "de" ? "Firmenname *" : "Firma Adı *"}
              </span>

              <input
                required
                value={settings.companyName}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    companyName: event.target.value,
                  }))
                }
                placeholder={language === "de" ? "Beispielfirma" : "Örnek Firma"}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-orange-500"
              />
            </label>

            <label className="block">
              <span className="text-sm font-bold text-slate-700">
                {language === "de" ? "Firmenuntertitel" : "Firma Alt Başlığı"}
              </span>

              <input
                value={settings.companySubtitle}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    companySubtitle: event.target.value,
                  }))
                }
                placeholder={language === "de" ? "Firmenslogan oder Untertitel" : "Firma sloganı veya alt başlığı"}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-orange-500"
              />
            </label>

          </div>

          <section className="rounded-3xl border border-slate-200 p-5">
            <h2 className="text-xl font-black text-slate-950">
              {language === "de" ? "Firmeninformationen" : "Firma Bilgileri"}
            </h2>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <label>
                <span className="text-sm font-bold text-slate-700">
                  {language === "de" ? "Rechtsform" : "Firma Türü"}
                </span>

                <input
                  value={settings.legalForm}
                  onChange={(e)=>
                    setSettings(c=>({
                      ...c,
                      legalForm:e.target.value,
                    }))
                  }
                  placeholder="GmbH, UG, e.K., GmbH & Co. KG..."
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"
                />
              </label>

              <label>
                <span className="text-sm font-bold text-slate-700">{language === "de" ? "Geschäftsführer" : "Şirket Yetkilisi"}</span>
                <input
                  value={settings.managingDirector}
                  onChange={(e)=>setSettings(c=>({...c,managingDirector:e.target.value}))}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"
                />
              </label>

              <label className="sm:col-span-2">
                <span className="text-sm font-bold text-slate-700">{language === "de" ? "Firmenbeschreibung" : "Firma Açıklaması"}</span>
                <textarea
                  rows={3}
                  value={settings.companyDescription}
                  onChange={(e)=>setSettings(c=>({...c,companyDescription:e.target.value}))}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"
                />
              </label>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <div>
              <h2 className="text-xl font-black text-slate-950">
                {language === "de" ? "Firmenlogo" : "Firma Logosu"}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {language === "de"
                  ? "Ein horizontales PNG- oder WEBP-Logo mit transparentem Hintergrund liefert das beste Ergebnis."
                  : "Şeffaf arka planlı, yatay PNG veya WEBP logo en iyi sonucu verir."}
              </p>

              <div className="mt-6">
                <label className="block text-sm font-bold text-slate-700">
                  {language === "de" ? "Logogröße" : "Logo Genişliği"}
                </label>

                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="mb-2 text-xs font-bold text-slate-500">
                      {language === "de" ? "Breite" : "Genişlik"}
                    </p>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setSettings((c) => ({
                            ...c,
                            logoWidth: Math.max(
                              140,
                              (c.logoWidth ?? 260) - 50,
                            ),
                          }))
                        }
                        className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-300 bg-white text-xl font-black hover:bg-slate-100"
                      >
                        −
                      </button>

                      <div className="min-w-[100px] rounded-xl border border-slate-200 bg-white px-4 py-2 text-center font-black">
                        {settings.logoWidth ?? 260}px
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setSettings((c) => ({
                            ...c,
                            logoWidth: Math.min(
                              1800,
                              (c.logoWidth ?? 260) + 50,
                            ),
                          }))
                        }
                        className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-300 bg-white text-xl font-black hover:bg-slate-100"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-bold text-slate-500">
                      {language === "de" ? "Höhe" : "Yükseklik"}
                    </p>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setSettings((c) => ({
                            ...c,
                            logoHeight: Math.max(
                              40,
                              (c.logoHeight ?? 120) - 10,
                            ),
                          }))
                        }
                        className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-300 bg-white text-xl font-black hover:bg-slate-100"
                      >
                        −
                      </button>

                      <div className="min-w-[100px] rounded-xl border border-slate-200 bg-white px-4 py-2 text-center font-black">
                        {settings.logoHeight ?? 120}px
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setSettings((c) => ({
                            ...c,
                            logoHeight: Math.min(
                              700,
                              (c.logoHeight ?? 120) + 20,
                            ),
                          }))
                        }
                        className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-300 bg-white text-xl font-black hover:bg-slate-100"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_340px]">
              <div>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 font-black text-white transition hover:bg-orange-500">
                  {uploading ? (
                    <Loader2 size={19} className="animate-spin" />
                  ) : (
                    <Upload size={19} />
                  )}

                  {uploading
                    ? language === "de"
                      ? "Wird hochgeladen..."
                      : "Yükleniyor..."
                    : language === "de"
                      ? "Logo vom Computer auswählen"
                      : "Bilgisayardan Logo Seç"}

                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    disabled={uploading}
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>

                {settings.logoUrl ? (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    disabled={saving || uploading}
                    className="ml-3 inline-flex disabled:cursor-not-allowed disabled:opacity-50 items-center gap-2 rounded-xl bg-red-50 px-5 py-3 font-black text-red-600"
                  >
                    <Trash2 size={18} />
                    {language === "de" ? "Logo entfernen" : "Logoyu Kaldır"}
                  </button>
                ) : null}

                <p className="mt-3 text-xs text-slate-500">
                  {language === "de"
                    ? "JPG, PNG, WEBP oder GIF. Maximal 5 MB."
                    : "JPG, PNG, WEBP veya GIF. En fazla 5 MB."}
                </p>
              </div>

              <div className="flex min-h-40 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white p-5">
                {settings.logoUrl ? (
                  <img
                    src={settings.logoUrl}
                    alt={
                      language === "de"
                        ? "Firmenlogo-Vorschau"
                        : "Firma logosu önizlemesi"
                    }
                    style={{
                      width: `${settings.logoWidth}px`,
                      height: `${settings.logoHeight}px`,
                      objectFit: "fill",
                    }}
                    className="max-w-none"
                  />
                ) : (
                  <div className="text-center text-slate-400">
                    <ImageIcon size={38} className="mx-auto" />

                    <p className="mt-2 text-sm font-bold">{language === "de" ? "Logovorschau" : "Logo önizlemesi"}</p>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 p-5">
            <h2 className="text-xl font-black text-slate-950">
              {language === "de" ? "Steuerliche Angaben" : "Vergi Bilgileri"}
            </h2>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">

              <label>
                <span className="text-sm font-bold text-slate-700">{language === "de" ? "Steuernummer" : "Vergi Numarası"}</span>
                <input
                  value={settings.taxNumber}
                  onChange={(e)=>setSettings(c=>({...c,taxNumber:e.target.value}))}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"
                />
              </label>

              <label>
                <span className="text-sm font-bold text-slate-700">{language === "de" ? "USt-IdNr." : "KDV Numarası"}</span>
                <input
                  value={settings.vatId}
                  onChange={(e)=>setSettings(c=>({...c,vatId:e.target.value}))}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"
                />
              </label>

              <label>
                <span className="text-sm font-bold text-slate-700">{language === "de" ? "Handelsregister" : "Ticaret Sicili"}</span>
                <input
                  value={settings.commercialRegister}
                  onChange={(e)=>setSettings(c=>({...c,commercialRegister:e.target.value}))}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"
                />
              </label>

              <label>
                <span className="text-sm font-bold text-slate-700">{language === "de" ? "Registergericht" : "Tescil Mahkemesi"}</span>
                <input
                  value={settings.registerCourt}
                  onChange={(e)=>setSettings(c=>({...c,registerCourt:e.target.value}))}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"
                />
              </label>

            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 p-5">
            <h2 className="text-xl font-black text-slate-950">
              {language === "de" ? "Kontaktinformationen" : "İletişim Bilgileri"}
            </h2>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">

              <label>
                <span className="text-sm font-bold text-slate-700">{language === "de" ? "Telefon" : "Telefon"}</span>
                <input
                  value={settings.phone}
                  onChange={(e)=>setSettings(c=>({...c,phone:e.target.value}))}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"
                />
              </label>

              <label>
                <span className="text-sm font-bold text-slate-700">{language === "de" ? "WhatsApp" : "WhatsApp"}</span>
                <input
                  value={settings.whatsapp}
                  onChange={(e)=>setSettings(c=>({...c,whatsapp:e.target.value}))}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"
                />
              </label>

              <label>
                <span className="text-sm font-bold text-slate-700">{language === "de" ? "E-Mail" : "E-Posta"}</span>
                <input
                  value={settings.email}
                  onChange={(e)=>setSettings(c=>({...c,email:e.target.value}))}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"
                />
              </label>

              <label>
                <span className="text-sm font-bold text-slate-700">{language === "de" ? "Webseite" : "Web Sitesi"}</span>
                <input
                  value={settings.website}
                  onChange={(e)=>setSettings(c=>({...c,website:e.target.value}))}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"
                />
              </label>

              <label className="sm:col-span-2">
                <span className="text-sm font-bold text-slate-700">{language === "de" ? "Adresse" : "Adres"}</span>
                <input
                  value={settings.address}
                  onChange={(e)=>setSettings(c=>({...c,address:e.target.value}))}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"
                />
              </label>

              <label>
                <span className="text-sm font-bold text-slate-700">{language === "de" ? "Land" : "Ülke"}</span>
                <input
                  value={settings.country}
                  onChange={(e)=>setSettings(c=>({...c,country:e.target.value}))}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"
                />
              </label>

              <label>
                <span className="text-sm font-bold text-slate-700">{language === "de" ? "Straße" : "Sokak"}</span>
                <input
                  value={settings.street}
                  onChange={(e)=>setSettings(c=>({...c,street:e.target.value}))}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"
                />
              </label>

              <label>
                <span className="text-sm font-bold text-slate-700">{language === "de" ? "Hausnummer" : "Kapı No"}</span>
                <input
                  value={settings.houseNumber}
                  onChange={(e)=>setSettings(c=>({...c,houseNumber:e.target.value}))}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"
                />
              </label>

              <label>
                <span className="text-sm font-bold text-slate-700">{language === "de" ? "Postleitzahl" : "Posta Kodu"}</span>
                <input
                  value={settings.postalCode}
                  onChange={(e)=>setSettings(c=>({...c,postalCode:e.target.value}))}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"
                />
              </label>

              <label>
                <span className="text-sm font-bold text-slate-700">{language === "de" ? "Stadt" : "Şehir"}</span>
                <input
                  value={settings.city}
                  onChange={(e)=>setSettings(c=>({...c,city:e.target.value}))}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"
                />
              </label>

            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 p-5">
            <h2 className="text-xl font-black text-slate-950">
              {language === "de" ? "Soziale Medien" : "Sosyal Medya"}
            </h2>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <label>
                <span className="text-sm font-bold text-slate-700">
                  Instagram
                </span>
                <input
                  value={settings.instagram}
                  onChange={(e) =>
                    setSettings((c) => ({
                      ...c,
                      instagram: e.target.value,
                    }))
                  }
                  placeholder="https://instagram.com/..."
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"
                />
              </label>

              <label>
                <span className="text-sm font-bold text-slate-700">
                  Facebook
                </span>
                <input
                  value={settings.facebook}
                  onChange={(e) =>
                    setSettings((c) => ({
                      ...c,
                      facebook: e.target.value,
                    }))
                  }
                  placeholder="https://facebook.com/..."
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"
                />
              </label>

              <label>
                <span className="text-sm font-bold text-slate-700">
                  LinkedIn
                </span>
                <input
                  value={settings.linkedin}
                  onChange={(e) =>
                    setSettings((c) => ({
                      ...c,
                      linkedin: e.target.value,
                    }))
                  }
                  placeholder="https://linkedin.com/company/..."
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"
                />
              </label>

              <label>
                <span className="text-sm font-bold text-slate-700">
                  TikTok
                </span>
                <input
                  value={settings.tiktok}
                  onChange={(e) =>
                    setSettings((c) => ({
                      ...c,
                      tiktok: e.target.value,
                    }))
                  }
                  placeholder="https://tiktok.com/@..."
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"
                />
              </label>

              <label>
                <span className="text-sm font-bold text-slate-700">
                  X (Twitter)
                </span>
                <input
                  value={settings.twitter}
                  onChange={(e) =>
                    setSettings((c) => ({
                      ...c,
                      twitter: e.target.value,
                    }))
                  }
                  placeholder="https://x.com/..."
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"
                />
              </label>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 p-5">
            <h2 className="text-xl font-black text-slate-950">
              {language === "de" ? "Bankverbindung" : "Banka Bilgileri"}
            </h2>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">

              <label>
                <span className="text-sm font-bold text-slate-700">{language === "de" ? "Bank" : "Banka"}</span>
                <input
                  value={settings.bankName}
                  onChange={(e)=>setSettings(c=>({...c,bankName:e.target.value}))}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"
                />
              </label>

              <label>
                <span className="text-sm font-bold text-slate-700">{language === "de" ? "Kontoinhaber" : "Hesap Sahibi"}</span>
                <input
                  value={settings.accountHolder}
                  onChange={(e)=>setSettings(c=>({...c,accountHolder:e.target.value}))}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"
                />
              </label>

              <label>
                <span className="text-sm font-bold text-slate-700">{language === "de" ? "IBAN" : "IBAN"}</span>
                <input
                  value={settings.iban}
                  onChange={(e)=>setSettings(c=>({...c,iban:e.target.value}))}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"
                />
              </label>

              <label>
                <span className="text-sm font-bold text-slate-700">{language === "de" ? "BIC" : "BIC"}</span>
                <input
                  value={settings.bic}
                  onChange={(e)=>setSettings(c=>({...c,bic:e.target.value}))}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"
                />
              </label>

            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 p-5">
            <h2 className="text-xl font-black text-slate-950">
              {language === "de" ? "Footer-Einstellungen" : "Footer Ayarları"}
            </h2>

            <div className="mt-5 space-y-5">

              <label className="block">
                <span className="text-sm font-bold text-slate-700">
                  {language === "de" ? "Footer-Beschreibung" : "Footer Açıklaması"}
                </span>

                <textarea
                  rows={4}
                  value={settings.footerText}
                  onChange={(e)=>
                    setSettings(c=>({
                      ...c,
                      footerText:e.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"
                />
              </label>

              <label className="block">
                <span className="text-sm font-bold text-slate-700">
                  Copyright
                </span>

                <input
                  value={settings.copyrightText}
                  onChange={(e)=>
                    setSettings(c=>({
                      ...c,
                      copyrightText:e.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"
                />
              </label>

            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 p-5">
            <p className="text-sm font-black text-slate-500">
              {language === "de" ? "Header-Vorschau" : "Header Önizlemesi"}
            </p>

            <div className="mt-4 flex min-h-24 items-center rounded-2xl border border-slate-200 bg-white px-6">
              {settings.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt={
                    language === "de"
                      ? "Header-Logo-Vorschau"
                      : "Header logo önizlemesi"
                  }
                  style={{
                    width: `${settings.logoWidth}px`,
                    height: `${settings.logoHeight}px`,
                    objectFit: "fill",
                  }}
                  className="object-contain object-left"
                />
              ) : (
                <p className="text-sm font-bold text-slate-400">
                  {language === "de" ? "Kein Logo ausgewählt" : "Logo seçilmedi"}
                </p>
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-950">
                  {language === "de"
                    ? "Startseiten-Aktionen"
                    : "Ana Sayfa Kampanyaları"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {language === "de"
                    ? "Legen Sie fest, ob der Bereich mit Aktionsprodukten den Kunden angezeigt wird."
                    : "Kampanyalı ürünler bölümünün müşterilere gösterilip gösterilmeyeceğini belirleyin."}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSettings((current) => ({
                    ...current,
                    showOffers: !current.showOffers,
                  }))
                }
                className={`relative h-8 w-14 shrink-0 rounded-full transition ${
                  settings.showOffers ? "bg-green-500" : "bg-slate-300"
                }`}
              >
                <span
                  className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition ${
                    settings.showOffers ? "left-7" : "left-1"
                  }`}
                />
              </button>
            </div>

            <p
              className={`mt-4 text-sm font-black ${
                settings.showOffers ? "text-green-700" : "text-red-600"
              }`}
            >
              {settings.showOffers
                ? language === "de"
                  ? "Aktionen werden auf der Startseite angezeigt."
                  : "Kampanyalar ana sayfada gösteriliyor."
                : language === "de"
                  ? "Aktionen werden auf der Startseite ausgeblendet."
                  : "Kampanyalar ana sayfada gizleniyor."}
            </p>
          </section>

          <section className="rounded-3xl border border-slate-200 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-950">
                  {language === "de"
                    ? "Mindestbestellwert"
                    : "Minimum Sipariş Tutarı"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {language === "de"
                    ? "Legen Sie fest, ob Kunden einen Mindestbestellwert erreichen müssen."
                    : "Müşterilerin belirli bir minimum tutara ulaşması gerekip gerekmediğini belirleyin."}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSettings((current) => ({
                    ...current,
                    minOrderValueEnabled: !current.minOrderValueEnabled,
                  }))
                }
                className={`relative h-8 w-14 shrink-0 rounded-full transition ${
                  settings.minOrderValueEnabled
                    ? "bg-green-500"
                    : "bg-slate-300"
                }`}
              >
                <span
                  className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition ${
                    settings.minOrderValueEnabled ? "left-7" : "left-1"
                  }`}
                />
              </button>
            </div>

            {settings.minOrderValueEnabled ? (
              <label className="mt-4 block max-w-xs">
                <span className="text-sm font-bold text-slate-700">
                  {language === "de"
                    ? "Mindestbestellwert (€)"
                    : "Minimum Sipariş Tutarı (€)"}
                </span>

                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={settings.minOrderValue}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      minOrderValue: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-orange-500"
                />
              </label>
            ) : null}

            <p
              className={`mt-4 text-sm font-black ${
                settings.minOrderValueEnabled
                  ? "text-green-700"
                  : "text-red-600"
              }`}
            >
              {settings.minOrderValueEnabled
                ? language === "de"
                  ? `Bestellungen unter ${Number(settings.minOrderValue || 0).toFixed(2)} € werden abgelehnt.`
                  : `${Number(settings.minOrderValue || 0).toFixed(2)} € altındaki siparişler reddedilir.`
                : language === "de"
                  ? "Kein Mindestbestellwert aktiv."
                  : "Minimum sipariş tutarı aktif değil."}
            </p>
          </section>

          <section className="rounded-3xl border border-slate-200 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-950">
                  {language === "de"
                    ? "Automatischer Bestelldruck"
                    : "Otomatik Sipariş Yazdırma"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {language === "de"
                    ? "Neue Bestellungen werden automatisch gedruckt, sobald sie eingehen — solange irgendwo im Admin-Bereich ein Browser-Tab geöffnet ist (nicht nur auf der Bestellseite)."
                    : "Yeni siparişler geldiği anda otomatik yazdırılır — admin panelinde herhangi bir sayfa açık olması yeterlidir (sadece sipariş sayfası değil)."}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSettings((current) => ({
                    ...current,
                    autoPrintOrders: !current.autoPrintOrders,
                  }))
                }
                className={`relative h-8 w-14 shrink-0 rounded-full transition ${
                  settings.autoPrintOrders ? "bg-green-500" : "bg-slate-300"
                }`}
              >
                <span
                  className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition ${
                    settings.autoPrintOrders ? "left-7" : "left-1"
                  }`}
                />
              </button>
            </div>

            <p
              className={`mt-4 text-sm font-black ${
                settings.autoPrintOrders ? "text-green-700" : "text-red-600"
              }`}
            >
              {settings.autoPrintOrders
                ? language === "de"
                  ? "Aktiv — ein eingeloggter Admin-Tab muss geöffnet bleiben."
                  : "Aktif — giriş yapılmış bir admin sekmesi açık kalmalıdır."
                : language === "de"
                  ? "Automatischer Druck ist deaktiviert."
                  : "Otomatik yazdırma devre dışı."}
            </p>
          </section>

          <button
            type="submit"
            disabled={saving || uploading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 py-4 font-black text-white transition hover:bg-orange-600 disabled:bg-orange-300"
          >
            {saving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
            {language === "de"
              ? "Firmeneinstellungen speichern"
              : "Firma Ayarlarını Kaydet"}
          </button>
        </form>
      </div>
    </main>
  );
}
