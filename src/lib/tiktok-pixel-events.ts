"use client";

import { hasMarketingConsent } from "@/lib/cookie-consent";

declare global {
  interface Window {
    ttq?: {
      track: (...args: unknown[]) => void;
    };
  }
}

export function trackTikTokPixelEvent(
  eventName: string,
  params?: Record<string, unknown>,
) {
  if (typeof window === "undefined") {
    return;
  }

  if (!hasMarketingConsent() || typeof window.ttq?.track !== "function") {
    return;
  }

  window.ttq.track(eventName, params);
}
