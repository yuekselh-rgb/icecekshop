"use client";

import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { Minus, Plus, RotateCcw, ShoppingBag, Trash2, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function CartClient({
  initialSettings,
}: {
  initialSettings?: any;
} = {}) {
  const {
    items,
    pfandItems,
    productSubtotal,
    productPfandTotal,
    subtotal,
    pfandReturnTotal,
    increaseQuantity,
    decreaseQuantity,
    setItemQuantity,
    removeFromCart,
    removePfandItem,
    setPfandQuantity,
    adjustPfandQuantity,
  } = useCart();

  const { language, translations } = useLanguage();

  const t = {
    ...translations[language].cartPage,
    invalidQuantity:
      language === "de"
        ? "Bitte geben Sie eine gültige Anzahl ein."
        : "Geçerli bir adet girin.",
    emptyReturnTitle:
      language === "de"
        ? "Leergut zurückgeben"
        : "Pfand İadesi",
    emptyReturnDescription:
      language === "de"
        ? "Leere Kisten oder Flaschen bei der Lieferung zurückgeben."
        : "Boş kasa veya şişeleri teslimatta iade edin.",
    addReturn:
      language === "de"
        ? "Leergut hinzufügen"
        : "Pfand Ekle",
    addReturnTitle:
      language === "de"
        ? "Leergut erfassen"
        : "Pfand Gir",
    pfand: "Pfand",
    quantity:
      language === "de"
        ? "Anzahl"
        : "Adet",
    totalLabel:
      language === "de"
        ? "Gesamt"
        : "Toplam",
    deletePfand:
      language === "de"
        ? "Pfandposition löschen"
        : "Pfand kalemini sil",
    totalPfand:
      language === "de"
        ? "Gesamtpfand"
        : "Toplam Pfand",
    goodsValue:
      language === "de"
        ? "Warenwert"
        : "Ürün tutarı",
    boughtPfand:
      language === "de"
        ? "Pfand auf gekaufte Produkte"
        : "Satın alınan ürün Pfand",
    subtotalWithPfand:
      language === "de"
        ? "Zwischensumme inkl. Pfand"
        : "Pfand dahil ara toplam",
    pfandReturn:
      language === "de"
        ? "Pfandrückgabe"
        : "Pfand İadesi",
    pfandInfo:
      language === "de"
        ? "Die Pfandgutschrift wird nach Prüfung der zurückgegebenen Kisten und Flaschen bestätigt."
        : "Pfand tutarı, teslimatta kasa ve şişeler kontrol edildikten sonra onaylanacaktır.",
    pfandPerUnit:
      language === "de"
        ? "Pfand pro Stück"
        : "adet başına Pfand",
    pfandOnlyEntry:
      language === "de"
        ? "Ich möchte nur Leergut zurückgeben, ohne etwas zu kaufen"
        : "Sadece bir şey satın almadan Pfand iade etmek istiyorum",
  };

  const [deliveryFeeEnabled, setDeliveryFeeEnabled] = useState(
    initialSettings ? initialSettings.deliveryFeeEnabled !== false : true,
  );

  useEffect(() => {
    /*
     * initialSettings kam bereits vom Server — kein erneuter Fetch
     * beim Mount nötig.
     */
    if (initialSettings) {
      return;
    }

    async function loadCompanySettings() {
      try {
        const response = await fetch("/api/company-settings");
        const data = await response.json();

        setDeliveryFeeEnabled(data.settings?.deliveryFeeEnabled !== false);
      } catch {
        // Lieferkosten-Status ist optional; bei Fehler Standardverhalten beibehalten.
      }
    }

    loadCompanySettings();
  }, [initialSettings]);

  const [quantityInputs, setQuantityInputs] = useState<Record<string, string>>(
    {},
  );

  const [pfandQuantityInputs, setPfandQuantityInputs] = useState<
    Record<string, string>
  >({});

  const [showPfandForm, setShowPfandForm] = useState(false);

  const [forcePfandOnly, setForcePfandOnly] = useState(false);

  const [pfandError, setPfandError] = useState("");

  const pfandCatalog = [
    {
      key: "PET_025",
      unitAmount: 0.25,
      name: {
        de: "PET / Dose (Einweg)",
        tr: "PET / Kutu (Tek Kullanımlık)",
      },
    },
    {
      key: "GLASS_008",
      unitAmount: 0.08,
      name: {
        de: "Glasflasche Mehrweg 0,08 €",
        tr: "Cam Şişe (İade) 0,08 €",
      },
    },
    {
      key: "GLASS_015",
      unitAmount: 0.15,
      name: {
        de: "Glasflasche Mehrweg 0,15 €",
        tr: "Cam Şişe (İade) 0,15 €",
      },
    },
    {
      key: "CRATE_330",
      unitAmount: 3.3,
      name: {
        de: "Kiste / Getränkekasten",
        tr: "Kasa / İçecek Kasası",
      },
    },
    {
      key: "CRATE_510",
      unitAmount: 5.1,
      name: {
        de: "Kasten Pfand 5,10 €",
        tr: "Kasa Pfandı 5,10 €",
      },
    },
    {
      key: "CRATE_390",
      unitAmount: 3.9,
      name: {
        de: "Kasten Pfand 3,90 €",
        tr: "Kasa Pfandı 3,90 €",
      },
    },
    {
      key: "CRATE_342",
      unitAmount: 3.42,
      name: {
        de: "Kasten Pfand 3,42 €",
        tr: "Kasa Pfandı 3,42 €",
      },
    },
    {
      key: "CRATE_310",
      unitAmount: 3.1,
      name: {
        de: "Kasten Pfand 3,10 €",
        tr: "Kasa Pfandı 3,10 €",
      },
    },
    {
      key: "CRATE_150",
      unitAmount: 1.5,
      name: {
        de: "Kasten Pfand 1,50 €",
        tr: "Kasa Pfandı 1,50 €",
      },
    },
  ] as const;

  function applyPfandQuantity(
    canonicalName: string,
    unitAmount: number,
    nextQuantity: number,
  ) {
    setPfandQuantity(canonicalName, unitAmount, nextQuantity);
  }

  return (
    <main className="min-h-screen bg-[#f7f7f5]">
      <Header initialSettings={initialSettings} />

      <section className="border-b border-slate-200 bg-white px-4 py-12 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="font-bold text-orange-500">{t.eyebrow}</p>

          <h1 className="mt-2 text-4xl font-black text-slate-950 sm:text-5xl">
            {t.title}
          </h1>
        </div>
      </section>

      <section className="px-4 py-10 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {items.length === 0 && pfandItems.length === 0 && !forcePfandOnly ? (
            <div className="rounded-[32px] bg-white p-12 text-center">
              <ShoppingBag size={48} className="mx-auto text-slate-300" />

              <h2 className="mt-5 text-2xl font-black text-slate-950">
                {t.emptyTitle}
              </h2>

              <p className="mt-2 text-slate-500">{t.emptyDescription}</p>

              <Link
                href="/products"
                className="mt-6 inline-flex rounded-xl bg-orange-500 px-6 py-3 font-black text-white"
              >
                {t.browseProducts}
              </Link>

              <button
                type="button"
                onClick={() => {
                  setForcePfandOnly(true);
                  setShowPfandForm(true);
                }}
                className="mt-4 block w-full text-sm font-bold text-slate-500 underline underline-offset-2 hover:text-orange-500"
              >
                {t.pfandOnlyEntry}
              </button>
            </div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
              <div className="space-y-6">
                <div className="space-y-4">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col gap-5 rounded-3xl bg-white p-5 sm:flex-row sm:items-center"
                    >
                      <div className="relative flex h-28 w-full shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-100 sm:w-28">
                        {item.image &&
                        (item.image.startsWith("http://") ||
                          item.image.startsWith("https://") ||
                          item.image.startsWith("/") ||
                          item.image.startsWith("data:image/") ||
                          item.image.startsWith("blob:")) ? (
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            sizes="112px"
                            className="object-contain p-2"
                          />
                        ) : (
                          <span className="text-5xl">{item.image || "📦"}</span>
                        )}
                      </div>

                      <div className="flex-1">
                        <h2 className="text-lg font-black text-slate-950">
                          {item.name}
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                          {item.packageInfo}
                        </p>

                        <p className="mt-3 font-black text-slate-950">
                          {(
                            (item.price + Number(item.pfandAmount || 0)) *
                            item.quantity
                          ).toFixed(2)}{" "}
                          €
                        </p>

                        {Number(item.pfandAmount || 0) > 0 ? (
                          <p className="mt-1 text-xs font-bold text-orange-600">
                            {item.price.toFixed(2)} € +{" "}
                            {Number(item.pfandAmount || 0).toFixed(2)} €{" "}
                            {t.pfandPerUnit}
                          </p>
                        ) : null}
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center rounded-xl border border-slate-200">
                          <button
                            type="button"
                            aria-label={t.decrease}
                            onClick={() => decreaseQuantity(item.id)}
                            className="p-3"
                          >
                            <Minus size={16} />
                          </button>

                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            aria-label={t.quantity}
                            value={quantityInputs[item.id] ?? String(item.quantity)}
                            onChange={(event) => {
                              const raw = event.target.value;

                              if (raw === "" || /^[0-9]+$/.test(raw)) {
                                const normalized = raw.replace(
                                  /^0+(?=\d)/,
                                  "",
                                );

                                setQuantityInputs((current) => ({
                                  ...current,
                                  [item.id]: normalized,
                                }));
                              }
                            }}
                            onBlur={() => {
                              const raw = quantityInputs[item.id];

                              if (raw !== undefined && raw !== "") {
                                setItemQuantity(item.id, Number(raw));
                              }

                              setQuantityInputs((current) => {
                                const next = { ...current };
                                delete next[item.id];
                                return next;
                              });
                            }}
                            className="w-10 shrink-0 border-0 bg-transparent text-center font-black outline-none"
                          />

                          <button
                            type="button"
                            aria-label={t.increase}
                            onClick={() => increaseQuantity(item.id)}
                            className="p-3"
                          >
                            <Plus size={16} />
                          </button>
                        </div>

                        <button
                          type="button"
                          aria-label={t.remove}
                          onClick={() => removeFromCart(item.id)}
                          className="rounded-xl border border-red-100 p-3 text-red-500 transition hover:bg-red-50"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <section className="rounded-[32px] bg-white p-6">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                        <RotateCcw size={22} />
                      </div>

                      <div>
                        <h2 className="text-xl font-black text-slate-950">
                          {t.emptyReturnTitle}
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                          {t.emptyReturnDescription}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowPfandForm(true)}
                      className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 font-black text-white transition hover:bg-orange-500"
                    >
                      <Plus size={18} />

                      {t.addReturn}
                    </button>
                  </div>

                  {showPfandForm ? (
                    <div className="mt-4 rounded-2xl border border-orange-100 bg-orange-50 p-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-black text-slate-950">
                          {t.addReturnTitle}
                        </h3>

                        <button
                          type="button"
                          onClick={() => setShowPfandForm(false)}
                          className="rounded-lg bg-white p-2 text-slate-500"
                        >
                          <X size={18} />
                        </button>
                      </div>

                      {pfandError ? (
                        <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-600">
                          {pfandError}
                        </div>
                      ) : null}

                      <div className="mt-4 overflow-hidden rounded-xl border border-orange-100 bg-white">
                        {pfandCatalog.map((option) => {
                          const canonicalName = option.name.de;
                          const displayName = option.name[language];

                          const currentItem = pfandItems.find(
                            (item) => item.name === canonicalName,
                          );

                          const quantity = currentItem?.quantity ?? 0;

                          return (
                            <div
                              key={option.key}
                              className="grid gap-2 border-b border-slate-200 px-3 py-2.5 last:border-b-0 sm:grid-cols-[1fr_90px_110px_100px_44px] sm:items-center"
                            >
                              <div>
                                <p className="text-sm font-black text-slate-950">
                                  {displayName}
                                </p>
                              </div>

                              <div>
                                <p className="text-[10px] font-bold uppercase text-slate-400">
                                  {t.pfand}
                                </p>

                                <p className="mt-0.5 text-sm font-black text-orange-500">
                                  {option.unitAmount.toFixed(2)} €
                                </p>
                              </div>

                              <div>
                                <span className="text-[10px] font-bold uppercase text-slate-400">
                                  {t.quantity}
                                </span>

                                <div className="mt-1 flex items-center rounded-lg border border-slate-200">
                                  <button
                                    type="button"
                                    aria-label={t.decrease}
                                    disabled={quantity <= 0}
                                    onClick={() =>
                                      adjustPfandQuantity(
                                        canonicalName,
                                        option.unitAmount,
                                        -1,
                                      )
                                    }
                                    className="p-2 disabled:cursor-not-allowed disabled:opacity-30"
                                  >
                                    <Minus size={14} />
                                  </button>

                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    aria-label={t.quantity}
                                    value={
                                      pfandQuantityInputs[option.key] ??
                                      String(quantity)
                                    }
                                    onChange={(event) => {
                                      const raw = event.target.value;

                                      if (raw === "" || /^[0-9]+$/.test(raw)) {
                                        const normalized = raw.replace(
                                          /^0+(?=\d)/,
                                          "",
                                        );

                                        setPfandQuantityInputs((current) => ({
                                          ...current,
                                          [option.key]: normalized,
                                        }));

                                        if (normalized !== "") {
                                          applyPfandQuantity(
                                            canonicalName,
                                            option.unitAmount,
                                            Number(normalized),
                                          );
                                        }
                                      }
                                    }}
                                    onBlur={() => {
                                      const raw =
                                        pfandQuantityInputs[option.key];

                                      if (raw !== undefined) {
                                        applyPfandQuantity(
                                          canonicalName,
                                          option.unitAmount,
                                          raw === "" ? 0 : Number(raw),
                                        );
                                      }

                                      setPfandQuantityInputs((current) => {
                                        const next = { ...current };
                                        delete next[option.key];
                                        return next;
                                      });
                                    }}
                                    className="min-w-0 flex-1 border-0 bg-transparent px-1 py-2 text-center text-sm font-bold outline-none"
                                  />

                                  <button
                                    type="button"
                                    aria-label={t.increase}
                                    onClick={() =>
                                      adjustPfandQuantity(
                                        canonicalName,
                                        option.unitAmount,
                                        1,
                                      )
                                    }
                                    className="p-2"
                                  >
                                    <Plus size={14} />
                                  </button>
                                </div>
                              </div>

                              <div>
                                <p className="text-[10px] font-bold uppercase text-slate-400">
                                  {t.totalLabel}
                                </p>

                                <p className="mt-0.5 text-sm font-black text-green-700">
                                  {(quantity * option.unitAmount).toFixed(2)} €
                                </p>
                              </div>

                              <div className="flex justify-end">
                                <button
                                  type="button"
                                  disabled={!currentItem}
                                  onClick={() => {
                                    if (currentItem) {
                                      removePfandItem(currentItem.id);
                                    }
                                  }}
                                  aria-label={
                                    t.deletePfand
                                  }
                                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-500 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-30"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-3 flex items-center justify-between rounded-xl bg-green-50 px-4 py-3 text-sm font-black text-green-700">
                        <span>
                          {t.totalPfand}
                        </span>

                        <span>{pfandReturnTotal.toFixed(2)} €</span>
                      </div>
                    </div>
                  ) : null}
                </section>
              </div>

              <aside className="h-fit rounded-[32px] bg-white p-6 lg:sticky lg:top-28">
                <h2 className="text-2xl font-black text-slate-950">
                  {t.orderSummary}
                </h2>

                <div className="mt-6 space-y-4">
                  <div className="flex justify-between">
                    <span className="text-slate-500">
                      {t.goodsValue}
                    </span>

                    <span className="font-bold">
                      {productSubtotal.toFixed(2)} €
                    </span>
                  </div>

                  {productPfandTotal > 0 ? (
                    <div className="flex justify-between">
                      <span className="text-slate-500">
                        {t.boughtPfand}
                      </span>

                      <span className="font-bold text-orange-600">
                        +{productPfandTotal.toFixed(2)} €
                      </span>
                    </div>
                  ) : null}

                  <div className="flex justify-between">
                    <span className="font-bold text-slate-700">
                      {t.subtotalWithPfand}
                    </span>

                    <span className="font-black">{subtotal.toFixed(2)} €</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500">{t.delivery}</span>

                    <span className="font-bold text-green-600">
                      {deliveryFeeEnabled ? t.calculatedLater : t.free}
                    </span>
                  </div>

                  {pfandReturnTotal > 0 ? (
                    <div className="flex justify-between">
                      <span className="text-slate-500">
                        {t.pfandReturn}
                      </span>

                      <span className="font-bold text-green-700">
                        -{pfandReturnTotal.toFixed(2)} €
                      </span>
                    </div>
                  ) : null}

                  <div className="border-t border-slate-200 pt-4">
                    <div className="flex justify-between text-xl">
                      <span className="font-black">{t.total}</span>

                      <span className="font-black">
                        {Math.max(0, subtotal - pfandReturnTotal).toFixed(2)} €
                      </span>
                    </div>

                    {pfandReturnTotal > 0 ? (
                      <p className="mt-3 text-xs leading-5 text-slate-500">
                        {t.pfandInfo}
                      </p>
                    ) : null}
                  </div>
                </div>

                <Link
                  href="/checkout"
                  className="mt-6 flex w-full items-center justify-center rounded-xl bg-orange-500 px-6 py-4 font-black text-white transition hover:bg-orange-600"
                >
                  {t.checkout}
                </Link>
              </aside>
            </div>
          )}
        </div>
      </section>

      <Footer initialSettings={initialSettings} />
    </main>
  );
}
