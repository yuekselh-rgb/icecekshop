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
  sellByCarton?: boolean;
  unitsPerCarton?: number | null;
  cartonPrice?: number | null;
};

export default function ProductActions({
  id,
  name,
  price,
  pfandAmount,
  image,
  packageInfo,
  inStock,
  sellByCarton = false,
  unitsPerCarton,
  cartonPrice,
}: ProductActionsProps) {
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();
  const { language } = useLanguage();

  const canSellByCarton = Boolean(
    sellByCarton && unitsPerCarton && cartonPrice !== null && cartonPrice !== undefined,
  );

  const [selectedUnit, setSelectedUnit] = useState<"PIECE" | "CARTON">(
    "PIECE",
  );

  const t = language === "de"
    ? {
        decrease: "Menge verringern",
        increase: "Menge erhöhen",
        add: "In den Warenkorb",
        out: "Nicht verfügbar",
        piece: "Stück",
        carton: "Karton",
        pfand: "Pfand",
      }
    : {
        decrease: "Adedi azalt",
        increase: "Adedi artır",
        add: "Sepete Ekle",
        out: "Stokta Yok",
        piece: "Adet",
        carton: "Karton",
        pfand: "Pfand",
      };

  const effectiveUnit = canSellByCarton ? selectedUnit : "PIECE";

  const effectivePrice =
    effectiveUnit === "CARTON" ? Number(cartonPrice) : price;

  const effectivePfand =
    effectiveUnit === "CARTON"
      ? pfandAmount * Number(unitsPerCarton)
      : pfandAmount;

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
        id: effectiveUnit === "CARTON" ? `${id}::CARTON` : id,
        productId: id,
        unit: effectiveUnit,
        unitsPerCarton:
          effectiveUnit === "CARTON" ? Number(unitsPerCarton) : undefined,
        name:
          effectiveUnit === "CARTON" ? `${name} (${t.carton})` : name,
        price: effectivePrice,
        pfandAmount: effectivePfand,
        image,
        packageInfo,
      },
      quantity,
    );
  }

  return (
    <div className="mt-8">
      {canSellByCarton ? (
        <div className="mb-4 flex gap-1.5 rounded-xl border border-slate-200 bg-white p-1 text-sm font-bold">
          <button
            type="button"
            onClick={() => setSelectedUnit("PIECE")}
            className={`flex-1 rounded-lg py-2 transition ${
              selectedUnit === "PIECE"
                ? "bg-slate-950 text-white"
                : "text-slate-600"
            }`}
          >
            {t.piece} · {price.toFixed(2)} €
          </button>

          <button
            type="button"
            onClick={() => setSelectedUnit("CARTON")}
            className={`flex-1 rounded-lg py-2 transition ${
              selectedUnit === "CARTON"
                ? "bg-slate-950 text-white"
                : "text-slate-600"
            }`}
          >
            {t.carton} ({unitsPerCarton}×) · {Number(cartonPrice).toFixed(2)} €
          </button>
        </div>
      ) : null}

      {effectivePfand > 0 ? (
        <p className="mb-3 text-sm font-bold text-orange-600">
          {effectivePrice.toFixed(2)} € + {effectivePfand.toFixed(2)} € {t.pfand}{" "}
          = {(effectivePrice + effectivePfand).toFixed(2)} €
        </p>
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row">
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
    </div>
  );
}
