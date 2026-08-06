"use client";

import { Check, Minus, Plus, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";

type ProductCardProps = {
  id: string;

  name: {
    tr: string;
    de: string;
  };

  category: {
    tr: string;
    de: string;
  };

  categorySlug: string;

  packageInfo: string;
  price: number;
  pfandAmount: number;
  oldPrice?: number;
  image: string;
  imageScale?: number;
  imagePositionX?: number;
  imagePositionY?: number;

  badge?: {
    tr: string;
    de: string;
  };

  inStock?: boolean;
};

function isImageSource(value: string) {
  return (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("/") ||
    value.startsWith("data:image/") ||
    value.startsWith("blob:")
  );
}

export default function ProductCard({
  id,
  name,
  category,
  categorySlug,
  packageInfo,
  price,
  pfandAmount,
  oldPrice,
  image,
  imageScale = 1,
  imagePositionX = 0,
  imagePositionY = 0,
  badge,
  inStock = true,
}: ProductCardProps) {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const { addToCart } = useCart();

  const { language } = useLanguage();

  const localizedName = name[language];

  const localizedCategory = category[language];

  const localizedBadge = badge ? badge[language] : undefined;

  const t =
    language === "de"
      ? {
          inStock: "Auf Lager",
          outOfStock: "Nicht verfügbar",
          addToCart: "In den Warenkorb",
          pfand: "Pfand",
          decreaseQuantity: "Menge verringern",
          increaseQuantity: "Menge erhöhen",
        }
      : {
          inStock: "Stokta",
          outOfStock: "Stokta Yok",
          addToCart: "Sepete Ekle",
          pfand: "Pfand",
          decreaseQuantity: "Adedi azalt",
          increaseQuantity: "Adedi artır",
        };

  function decreaseQuantity() {
    setQuantity((current) => Math.max(1, current - 1));
  }

  function increaseQuantity() {
    setQuantity((current) => current + 1);
  }

  function handleAddToCart() {
    if (!inStock) {
      return;
    }

    addToCart(
      {
        id,
        name: localizedName,
        price,
        pfandAmount,
        image,
        packageInfo,
      },
      quantity,
    );

    setQuantity(1);

    setAdded(true);

    setTimeout(() => {
      setAdded(false);
    }, 1000);
  }

  return (
    <article
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition duration-300 hover:-translate-y-0.5 hover:shadow-lg">
      <Link
        href={`/urunler/${id}`}
        className="relative flex h-44 items-center justify-center overflow-hidden bg-slate-100"
      >
        {localizedBadge ? (
          <span className="absolute left-3 top-3 z-10 rounded-full bg-slate-950 px-2.5 py-1 text-[10px] font-bold text-white">
            {localizedBadge}
          </span>
        ) : null}

        {isImageSource(image) ? (
          <img
            src={image}
            alt={localizedName}
            className="h-full w-full object-contain transition duration-300"
            style={{
              transform: `translate(${imagePositionX}px, ${imagePositionY}px) scale(${imageScale})`,
              transformOrigin: "center",
            }}
          />
        ) : (
          <span className="text-7xl transition duration-300 group-hover:scale-110">
            {image || "📦"}
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col px-2.5 pb-2.5 pt-2">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-[10px] font-bold text-orange-500">
            {localizedCategory}
          </p>

          <span
            className={`shrink-0 text-[9px] font-bold ${
              inStock ? "text-green-600" : "text-red-500"
            }`}
          >
            {inStock ? t.inStock : t.outOfStock}
          </span>
        </div>

        <Link href={`/urunler/${id}`}>
          <h3 className="mt-0.5 line-clamp-2 min-h-9 text-sm font-black leading-4 text-slate-950 transition hover:text-orange-500">
            {localizedName}
          </h3>
        </Link>

        <p className="mt-0.5 truncate text-[11px] text-slate-500">
          {packageInfo}
        </p>

        <div className="mt-auto pt-2">
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <span className="text-sm font-black text-slate-950">
                {(price + pfandAmount).toFixed(2)} €
              </span>

              {oldPrice ? (
                <span className="ml-1.5 text-[10px] text-slate-400 line-through">
                  {(oldPrice + pfandAmount).toFixed(2)} €
                </span>
              ) : null}

              {pfandAmount > 0 ? (
                <p className="mt-0.5 text-[9px] font-bold text-orange-600">
                  {price.toFixed(2)} € + {pfandAmount.toFixed(2)} € {t.pfand}
                </p>
              ) : null}
            </div>
          </div>

          <div className="mt-1.5 flex items-center gap-1.5">
            <div className="flex h-8 shrink-0 items-center rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={decreaseQuantity}
                disabled={quantity <= 1 || !inStock}
                aria-label={t.decreaseQuantity}
                className="flex h-full w-8 items-center justify-center text-slate-600 transition hover:text-orange-500 disabled:text-slate-300"
              >
                <Minus size={14} />
              </button>

              <span className="min-w-6 text-center text-xs font-black">
                {quantity}
              </span>

              <button
                type="button"
                onClick={increaseQuantity}
                disabled={!inStock}
                aria-label={t.increaseQuantity}
                className="flex h-full w-8 items-center justify-center text-slate-600 transition hover:text-orange-500 disabled:text-slate-300"
              >
                <Plus size={14} />
              </button>
            </div>

            <button
              type="button"
              disabled={!inStock}
              onClick={handleAddToCart}
              className={`flex h-8 min-w-0 flex-1 items-center justify-center gap-1 rounded-lg px-2 text-[10px] font-black text-white transition ${added ? 'bg-orange-500' : 'bg-slate-950 hover:bg-orange-500'} disabled:bg-slate-300`}
            >
              {added ? <Check size={15} /> : <ShoppingCart size={15} />}

              <span className="truncate">
                {added ? (language === 'de' ? 'Hinzugefügt' : 'Eklendi') : t.addToCart}
              </span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
