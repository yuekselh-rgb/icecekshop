"use client";

import {
  ArrowLeft,
  Boxes,
  Loader2,
  Minus,
  Plus,
  Search,
} from "lucide-react";
import Link from "next/link";
import {
  FormEvent,
  Fragment,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useLanguage } from "@/context/LanguageContext";

type Product = {
  id: string;
  name: string;
  nameTr:
    string | null;
  nameDe:
    string | null;
  stock: number;
  minStock: number;
  salePrice: number;
  purchasePrice: number;

  soldToday: number;
  soldTodayRevenue: number;
  soldTodayCost: number;
  soldTodayProfit: number;

  soldThisMonth: number;
  soldThisMonthRevenue: number;
  soldThisMonthCost: number;
  soldThisMonthProfit: number;

  soldThisYear: number;
  soldThisYearRevenue: number;
  soldThisYearCost: number;
  soldThisYearProfit: number;

  packageInfo:
    string | null;
  active: boolean;

  category: {
    id: string;
    name: string;
    nameTr:
      string | null;
    nameDe:
      string | null;
  };
};

type StockAction =
  | "STOCK_ADD"
  | "RETURN"
  | "BROKEN"
  | "EXPIRED";

const categoryThemes = [
  {
    container:
      "border-blue-200 bg-blue-50",
    accent:
      "bg-blue-500",
    label:
      "text-blue-600",
    title:
      "text-blue-950",
    badge:
      "border-blue-200 bg-white text-blue-800",
  },
  {
    container:
      "border-orange-200 bg-orange-50",
    accent:
      "bg-orange-500",
    label:
      "text-orange-600",
    title:
      "text-orange-950",
    badge:
      "border-orange-200 bg-white text-orange-800",
  },
  {
    container:
      "border-emerald-200 bg-emerald-50",
    accent:
      "bg-emerald-500",
    label:
      "text-emerald-600",
    title:
      "text-emerald-950",
    badge:
      "border-emerald-200 bg-white text-emerald-800",
  },
  {
    container:
      "border-violet-200 bg-violet-50",
    accent:
      "bg-violet-500",
    label:
      "text-violet-600",
    title:
      "text-violet-950",
    badge:
      "border-violet-200 bg-white text-violet-800",
  },
  {
    container:
      "border-cyan-200 bg-cyan-50",
    accent:
      "bg-cyan-500",
    label:
      "text-cyan-600",
    title:
      "text-cyan-950",
    badge:
      "border-cyan-200 bg-white text-cyan-800",
  },
  {
    container:
      "border-rose-200 bg-rose-50",
    accent:
      "bg-rose-500",
    label:
      "text-rose-600",
    title:
      "text-rose-950",
    badge:
      "border-rose-200 bg-white text-rose-800",
  },
  {
    container:
      "border-amber-200 bg-amber-50",
    accent:
      "bg-amber-500",
    label:
      "text-amber-600",
    title:
      "text-amber-950",
    badge:
      "border-amber-200 bg-white text-amber-800",
  },
  {
    container:
      "border-indigo-200 bg-indigo-50",
    accent:
      "bg-indigo-500",
    label:
      "text-indigo-600",
    title:
      "text-indigo-950",
    badge:
      "border-indigo-200 bg-white text-indigo-800",
  },
] as const;

function getCategoryTheme(
  categoryId: string
) {
  let hash = 0;

  for (
    let index = 0;
    index <
    categoryId.length;
    index += 1
  ) {
    hash =
      (
        hash * 31 +
        categoryId.charCodeAt(
          index
        )
      ) |
      0;
  }

  const themeIndex =
    Math.abs(hash) %
    categoryThemes.length;

  return categoryThemes[
    themeIndex
  ];
}

type StockMovement = {
  id: string;
  productId: string;
  amount: number;
  reason: string;
  createdAt: string;

  product: {
    id: string;
    name: string;
    nameTr:
      string | null;
    nameDe:
      string | null;
  };
};

