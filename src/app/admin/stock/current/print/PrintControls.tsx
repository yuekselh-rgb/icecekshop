"use client";

import { ArrowLeft, Printer } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PrintControls() {
  const router = useRouter();

  return (
    <div className="mb-5 flex items-center justify-between gap-3 print:hidden">
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 font-bold text-slate-700"
      >
        <ArrowLeft size={18} />
        Geri
      </button>

      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 font-black text-white"
      >
        <Printer size={18} />
        PDF / Yazdır
      </button>
    </div>
  );
}
