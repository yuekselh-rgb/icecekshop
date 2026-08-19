"use client";

import { Check, Minus, Plus, ShoppingCart } from "lucide-react";
import Image from "next/image";
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

  sellByCarton?: boolean;
  unitsPerCarton?: number | null;
  cartonPrice?: number | null;
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
  sellByCarton = false,
  unitsPerCarton,
  cartonPrice,
}: ProductCardProps) {
  const [quantityInput, setQuantityInput] = useState("1");
  const [added, setAdded] = useState(false);

  const canSellByCarton = Boolean(
    sellByCarton && unitsPerCarton && cartonPrice !== null && cartonPrice !== undefined,
  );

  const [selectedUnit, setSelectedUnit] = useState<"PIECE" | "CARTON">(
    "PIECE",
  );

  const quantity = Math.max(1, parseInt(quantityInput, 10) || 1);

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
          quantity: "Menge",
          decreaseQuantity: "Menge verringern",
          increaseQuantity: "Menge erhöhen",
          piece: "Stück",
          carton: "Karton",
        }
      : {
          inStock: "Stokta",
          outOfStock: "Stokta Yok",
          addToCart: "Sepete Ekle",
          pfand: "Pfand",
          quantity: "Adet",
          decreaseQuantity: "Adedi azalt",
          increaseQuantity: "Adedi artır",
          piece: "Adet",
          carton: "Karton",
        };

  const effectiveUnit = canSellByCarton ? selectedUnit : "PIECE";

  const effectivePrice =
    effectiveUnit === "CARTON" ? Number(cartonPrice) : price;

  const effectivePfand =
    effectiveUnit === "CARTON"
      ? pfandAmount * Number(unitsPerCarton)
      : pfandAmount;

  function decreaseQuantity() {
    setQuantityInput((current) =>
      String(Math.max(1, (parseInt(current, 10) || 1) - 1)),
    );
  }

  function increaseQuantity() {
    setQuantityInput((current) => String((parseInt(current, 10) || 1) + 1));
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
          effectiveUnit === "CARTON"
            ? `${localizedName} (${t.carton})`
            : localizedName,
        price: effectivePrice,
        pfandAmount: effectivePfand,
        image,
        packageInfo,
      },
      quantity,
    );

    setQuantityInput("1");

    setAdded(true);

    setTimeout(() => {
      setAdded(false);
    }, 1000);
  }

  return (
    <article
      className="group flex h-full flex-col overflow-hidden rounded-none border border-[#05090a26] bg-white transition duration-300">
      <Link
        href={`/products/${id}`}
        className="relative flex aspect-square items-center justify-center overflow-hidden bg-[#F2F2F2]"
      >
        {localizedBadge ? (
          <span className="absolute left-3 top-3 z-10 rounded-full bg-[#05090A] px-2.5 py-1 text-[10px] font-bold text-white">
            {localizedBadge}
          </span>
        ) : null}

        {isImageSource(image) ? (
          <Image
            src={image}
            alt={localizedName}
            fill
            sizes="(max-width: 1024px) 50vw, 25vw"
            className="object-contain transition duration-300"
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
          <p className="truncate text-[10px] font-bold text-[#0E6FAE]">
            {localizedCategory}
          </p>

          <span
            className={`shrink-0 text-[9px] font-bold ${
              inStock ? "text-green-700" : "text-red-500"
            }`}
          >
            {inStock ? t.inStock : t.outOfStock}
          </span>
        </div>

        <Link href={`/products/${id}`}>
          <h3 className="mt-0.5 line-clamp-2 min-h-9 text-sm font-bold leading-4 text-[#05090A] transition hover:text-[#0E6FAE]">
            {localizedName}
          </h3>
        </Link>

        <p className="mt-0.5 truncate text-[11px] text-[#505253]">
          {packageInfo}
        </p>

        <div className="mt-auto pt-2">
          {canSellByCarton ? (
            <div className="mb-1.5 flex gap-1 rounded-full border border-[#05090a26] p-0.5 text-[10px] font-bold">
              <button
                type="button"
                onClick={() => setSelectedUnit("PIECE")}
                className={`flex-1 rounded-full py-1 transition ${
                  selectedUnit === "PIECE"
                    ? "bg-[#05090A] text-white"
                    : "text-[#505253]"
                }`}
              >
                {t.piece}
              </button>

              <button
                type="button"
                onClick={() => setSelectedUnit("CARTON")}
                className={`flex-1 rounded-full py-1 transition ${
                  selectedUnit === "CARTON"
                    ? "bg-[#05090A] text-white"
                    : "text-[#505253]"
                }`}
              >
                {t.carton} ({unitsPerCarton}×)
              </button>
            </div>
          ) : null}

          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <span className="text-sm font-bold text-[#05090A]">
                {(effectivePrice + effectivePfand).toFixed(2)} €
              </span>

              {oldPrice && effectiveUnit === "PIECE" ? (
                <span className="ml-1.5 text-[10px] text-[#828484] line-through">
                  {(oldPrice + pfandAmount).toFixed(2)} €
                </span>
              ) : null}

              {effectivePfand > 0 ? (
                <p className="mt-0.5 text-[9px] font-bold text-[#0E6FAE]">
                  {effectivePrice.toFixed(2)} € + {effectivePfand.toFixed(2)} €{" "}
                  {t.pfand}
                </p>
              ) : null}
            </div>
          </div>

          <div className="mt-1.5 flex items-center gap-1.5">
            <div className="flex h-8 shrink-0 items-center rounded-none border border-[#05090a26]">
              <button
                type="button"
                onClick={decreaseQuantity}
                disabled={quantity <= 1 || !inStock}
                aria-label={t.decreaseQuantity}
                className="flex h-full w-8 items-center justify-center text-[#505253] transition hover:text-[#0E6FAE] disabled:text-[#D9DADA]"
              >
                <Minus size={14} />
              </button>

              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                disabled={!inStock}
                value={quantityInput}
                onChange={(event) => {
                  const raw = event.target.value;

                  if (raw === "" || /^[0-9]+$/.test(raw)) {
                    setQuantityInput(raw);
                  }
                }}
                onBlur={() => {
                  setQuantityInput(String(quantity));
                }}
                aria-label={t.quantity}
                className="min-w-6 w-8 border-0 bg-transparent text-center text-xs font-bold outline-none disabled:text-[#D9DADA]"
              />

              <button
                type="button"
                onClick={increaseQuantity}
                disabled={!inStock}
                aria-label={t.increaseQuantity}
                className="flex h-full w-8 items-center justify-center text-[#505253] transition hover:text-[#0E6FAE] disabled:text-[#D9DADA]"
              >
                <Plus size={14} />
              </button>
            </div>

            <button
              type="button"
              disabled={!inStock}
              onClick={handleAddToCart}
              aria-label={added ? (language === 'de' ? 'Hinzugefügt' : 'Eklendi') : t.addToCart}
              className={`flex h-8 min-w-0 flex-1 items-center justify-center gap-1 rounded-full px-2 text-[10px] font-bold text-white transition ${added ? 'bg-[#0E6FAE]' : 'bg-[#05090A] hover:bg-[#0E6FAE]'} disabled:bg-[#B4B5B5]`}
            >
              {added ? <Check size={15} /> : <ShoppingCart size={15} />}

              <span className="hidden truncate sm:inline">
                {added ? (language === 'de' ? 'Hinzugefügt' : 'Eklendi') : t.addToCart}
              </span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
