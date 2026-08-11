"use client";

import { useLanguage } from "@/context/LanguageContext";
import { printOrderSilently, type ReceiptOrder } from "@/lib/order-receipt";
import { useEffect, useRef } from "react";

const POLL_INTERVAL_MS = 10000;

export default function AutoPrintWatcher() {
  const { language } = useLanguage();

  const canPrintRef = useRef(false);
  const seenOrderIdsRef = useRef<Set<string> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function checkPermission() {
      try {
        const response = await fetch("/api/admin/me");
        const data = await response.json();

        if (!cancelled && response.ok) {
          canPrintRef.current = Boolean(data.permissions?.printOrder);
        }
      } catch {
        // Stiller Wächter: Fehler hier blockieren keine sichtbare Seite.
      }
    }

    checkPermission();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      if (!canPrintRef.current) {
        return;
      }

      try {
        const [companySettingsResponse, ordersResponse] = await Promise.all([
          fetch("/api/company-settings"),
          fetch("/api/admin/orders"),
        ]);

        if (cancelled) {
          return;
        }

        const companySettingsData = companySettingsResponse.ok
          ? await companySettingsResponse.json()
          : null;

        const autoPrintEnabled = Boolean(
          companySettingsData?.settings?.autoPrintOrders,
        );

        if (!ordersResponse.ok) {
          return;
        }

        const ordersData = await ordersResponse.json();

        const orders: ReceiptOrder[] = ordersData.orders || [];

        const fetchedIds = orders.map((order) => order.id);

        if (seenOrderIdsRef.current === null) {
          seenOrderIdsRef.current = new Set(fetchedIds);
          return;
        }

        const newOrders = orders.filter(
          (order) => !seenOrderIdsRef.current!.has(order.id),
        );

        fetchedIds.forEach((id) => seenOrderIdsRef.current!.add(id));

        if (newOrders.length > 0 && autoPrintEnabled) {
          newOrders.forEach((order) => {
            printOrderSilently(order, language);
          });
        }
      } catch {
        // Stiller Wächter: Netzwerkfehler beim Polling werden ignoriert.
      }
    }

    poll();

    const interval = window.setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [language]);

  return null;
}
