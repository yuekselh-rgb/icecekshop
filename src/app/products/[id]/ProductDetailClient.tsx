"use client";

import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import ProductActions from "@/components/product/ProductActions";
import ProductCard from "@/components/ui/ProductCard";
import { useLanguage } from "@/context/LanguageContext";
import { trackProductView } from "@/lib/analytics";
import { Check, Loader2, RotateCcw } from "lucide-react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type LocalizedText = {
  tr: string;
  de: string;
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

type PublicProduct = {
  id: string;
  slug: string;
  name: LocalizedText;
  category: LocalizedText;
  categorySlug: string;
  description: LocalizedText;
  packageInfo: string;
  price: number;
  oldPrice?: number;
  pfandAmount: number;
  image: string;
  imageScale?: number;
  imagePositionX?: number;
  imagePositionY?: number;
  badge?: LocalizedText;
  stock: number;
  inStock: boolean;
  sellByCarton?: boolean;
  unitsPerCarton?: number | null;
  cartonPrice?: number | null;
};

export default function ProductDetailClient({
  initialSettings,
}: {
  initialSettings?: any;
} = {}) {
  const params = useParams<{
    id: string;
  }>();

  const { language } = useLanguage();

  const t =
    language === "de"
      ? {
          productNotFound: "Produkt nicht gefunden",
          loading: "Produkt wird geladen...",
          productInfo: "Produktinformationen",
          category: "Kategorie",
          package: "Verpackung",
          pfand: "Pfand",
          inStock: "Auf Lager",
          outOfStock: "Produkt derzeit nicht verfügbar",
          depositReturn: "Pfandrückgabe",
          depositReturnText:
            "Bei pfandpflichtigen Produkten können Sie leere Kisten oder Flaschen bei der Lieferung zurückgeben.",
          related: "Ähnliche Produkte",
          youMayLike: "Das könnte Sie auch interessieren",
          loadError: "Produkt konnte nicht geladen werden.",
        }
      : {
          productNotFound: "Ürün bulunamadı",
          loading: "Ürün yükleniyor...",
          productInfo: "Ürün Bilgileri",
          category: "Kategori",
          package: "Paket",
          pfand: "Pfand",
          inStock: "Stokta",
          outOfStock: "Ürün şu anda stokta yok",
          depositReturn: "Pfand İadesi",
          depositReturnText:
            "Pfand içeren ürünlerde boş kasa veya şişelerinizi teslimat sırasında iade edebilirsiniz.",
          related: "Benzer Ürünler",
          youMayLike: "Bunlar da ilginizi çekebilir",
          loadError: "Ürün yüklenirken hata oluştu.",
        };

  const [product, setProduct] = useState<PublicProduct | null>(null);

  const [relatedProducts, setRelatedProducts] = useState<PublicProduct[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProduct() {
      try {
        const response = await fetch(`/api/products/${params.id}`);

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || t.productNotFound);
          return;
        }

        setProduct(data.product);
        setRelatedProducts(data.relatedProducts);
      } catch {
        setError(t.loadError);
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [params.id]);

  const trackedProductViewRef = useRef<string | null>(null);

  useEffect(() => {
    if (!product || trackedProductViewRef.current === product.id) {
      return;
    }

    trackedProductViewRef.current = product.id;

    trackProductView({
      id: product.id,
      name: product.name[language],
      price: product.price,
    });
    // Nur einmal pro Produkt-ID feuern, nicht bei jedem Sprachwechsel.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f7f5]">
        <Header initialSettings={initialSettings} />

        <div className="flex min-h-[500px] items-center justify-center gap-3 font-bold text-slate-500">
          <Loader2 className="animate-spin" />

          {t.loading}
        </div>

        <Footer initialSettings={initialSettings} />
      </main>
    );
  }

  if (!product || error) {
    return (
      <main className="min-h-screen bg-[#f7f7f5]">
        <Header initialSettings={initialSettings} />

        <section className="px-4 py-20 text-center">
          <h1 className="text-3xl font-black text-slate-950">
            {t.productNotFound}
          </h1>

          {error ? <p className="mt-3 text-slate-500">{error}</p> : null}
        </section>

        <Footer initialSettings={initialSettings} />
      </main>
    );
  }

  const localizedName = product.name[language];

  const localizedCategory = product.category[language];

  const localizedBadge = product.badge?.[language];

  const localizedDescription = product.description[language];

  return (
    <main className="min-h-screen bg-[#f7f7f5]">
      <Header initialSettings={initialSettings} />

      <section className="px-4 py-10 lg:px-8 lg:py-14">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="relative flex min-h-[480px] items-center justify-center overflow-hidden rounded-[32px] bg-white p-10 shadow-sm">
              {localizedBadge ? (
                <span className="absolute left-6 top-6 rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white">
                  {localizedBadge}
                </span>
              ) : null}

              {isImageSource(product.image) ? (
                <Image
                  src={product.image}
                  alt={localizedName}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-contain transition duration-300"
                  style={{
                    transform: `translate(${product.imagePositionX ?? 0}px, ${
                      product.imagePositionY ?? 0
                    }px) scale(${product.imageScale ?? 1})`,
                    transformOrigin: "center",
                  }}
                />
              ) : (
                <span className="text-[140px] sm:text-[180px]">
                  {product.image || "📦"}
                </span>
              )}
            </div>

            <div className="rounded-[32px] bg-white p-7 shadow-sm sm:p-10">
              <p className="font-bold text-orange-500">{localizedCategory}</p>

              <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">
                {localizedName}
              </h1>

              <p className="mt-3 text-lg text-slate-500">
                {product.packageInfo}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <div>
                  <span className="text-3xl font-black text-slate-950">
                    {(product.price + product.pfandAmount).toFixed(2)} €
                  </span>

                  {product.pfandAmount > 0 ? (
                    <p className="mt-1 text-sm font-bold text-orange-600">
                      {product.price.toFixed(2)} € +{" "}
                      {product.pfandAmount.toFixed(2)} € {t.pfand}
                    </p>
                  ) : null}
                </div>

                {product.oldPrice ? (
                  <span className="text-lg text-slate-400 line-through">
                    {(product.oldPrice + product.pfandAmount).toFixed(2)} €
                  </span>
                ) : null}
              </div>

              <div className="mt-6 flex items-center gap-2">
                <Check
                  size={19}
                  className={
                    product.inStock ? "text-green-600" : "text-red-500"
                  }
                />

                <span
                  className={`font-bold ${
                    product.inStock ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {product.inStock ? t.inStock : t.outOfStock}
                </span>
              </div>

              {localizedDescription ? (
                <p className="mt-6 leading-7 text-slate-600">
                  {localizedDescription}
                </p>
              ) : null}

              <div className="mt-8 rounded-2xl bg-slate-50 p-5">
                <h2 className="font-black text-slate-950">
                  {t.productInfo}
                </h2>

                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between gap-4 border-b border-slate-200 pb-3">
                    <span className="text-slate-500">
                      {t.category}
                    </span>

                    <span className="font-bold text-slate-950">
                      {localizedCategory}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4 border-b border-slate-200 pb-3">
                    <span className="text-slate-500">
                      {t.package}
                    </span>

                    <span className="font-bold text-slate-950">
                      {product.packageInfo}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4 border-b border-slate-200 pb-3">
                    <span className="text-slate-500">{t.pfand}</span>

                    <span className="font-bold text-slate-950">
                      {product.pfandAmount.toFixed(2)} €
                    </span>
                  </div>
                </div>
              </div>

              <ProductActions
                id={product.id}
                name={localizedName}
                price={product.price}
                pfandAmount={product.pfandAmount}
                image={product.image}
                packageInfo={product.packageInfo}
                inStock={product.inStock}
                sellByCarton={product.sellByCarton}
                unitsPerCarton={product.unitsPerCarton}
                cartonPrice={product.cartonPrice}
              />

              <div className="mt-6 flex items-start gap-3 rounded-2xl border border-orange-100 bg-orange-50 p-4">
                <RotateCcw
                  size={21}
                  className="mt-0.5 shrink-0 text-orange-500"
                />

                <div>
                  <p className="font-black text-slate-950">
                    {t.depositReturn}
                  </p>

                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {t.depositReturnText}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {relatedProducts.length > 0 ? (
        <section className="bg-white px-4 py-16 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <p className="font-bold text-orange-500">
              {t.related}
            </p>

            <h2 className="mt-2 text-3xl font-black text-slate-950">
              {t.youMayLike}
            </h2>

            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {relatedProducts.map((item) => (
                <ProductCard
                  key={item.id}
                  id={item.id}
                  name={item.name}
                  category={item.category}
                  categorySlug={item.categorySlug}
                  packageInfo={item.packageInfo}
                  price={item.price}
                  pfandAmount={item.pfandAmount}
                  oldPrice={item.oldPrice}
                  image={item.image}
                  imageScale={item.imageScale}
                  imagePositionX={item.imagePositionX}
                  imagePositionY={item.imagePositionY}
                  badge={item.badge}
                  inStock={item.inStock}
                  sellByCarton={item.sellByCarton}
                  unitsPerCarton={item.unitsPerCarton}
                  cartonPrice={item.cartonPrice}
                />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <Footer initialSettings={initialSettings} />
    </main>
  );
}
