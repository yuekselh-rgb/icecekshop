"use client";

import { House, Lock } from "lucide-react";

import ResetSalesButton from "./_components/ResetSalesButton";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import { useLanguage } from "@/context/LanguageContext";

export default function SuperAdminPage() {
  const { language } = useLanguage();

  return (
    <main className="min-h-screen bg-slate-100 p-6 lg:p-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-4 flex justify-end gap-3">
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
            Sistem yönetimi ve tüm yönetici yetkileri.
          </p>

          
        <ResetSalesButton />

        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/admin"
            className="rounded-3xl bg-orange-500 p-7 font-black text-white shadow-sm"
          >
            Admin Paneline Git
          </Link>

          <Link
            href="/super-admin/adminler"
            className="rounded-3xl bg-white p-7 font-black text-slate-950 shadow-sm"
          >
            Admin Yönetimi
          </Link>

          <Link
            href="/super-admin/stok"
            className="rounded-3xl bg-white p-7 font-black text-slate-950 shadow-sm"
          >
            Stok Yönetimi
          </Link>

          <Link
            href="/super-admin/musteriler"
            className="rounded-3xl bg-white p-7 font-black text-slate-950 shadow-sm"
          >
            Müşteri Yönetimi
          </Link>

          <Link
            href="/super-admin/soforler"
            className="rounded-3xl bg-white p-7 font-black text-slate-950 shadow-sm"
          >
            Şoför Yönetimi
          </Link>

          <Link
            href="/admin/bayiler"
            className="rounded-3xl bg-white p-7 font-black text-slate-950 shadow-sm"
          >
            Bayi Yönetimi
          </Link>

          <Link
            href="/super-admin/siparisler"
            className="rounded-3xl bg-white p-7 font-black text-slate-950 shadow-sm"
          >
            Tüm Siparişler
          </Link>

          <Link
            href="/super-admin/ayarlar"
            className="rounded-3xl bg-white p-7 font-black text-slate-950 shadow-sm"
          >
            Firma ve Sistem Ayarları
          </Link>


          <Link
            href="/super-admin/sifre-degistir"
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
