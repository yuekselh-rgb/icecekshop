"use client";

import { useLanguage } from "@/context/LanguageContext";
import {
  Coffee,
  Milk,
  Package,
  Pizza,
  ShoppingBasket,
  SprayCan,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type CategorySlug =
  "all" | "icecekler" | "ambalaj" | "sicak-icecek" | "take-away" | "temizlik";


type HomeCategory = {
  id: string;
  slug: string;
  name: string;
  nameTr?: string | null;
  nameDe?: string | null;
  type: string;
};


const iconMap = {
  DRINK: Milk,
  PACKAGING: Package,
  TAKEAWAY: Pizza,
  CLEANING: SprayCan,
  OTHER: Coffee,
} as const;

export default function CategorySection({
  initialCategories = [],
}: {
  initialCategories?: HomeCategory[];
}) {
  const { language } = useLanguage();

  const [activeCategory, setActiveCategory] = useState("all");
  const [categories, setCategories] = useState<HomeCategory[]>(
    initialCategories,
  );

  const buttonRefs = useRef<
    Record<string, HTMLButtonElement | null>
  >({})


  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const categoryBarRef = useRef<HTMLElement | null>(null);

  const [isPinned, setIsPinned] = useState(false);
  const [categoryBarHeight, setCategoryBarHeight] = useState(0);

  /*
   * Safari'de sticky bazı sayfa yapılarında çalışmadığı için
   * kategori çubuğunu scroll sırasında gerçek fixed konuma alır.
   */
  useEffect(() => {
    const sentinel = sentinelRef.current;
    const categoryBar = categoryBarRef.current;

    if (!sentinel || !categoryBar) {
      return;
    }

    function updateBarHeight() {
      if (!categoryBar) return;
      setCategoryBarHeight(categoryBar.getBoundingClientRect().height);
    }

    updateBarHeight();

    const resizeObserver = new ResizeObserver(updateBarHeight);
    resizeObserver.observe(categoryBar);

    const observer = new IntersectionObserver(
      ([entry]) => {
        const shouldPin =
          !entry.isIntersecting &&
          entry.boundingClientRect.top < 0;

        setIsPinned(shouldPin);
      },
      {
        root: null,
        threshold: [0, 1],
      },
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
      resizeObserver.disconnect();
    };
  }, []);


  useEffect(() => {
    fetch("/api/categories")
      .then(r => r.json())
      .then(data => {
        console.log("HOME CATEGORIES", data.categories);
        setCategories(data.categories || []);
      })
      .catch(() => {});
  }, []);

;

  /*
   * Sayfa aşağı/yukarı kaydırıldığında sabit barın hemen
   * altındaki ilk ürünün kategorisini aktif yapar.
   */


  /*
   * Scroll sırasında aktif kategoriyi otomatik değiştir.
   *
   * IntersectionObserver kullanır (manuel scroll+rAF hesaplamasının
   * yerine), çünkü bir kategori pilline tıklandığında
   * FeaturedProducts diğer kategori bölümlerini DOM'dan tamamen
   * kaldırıyordu ve eski scroll dinleyicisi bunu fark edemiyordu.
   * Gözlemlenen bölüm listesi, "home-category-change" olayından
   * sonra (DOM güncellendikten bir kare sonra) yeniden taranır.
   */
  useEffect(() => {
    const line = isPinned ? categoryBarHeight + 20 : 150;

    const bottomMargin = Math.max(
      0,
      window.innerHeight - line - 4,
    );

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);

        if (visible.length === 0) {
          return;
        }

        const topMost = visible.reduce((a, b) =>
          a.boundingClientRect.top < b.boundingClientRect.top ? a : b,
        );

        const slug = (topMost.target as HTMLElement).dataset
          .homeProductCategory;

        if (slug) {
          setActiveCategory(slug);
        }
      },
      {
        rootMargin: `-${line}px 0px -${bottomMargin}px 0px`,
        threshold: 0,
      },
    );

    function observeSections() {
      const sections = document.querySelectorAll<HTMLElement>(
        "[data-home-product-category]",
      );

      sections.forEach((section) => observer.observe(section));
    }

    observeSections();

    function handleScrollTop() {
      if (window.scrollY < 80) {
        setActiveCategory("all");
      }
    }

    function handleCategoryChange() {
      observer.disconnect();
      requestAnimationFrame(observeSections);
    }

    handleScrollTop();

    window.addEventListener("scroll", handleScrollTop, {
      passive: true,
    });

    window.addEventListener(
      "home-category-change",
      handleCategoryChange,
    );

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleScrollTop);
      window.removeEventListener(
        "home-category-change",
        handleCategoryChange,
      );
    };
  }, [isPinned, categoryBarHeight]);


  /*
   * Aktif kategori telefonda görünmeyen tarafta kalırsa
   * kategori satırı otomatik olarak yana kayar.
   *
   * İlk mount'ta atlanır: aksi halde varsayılan "all" kategorisi
   * için çalışan bu efekt, kategori çubuğu artık sayfanın daha
   * aşağısında olduğundan (Hero/Vorteile/Pfand/Gastro'dan sonra)
   * sayfa her yüklendiğinde dikey olarak çubuğa kaydırır.
   */
  const isInitialActiveCategoryRender = useRef(true);

  useEffect(() => {
    if (isInitialActiveCategoryRender.current) {
      isInitialActiveCategoryRender.current = false;
      return;
    }

    buttonRefs.current[activeCategory]?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [activeCategory]);

  return (    <>
      <div
        ref={sentinelRef}
        aria-hidden="true"
        className="h-px w-full"
      />

      {isPinned ? (
        <div
          aria-hidden="true"
          style={{ height: categoryBarHeight }}
        />
      ) : null}

      <section
        ref={categoryBarRef}
        className={`border-y border-[#05090a26] bg-white/95 shadow-md backdrop-blur-md ${
          isPinned
            ? "fixed inset-x-0 top-0 z-[9999] w-full"
            : "relative z-[100] w-full"
        }`}
      >
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="flex gap-3 overflow-x-auto py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

          <button
            ref={(element) => {
              buttonRefs.current["all"] = element;
            }}
            type="button"
            onClick={() => {
              setActiveCategory("all");

              window.dispatchEvent(
                new CustomEvent("home-category-change", {
                  detail: {
                    category: "all",
                  },
                }),
              );
            }}
            aria-pressed={activeCategory === "all"}
            className={`group flex shrink-0 items-center gap-2.5 rounded-full border px-4 py-3 transition ${
              activeCategory === "all"
                ? "border-[#1B4965] bg-[#1B4965] text-white shadow-md"
                : "border-[#05090a26] bg-white text-[#05090A] hover:border-[#1B4965] hover:bg-[#E8ECEF]"
            }`}
          >
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-full ${
                activeCategory === "all"
                  ? "bg-white/20 text-white"
                  : "bg-[#E8ECEF] text-[#1B4965]"
              }`}
            >
              <ShoppingBasket size={19} />
            </span>

            <span className="whitespace-nowrap text-sm font-black">
              {language === "de" ? "Alle" : "Tümü"}
            </span>
          </button>

          {categories.map((category) => {
            const Icon = iconMap[category.type as keyof typeof iconMap] ?? ShoppingBasket;

            const isActive = activeCategory === category.slug;

            return (
              <button
                key={category.slug}
                ref={(element) => {
                  buttonRefs.current[category.slug] = element;
                }}
                type="button"
                onClick={() => {
                  setActiveCategory(category.slug);

                  window.dispatchEvent(
                    new CustomEvent("home-category-change", {
                      detail: {
                        category: category.slug,
                      },
                    }),
                  );

                  requestAnimationFrame(() => {
                    document
                      .querySelector(
                        `[data-home-product-category="${category.slug}"]`
                      )
                      ?.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      });
                  });
                }}
                aria-pressed={isActive}
                className={`group flex shrink-0 items-center gap-2.5 rounded-full border px-4 py-3 transition ${
                  isActive
                    ? "border-[#1B4965] bg-[#1B4965] text-white shadow-md"
                    : "border-[#05090a26] bg-white text-[#05090A] hover:border-[#1B4965] hover:bg-[#E8ECEF]"
                }`}
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-full transition ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-[#E8ECEF] text-[#1B4965] group-hover:bg-[#1B4965] group-hover:text-white"
                  }`}
                >
                  <Icon size={19} />
                </span>

                <span className="whitespace-nowrap text-sm font-black">
                  {language === "de"
                    ? (category.nameDe || category.name)
                    : (category.nameTr || category.name)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
    </>
  );
}
