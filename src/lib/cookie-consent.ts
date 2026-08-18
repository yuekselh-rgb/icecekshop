export const CONSENT_STORAGE_KEY = "paketmarket-cookie-consent";
export const CONSENT_COOKIE_KEY = "paketmarket_cookie_consent";
export const CONSENT_UPDATED_EVENT = "paketmarket:cookie-consent-updated";

export type ConsentSelection = {
  analytics: boolean;
  marketing: boolean;
};

export type StoredConsent = ConsentSelection & {
  necessary: true;
  updatedAt: string;
};

export function readStoredConsent(): StoredConsent | null {
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);

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

export function hasMarketingConsent() {
  return readStoredConsent()?.marketing === true;
}
