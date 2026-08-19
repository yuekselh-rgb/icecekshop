"use client";

/*
 * Zentrale Analytics-Schicht: alle fbq()/ttq()-Aufrufe für Commerce-Events
 * laufen über diese Datei, statt über das Projekt verstreut zu sein. Die
 * eigentliche Übertragung (inkl. Consent-Prüfung) übernehmen weiterhin
 * meta-pixel-events.ts / tiktok-pixel-events.ts — hier wird nur einmal
 * pro Aktion die passende Nutzlast für beide Plattformen gebaut, damit
 * Aufrufer (CartContext, Checkout, Produktseite, Suche, …) nur noch ein
 * einziges, typisiertes trackX(...) aufrufen statt zwei plattform-
 * spezifische Aufrufe zu duplizieren.
 */

import { trackMetaPixelEvent } from "@/lib/meta-pixel-events";
import { trackTikTokPixelEvent } from "@/lib/tiktok-pixel-events";

const CURRENCY = "EUR";

type AnalyticsCartItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
};

export function trackProductView(product: {
  id: string;
  name: string;
  price: number;
}) {
  const value = Number(product.price.toFixed(2));

  trackMetaPixelEvent("ViewContent", {
    content_ids: [product.id],
    content_name: product.name,
    content_type: "product",
    value,
    currency: CURRENCY,
  });

  trackTikTokPixelEvent("ViewContent", {
    content_id: product.id,
    content_name: product.name,
    content_type: "product",
    price: product.price,
    value,
    currency: CURRENCY,
  });
}

export function trackSearch(searchTerm: string, resultsCount: number) {
  const trimmed = searchTerm.trim();

  if (!trimmed) {
    return;
  }

  trackMetaPixelEvent("Search", {
    search_string: trimmed,
    content_category: "product",
    num_results: resultsCount,
  });

  trackTikTokPixelEvent("Search", {
    query: trimmed,
    num_results: resultsCount,
  });
}

export function trackAddToCart(item: AnalyticsCartItem) {
  const value = Number((item.price * item.quantity).toFixed(2));

  trackMetaPixelEvent("AddToCart", {
    content_ids: [item.productId],
    content_name: item.name,
    content_type: "product",
    value,
    currency: CURRENCY,
  });

  trackTikTokPixelEvent("AddToCart", {
    content_id: item.productId,
    content_name: item.name,
    content_type: "product",
    quantity: item.quantity,
    price: item.price,
    value,
    currency: CURRENCY,
  });
}

export function trackBeginCheckout(
  items: AnalyticsCartItem[],
  subtotal: number,
) {
  const value = Number(subtotal.toFixed(2));
  const numItems = items.reduce((total, item) => total + item.quantity, 0);

  trackMetaPixelEvent("InitiateCheckout", {
    content_ids: items.map((item) => item.productId),
    content_type: "product",
    num_items: numItems,
    value,
    currency: CURRENCY,
  });

  trackTikTokPixelEvent("InitiateCheckout", {
    contents: items.map((item) => ({
      content_id: item.productId,
      content_name: item.name,
      content_type: "product",
      quantity: item.quantity,
      price: item.price,
    })),
    value,
    currency: CURRENCY,
  });
}

export function trackPurchase(items: AnalyticsCartItem[], totalAmount: number) {
  const numItems = items.reduce((total, item) => total + item.quantity, 0);

  trackMetaPixelEvent("Purchase", {
    content_ids: items.map((item) => item.productId),
    content_type: "product",
    num_items: numItems,
    value: Number(totalAmount),
    currency: CURRENCY,
  });

  trackTikTokPixelEvent("CompletePayment", {
    contents: items.map((item) => ({
      content_id: item.productId,
      content_name: item.name,
      content_type: "product",
      quantity: item.quantity,
      price: item.price,
    })),
    value: Number(totalAmount),
    currency: CURRENCY,
  });
}
