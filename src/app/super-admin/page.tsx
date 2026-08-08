"use client";

import { House, Lock } from "lucide-react";

import ResetSalesButton from "./_components/ResetSalesButton";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import { useLanguage } from "@/context/LanguageContext";

export default function SuperAdminPage() {
  const { language, setLanguage } = useLanguage();

  return (
    <main className="min-h-screen bg-slate-100 p-6 lg:p-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-4 flex justify-end gap-3">
          <div className="flex items-center rounded-full border border-slate-200 bg-white p-1">
            <button
              type="button"
              onClick={() => setLanguage("de")}
              className={`rounded-full px-3 py-1.5 text-xs font-black transition ${
                language === "de"
                  ? "bg-slate-950 text-white"
                  : "text-slate-500 hover:text-slate-950"
              }`}
            >
              DE
            </button>

            <button
              type="button"
              onClick={() => setLanguage("tr")}
              className={`rounded-full px-3 py-1.5 text-xs font-black transition ${
                language === "tr"
                  ? "bg-slate-950 text-white"
                  : "text-slate-500 hover:text-slate-950"
              }`}
            >
              TR
            </button>
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 font-semibold text-slate-900 shadow transition hover:bg-slate-100"
          >
            <House size={18} />
            {language === "de" ? "Startseite" : "Ana Sayfa"}
          </Link>

          <LogoutButton
            label={language === "de" ? "Abmelden" : "Çıkış Yap"}
          />
        </div>


        <div className="relative rounded-3xl bg-slate-950 p-8 text-white lg:min-h-[260px] lg:pr-[420px]">
          <p className="font-bold text-orange-400">{language === "de" ? "Systemverwaltung" : "Sistem Yönetimi"}</p>

          <h1 className="mt-2 text-4xl font-black">{language === "de" ? "Super-Administrator" : "Super Admin"}</h1>

          <p className="mt-3 text-slate-400">
            {language === "de"
              ? "Systemverwaltung und alle Admin-Berechtigungen."
              : "Sistem yönetimi ve tüm yönetici yetkileri."}
          </p>


        <ResetSalesButton />

        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/admin"
            className="rounded-3xl bg-orange-500 p-7 font-black text-white shadow-sm"
          >
            {language === "de" ? "Zum Admin-Panel" : "Admin Paneline Git"}
          </Link>

          <Link
            href="/super-admin/admins"
            className="rounded-3xl bg-white p-7 font-black text-slate-950 shadow-sm"
          >
            {language === "de" ? "Admin-Verwaltung" : "Admin Yönetimi"}
          </Link>

          <Link
            href="/super-admin/stock"
            className="rounded-3xl bg-white p-7 font-black text-slate-950 shadow-sm"
          >
            {language === "de" ? "Lagerverwaltung" : "Stok Yönetimi"}
          </Link>

          <Link
            href="/super-admin/customers"
            className="rounded-3xl bg-white p-7 font-black text-slate-950 shadow-sm"
          >
            {language === "de" ? "Kundenverwaltung" : "Müşteri Yönetimi"}
          </Link>

          <Link
            href="/super-admin/drivers"
            className="rounded-3xl bg-white p-7 font-black text-slate-950 shadow-sm"
          >
            {language === "de" ? "Fahrerverwaltung" : "Şoför Yönetimi"}
          </Link>

          <Link
            href="/admin/dealers"
            className="rounded-3xl bg-white p-7 font-black text-slate-950 shadow-sm"
          >
            {language === "de" ? "Händlerverwaltung" : "Bayi Yönetimi"}
          </Link>

          <Link
            href="/super-admin/orders"
            className="rounded-3xl bg-white p-7 font-black text-slate-950 shadow-sm"
          >
            {language === "de" ? "Alle Bestellungen" : "Tüm Siparişler"}
          </Link>

          <Link
            href="/super-admin/settings"
            className="rounded-3xl bg-white p-7 font-black text-slate-950 shadow-sm"
          >
            {language === "de" ? "Firmen- und Systemeinstellungen" : "Firma ve Sistem Ayarları"}
          </Link>


          <Link
            href="/super-admin/change-password"
            className="flex items-center gap-2 rounded-3xl bg-white p-7 font-black text-slate-950 shadow-sm"
          >
            <Lock size={20} className="text-orange-500" />
            {language === "de" ? "Passwort ändern" : "Şifre Değiştir"}
          </Link>
        </div>
      </div>
    
</main>
  );
}