export default function SuperAdminStockPage() {
  const { language } = useLanguage();

  const t =
    language === "de"
      ? {
          loadError:
            "Bestandsdaten konnten nicht geladen werden.",
          invalidPurchasePrice:
            "Bitte geben Sie einen gültigen Einkaufspreis ein.",
          invalidQuantity:
            "Bitte geben Sie eine gültige Menge ein.",
          exceedsStock:
            "Es kann nicht mehr abgebucht werden, als auf Lager ist.",
          actionFailed:
            "Lagerbuchung fehlgeschlagen.",
          stockUpdated:
            "Lagerbestand aktualisiert.",
          actionError:
            "Lagerbuchung konnte nicht durchgeführt werden.",
          loadingStock:
            "Lagerbestand wird geladen...",
          pageTitle:
            "Lagerverwaltung",
          pageSubtitle:
            "Sehen Sie sich Produktbestände an, fügen Sie Bestand hinzu, buchen Sie ihn ab und verfolgen Sie Lagerbewegungen.",
          productCountLabel:
            "Produktanzahl",
          totalStockLabel:
            "Gesamtbestand",
          stockPurchaseValueLabel:
            "Warenwert im Lager",
          byPurchasePrice:
            "Nach Einkaufspreis",
          todayProfitLabel:
            "Tagesgewinn",
          fromTodaySales:
            "Aus heutigen Verkäufen",
          monthlyProfitLabel:
            "Monatsgewinn",
          fromMonthSales:
            "Aus Verkäufen dieses Monats",
          yearlyProfitLabel:
            "Jahresgewinn",
          sinceJan1:
            "Seit dem 1. Januar",
          criticalStockLabel:
            "Kritischer Bestand",
          outOfStockLabel:
            "Nicht auf Lager",
          searchPlaceholder:
            "Produkt oder Kategorie suchen",
          noProductsFound:
            "Kein Produkt gefunden.",
          colProduct:
            "Produkt",
          colStock:
            "Bestand",
          colPurchasePrice:
            "Einkaufspreis",
          colSalePrice:
            "Verkaufspreis",
          colStockValue:
            "Bestandswert",
          colToday:
            "Heute",
          colThisMonth:
            "Diesen Monat",
          colTodayProfit:
            "Gewinn heute",
          colMonthlyProfit:
            "Gewinn im Monat",
          colActions:
            "Aktionen",
          categoryLabel:
            "Kategorie",
          stockValueBadge:
            "Warenwert",
          noPackageInfo:
            "Keine Verpackungsinfo",
          inactiveBadge:
            "Inaktiv",
          minLabel:
            "Min:",
          saveBtn:
            "Speichern",
          registerPriceLabel:
            "Kassenpreis",
          revenueSuffix:
            "Umsatz",
          dailyLabel:
            "Täglich",
          monthlyLabel:
            "Monatlich",
          addStockBtn:
            "+ Bestand",
          returnBtn:
            "Retoure",
          brokenBtn:
            "Bruch",
          expiredBtn:
            "Verfallen",
          dialogAriaLabel:
            "Fenster für Lagerbewegung",
          dialogEyebrow:
            "Lagerbuchung",
          currentStockLabel:
            "Aktueller Bestand:",
          closeBtn:
            "Schließen",
          actionTitleAdd:
            "Bestand erhöhen",
          actionTitleReturn:
            "Rückgabe an Lieferanten",
          actionTitleBroken:
            "Beschädigte Ware",
          actionTitleExpired:
            "Abgelaufene Ware",
          actionDescAdd:
            "Die eingegebene Menge wird dem aktuellen Bestand hinzugefügt.",
          actionDescReduce:
            "Die eingegebene Menge wird vom aktuellen Bestand abgezogen.",
          quantityLabel:
            "Menge",
          quantityPlaceholder:
            "Menge eingeben",
          submitBtn:
            "Buchung speichern",
        }
      : {
          loadError:
            "Stok bilgileri yüklenemedi.",
          invalidPurchasePrice:
            "Geçerli bir alış fiyatı girin.",
          invalidQuantity:
            "Geçerli bir miktar girin.",
          exceedsStock:
            "Mevcut stoktan daha fazla ürün düşülemez.",
          actionFailed:
            "Stok işlemi başarısız.",
          stockUpdated:
            "Stok güncellendi.",
          actionError:
            "Stok işlemi gerçekleştirilemedi.",
          loadingStock:
            "Stoklar yükleniyor...",
          pageTitle:
            "Stok Yönetimi",
          pageSubtitle:
            "Ürün stoklarını görüntüleyin, ekleyin, azaltın ve stok hareketlerini takip edin.",
          productCountLabel:
            "Ürün Sayısı",
          totalStockLabel:
            "Toplam Stok",
          stockPurchaseValueLabel:
            "Stoktaki Mal Değeri",
          byPurchasePrice:
            "Alış fiyatına göre",
          todayProfitLabel:
            "Bugünkü Kâr",
          fromTodaySales:
            "Bugünkü satışlardan",
          monthlyProfitLabel:
            "Aylık Kâr",
          fromMonthSales:
            "Bu ayki satışlardan",
          yearlyProfitLabel:
            "Yıllık Kâr",
          sinceJan1:
            "1 Ocak'tan bugüne",
          criticalStockLabel:
            "Kritik Stok",
          outOfStockLabel:
            "Stok Bitti",
          searchPlaceholder:
            "Ürün veya kategori ara",
          noProductsFound:
            "Ürün bulunamadı.",
          colProduct:
            "Ürün",
          colStock:
            "Stok",
          colPurchasePrice:
            "Alış Fiyatı",
          colSalePrice:
            "Satış Fiyatı",
          colStockValue:
            "Stok Değeri",
          colToday:
            "Bugün",
          colThisMonth:
            "Bu Ay",
          colTodayProfit:
            "Bugün Kâr",
          colMonthlyProfit:
            "Aylık Kâr",
          colActions:
            "İşlemler",
          categoryLabel:
            "Kategori",
          stockValueBadge:
            "Mal Değeri",
          noPackageInfo:
            "Paket bilgisi yok",
          inactiveBadge:
            "Pasif",
          minLabel:
            "Min:",
          saveBtn:
            "Kaydet",
          registerPriceLabel:
            "Kasadaki fiyat",
          revenueSuffix:
            "ciro",
          dailyLabel:
            "Günlük",
          monthlyLabel:
            "Aylık",
          addStockBtn:
            "+ Stok",
          returnBtn:
            "İade",
          brokenBtn:
            "Kırık",
          expiredBtn:
            "Tarihi",
          dialogAriaLabel:
            "Stok işlemi penceresi",
          dialogEyebrow:
            "Stok İşlemi",
          currentStockLabel:
            "Mevcut stok:",
          closeBtn:
            "Kapat",
          actionTitleAdd:
            "Stok artır",
          actionTitleReturn:
            "Tedarikçiye ürün iadesi",
          actionTitleBroken:
            "Kırılan ürün",
          actionTitleExpired:
            "Tarihi geçen ürün",
          actionDescAdd:
            "Girilen miktar mevcut stoğa eklenecek.",
          actionDescReduce:
            "Girilen miktar mevcut stoktan düşülecek.",
          quantityLabel:
            "Miktar",
          quantityPlaceholder:
            "Miktar girin",
          submitBtn:
            "İşlemi Kaydet",
        };

  const [
    products,
    setProducts,
  ] =
    useState<Product[]>([]);

  const [
    movements,
    setMovements,
  ] =
    useState<
      StockMovement[]
    >([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    savingProductId,
    setSavingProductId,
  ] =
    useState<
      string | null
    >(null);

  const [
    actionDialog,
    setActionDialog,
  ] =
    useState<{
      product: Product;
      action: StockAction;
    } | null>(null);

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    success,
    setSuccess,
  ] =
    useState("");

  async function loadData(
    silent = false
  ) {
    if (!silent) {
      setLoading(true);
    }

    try {
      const response =
        await fetch(
          "/api/super-admin/stock"
        );

      const data =
        await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            t.loadError
        );
        return;
      }

      setProducts(
        data.products ||
          []
      );

      setMovements(
        data.movements ||
          []
      );
    } catch {
      setError(
        t.loadError
      );
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredProducts =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLocaleLowerCase(
            "tr-TR"
          );

      if (!query) {
        return products;
      }

      return products.filter(
        (product) => {
          const text = [
            product.name,
            product.nameTr,
            product.nameDe,
            product.packageInfo,
            product.category.name,
            product.category.nameTr,
            product.category.nameDe,
          ]
            .filter(
              Boolean
            )
            .join(" ")
            .toLocaleLowerCase(
              "tr-TR"
            );

          return text.includes(
            query
          );
        }
      );
    }, [
      products,
      search,
    ]);

  const categorySummaries =
    useMemo(() => {
      const summaries =
        new Map<
          string,
          {
            productCount: number;
            totalStock: number;
            stockValue: number;
          }
        >();

      for (
        const product of
        filteredProducts
      ) {
        const current =
          summaries.get(
            product.category.id
          ) || {
            productCount: 0,
            totalStock: 0,
            stockValue: 0,
          };

        current.productCount +=
          1;

        current.totalStock +=
          product.stock;

        current.stockValue +=
          product.stock *
          product.purchasePrice;

        summaries.set(
          product.category.id,
          current
        );
      }

      return summaries;
    }, [
      filteredProducts,
    ]);

  const summary =
    useMemo(() => {
      const totalStock =
        products.reduce(
          (
            total,
            product
          ) =>
            total +
            product.stock,
          0
        );

      const stockPurchaseValue =
        products.reduce(
          (
            total,
            product
          ) =>
            total +
            product.stock *
              product.purchasePrice,
          0
        );

      const todayProfit =
        products.reduce(
          (
            total,
            product
          ) =>
            total +
            product.soldTodayProfit,
          0
        );

      const monthlyProfit =
        products.reduce(
          (
            total,
            product
          ) =>
            total +
            product.soldThisMonthProfit,
          0
        );

      const yearlyProfit =
        products.reduce(
          (
            total,
            product
          ) => {
            const profit =
              Number(
                product.soldThisYearProfit ??
                  0
              );

            return (
              total +
              (
                Number.isFinite(
                  profit
                )
                  ? profit
                  : 0
              )
            );
          },
          0
        );

      const lowStock =
        products.filter(
          (
            product
          ) =>
            product.stock <=
            product.minStock
        ).length;

      const outOfStock =
        products.filter(
          (
            product
          ) =>
            product.stock ===
            0
        ).length;

      return {
        productCount:
          products.length,

        totalStock,

        stockPurchaseValue:
          Number(
            stockPurchaseValue.toFixed(
              2
            )
          ),

        todayProfit:
          Number(
            todayProfit.toFixed(
              2
            )
          ),

        monthlyProfit:
          Number(
            monthlyProfit.toFixed(
              2
            )
          ),

        yearlyProfit:
          Number(
            yearlyProfit.toFixed(
              2
            )
          ),

        lowStock,
        outOfStock,
      };
    }, [
      products,
    ]);

  async function changeStock(
    event:
      FormEvent<HTMLFormElement>,
    product: Product,
    action:
      | StockAction
      | "UPDATE_PURCHASE_PRICE"
  ) {
    event.preventDefault();

    const form =
      event.currentTarget;

    const formData =
      new FormData(
        form
      );

    const quantity =
      Number(
        formData.get(
          "quantity"
        )
      );

    const purchasePrice =
      Number(
        formData.get(
          "purchasePrice"
        )
      );

    if (
      action ===
      "UPDATE_PURCHASE_PRICE"
    ) {
      if (
        !Number.isFinite(
          purchasePrice
        ) ||
        purchasePrice < 0
      ) {
        setError(
          t.invalidPurchasePrice
        );
        return;
      }
    } else if (
      !Number.isInteger(
        quantity
      ) ||
      quantity <= 0
    ) {
      setError(
        t.invalidQuantity
      );
      return;
    }

    const reducesStock =
      action === "RETURN" ||
      action === "BROKEN" ||
      action === "EXPIRED";

    if (
      reducesStock &&
      quantity >
        product.stock
    ) {
      setError(
        t.exceedsStock
      );
      return;
    }

    setSavingProductId(
      product.id
    );

    setError("");
    setSuccess("");

    try {
      const response =
        await fetch(
          "/api/super-admin/stock",
          {
            method:
              "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                productId:
                  product.id,

                action,

                quantity,

                purchasePrice,
              }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            t.actionFailed
        );
        return;
      }

      setProducts(
        (
          current
        ) =>
          current.map(
            (
              currentProduct
            ) =>
              currentProduct.id ===
              product.id
                ? {
                    ...currentProduct,

                    stock:
                      data.product.stock,

                    purchasePrice:
                      data.product.purchasePrice ??
                      currentProduct.purchasePrice,
                  }
                : currentProduct
          )
      );

      setSuccess(
        data.message ||
          t.stockUpdated
      );

      form.reset();

      if (
        action !==
        "UPDATE_PURCHASE_PRICE"
      ) {
        setActionDialog(
          null
        );
      }

      await loadData(
        true
      );
    } catch {
      setError(
        t.actionError
      );
    } finally {
      setSavingProductId(
        null
      );
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="flex items-center gap-3 font-bold text-slate-600">
          <Loader2
            className="animate-spin"
          />
          {t.loadingStock}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-slate-100 p-4 sm:p-6 lg:p-10">
      <div className="mx-auto min-w-0 w-full max-w-full">
        <Link
          href="/super-admin"
          className="inline-flex items-center gap-2 font-bold text-slate-600 transition hover:text-orange-500"
        >
          <ArrowLeft
            size={18}
          />
          Super Admin
        </Link>

        <section className="mt-6 rounded-[32px] bg-slate-950 p-7 text-white sm:p-10">
          <Boxes
            size={30}
            className="text-orange-400"
          />

          <h1 className="mt-4 text-4xl font-black">
            {t.pageTitle}
          </h1>

          <p className="mt-3 text-slate-400">
            {t.pageSubtitle}
          </p>
        </section>

        <section className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-xs font-black uppercase text-slate-500">
              {t.productCountLabel}
            </p>

            <p className="mt-1 text-2xl font-black text-slate-950">
              {
                summary.productCount
              }
            </p>
          </div>

          <div className="rounded-2xl bg-slate-950 p-4 text-white shadow-sm">
            <p className="text-xs font-black uppercase text-slate-400">
              {t.totalStockLabel}
            </p>

            <p className="mt-1 text-2xl font-black">
              {
                summary.totalStock
              }
            </p>
          </div>

          <div className="rounded-2xl bg-amber-50 p-4 shadow-sm">
            <p className="text-xs font-black uppercase text-amber-700">
              {t.stockPurchaseValueLabel}
            </p>

            <p className="mt-1 text-2xl font-black text-amber-900">
              {summary.stockPurchaseValue.toLocaleString(
                "de-DE",
                {
                  minimumFractionDigits:
                    2,
                  maximumFractionDigits:
                    2,
                }
              )}{" "}
              €
            </p>

            <p className="mt-1 text-[10px] font-bold text-amber-700">
              {t.byPurchasePrice}
            </p>
          </div>

          <div className="rounded-2xl bg-emerald-50 p-4 shadow-sm">
            <p className="text-xs font-black uppercase text-emerald-700">
              {t.todayProfitLabel}
            </p>

            <p
              className={`mt-1 text-2xl font-black ${
                summary.todayProfit >=
                0
                  ? "text-emerald-900"
                  : "text-red-700"
              }`}
            >
              {summary.todayProfit.toLocaleString(
                "de-DE",
                {
                  minimumFractionDigits:
                    2,
                  maximumFractionDigits:
                    2,
                }
              )}{" "}
              €
            </p>

            <p className="mt-1 text-[10px] font-bold text-emerald-700">
              {t.fromTodaySales}
            </p>
          </div>

          <div className="rounded-2xl bg-green-100 p-4 shadow-sm">
            <p className="text-xs font-black uppercase text-green-700">
              {t.monthlyProfitLabel}
            </p>

            <p
              className={`mt-1 text-2xl font-black ${
                summary.monthlyProfit >=
                0
                  ? "text-green-900"
                  : "text-red-700"
              }`}
            >
              {summary.monthlyProfit.toLocaleString(
                "de-DE",
                {
                  minimumFractionDigits:
                    2,
                  maximumFractionDigits:
                    2,
                }
              )}{" "}
              €
            </p>

            <p className="mt-1 text-[10px] font-bold text-green-700">
              {t.fromMonthSales}
            </p>
          </div>

          <div className="rounded-2xl bg-teal-50 p-4 shadow-sm">
            <p className="text-xs font-black uppercase text-teal-700">
              {t.yearlyProfitLabel}
            </p>

            <p
              className={`mt-1 text-2xl font-black ${
                summary.yearlyProfit >=
                0
                  ? "text-teal-900"
                  : "text-red-700"
              }`}
            >
              {summary.yearlyProfit.toLocaleString(
                "de-DE",
                {
                  minimumFractionDigits:
                    2,
                  maximumFractionDigits:
                    2,
                }
              )}{" "}
              €
            </p>

            <p className="mt-1 text-[10px] font-bold text-teal-700">
              {t.sinceJan1}
            </p>
          </div>

          <div className="rounded-2xl bg-orange-50 p-4 shadow-sm">
            <p className="text-xs font-black uppercase text-orange-700">
              {t.criticalStockLabel}
            </p>

            <p className="mt-1 text-2xl font-black text-orange-900">
              {
                summary.lowStock
              }
            </p>
          </div>

          <div className="rounded-2xl bg-red-50 p-4 shadow-sm">
            <p className="text-xs font-black uppercase text-red-700">
              {t.outOfStockLabel}
            </p>

            <p className="mt-1 text-2xl font-black text-red-900">
              {
                summary.outOfStock
              }
            </p>
          </div>
        </section>

        {error ? (
          <div className="mt-6 rounded-2xl bg-red-50 p-4 font-bold text-red-600">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="mt-6 rounded-2xl bg-green-50 p-4 font-bold text-green-700">
            {success}
          </div>
        ) : null}

        <section className="mt-6 rounded-[28px] bg-white p-5 shadow-sm">
          <div className="relative">
            <Search
              size={19}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              value={
                search
              }
              onChange={(
                event
              ) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder={t.searchPlaceholder}
              className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 font-bold outline-none focus:border-orange-500"
            />
          </div>
        </section>

        <section className="mt-6 min-w-0 w-full max-w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {filteredProducts.length ===
          0 ? (
            <div className="p-8 text-center text-slate-500">
              {t.noProductsFound}
            </div>
          ) : (
            <div className="w-full min-w-0">
              <div className="w-full min-w-0">
                <div className="grid grid-cols-[minmax(155px,1.35fr)_78px_104px_92px_105px_86px_86px_100px_100px_230px] items-center gap-3 border-b border-slate-200 bg-slate-100 px-4 py-3.5 text-[11px] font-black uppercase tracking-wide text-slate-500">
                  <div>
                    {t.colProduct}
                  </div>

                  <div className="text-center">
                    {t.colStock}
                  </div>

                  <div className="text-center">
                    {t.colPurchasePrice}
                  </div>

                  <div className="text-center">
                    {t.colSalePrice}
                  </div>

                  <div className="text-center">
                    {t.colStockValue}
                  </div>

                  <div className="text-center">
                    {t.colToday}
                  </div>

                  <div className="text-center">
                    {t.colThisMonth}
                  </div>

                  <div className="text-center">
                    {t.colTodayProfit}
                  </div>

                  <div className="text-center">
                    {t.colMonthlyProfit}
                  </div>

                  <div className="text-center">
                    {t.colActions}
                  </div>
                </div>

                <div className="divide-y divide-slate-200">
                  {filteredProducts.map(
                    (
                      product,
                      index
                    ) => {
                      const productName =
                        product.nameTr ||
                        product.nameDe ||
                        product.name;

                      const categoryName =
                        product.category
                          .nameTr ||
                        product.category
                          .nameDe ||
                        product.category
                          .name;

                      const previousProduct =
                        index > 0
                          ? filteredProducts[
                              index - 1
                            ]
                          : null;

                      const showCategoryHeader =
                        !previousProduct ||
                        previousProduct
                          .category.id !==
                          product.category.id;

                      const categorySummary =
                        categorySummaries.get(
                          product.category.id
                        ) || {
                          productCount: 0,
                          totalStock: 0,
                          stockValue: 0,
                        };

                      const categoryTheme =
                        getCategoryTheme(
                          product.category.id
                        );

                      const critical =
                        product.stock <=
                        product.minStock;

                      const isSaving =
                        savingProductId ===
                        product.id;

                      return (
                        <Fragment
                          key={
                            product.id
                          }
                        >
                          {showCategoryHeader ? (
                            <div
                              className={`relative overflow-hidden border-y px-4 py-4 ${
                                categoryTheme.container
                              }`}
                            >
                              <div
                                className={`absolute inset-y-0 left-0 w-1.5 ${
                                  categoryTheme.accent
                                }`}
                              />

                              <div className="flex flex-col gap-3 pl-2 lg:flex-row lg:items-center lg:justify-between">
                                <div className="min-w-0">
                                  <p
                                    className={`text-[10px] font-black uppercase tracking-[0.18em] ${
                                      categoryTheme.label
                                    }`}
                                  >
                                    {t.categoryLabel}
                                  </p>

                                  <h2
                                    className={`mt-0.5 truncate text-xl font-black ${
                                      categoryTheme.title
                                    }`}
                                  >
                                    {
                                      categoryName
                                    }
                                  </h2>
                                </div>

                                <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:justify-end">
                                  <div
                                    className={`rounded-xl border px-3 py-2 text-center shadow-sm ${
                                      categoryTheme.badge
                                    }`}
                                  >
                                    <p className="text-base font-black leading-none">
                                      {
                                        categorySummary.productCount
                                      }
                                    </p>

                                    <p className="mt-1 text-[9px] font-black uppercase">
                                      {t.colProduct}
                                    </p>
                                  </div>

                                  <div
                                    className={`rounded-xl border px-3 py-2 text-center shadow-sm ${
                                      categoryTheme.badge
                                    }`}
                                  >
                                    <p className="text-base font-black leading-none">
                                      {
                                        categorySummary.totalStock
                                      }
                                    </p>

                                    <p className="mt-1 text-[9px] font-black uppercase">
                                      {t.colStock}
                                    </p>
                                  </div>

                                  <div
                                    className={`rounded-xl border px-3 py-2 text-center shadow-sm ${
                                      categoryTheme.badge
                                    }`}
                                  >
                                    <p className="text-base font-black leading-none">
                                      {categorySummary.stockValue.toLocaleString(
                                        "de-DE",
                                        {
                                          minimumFractionDigits:
                                            2,
                                          maximumFractionDigits:
                                            2,
                                        }
                                      )}{" "}
                                      €
                                    </p>

                                    <p className="mt-1 text-[9px] font-black uppercase">
                                      {t.stockValueBadge}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : null}

                          <article
                            className={`grid grid-cols-[minmax(155px,1.35fr)_78px_104px_92px_105px_86px_86px_100px_100px_230px] items-center gap-3 px-4 py-4 ${
                            critical
                              ? "bg-orange-50/40"
                              : "bg-white"
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="text-[10px] font-black uppercase text-orange-500">
                              {
                                categoryName
                              }
                            </p>

                            <h2 className="truncate text-base font-black text-slate-950">
                              {
                                productName
                              }
                            </h2>

                            <p className="mt-0.5 truncate text-xs text-slate-500">
                              {product.packageInfo ||
                                t.noPackageInfo}
                            </p>

                            {!product.active ? (
                              <span className="mt-1 inline-flex rounded-full bg-slate-200 px-2 py-0.5 text-[9px] font-black text-slate-600">
                                {t.inactiveBadge}
                              </span>
                            ) : null}
                          </div>

                          <div
                            className={`rounded-xl px-3 py-3 text-center ${
                              product.stock ===
                              0
                                ? "bg-red-50 text-red-800"
                                : critical
                                  ? "bg-orange-100 text-orange-800"
                                  : "bg-green-50 text-green-800"
                            }`}
                          >
                            <p className="text-xl font-black leading-none">
                              {
                                product.stock
                              }
                            </p>

                            <p className="mt-1.5 text-[10px] font-bold leading-none">
                              {t.minLabel}{" "}
                              {
                                product.minStock
                              }
                            </p>
                          </div>

                          <form
                            onSubmit={(
                              event
                            ) =>
                              changeStock(
                                event,
                                product,
                                "UPDATE_PURCHASE_PRICE"
                              )
                            }
                            className="grid gap-1"
                          >
                            <input
                              required
                              min="0"
                              step="0.01"
                              type="number"
                              name="purchasePrice"
                              defaultValue={
                                product.purchasePrice
                              }
                              placeholder="0,00"
                              className="h-10 min-w-0 rounded-lg border border-amber-200 bg-white px-3 text-center text-sm font-bold outline-none focus:border-amber-500"
                            />

                            <button
                              type="submit"
                              disabled={
                                isSaving
                              }
                              className="h-9 rounded-lg bg-amber-500 px-3 text-xs font-black text-white transition hover:bg-amber-600 disabled:opacity-50"
                            >
                              {t.saveBtn}
                            </button>
                          </form>

                          <div className="rounded-xl bg-slate-100 px-3 py-3 text-center">
                            <p className="text-base font-black text-slate-950">
                              {product.salePrice.toFixed(
                                2
                              )}{" "}
                              €
                            </p>

                            <p className="mt-1 text-[9px] font-bold text-slate-500">
                              {t.registerPriceLabel}
                            </p>
                          </div>

                          <div className="rounded-xl bg-amber-50 px-3 py-3 text-center text-amber-900">
                            <p className="text-base font-black leading-none">
                              {(
                                product.stock *
                                product.purchasePrice
                              ).toLocaleString(
                                "de-DE",
                                {
                                  minimumFractionDigits:
                                    2,
                                  maximumFractionDigits:
                                    2,
                                }
                              )}{" "}
                              €
                            </p>

                            <p className="mt-1 text-[9px] font-bold text-amber-700">
                              {product.stock} ×{" "}
                              {product.purchasePrice.toLocaleString(
                                "de-DE",
                                {
                                  minimumFractionDigits:
                                    2,
                                  maximumFractionDigits:
                                    2,
                                }
                              )}{" "}
                              €
                            </p>
                          </div>

                          <div className="rounded-xl bg-blue-50 px-3 py-3 text-center text-blue-800">
                            <p className="text-base font-black leading-none">
                              {
                                product.soldToday
                              }
                            </p>

                            <p className="mt-1 text-[9px] font-bold">
                              {product.soldTodayRevenue.toFixed(
                                2
                              )}{" "}
                              € {t.revenueSuffix}
                            </p>
                          </div>

                          <div className="rounded-xl bg-violet-50 px-3 py-3 text-center text-violet-800">
                            <p className="text-base font-black leading-none">
                              {
                                product.soldThisMonth
                              }
                            </p>

                            <p className="mt-1 text-[9px] font-bold">
                              {product.soldThisMonthRevenue.toFixed(
                                2
                              )}{" "}
                              € {t.revenueSuffix}
                            </p>
                          </div>

                          <div
                            className={`rounded-xl px-3 py-3 text-center ${
                              product.soldTodayProfit >=
                              0
                                ? "bg-emerald-50 text-emerald-800"
                                : "bg-red-50 text-red-800"
                            }`}
                          >
                            <p className="text-base font-black">
                              {product.soldTodayProfit.toFixed(
                                2
                              )}{" "}
                              €
                            </p>

                            <p className="mt-1 text-[9px] font-bold">
                              {t.dailyLabel}
                            </p>
                          </div>

                          <div
                            className={`rounded-xl px-3 py-3 text-center ${
                              product.soldThisMonthProfit >=
                              0
                                ? "bg-emerald-50 text-emerald-800"
                                : "bg-red-50 text-red-800"
                            }`}
                          >
                            <p className="text-base font-black">
                              {product.soldThisMonthProfit.toFixed(
                                2
                              )}{" "}
                              €
                            </p>

                            <p className="mt-1 text-[9px] font-bold">
                              {t.monthlyLabel}
                            </p>
                          </div>

                          <div className="grid grid-cols-4 gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setActionDialog({
                                  product,
                                  action:
                                    "STOCK_ADD",
                                })
                              }
                              disabled={
                                isSaving
                              }
                              className="rounded-xl bg-green-600 px-3 py-3 text-xs font-black text-white transition hover:bg-green-700 disabled:opacity-50"
                            >
                              {t.addStockBtn}
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setActionDialog({
                                  product,
                                  action:
                                    "RETURN",
                                })
                              }
                              disabled={
                                product.stock ===
                                  0 ||
                                isSaving
                              }
                              className="rounded-xl bg-blue-600 px-3 py-3 text-xs font-black text-white transition hover:bg-blue-700 disabled:opacity-40"
                            >
                              {t.returnBtn}
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setActionDialog({
                                  product,
                                  action:
                                    "BROKEN",
                                })
                              }
                              disabled={
                                product.stock ===
                                  0 ||
                                isSaving
                              }
                              className="rounded-xl bg-red-600 px-3 py-3 text-xs font-black text-white transition hover:bg-red-700 disabled:opacity-40"
                            >
                              {t.brokenBtn}
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setActionDialog({
                                  product,
                                  action:
                                    "EXPIRED",
                                })
                              }
                              disabled={
                                product.stock ===
                                  0 ||
                                isSaving
                              }
                              className="rounded-xl bg-orange-500 px-3 py-3 text-xs font-black text-white transition hover:bg-orange-600 disabled:opacity-40"
                            >
                              {t.expiredBtn}
                            </button>
                          </div>
                          </article>
                        </Fragment>
                      );
                    }
                  )}
                </div>
              </div>
            </div>
          )}
        </section>


        {actionDialog ? (
          <div
            aria-label={t.dialogAriaLabel}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
            onMouseDown={() =>
              setActionDialog(
                null
              )
            }
          >
            <div
              className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
              onMouseDown={(
                event
              ) =>
                event.stopPropagation()
              }
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase text-orange-500">
                    {t.dialogEyebrow}
                  </p>

                  <h2 className="mt-1 text-xl font-black text-slate-950">
                    {actionDialog.product.nameTr ||
                      actionDialog.product.nameDe ||
                      actionDialog.product.name}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {t.currentStockLabel}{" "}
                    <strong>
                      {
                        actionDialog.product.stock
                      }
                    </strong>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setActionDialog(
                      null
                    )
                  }
                  className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-black text-slate-600"
                >
                  {t.closeBtn}
                </button>
              </div>

              <div className="mt-5 rounded-2xl bg-slate-100 p-4">
                <p className="font-black text-slate-950">
                  {actionDialog.action ===
                  "STOCK_ADD"
                    ? t.actionTitleAdd
                    : actionDialog.action ===
                        "RETURN"
                      ? t.actionTitleReturn
                      : actionDialog.action ===
                          "BROKEN"
                        ? t.actionTitleBroken
                        : t.actionTitleExpired}
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  {actionDialog.action ===
                  "STOCK_ADD"
                    ? t.actionDescAdd
                    : t.actionDescReduce}
                </p>
              </div>

              <form
                onSubmit={(
                  event
                ) =>
                  changeStock(
                    event,
                    actionDialog.product,
                    actionDialog.action
                  )
                }
                className="mt-5"
              >
                <label className="block">
                  <span className="text-sm font-black text-slate-700">
                    {t.quantityLabel}
                  </span>

                  <input
                    autoFocus
                    required
                    min="1"
                    max={
                      actionDialog.action ===
                      "STOCK_ADD"
                        ? undefined
                        : actionDialog.product
                            .stock
                    }
                    step="1"
                    type="number"
                    name="quantity"
                    placeholder={t.quantityPlaceholder}
                    className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 text-lg font-black outline-none focus:border-orange-500"
                  />
                </label>

                <button
                  type="submit"
                  disabled={
                    savingProductId ===
                    actionDialog.product.id
                  }
                  className={`mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl font-black text-white transition disabled:opacity-50 ${
                    actionDialog.action ===
                    "STOCK_ADD"
                      ? "bg-green-600 hover:bg-green-700"
                      : actionDialog.action ===
                          "RETURN"
                        ? "bg-blue-600 hover:bg-blue-700"
                        : actionDialog.action ===
                            "BROKEN"
                          ? "bg-red-600 hover:bg-red-700"
                          : "bg-orange-500 hover:bg-orange-600"
                  }`}
                >
                  {savingProductId ===
                  actionDialog.product.id ? (
                    <Loader2
                      size={19}
                      className="animate-spin"
                    />
                  ) : actionDialog.action ===
                    "STOCK_ADD" ? (
                    <Plus
                      size={19}
                    />
                  ) : (
                    <Minus
                      size={19}
                    />
                  )}

                  {t.submitBtn}
                </button>
              </form>
            </div>
          </div>
        ) : null}

      </div>
    </main>
  );
}
