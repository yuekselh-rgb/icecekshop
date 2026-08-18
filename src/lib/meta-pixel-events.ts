"use client";

import { hasMarketingConsent } from "@/lib/cookie-consent";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export function trackMetaPixelEvent(
  eventName: string,
  params?: Record<string, unknown>,
) {
  if (typeof window === "undefined") {
    return;
  }

  if (!hasMarketingConsent() || typeof window.fbq !== "function") {
    return;
  }

  window.fbq("track", eventName, params);
}
