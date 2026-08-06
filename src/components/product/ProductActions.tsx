"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { Minus, Plus, ShoppingCart } from "lucide-react";

type ProductActionsProps = {
  id: string;
  name: string;
  price: number;
  pfandAmount: number;
  image: string;
  packageInfo: string;
  inStock: boolean;
};

export default function ProductActions({
  id,
  name,
  price,
  pfandAmount,
  image,
  packageInfo,
  inStock,
}: ProductActionsProps) {
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();
  const { language } = useLanguage();

  const t = language === "de"
    ? {
        decrease: "Menge verringern",
        increase: "Menge erhöhen",
        add: "In den Warenkorb",
        out: "Nicht verfügbar",
      }
    : {
        decrease: "Adedi azalt",
        increase: "Adedi artır",
        add: "Sepete Ekle",
        out: "Stokta Yok",
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
        name,
        price,
        pfandAmount,
        image,
        packageInfo,
      },
      quantity,
    );
  }

  return (
    <div className="mt-8 flex flex-col gap-4 sm:flex-row">
      <div className="flex h-14 items-center justify-between rounded-xl border border-slate-200 bg-white">
        <button
          type="button"
          onClick={decreaseQuantity}
          disabled={quantity <= 1}
          aria-label={t.decrease}
          className="flex h-full w-12 items-center justify-center text-slate-600 transition hover:text-orange-500 disabled:cursor-not-allowed disabled:text-slate-300"
        >
          <Minus size={18} />
        </button>

        <span className="min-w-10 text-center font-black">{quantity}</span>

        <button
          type="button"
          onClick={increaseQuantity}
          aria-label={t.increase}
          className="flex h-full w-12 items-center justify-center text-slate-600 transition hover:text-orange-500"
        >
          <Plus size={18} />
        </button>
      </div>

      <button
        type="button"
        onClick={handleAddToCart}
        disabled={!inStock}
        className="inline-flex h-14 flex-1 items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 font-black text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        <ShoppingCart size={20} />

        {inStock ? t.add : t.out}
      </button>
    </div>
  );
}
