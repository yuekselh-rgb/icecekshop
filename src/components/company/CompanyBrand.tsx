"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type CompanySettings = {
  companyName: string;
  companySubtitle: string | null;
  logoUrl: string | null;
  logoWidth?: number;
  logoHeight?: number;
  updatedAt?: string;
};

type CompanyBrandProps = {
  variant?: "header" | "hero" | "footer";
  initialSettings?: CompanySettings;
};

const fallbackSettings: CompanySettings = {
  companyName: "Firma Adı",
  companySubtitle: null,
  logoUrl: null,
  logoWidth: 260,
  logoHeight: 120,
};

export default function CompanyBrand({
  variant = "header",
  initialSettings,
}: CompanyBrandProps) {
  const [settings, setSettings] = useState<CompanySettings>(
    initialSettings ?? fallbackSettings,
  );

  const [loading, setLoading] = useState(!initialSettings);

  useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      try {
        const response = await fetch(
          `/api/company-settings?refresh=${Date.now()}`,
          {
            cache: "no-store",
          },
        );

        const data = await response.json();

        if (!cancelled && response.ok && data.settings) {
          setSettings(data.settings);
        }
      } catch {
        // Varsayılan firma bilgileri gösterilmeye devam eder.
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        loadSettings();
      }
    }

    /*
     * initialSettings zaten sunucudan taze geldiyse mount anında
     * tekrar aynı isteği atmaya gerek yok; sadece sekmeye geri
     * dönüldüğünde güncel kalması için yeniden çekilir.
     */
    if (!initialSettings) {
      loadSettings();
    }

    window.addEventListener("focus", loadSettings);
    window.addEventListener("pageshow", loadSettings);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;

      window.removeEventListener("focus", loadSettings);
      window.removeEventListener("pageshow", loadSettings);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const isFooter = variant === "footer";
  const isHero = variant === "hero";
  const isHeader = variant === "header";

  return (
    <Link
      href="/"
      className="flex w-full items-start justify-center"
      aria-label={settings.companyName}
    >
      {settings.logoUrl ? (
        <img
          src={`${settings.logoUrl}${
            settings.updatedAt
              ? `?v=${encodeURIComponent(settings.updatedAt)}`
              : ""
          }`}
          alt={`${settings.companyName} logosu`}
          style={
            isHero
              ? {
                  width: "100%",
                  height: "auto",
                  objectFit: "contain",
                }
              : {
                  width: "100%",
                  maxWidth: "100%",
                  height: "auto",
                  objectFit: "contain",
                }
          }
          className={
            isHero
              ? "mx-auto block w-full max-w-[360px] md:max-w-[700px] lg:max-w-[900px] object-contain"
              : isHeader
                ? "mx-auto block w-full h-auto max-h-[170px] object-contain"
                : isFooter
                  ? "w-auto object-contain object-left"
                  : "block w-full max-w-full object-contain"
          }
        />
      ) : loading ? null : (
        <div className="text-center">
          <div className="text-2xl font-black">
            {settings.companyName}
          </div>

          {settings.companySubtitle ? (
            <div className="mt-1 text-sm text-slate-500">
              {settings.companySubtitle}
            </div>
          ) : null}
        </div>
      )}
    </Link>
  );
}
