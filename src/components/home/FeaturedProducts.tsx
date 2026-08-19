"use client";

import ProductCard from "@/components/ui/ProductCard";
import { useLanguage } from "@/context/LanguageContext";
import { ChevronDown, ChevronUp, Loader2, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

/*
 * Auf der Startseite wird pro Kategorie zunächst nur eine Vorschau
 * gezeigt -- bei allen Produkten inline auf einer Seite wurde die
 * Startseite so hoch (30.000px+), dass sie in manchen Browsern/Geräten
 * nicht mehr vollständig gerendert wurde (GPU-Kompositions-Limit).
 * "Alle anzeigen" blendet die restlichen Produkte der jeweiligen
 * Kategorie direkt ein, statt auf /products zu verlinken.
 */
const PREVIEW_COUNT = 8;

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
  sellByCarton?: boolean;
  unitsPerCarton?: number | null;
  cartonPrice?: number | null;
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
  const [searchQuery, setSearchQuery] = useState("");

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(),
  );

  const searchInputRef = useRef<HTMLInputElement>(null);

  function toggleCategoryExpanded(slug: string) {
    setExpandedCategories((current) => {
      const next = new Set(current);

      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }

      return next;
    });
  }

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
          showAll: "Alle anzeigen",
          showLess: "Weniger anzeigen",
          searchPlaceholder: "Produkt suchen",
          searchResultsFor: (query: string) => `Suchergebnisse für „${query}“`,
          clearSearch: "Suche zurücksetzen",
          noSearchResults: (query: string) =>
            `Keine Produkte gefunden für „${query}“.`,
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
          showAll: "Tümünü gör",
          showLess: "Daha az göster",
          searchPlaceholder: "Ürün ara",
          searchResultsFor: (query: string) => `„${query}“ için arama sonuçları`,
          clearSearch: "Aramayı temizle",
          noSearchResults: (query: string) =>
            `„${query}“ için ürün bulunamadı.`,
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
    const normalizedSearch = searchQuery.trim().toLowerCase();

    const filtered = products
      .filter(
        (product) =>
          selectedCategory === "all" ||
          product.categorySlug === selectedCategory,
      )
      .filter(
        (product) =>
          normalizedSearch === "" ||
          product.name[language].toLowerCase().includes(normalizedSearch),
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
  }, [products, selectedCategory, searchQuery, language]);

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

  /*
   * Das Kopfzeilen-Suchsymbol scrollt hierher und feuert dieses Event
   * einmalig, um das lokale Suchfeld zu fokussieren — die eigentliche
   * Live-Filterung passiert direkt hier über das Suchfeld selbst.
   */
  useEffect(() => {
    function handleFocusRequest() {
      searchInputRef.current?.focus();
    }

    window.addEventListener("focus-home-search", handleFocusRequest);

    return () => {
      window.removeEventListener("focus-home-search", handleFocusRequest);
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
          sellByCarton={product.sellByCarton}
          unitsPerCarton={product.unitsPerCarton}
          cartonPrice={product.cartonPrice}
        />
      </div>
    );
  }

  return (
    <section className="bg-white px-4 py-12 lg:px-8 lg:py-16">
      <div className="mx-auto max-w-7xl">
        {loading ? (
          <div className="flex min-h-64 items-center justify-center gap-3 font-bold text-[#505253]">
            <Loader2 className="animate-spin" />
            {t.loading}
          </div>
        ) : error ? (
          <div className="rounded-none bg-red-50 p-5 font-bold text-red-600">
            {error}
          </div>
        ) : (
          <div>
            <section id="home-products" className="scroll-mt-28">
              <div className="relative mx-auto mb-8 max-w-md">
                <Search
                  size={20}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#828484]"
                />

                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(event) => {
                    setSearchQuery(event.target.value);
                    setSelectedCategory("all");
                  }}
                  placeholder={t.searchPlaceholder}
                  className="w-full rounded-full border border-[#05090a26] py-3 pl-12 pr-12 outline-none transition focus:border-[#0E6FAE]"
                />

                {searchQuery ? (
                  <button
                    type="button"
                    aria-label={t.clearSearch}
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-[#828484] transition hover:text-[#05090A]"
                  >
                    <X size={18} />
                  </button>
                ) : null}
              </div>
            </section>

            {showOffers && offerProducts.length > 0 ? (
              <section className="mb-16">
                <div className="mx-auto mb-8 max-w-lg text-center">
                  <p className="font-semibold text-[#05090A]">{t.offersEyebrow}</p>

                  <h2 className="mt-3 text-3xl font-medium tracking-tight text-[#05090A] sm:text-4xl">
                    {t.offersTitle}
                  </h2>

                  <p className="mt-3 text-[#505253]">
                    {t.offersDescription}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                  {offerProducts.map(renderProductCard)}
                </div>
              </section>
            ) : null}

            <section>
              {searchQuery.trim() ? (
                <div className="mx-auto mb-8 max-w-lg text-center">
                  <p className="font-semibold text-[#05090A]">
                    {t.searchResultsFor(searchQuery.trim())}
                  </p>
                </div>
              ) : (
                <div className="mx-auto mb-12 max-w-lg text-center">
                  <p className="font-semibold text-[#05090A]">
                    {language === "de" ? "Sortiment" : "Ürünler"}
                  </p>

                  <h2 className="mt-3 text-3xl font-medium tracking-tight text-[#05090A] sm:text-4xl">
                    {t.allProductsTitle}
                  </h2>

                  <p className="mt-3 text-[#505253]">
                    {t.allProductsDescription}
                  </p>
                </div>
              )}

              {searchQuery.trim() && groupedProducts.length === 0 ? (
                <p className="mx-auto max-w-lg text-center text-[#505253]">
                  {t.noSearchResults(searchQuery.trim())}
                </p>
              ) : null}

{groupedProducts.map((group) => {
  const hasMore = group.products.length > PREVIEW_COUNT;
  const isExpanded = expandedCategories.has(group.slug);
  const visibleProducts =
    isExpanded || !hasMore
      ? group.products
      : group.products.slice(0, PREVIEW_COUNT);

  return (
    <section
      key={group.slug}
      data-home-product-category={group.slug}
      className="mb-10 scroll-mt-28"
    >
      <div className="mb-4 flex items-center justify-between gap-4">
        <h3 className="text-2xl font-medium text-[#05090A]">
          {language === "de"
            ? group.category.de
            : group.category.tr}
        </h3>

        {hasMore ? (
          <button
            type="button"
            onClick={() => toggleCategoryExpanded(group.slug)}
            className="flex shrink-0 items-center gap-1.5 text-sm font-semibold text-[#0E6FAE] transition hover:text-[#05090A]"
          >
            {isExpanded ? t.showLess : t.showAll}
            {isExpanded ? (
              <ChevronUp size={16} />
            ) : (
              <ChevronDown size={16} />
            )}
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {visibleProducts.map(renderProductCard)}
      </div>
    </section>
  );
})}

            </section>
          </div>
        )}
      </div>
    </section>
  );
}
