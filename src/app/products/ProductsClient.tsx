"use client";

import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import ProductCard from "@/components/ui/ProductCard";
import { useLanguage } from "@/context/LanguageContext";
import { trackSearch } from "@/lib/analytics";
import { Loader2, Search, SlidersHorizontal } from "lucide-react";
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
  oldPrice?: number;
  pfandAmount: number;
  image: string;
  imageScale?: number;
  imagePositionX?: number;
  imagePositionY?: number;
  badge?: LocalizedText;
  inStock: boolean;
  stock: number;
  createdAt: string;
  sellByCarton?: boolean;
  unitsPerCarton?: number | null;
  cartonPrice?: number | null;
};

export default function ProductsClient({
  initialSettings,
}: {
  initialSettings?: any;
} = {}) {
  const { language, translations } = useLanguage();

  const t = {
    ...translations[language].productsPage,
    loadingText:
      language === "de"
        ? "Produkte werden geladen..."
        : "Ürünler yükleniyor...",
    showAll:
      language === "de"
        ? "Alle Produkte anzeigen"
        : "Tüm ürünleri göster",
    noProductsTitle:
      language === "de"
        ? "Keine Produkte gefunden"
        : "Ürün bulunamadı",
    noProductsDescription:
      language === "de"
        ? "Ändern Sie Ihre Suche oder wählen Sie eine andere Kategorie."
        : "Arama kelimenizi değiştirin veya başka bir kategori seçin.",
    hotDrinks:
      language === "de"
        ? "Kaffee & Heißgetränke"
        : "Kahve & Sıcak İçecek",
    inStockOnly:
      language === "de"
        ? "Nur verfügbare Produkte"
        : "Sadece stokta olanlar",
    loadError:
      language === "de"
        ? "Produkte konnten nicht geladen werden."
        : "Ürünler yüklenemedi.",
  };

  const [products, setProducts] = useState<PublicProduct[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [activeCategory, setActiveCategory] = useState("all");

  const [sortOption, setSortOption] = useState<
    "recommended" | "priceAsc" | "priceDesc" | "newest"
  >("recommended");

  const [inStockOnly, setInStockOnly] = useState(false);

  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const validCategories = new Set([
      "all",
      "icecekler",
      "ambalaj",
      "sicak-icecek",
      "take-away",
      "temizlik",
    ]);

    const syncFromUrl = () => {
      const params = new URLSearchParams(window.location.search);

      const category = params.get("category") || "all";

      setActiveCategory(validCategories.has(category) ? category : "all");

      setSearch(params.get("search") || "");
    };

    syncFromUrl();

    window.addEventListener("popstate", syncFromUrl);

    return () => {
      window.removeEventListener("popstate", syncFromUrl);
    };
  }, []);

  function changeCategory(category: string) {
    setActiveCategory(category);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    const url = new URL(window.location.href);

    if (category === "all") {
      url.searchParams.delete("category");
    } else {
      url.searchParams.set("category", category);
    }

    window.history.pushState({}, "", `${url.pathname}${url.search}`);
  }

  useEffect(() => {
    async function loadProducts() {
      try {
        const response = await fetch("/api/products");

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || t.loadError);
          return;
        }

        setProducts(data.products);
      } catch {
        setError(t.loadError);
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const filtered = products.filter((product) => {
      const matchesCategory =
        activeCategory === "all" || product.categorySlug === activeCategory;

      const matchesSearch =
        normalizedSearch === "" ||
        product.name[language].toLowerCase().includes(normalizedSearch);

      const matchesStock = !inStockOnly || product.inStock;

      return matchesCategory && matchesSearch && matchesStock;
    });

    const sorted = [...filtered];

    if (sortOption === "priceAsc") {
      sorted.sort((a, b) => a.price - b.price);
    } else if (sortOption === "priceDesc") {
      sorted.sort((a, b) => b.price - a.price);
    } else if (sortOption === "newest") {
      sorted.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    }

    return sorted;
  }, [products, search, activeCategory, language, sortOption, inStockOnly]);

  /*
   * Suchvorgänge werden erst getrackt, nachdem der Nutzer für 600ms
   * aufgehört hat zu tippen — sonst würde jeder Tastenanschlag ein
   * eigenes Analytics-Event auslösen.
   */
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 600);

    return () => clearTimeout(handle);
  }, [search]);

  useEffect(() => {
    if (!debouncedSearch) {
      return;
    }

    trackSearch(debouncedSearch, filteredProducts.length);
    // filteredProducts absichtlich nicht in den Deps: soll nur beim
    // Einpendeln des Suchbegriffs feuern, nicht bei jeder Filteränderung.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const categoryButtons = [
    {
      slug: "all",
      label: t.all,
    },
    {
      slug: "icecekler",
      label: t.drinks,
    },
    {
      slug: "ambalaj",
      label: t.packaging,
    },
    {
      slug: "sicak-icecek",
      label: t.hotDrinks,
    },
    {
      slug: "take-away",
      label: t.takeaway,
    },
    {
      slug: "temizlik",
      label: t.cleaning,
    },
  ];

  const activeCategoryLabel =
    categoryButtons.find((category) => category.slug === activeCategory)
      ?.label || t.all;

  return (
    <main className="min-h-screen bg-[#f6f7f9]">
      <Header initialSettings={initialSettings} />

      <section className="border-b border-slate-200 bg-white px-4 py-9 lg:px-8 lg:py-11">
        <div className="w-full">
          <p className="font-bold text-orange-500">{t.eyebrow}</p>

          <div className="mt-2 flex flex-wrap items-end justify-between gap-5">
            <h1 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
              {activeCategory === "all" ? t.title : activeCategoryLabel}
            </h1>

            {activeCategory !== "all" ? (
              <button
                type="button"
                onClick={() => changeCategory("all")}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 transition hover:border-orange-500 hover:text-orange-500"
              >
                {t.showAll}
              </button>
            ) : null}
          </div>

          <p className="mt-4 max-w-2xl text-slate-600">{t.description}</p>
        </div>
      </section>

      <section className="px-4 py-8 lg:px-8 lg:py-10">
        <div className="w-full">
          <div className="sticky top-16 z-30 mb-8 flex flex-col gap-4 rounded-[28px] border border-slate-200 bg-white/95 p-4 shadow-lg shadow-slate-200/40 backdrop-blur-xl lg:relative lg:flex-row lg:items-center lg:justify-between lg:p-5">
            <div className="relative w-full lg:max-w-md">
              <Search
                size={20}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full rounded-xl border border-slate-200 py-3 pl-12 pr-4 outline-none transition focus:border-orange-500"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {categoryButtons.map((category) => (
                <button
                  key={category.slug}
                  type="button"
                  onClick={() => changeCategory(category.slug)}
                  className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                    activeCategory === category.slug
                      ? "bg-slate-950 text-white"
                      : "border border-slate-200 bg-white text-slate-700 hover:border-orange-500 hover:text-orange-500"
                  }`}
                >
                  {category.label}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setShowFilters((open) => !open)}
                className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition ${
                  showFilters || inStockOnly
                    ? "border-orange-500 bg-orange-50 text-orange-600"
                    : "border-slate-200 bg-white text-slate-700"
                }`}
              >
                <SlidersHorizontal size={17} />
                {t.filter}
              </button>
            </div>

            {showFilters ? (
              <div className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:absolute lg:right-5 lg:top-full lg:mt-2 lg:w-64">
                <label className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(event) =>
                      setInStockOnly(event.target.checked)
                    }
                    className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500"
                  />
                  {t.inStockOnly}
                </label>
              </div>
            ) : null}
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-3 py-20 font-bold text-slate-500">
              <Loader2 className="animate-spin" />
              {t.loadingText}
            </div>
          ) : error ? (
            <div className="rounded-2xl bg-red-50 p-5 font-bold text-red-600">
              {error}
            </div>
          ) : (
            <>
              <div className="mb-6 flex items-center justify-between gap-4">
                <p className="text-sm text-slate-500">
                  {filteredProducts.length} {t.productsFound}
                </p>

                <select
                  value={sortOption}
                  onChange={(event) =>
                    setSortOption(
                      event.target.value as typeof sortOption,
                    )
                  }
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none"
                >
                  <option value="recommended">{t.recommended}</option>
                  <option value="priceAsc">{t.priceAsc}</option>
                  <option value="priceDesc">{t.priceDesc}</option>
                  <option value="newest">{t.newest}</option>
                </select>
              </div>

              {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-5">
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      id={product.id}
                      name={product.name}
                      category={product.category}
                      categorySlug={product.categorySlug}
                      packageInfo={product.packageInfo}
                      price={product.price}
                      oldPrice={product.oldPrice}
                      pfandAmount={product.pfandAmount}
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
                  ))}
                </div>
              ) : (
                <div className="rounded-[32px] border border-dashed border-slate-300 bg-white px-6 py-20 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-3xl">
                    🔎
                  </div>

                  <h2 className="mt-5 text-2xl font-black text-slate-950">
                    {t.noProductsTitle}
                  </h2>

                  <p className="mx-auto mt-2 max-w-md text-slate-500">
                    {t.noProductsDescription}
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      changeCategory("all");
                    }}
                    className="mt-6 rounded-xl bg-slate-950 px-5 py-3 font-black text-white transition hover:bg-orange-500"
                  >
                    {t.showAll}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <Footer initialSettings={initialSettings} />
    </main>
  );
}
