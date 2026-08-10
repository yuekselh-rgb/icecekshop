"use client";

import ProductCard from "@/components/ui/ProductCard";
import { useLanguage } from "@/context/LanguageContext";
import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type LocalizedText = {
  tr: string;
  de: string;
};

type PublicProduct = {
  id: string;
  slug: string;
  name: LocalizedText;
  category: LocalizedText;
  categorySlug: string;
  packageInfo: string;
  price: number;
  pfandAmount: number;
  oldPrice?: number;
  isOffer: boolean;
  image: string;
  imageScale?: number;
  imagePositionX?: number;
  imagePositionY?: number;
  badge?: LocalizedText;
  inStock: boolean;
  stock: number;
};

export default function FeaturedProducts({
  initialProducts = [],
  initialShowOffers = true,
}: {
  initialProducts?: PublicProduct[];
  initialShowOffers?: boolean;
}) {
  const { language } = useLanguage();

  const [products, setProducts] =
    useState<PublicProduct[]>(initialProducts);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(initialProducts.length === 0);
  const [error, setError] = useState("");
  const [showOffers, setShowOffers] = useState(initialShowOffers);

  const t =
    language === "de"
      ? {
          offersEyebrow: "Aktuelle Angebote",
          offersTitle: "Unsere Angebote",
          offersDescription:
            "Entdecken Sie unsere aktuell reduzierten Produkte.",
          allProductsTitle: "Alle Produkte",
          allProductsDescription:
            "Entdecken Sie unser gesamtes Sortiment nach Kategorien.",
          noOffers: "Aktuell sind keine Angebote verfügbar.",
          noProducts: "In dieser Kategorie sind noch keine Produkte vorhanden.",
          loading: "Produkte werden geladen...",
          error: "Produkte konnten nicht geladen werden.",
        }
      : {
          offersEyebrow: "Güncel Kampanyalar",
          offersTitle: "Kampanyalı Ürünler",
          offersDescription:
            "Güncel indirimli ve kampanyalı ürünlerimizi keşfedin.",
          allProductsTitle: "Tüm Ürünler",
          allProductsDescription:
            "Tüm ürün çeşitlerimizi kategorilere göre inceleyin.",
          noOffers: "Şu anda kampanyalı ürün bulunmuyor.",
          noProducts: "Bu kategoride henüz ürün bulunmuyor.",
          loading: "Ürünler yükleniyor...",
          error: "Ürünler yüklenemedi.",
        };

  useEffect(() => {
    /*
     * Sunucu tarafında initialProducts zaten taze çekildiyse
     * (anasayfanın tek çağrı noktası her zaman bunu sağlıyor),
     * mount anında aynı verileri tekrar istemek gereksiz bir
     * ağ round-trip'i ekliyordu.
     */
    if (initialProducts.length > 0) {
      return;
    }

    async function loadProducts() {
      try {
        const [productsResponse, settingsResponse] = await Promise.all([
          fetch("/api/products"),
          fetch("/api/company-settings"),
        ]);

        const productsData = await productsResponse.json();
        const settingsData = await settingsResponse.json();

        if (!productsResponse.ok) {
          setError(productsData.error || t.error);
          return;
        }

        setProducts(productsData.products || []);

        if (settingsResponse.ok && settingsData.settings) {
          setShowOffers(settingsData.settings.showOffers !== false);
        }
      } catch {
        setError(t.error);
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t.error]);

  const offerProducts = useMemo(
    () => products.filter((product) => product.isOffer),
    [products],
  );


  const groupedProducts = useMemo(() => {
    const filtered =
      selectedCategory === "all"
        ? products
        : products.filter(
            (product) => product.categorySlug === selectedCategory,
          );

    const map = new Map();

    for (const product of filtered) {
      if (!map.has(product.categorySlug)) {
        map.set(product.categorySlug, {
          slug: product.categorySlug,
          category: product.category,
          products: [],
        });
      }

      map.get(product.categorySlug).products.push(product);
    }

    return Array.from(map.values());
  }, [products, selectedCategory]);

  useEffect(() => {
    function handleCategoryChange(event: Event) {
      const customEvent = event as CustomEvent<{ category: string }>;

      console.log("EVENT RECEIVED:", customEvent.detail.category);
      setSelectedCategory(customEvent.detail.category || "all");
    }

    window.addEventListener(
      "home-category-change",
      handleCategoryChange,
    );

    return () => {
      window.removeEventListener(
        "home-category-change",
        handleCategoryChange,
      );
    };
  }, []);

  useEffect(() => {
    if (selectedCategory === "all") return;

    document
      .getElementById("home-products")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  }, [selectedCategory]);


  function renderProductCard(product: PublicProduct) {
    return (
      <div
        key={product.id}
        className="min-w-0"
      >
        <ProductCard
          id={product.id}
          name={product.name}
          category={product.category}
          categorySlug={product.categorySlug}
          packageInfo={product.packageInfo}
          price={product.price}
          pfandAmount={product.pfandAmount}
          oldPrice={product.oldPrice}
          image={product.image}
          imageScale={product.imageScale}
          imagePositionX={product.imagePositionX}
          imagePositionY={product.imagePositionY}
          badge={product.badge}
          inStock={product.inStock}
        />
      </div>
    );
  }

  return (
    <section className="bg-white px-4 py-12 lg:px-8 lg:py-16">
      <div className="mx-auto max-w-7xl">
        {loading ? (
          <div className="flex min-h-64 items-center justify-center gap-3 font-bold text-slate-500">
            <Loader2 className="animate-spin" />
            {t.loading}
          </div>
        ) : error ? (
          <div className="rounded-2xl bg-red-50 p-5 font-bold text-red-600">
            {error}
          </div>
        ) : (
          <div>
            {showOffers && offerProducts.length > 0 ? (
              <section className="mb-12">
                <div className="mb-6">
                  <p className="font-bold text-sky-500">{t.offersEyebrow}</p>

                  <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                    {t.offersTitle}
                  </h2>

                  <p className="mt-3 max-w-2xl text-slate-600">
                    {t.offersDescription}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
                  {offerProducts.map(renderProductCard)}
                </div>
              </section>
            ) : null}

            <section id="home-products" className="scroll-mt-28">
              <div className="mb-8">
                <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                  {t.allProductsTitle}
                </h2>

                <p className="mt-3 max-w-2xl text-slate-600">
                  {t.allProductsDescription}
                </p>
              </div>

              
{groupedProducts.map((group) => (
  <section
    key={group.slug}
    data-home-product-category={group.slug}
    className="mb-10 scroll-mt-28"
  >
    <h3 className="mb-4 text-2xl font-black">
      {language === "de"
        ? group.category.de
        : group.category.tr}
    </h3>

    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
      {group.products.map(renderProductCard)}
    </div>
  </section>
))}

            </section>
          </div>
        )}
      </div>
    </section>
  );
}
