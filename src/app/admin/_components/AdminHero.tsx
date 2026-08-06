"use client";

import { useLanguage } from "@/context/LanguageContext";

type Props = {
  adminName: string;
};

export default function AdminHero({ adminName }: Props) {
  const { language } = useLanguage();

  return (
    <section className="relative overflow-hidden rounded-[32px] bg-slate-950 p-8 text-white lg:p-10">
      <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-orange-500/10" />

      <div className="relative">
        <p className="font-bold text-orange-400">
          {language === "de"
            ? "Verwaltungsbereich"
            : "Yönetim Paneli"}
        </p>

        <p className="mt-5 text-sm font-bold text-slate-400">
          {language === "de"
            ? "Willkommen"
            : "Hoş geldiniz"}
        </p>

        <h1 className="mt-1 text-4xl font-black">
          {adminName}
        </h1>

        <p className="mt-4 max-w-2xl text-slate-400">
          {language === "de"
            ? "Sie können die Verwaltungsfunktionen entsprechend Ihrer Berechtigungen verwenden."
            : "Size verilen yetkilere göre yönetim işlemlerini gerçekleştirebilirsiniz."}
        </p>
      </div>
    </section>
  );
}
