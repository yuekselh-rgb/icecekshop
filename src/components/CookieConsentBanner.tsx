"use client";

import { useLanguage } from "@/context/LanguageContext";
import { Cookie, ShieldCheck } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const STORAGE_KEY = "paketmarket-cookie-consent";
const COOKIE_KEY = "paketmarket_cookie_consent";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 180;
const REOPEN_EVENT = "paketmarket:open-cookie-settings";

const STAFF_PATH_PREFIXES = ["/admin", "/driver", "/super-admin", "/platform"];

type ConsentSelection = {
  analytics: boolean;
  marketing: boolean;
};

type StoredConsent = ConsentSelection & {
  necessary: true;
  updatedAt: string;
};

function readStoredConsent(): StoredConsent | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);

    if (
      typeof parsed?.analytics !== "boolean" ||
      typeof parsed?.marketing !== "boolean"
    ) {
      return null;
    }

    return parsed as StoredConsent;
  } catch {
    return null;
  }
}

function writeConsent(selection: ConsentSelection) {
  const stored: StoredConsent = {
    necessary: true,
    analytics: selection.analytics,
    marketing: selection.marketing,
    updatedAt: new Date().toISOString(),
  };

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // Speicher nicht verfügbar (z. B. privater Modus) — Banner erscheint dann beim nächsten Besuch erneut.
  }

  document.cookie = `${COOKIE_KEY}=${encodeURIComponent(
    JSON.stringify({ necessary: true, ...selection }),
  )}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
}

export function openCookieSettings() {
  window.dispatchEvent(new Event(REOPEN_EVENT));
}

export default function CookieConsentBanner() {
  const { language } = useLanguage();
  const pathname = usePathname();

  const [visible, setVisible] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  const isStaffArea = STAFF_PATH_PREFIXES.some((prefix) =>
    pathname?.startsWith(prefix),
  );

  useEffect(() => {
    if (isStaffArea) {
      setVisible(false);
      return;
    }

    const stored = readStoredConsent();

    if (!stored) {
      setVisible(true);
    } else {
      setAnalytics(stored.analytics);
      setMarketing(stored.marketing);
    }
  }, [isStaffArea]);

  useEffect(() => {
    function handleReopen() {
      const stored = readStoredConsent();

      if (stored) {
        setAnalytics(stored.analytics);
        setMarketing(stored.marketing);
      }

      setCustomizing(true);
      setVisible(true);
    }

    window.addEventListener(REOPEN_EVENT, handleReopen);

    return () => window.removeEventListener(REOPEN_EVENT, handleReopen);
  }, []);

  if (isStaffArea || !visible) {
    return null;
  }

  const t =
    language === "de"
      ? {
          title: "Wir schätzen Ihre Privatsphäre",
          description:
            "Wir verwenden Cookies, um unsere Website zuverlässig bereitzustellen und Ihr Nutzererlebnis zu verbessern. Notwendige Cookies sind für den Betrieb erforderlich; Analyse- und Marketing-Cookies setzen wir nur mit Ihrer Zustimmung ein.",
          acceptAll: "Alle akzeptieren",
          customize: "Anpassen",
          rejectAll: "Alles ablehnen",
          save: "Auswahl speichern",
          back: "Zurück",
          categoriesTitle: "Cookie-Einstellungen",
          necessary: "Notwendig",
          necessaryDescription:
            "Für Anmeldung, Warenkorb und grundlegende Funktionen erforderlich. Kann nicht deaktiviert werden.",
          analyticsLabel: "Analyse",
          analyticsDescription:
            "Hilft uns zu verstehen, wie die Website genutzt wird, um sie zu verbessern.",
          marketingLabel: "Marketing",
          marketingDescription:
            "Wird verwendet, um Ihnen relevantere Angebote zu zeigen.",
          alwaysOn: "Immer aktiv",
          privacyLink: "Datenschutzerklärung",
        }
      : {
          title: "Gizliliğinize önem veriyoruz",
          description:
            "Web sitemizi güvenilir şekilde sunmak ve kullanıcı deneyiminizi iyileştirmek için çerezler kullanıyoruz. Zorunlu çerezler çalışması için gereklidir; analiz ve pazarlama çerezlerini yalnızca izninizle kullanırız.",
          acceptAll: "Tümünü kabul et",
          customize: "Özelleştir",
          rejectAll: "Tümünü reddet",
          save: "Seçimi kaydet",
          back: "Geri",
          categoriesTitle: "Çerez Ayarları",
          necessary: "Zorunlu",
          necessaryDescription:
            "Giriş, sepet ve temel işlevler için gereklidir. Devre dışı bırakılamaz.",
          analyticsLabel: "Analiz",
          analyticsDescription:
            "Web sitesinin nasıl kullanıldığını anlamamıza ve geliştirmemize yardımcı olur.",
          marketingLabel: "Pazarlama",
          marketingDescription:
            "Size daha uygun teklifler göstermek için kullanılır.",
          alwaysOn: "Her zaman açık",
          privacyLink: "Gizlilik Politikası",
        };

  function acceptAll() {
    writeConsent({ analytics: true, marketing: true });
    setAnalytics(true);
    setMarketing(true);
    setVisible(false);
    setCustomizing(false);
  }

  function rejectAll() {
    writeConsent({ analytics: false, marketing: false });
    setAnalytics(false);
    setMarketing(false);
    setVisible(false);
    setCustomizing(false);
  }

  function saveSelection() {
    writeConsent({ analytics, marketing });
    setVisible(false);
    setCustomizing(false);
  }

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label={t.title}
      className="fixed inset-x-0 bottom-0 z-[100] flex justify-center px-4 pb-4 sm:px-6 sm:pb-6"
    >
      <div className="w-full max-w-lg rounded-2xl border border-[#05090a26] bg-white p-6 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E8ECEF] text-[#1B4965]">
            <Cookie size={20} />
          </div>

          <div>
            <h2 className="text-lg font-black text-[#05090A]">{t.title}</h2>

            <p className="mt-2 text-sm leading-relaxed text-[#505253]">
              {t.description}
            </p>
          </div>
        </div>

        {customizing ? (
          <div className="mt-5 space-y-3 border-t border-[#05090a26] pt-5">
            <div className="flex items-start justify-between gap-4 rounded-xl border border-[#05090a26] bg-[#F2F2F2] p-3.5">
              <div>
                <div className="flex items-center gap-2 text-sm font-bold text-[#05090A]">
                  <ShieldCheck size={16} className="text-[#1B4965]" />
                  {t.necessary}
                </div>

                <p className="mt-1 text-xs text-[#828484]">
                  {t.necessaryDescription}
                </p>
              </div>

              <span className="shrink-0 rounded-full border border-[#05090a26] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#828484]">
                {t.alwaysOn}
              </span>
            </div>

            <label className="flex items-start justify-between gap-4 rounded-xl border border-[#05090a26] p-3.5">
              <div>
                <div className="text-sm font-bold text-[#05090A]">
                  {t.analyticsLabel}
                </div>

                <p className="mt-1 text-xs text-[#828484]">
                  {t.analyticsDescription}
                </p>
              </div>

              <input
                type="checkbox"
                checked={analytics}
                onChange={(event) => setAnalytics(event.target.checked)}
                className="mt-1 h-5 w-9 shrink-0 accent-[#1B4965]"
              />
            </label>

            <label className="flex items-start justify-between gap-4 rounded-xl border border-[#05090a26] p-3.5">
              <div>
                <div className="text-sm font-bold text-[#05090A]">
                  {t.marketingLabel}
                </div>

                <p className="mt-1 text-xs text-[#828484]">
                  {t.marketingDescription}
                </p>
              </div>

              <input
                type="checkbox"
                checked={marketing}
                onChange={(event) => setMarketing(event.target.checked)}
                className="mt-1 h-5 w-9 shrink-0 accent-[#1B4965]"
              />
            </label>
          </div>
        ) : null}

        <div className="mt-5 flex flex-col gap-2">
          {customizing ? (
            <>
              <button
                type="button"
                onClick={saveSelection}
                className="rounded-full bg-[#05090A] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#1B4965]"
              >
                {t.save}
              </button>

              <button
                type="button"
                onClick={() => setCustomizing(false)}
                className="rounded-full border border-[#05090a26] px-4 py-3 text-sm font-bold text-[#05090A] transition hover:border-[#1B4965] hover:text-[#1B4965]"
              >
                {t.back}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={acceptAll}
                className="rounded-full bg-[#05090A] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#1B4965]"
              >
                {t.acceptAll}
              </button>

              <button
                type="button"
                onClick={() => setCustomizing(true)}
                className="rounded-full border border-[#05090a26] px-4 py-3 text-sm font-bold text-[#05090A] transition hover:border-[#1B4965] hover:text-[#1B4965]"
              >
                {t.customize}
              </button>

              <button
                type="button"
                onClick={rejectAll}
                className="rounded-full border border-[#05090a26] px-4 py-3 text-sm font-bold text-[#05090A] transition hover:border-[#1B4965] hover:text-[#1B4965]"
              >
                {t.rejectAll}
              </button>
            </>
          )}
        </div>

        <a
          href="/privacy"
          className="mt-4 block text-center text-xs font-semibold text-[#828484] underline-offset-2 hover:text-[#1B4965] hover:underline"
        >
          {t.privacyLink}
        </a>
      </div>
    </div>
  );
}
