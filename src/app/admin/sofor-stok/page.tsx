"use client";

import { useLanguage } from "@/context/LanguageContext";
import {
  ArrowLeft,
  Boxes,
  Loader2,
  PackagePlus,
  RotateCcw,
  Search,
  Truck,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type Driver = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phone: string | null;
};

type Product = {
  id: string;
  name: string;
  nameTr: string | null;
  nameDe: string | null;
  displayName: string;
  stock: number;
  stockUnit: string;
  packageInfo: string | null;
  unitsPerPackage: number;
  imageUrl: string | null;
  categoryName: string;
};

type DriverStock = {
  id: string;
  driverId: string;
  productId: string;
  quantity: number;
  updatedAt: string;
  loadedQuantity: number;
  soldQuantity: number;
  currentQuantity: number;
  salePrice: number;

  product: {
    id: string;
    name: string;
    nameTr: string | null;
    nameDe: string | null;
    displayName: string;
    stockUnit: string;
    packageInfo: string | null;
    imageUrl: string | null;
  };
};

type CurrentTripSale = {
  id: string;
  orderNumber: string;
  createdAt: string;

  customer: {
    id: string;
    name: string;
    phone: string | null;
    email: string;
  };

  paymentMethod: "CASH" | "CARD" | "OPEN" | "UNKNOWN";
  paymentStatus: string;

  grossAmount: number;
  returnedPfandAmount: number;
  netAmount: number;

  driverPaymentReportedAmount: number | null;

  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    pfand: number;
    lineTotal: number;
  }>;
};

type DriverLoad = {
  id: string;
  status: string;
  note: string | null;
  confirmedAt: string | null;
  createdAt: string;

  driver: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };

  createdBy: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };

  items: Array<{
    id: string;
    quantity: number;

    product: {
      id: string;
      displayName: string;
      stockUnit: string;
      packageInfo: string | null;
    };
  }>;
};

type DriverStockSummary = {
  totalLoadedQuantity: number;
  totalLoadedValue: number;
  totalReturnedQuantity: number;
  totalSoldQuantity: number;
  totalSoldValue: number;
  todayCashToCollect: number;
};

type DriverStockResponse = {
  canManage: boolean;

  /*
   * Şoförün bildirdiği nakit tahsilatı onaylayıp
   * Gerçek Kasa'ya alma yetkisi.
   */
  canApproveCustomerPayment: boolean;

  drivers: Driver[];
  products: Product[];
  driverStocks: DriverStock[];

  /*
   * Seçilen şoförün son araç turunda yaptığı müşteri satışları.
   */
  currentTripSales: CurrentTripSale[];

  loads: DriverLoad[];
  summary?: DriverStockSummary;
  error?: string;
};

function getPersonName(person: {
  firstName: string | null;
  lastName: string | null;
  email: string;
}) {
  return (
    [person.firstName, person.lastName].filter(Boolean).join(" ").trim() ||
    person.email
  );
}

function getUnitLabel(unit: string) {
  const labels: Record<string, string> = {
    KASA: "kasa",
    KARTON: "karton",
    PAKET: "paket",
    ADET: "adet",
  };

  return labels[unit] || unit.toLocaleLowerCase("tr-TR");
}

function getCategoryCardClasses(categoryName: string) {
  const colors = [
    {
      card: "border-orange-200 bg-orange-50/80",
      header: "border-orange-200 bg-orange-100/90",
      title: "text-orange-900",
      badge: "bg-orange-200 text-orange-800",
    },
    {
      card: "border-emerald-200 bg-emerald-50/80",
      header: "border-emerald-200 bg-emerald-100/90",
      title: "text-emerald-900",
      badge: "bg-emerald-200 text-emerald-800",
    },
    {
      card: "border-blue-200 bg-blue-50/80",
      header: "border-blue-200 bg-blue-100/90",
      title: "text-blue-900",
      badge: "bg-blue-200 text-blue-800",
    },
    {
      card: "border-violet-200 bg-violet-50/80",
      header: "border-violet-200 bg-violet-100/90",
      title: "text-violet-900",
      badge: "bg-violet-200 text-violet-800",
    },
    {
      card: "border-rose-200 bg-rose-50/80",
      header: "border-rose-200 bg-rose-100/90",
      title: "text-rose-900",
      badge: "bg-rose-200 text-rose-800",
    },
    {
      card: "border-cyan-200 bg-cyan-50/80",
      header: "border-cyan-200 bg-cyan-100/90",
      title: "text-cyan-900",
      badge: "bg-cyan-200 text-cyan-800",
    },
    {
      card: "border-amber-200 bg-amber-50/80",
      header: "border-amber-200 bg-amber-100/90",
      title: "text-amber-900",
      badge: "bg-amber-200 text-amber-800",
    },
    {
      card: "border-indigo-200 bg-indigo-50/80",
      header: "border-indigo-200 bg-indigo-100/90",
      title: "text-indigo-900",
      badge: "bg-indigo-200 text-indigo-800",
    },
  ];

  const hash = Array.from(categoryName).reduce(
    (total, character) => total + character.charCodeAt(0),
    0,
  );

  return colors[hash % colors.length];
}

function getCategoryTitleClasses(categoryName: string) {
  const colors = [
    "bg-orange-100 text-orange-800 ring-orange-200",
    "bg-blue-100 text-blue-800 ring-blue-200",
    "bg-emerald-100 text-emerald-800 ring-emerald-200",
    "bg-violet-100 text-violet-800 ring-violet-200",
    "bg-rose-100 text-rose-800 ring-rose-200",
    "bg-cyan-100 text-cyan-800 ring-cyan-200",
    "bg-amber-100 text-amber-800 ring-amber-200",
    "bg-indigo-100 text-indigo-800 ring-indigo-200",
  ];

  const colorIndex = Array.from(categoryName).reduce(
    (total, character) => total + character.charCodeAt(0),
    0,
  );

  return colors[colorIndex % colors.length];
}

export default function AdminDriverStockPage() {
  const { language } = useLanguage();

  const t =
    language === "de"
      ? {
          title: "Fahrerlager",
          selectDriver: "Fahrer auswählen",
          productSearch: "Produkt suchen...",
          noPackageInfo: "Keine Verpackungsinfo",
          mainStock: "Hauptlager",
          driverStock: "Beim Fahrer",
          noteLoad: "z.B. Fahrzeugbeladung am Morgen",
          noteReturn: "z.B. Fahrzeugzählung am Abend",
          loading: "Wird geladen...",
          loadProducts: "Produkte zum Fahrer laden",
          saveCounts: "Bestände speichern",
        }
      : {
          title: "Şoför Stokları",
          selectDriver: "Şoför seçin",
          productSearch: "Ürün ara...",
          noPackageInfo: "Paket bilgisi yok",
          mainStock: "Ana stok",
          driverStock: "Şoförde",
          noteLoad: "Örneğin: Sabah turu araç yüklemesi",
          noteReturn: "Örneğin: Akşam tur sonu araç sayımı",
          loading: "Yükleniyor...",
          loadProducts: "Ürünleri Şoföre Yükle",
          saveCounts: "Girilen Sayımları Toplu Kaydet",
        };



  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [driverStocks, setDriverStocks] = useState<DriverStock[]>([]);

  const [currentTripSales, setCurrentTripSales] = useState<CurrentTripSale[]>(
    [],
  );

  /*
   * Ürün detayları açık olan müşteri satışlarının ID'leri.
   * Her müşteri satışı birbirinden bağımsız açılıp kapanır.
   */
  const [expandedTripSaleIds, setExpandedTripSaleIds] = useState<Set<string>>(
    new Set(),
  );

  const [loads, setLoads] = useState<DriverLoad[]>([]);

  const [summary, setSummary] = useState<DriverStockSummary>({
    totalLoadedQuantity: 0,
    totalLoadedValue: 0,
    totalReturnedQuantity: 0,
    totalSoldQuantity: 0,
    totalSoldValue: 0,
    todayCashToCollect: 0,
  });

  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [note, setNote] = useState("");

  const [returnQuantities, setReturnQuantities] = useState<
    Record<string, string>
  >({});
  const [returnNote, setReturnNote] = useState("");

  const [activeStockAction, setActiveStockAction] = useState<
    "LOAD" | "RETURN" | null
  >(null);

  const [canManage, setCanManage] = useState(false);

  const [canApproveCustomerPayment, setCanApproveCustomerPayment] =
    useState(false);

  /*
   * Hangi müşteri satışının ödeme onayı yapılıyor?
   * Çift tıklamayı ve birden fazla isteği engeller.
   */
  const [approvingSalePaymentId, setApprovingSalePaymentId] = useState<
    string | null
  >(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [returning, setReturning] = useState(false);
  const [savingReturnProductId, setSavingReturnProductId] = useState<
    string | null
  >(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = useCallback(async (driverId?: string, silent = false) => {
    if (!silent) {
      setLoading(true);
    }

    setError("");

    try {
      const queryDriverId = driverId || "";

      const url = `/api/admin/driver-stock${
        queryDriverId ? `?driverId=${encodeURIComponent(queryDriverId)}` : ""
      }`;

      console.log("FETCH DRIVER STOCK:", url);

      const response = await fetch(
        url,
        {
          cache: "no-store",
        },
      );

      const data: DriverStockResponse = await response.json();

      if (!response.ok) {
        setError(data.error || "Şoför stokları yüklenemedi.");
        return;
      }

      setDrivers(data.drivers || []);
      setProducts(data.products || []);
      setDriverStocks(data.driverStocks || []);

      setCurrentTripSales(data.currentTripSales || []);
      setLoads(data.loads || []);

      setSummary(
        data.summary || {
          totalLoadedQuantity: 0,
          totalLoadedValue: 0,
          totalReturnedQuantity: 0,
          totalSoldQuantity: 0,
          totalSoldValue: 0,
          todayCashToCollect: 0,
        },
      );

      setCanManage(Boolean(data.canManage));
      setCanApproveCustomerPayment(Boolean(data.canApproveCustomerPayment));
    } catch {
      setError("Şoför stokları yüklenirken hata oluştu.");
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadData("");
  }, [loadData]);

  const selectedDriver = useMemo(
    () => drivers.find((driver) => driver.id === selectedDriverId) || null,
    [drivers, selectedDriverId],
  );

  const selectedItems = useMemo(
    () =>
      products
        .map((product) => ({
          product,
          quantity: Number(quantities[product.id] || 0),
        }))
        .filter((item) => Number.isInteger(item.quantity) && item.quantity > 0),
    [products, quantities],
  );

  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("tr-TR");

    if (!normalizedSearch) {
      return products;
    }

    return products.filter((product) =>
      [
        product.displayName,
        product.name,
        product.nameTr,
        product.nameDe,
        product.categoryName,
        product.packageInfo,
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("tr-TR")
        .includes(normalizedSearch),
    );
  }, [products, search]);

  const groupedFilteredProducts = useMemo(() => {
    const groups = new Map<string, Product[]>();

    for (const product of filteredProducts) {
      const categoryName = product.categoryName?.trim() || "Diğer Ürünler";

      const currentProducts = groups.get(categoryName) || [];
      currentProducts.push(product);
      groups.set(categoryName, currentProducts);
    }

    return Array.from(groups.entries()).map(
      ([categoryName, categoryProducts]) => ({
        categoryName,
        products: categoryProducts,
      }),
    );
  }, [filteredProducts]);

  const driverStockByProductId = useMemo(
    () =>
      new Map(driverStocks.map((stock) => [stock.productId, stock.quantity])),
    [driverStocks],
  );

  function toggleTripSaleDetails(saleId: string) {
    setExpandedTripSaleIds((current) => {
      const next = new Set(current);

      if (next.has(saleId)) {
        next.delete(saleId);
      } else {
        next.add(saleId);
      }

      return next;
    });
  }

  async function approveCurrentTripSalePayment(sale: CurrentTripSale) {
    if (sale.paymentStatus === "PAID") {
      return;
    }

    if (sale.driverPaymentReportedAmount === null) {
      setError(
        "Bu satış için şoför tarafından alınmış bir nakit ödeme bildirimi bulunmuyor.",
      );
      return;
    }

    if (!canApproveCustomerPayment) {
      setError("Müşteri tahsilatını onaylama yetkiniz bulunmuyor.");
      return;
    }

    const confirmed = window.confirm(
      `${sale.customer.name} müşterisinden alınan ` +
        `${sale.driverPaymentReportedAmount.toLocaleString("de-DE", {
          style: "currency",
          currency: "EUR",
        })} tutarındaki ödeme onaylanıp Gerçek Kasa'ya alınsın mı?`,
    );

    if (!confirmed) {
      return;
    }

    setApprovingSalePaymentId(sale.id);
    setError("");
    setSuccess("");

    try {
      /*
       * Admin sipariş ödeme API'si kullanılır.
       *
       * Bu işlem:
       * - PENDING OrderPayment kaydını APPROVED yapar.
       * - Ödemeyi sipariş hesabına işler.
       * - Sipariş tamamen kapandıysa paymentStatus PAID olur.
       * - Gerçek Kasa'ya gelir hareketi oluşturur.
       */
      const response = await fetch(`/api/admin/orders/${sale.id}`, {
        method: "PATCH",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          paymentStatus: "PAID",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Şoförün getirdiği para onaylanamadı.");
        return;
      }

      setSuccess(
        data.message ||
          `${sale.customer.name} müşterisinin ödemesi onaylandı ve Gerçek Kasa'ya alındı.`,
      );

      /*
       * Şoför stok ekranındaki satış kartlarını yeniden yükle.
       * Böylece düğme anında Ödendi durumuna dönüşür.
       */
      await loadData(selectedDriverId, true);
    } catch {
      setError("Ödeme onaylanırken bağlantı hatası oluştu.");
    } finally {
      setApprovingSalePaymentId(null);
    }
  }

  async function changeDriver(driverId: string) {
    setSelectedDriverId(driverId);

    /*
     * Şoför değiştiğinde önceki şoföre ait açık satış kartlarını kapat.
     */
    setExpandedTripSaleIds(new Set());

    setSummary({
      totalLoadedQuantity: 0,
      totalLoadedValue: 0,
      totalReturnedQuantity: 0,
      totalSoldQuantity: 0,
      totalSoldValue: 0,
      todayCashToCollect: 0,
    });

    setQuantities({});
    setReturnQuantities({});
    setNote("");
    setReturnNote("");
    setActiveStockAction(null);
    setSuccess("");
    setError("");

    await loadData(driverId);
  }

  function updateQuantity(productId: string, value: string) {
    const normalized = value.replace(/[^\d]/g, "");

    setQuantities((current) => ({
      ...current,
      [productId]: normalized,
    }));
  }

  function clearForm() {
    setQuantities({});
    setNote("");
  }

  async function submitLoad() {
    if (!selectedDriverId) {
      setError("Önce şoför seçin.");
      return;
    }

    if (selectedItems.length === 0) {
      setError("Yüklenecek en az bir ürün miktarı girin.");
      return;
    }

    const stockError = selectedItems.find(
      ({ product, quantity }) => quantity > product.stock,
    );

    if (stockError) {
      setError(`${stockError.product.displayName} için ana stok yetersiz.`);
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/admin/driver-stock", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          driverId: selectedDriverId,
          note,

          items: selectedItems.map(({ product, quantity }) => ({
            productId: product.id,
            quantity,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Şoför stok yüklemesi başarısız.");
        return;
      }

      clearForm();

      setSuccess(data.message || "Ürünler şoför stokuna yüklendi.");

      await loadData(selectedDriverId, true);
    } catch {
      setError("Şoför stok yüklemesi sırasında hata oluştu.");
    } finally {
      setSaving(false);
    }
  }

  const selectedReturnItems = useMemo(
    () =>
      driverStocks
        .map((stock) => {
          const rawValue = returnQuantities[stock.productId];

          if (rawValue === undefined || rawValue === "") {
            return null;
          }

          const returnedQuantity = Number(rawValue);

          if (!Number.isInteger(returnedQuantity) || returnedQuantity < 0) {
            return null;
          }

          return {
            stock,
            returnedQuantity,
          };
        })
        .filter(
          (
            item,
          ): item is {
            stock: DriverStock;
            returnedQuantity: number;
          } => item !== null,
        ),
    [driverStocks, returnQuantities],
  );

  function updateReturnQuantity(productId: string, value: string) {
    const normalized = value.replace(/[^\d]/g, "");

    setReturnQuantities((current) => ({
      ...current,
      [productId]: normalized,
    }));
  }

  async function submitReturn(productId?: string) {
    if (!selectedDriverId) {
      setError("Önce şoför seçin.");
      return;
    }

    const itemsToSave = productId
      ? selectedReturnItems.filter(({ stock }) => stock.productId === productId)
      : selectedReturnItems;

    if (itemsToSave.length === 0) {
      setError("Kaydedilecek en az bir araç sayımı girin.");
      return;
    }

    const quantityError = itemsToSave.find(
      ({ stock, returnedQuantity }) => returnedQuantity > stock.currentQuantity,
    );

    if (quantityError) {
      setError(
        `${quantityError.stock.product.displayName} için geri gelen miktar araç stokundan fazla.`,
      );
      return;
    }

    setReturning(!productId);
    setSavingReturnProductId(productId || null);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/admin/driver-stock", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          action: "COUNT_RETURN",
          driverId: selectedDriverId,
          note: returnNote,

          items: itemsToSave.map(({ stock, returnedQuantity }) => ({
            productId: stock.productId,
            returnedQuantity,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Araç sayımı kaydedilemedi.");
        return;
      }

      setReturnQuantities((current) => {
        if (!productId) {
          return {};
        }

        const next = { ...current };
        delete next[productId];
        return next;
      });

      if (!productId) {
        setReturnNote("");
      }

      setSuccess(data.message || "Araç sayımı başarıyla kaydedildi.");

      await loadData(selectedDriverId, true);
    } catch {
      setError("Araç sayımı kaydedilirken hata oluştu.");
    } finally {
      setReturning(false);
      setSavingReturnProductId(null);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="flex items-center gap-3 font-bold text-slate-600">
          <Loader2 className="animate-spin" />
          Şoför stokları yükleniyor...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-3 sm:p-4 lg:p-6">
      <div className="mx-auto w-full max-w-none">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 font-bold text-slate-600 transition hover:text-orange-500"
        >
          <ArrowLeft size={18} />
          Admin Paneli
        </Link>

        <section className="mt-6 rounded-[32px] bg-slate-950 p-7 text-white sm:p-10">
          <Truck size={32} className="text-orange-400" />

          <h1 className="mt-4 text-4xl font-black">{t.title}</h1>

          <p className="mt-3 max-w-3xl text-slate-400">
            Ana depodan şoförün araç stokuna ürün yükleyin. Yüklenen ürünler ana
            stoktan otomatik düşülür ve bütün hareketler kayıt altına alınır.
          </p>
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

        <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
          <label className="block">
            <span className="text-sm font-black text-slate-700">
              Şoför seçimi
            </span>

            <select
              value={selectedDriverId}
              onChange={(event) => changeDriver(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-950 outline-none focus:border-orange-500"
            >
              <option value="">{t.selectDriver}</option>

              {drivers.map((driver) => (
                <option key={driver.id} value={driver.id}>
                  {getPersonName(driver)}
                </option>
              ))}
            </select>
          </label>
        </section>

        {selectedDriver ? (
          <>
            <section className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <article className="rounded-3xl border border-orange-200 bg-orange-50 p-6 shadow-sm">
                <p className="text-sm font-black uppercase tracking-wide text-orange-700">
                  Giden Ürün Toplamı
                </p>

                <p className="mt-3 text-4xl font-black text-orange-950">
                  {summary.totalLoadedQuantity.toLocaleString("de-DE")}
                </p>

                <p className="mt-1 text-sm font-bold text-orange-700">
                  şoföre yüklenen ürün
                </p>
              </article>

              <article className="rounded-3xl border border-green-200 bg-green-50 p-6 shadow-sm">
                <p className="text-sm font-black uppercase tracking-wide text-green-700">
                  Gelen Ürün Toplamı
                </p>

                <p className="mt-3 text-4xl font-black text-green-950">
                  {summary.totalReturnedQuantity.toLocaleString("de-DE")}
                </p>

                <p className="mt-1 text-sm font-bold text-green-700">
                  depoya geri alınan ürün
                </p>
              </article>

              <article className="rounded-3xl border border-orange-200 bg-orange-50 p-5 shadow-sm">
                <p className="text-xs font-black uppercase tracking-wide text-orange-700">
                  Bugün Teslim Edilecek Nakit
                </p>

                <p className="mt-2 text-3xl font-black text-orange-950">
                  {summary.todayCashToCollect.toLocaleString("de-DE", {
                    style: "currency",
                    currency: "EUR",
                  })}
                </p>

                <p className="mt-1 text-xs font-bold text-orange-700">
                  Şoförün bugün kasaya teslim etmesi gereken nakit
                </p>
              </article>
              <article className="rounded-3xl border border-blue-200 bg-blue-50 p-6 shadow-sm">
                <p className="text-sm font-black uppercase tracking-wide text-blue-700">
                  Satılan Mal Toplamı
                </p>

                <p className="mt-3 text-4xl font-black text-blue-950">
                  {summary.totalSoldValue.toLocaleString("de-DE", {
                    style: "currency",
                    currency: "EUR",
                  })}
                </p>

                <p className="mt-1 text-sm font-bold text-blue-700">
                  {summary.totalSoldQuantity.toLocaleString("de-DE")} ürün
                  satıldı
                </p>
              </article>
            </section>

            <section className="mt-6 rounded-3xl bg-white p-4 shadow-sm sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-950">
                    Bu Tur Yapılan Müşteri Satışları
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Şoförün son araç yüklemesinden sonra müşterilere araçtan
                    yaptığı satışlar.
                  </p>
                </div>

                <div className="rounded-xl bg-blue-50 px-4 py-2 font-black text-blue-700">
                  {currentTripSales.length} satış
                </div>
              </div>

              {currentTripSales.length === 0 ? (
                <div className="mt-5 rounded-2xl bg-slate-50 p-6 text-center text-sm font-bold text-slate-500">
                  Bu araç turunda henüz müşteriye satış yapılmadı.
                </div>
              ) : (
                <div className="mt-5 space-y-4">
                  {currentTripSales.map((sale) => {
                    const paymentMethodLabel =
                      sale.paymentMethod === "CASH"
                        ? language === "de" ? "Bar" : "Nakit"
                        : sale.paymentMethod === "CARD"
                          ? language === "de" ? "Karte" : "Kart"
                          : sale.paymentMethod === "OPEN"
                            ? language === "de" ? "Offenes Konto" : "Açık Hesap"
                            : language === "de" ? "Nicht angegeben" : "Belirtilmedi";

                    const isExpanded = expandedTripSaleIds.has(sale.id);

                    return (
                      <article
                        key={sale.id}
                        className="overflow-hidden rounded-2xl border border-slate-200"
                      >
                        <div
                          className={`flex flex-col gap-4 px-5 py-4 transition lg:flex-row lg:items-center lg:justify-between ${
                            isExpanded
                              ? "border-b border-slate-200 bg-blue-50"
                              : "bg-slate-50"
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-lg font-black text-slate-950">
                                {sale.customer.name}
                              </h3>

                              <span className="rounded-full bg-orange-100 px-3 py-1 text-[10px] font-black uppercase text-orange-700">
                                {sale.orderNumber}
                              </span>
                            </div>

                            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs font-bold text-slate-500">
                              <span>
                                {new Date(sale.createdAt).toLocaleString(
                                  "de-DE",
                                )}
                              </span>

                              {sale.customer.phone ? (
                                <span>Telefon: {sale.customer.phone}</span>
                              ) : null}

                              <span>Ödeme: {paymentMethodLabel}</span>

                              <span>{sale.items.length} farklı ürün</span>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
                            <div className="rounded-xl bg-white px-4 py-2 text-right shadow-sm">
                              <p className="text-[10px] font-black uppercase text-slate-400">
                                Net satış
                              </p>

                              <p className="text-lg font-black text-slate-950">
                                {sale.netAmount.toLocaleString("de-DE", {
                                  style: "currency",
                                  currency: "EUR",
                                })}
                              </p>
                            </div>

                            <div
                              className={`rounded-xl px-4 py-2 text-right ${
                                sale.paymentStatus === "PAID"
                                  ? "bg-green-100"
                                  : "bg-amber-100"
                              }`}
                            >
                              <p
                                className={`text-[10px] font-black uppercase ${
                                  sale.paymentStatus === "PAID"
                                    ? "text-green-600"
                                    : "text-amber-700"
                                }`}
                              >
                                Ödeme durumu
                              </p>

                              <p
                                className={`text-sm font-black ${
                                  sale.paymentStatus === "PAID"
                                    ? "text-green-800"
                                    : "text-amber-900"
                                }`}
                              >
                                {sale.paymentStatus === "PAID"
                                  ? language === "de" ? "Bezahlt" : "Ödendi"
                                  : sale.driverPaymentReportedAmount !== null
                                    ? language === "de" ? "Wartet auf Admin-Freigabe" : "Admin Onayı Bekliyor"
                                    : language === "de" ? "Offen" : "Açık"}
                              </p>
                            </div>

                            {sale.paymentStatus !== "PAID" &&
                            sale.driverPaymentReportedAmount !== null ? (
                              canApproveCustomerPayment ? (
                                <button
                                  type="button"
                                  disabled={approvingSalePaymentId === sale.id}
                                  onClick={() =>
                                    approveCurrentTripSalePayment(sale)
                                  }
                                  className="inline-flex min-h-11 items-center justify-center rounded-xl bg-green-600 px-4 py-2 text-sm font-black text-white shadow-sm transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {approvingSalePaymentId === sale.id
                                    ? "Onaylanıyor..."
                                    : language === "de" ? "Als bezahlt markieren und in die Kasse übernehmen" : "Ödendi Yap ve Kasaya Al"}
                                </button>
                              ) : (
                                <div className="rounded-xl bg-slate-100 px-4 py-2 text-center">
                                  <p className="text-[10px] font-black uppercase text-slate-500">
                                    Ödeme onayı
                                  </p>

                                  <p className="text-xs font-bold text-slate-600">
                                    Onay yetkiniz bulunmuyor
                                  </p>
                                </div>
                              )
                            ) : null}

                            <button
                              type="button"
                              onClick={() => toggleTripSaleDetails(sale.id)}
                              aria-expanded={isExpanded}
                              className={`inline-flex min-w-[190px] items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black transition ${
                                isExpanded
                                  ? "bg-slate-900 text-white hover:bg-slate-800"
                                  : "bg-blue-600 text-white hover:bg-blue-700"
                              }`}
                            >
                              <span
                                className={`text-base transition-transform ${
                                  isExpanded ? "rotate-180" : ""
                                }`}
                              >
                                ▼
                              </span>

                              {isExpanded
                                ? language === "de" ? "Verkaufte Produkte ausblenden" : "Satılan Malları Kapat"
                                : language === "de" ? "Verkaufte Produkte anzeigen" : "Satılan Malları Göster"}
                            </button>
                          </div>
                        </div>

                        {isExpanded ? (
                          <div className="p-5">
                            <div className="overflow-x-auto rounded-xl border border-slate-200">
                              <div className="min-w-[720px]">
                                <div className="grid grid-cols-[minmax(250px,1fr)_90px_120px_110px_130px] gap-3 bg-slate-100 px-4 py-3 text-xs font-black uppercase text-slate-500">
                                  <div>{language === "de" ? "Produkt" : "Ürün"}</div>
                                  <div className="text-center">{language === "de" ? "Menge" : "Miktar"}</div>
                                  <div className="text-right">{language === "de" ? "Produktpreis" : "Ürün fiyatı"}</div>
                                  <div className="text-right">{language === "de" ? "Pfand" : "Pfand"}</div>
                                  <div className="text-right">{language === "de" ? "Gesamt" : "Toplam"}</div>
                                </div>

                                <div className="divide-y divide-slate-100">
                                  {sale.items.map((item) => (
                                    <div
                                      key={item.id}
                                      className="grid grid-cols-[minmax(250px,1fr)_90px_120px_110px_130px] items-center gap-3 px-4 py-3"
                                    >
                                      <div className="font-black text-slate-950">
                                        {item.name}
                                      </div>

                                      <div className="text-center font-black text-blue-700">
                                        {item.quantity}
                                      </div>

                                      <div className="text-right font-bold text-slate-700">
                                        {item.price.toLocaleString("de-DE", {
                                          style: "currency",
                                          currency: "EUR",
                                        })}
                                      </div>

                                      <div className="text-right font-bold text-amber-700">
                                        {(
                                          item.quantity * item.pfand
                                        ).toLocaleString("de-DE", {
                                          style: "currency",
                                          currency: "EUR",
                                        })}
                                      </div>

                                      <div className="text-right font-black text-slate-950">
                                        {item.lineTotal.toLocaleString(
                                          "de-DE",
                                          {
                                            style: "currency",
                                            currency: "EUR",
                                          },
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>

                            <div className="mt-4 grid gap-3 sm:grid-cols-3">
                              <div className="rounded-xl bg-slate-50 p-4">
                                <p className="text-xs font-black uppercase text-slate-500">
                                  Brüt satış
                                </p>

                                <p className="mt-1 text-xl font-black text-slate-950">
                                  {sale.grossAmount.toLocaleString("de-DE", {
                                    style: "currency",
                                    currency: "EUR",
                                  })}
                                </p>
                              </div>

                              <div className="rounded-xl bg-amber-50 p-4">
                                <p className="text-xs font-black uppercase text-amber-700">
                                  Müşteriden alınan Pfand
                                </p>

                                <p className="mt-1 text-xl font-black text-amber-900">
                                  -
                                  {sale.returnedPfandAmount.toLocaleString(
                                    "de-DE",
                                    {
                                      style: "currency",
                                      currency: "EUR",
                                    },
                                  )}
                                </p>
                              </div>

                              <div className="rounded-xl bg-green-50 p-4">
                                <p className="text-xs font-black uppercase text-green-700">
                                  Net tahsilat
                                </p>

                                <p className="mt-1 text-xl font-black text-green-900">
                                  {sale.netAmount.toLocaleString("de-DE", {
                                    style: "currency",
                                    currency: "EUR",
                                  })}
                                </p>
                              </div>
                            </div>
                          </div>
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            {canManage ? (
              <section className="mt-4 rounded-3xl bg-white p-4 shadow-sm">
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() =>
                      setActiveStockAction((current) =>
                        current === "LOAD" ? null : "LOAD",
                      )
                    }
                    className={`flex items-center justify-center gap-2 rounded-2xl px-5 py-4 font-black transition ${
                      activeStockAction === "LOAD"
                        ? "bg-orange-500 text-white"
                        : "bg-orange-50 text-orange-700 hover:bg-orange-100"
                    }`}
                  >
                    <PackagePlus size={20} />
                    Şoföre Mal Yükle
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setActiveStockAction((current) =>
                        current === "RETURN" ? null : "RETURN",
                      )
                    }
                    className={`flex items-center justify-center gap-2 rounded-2xl px-5 py-4 font-black transition ${
                      activeStockAction === "RETURN"
                        ? "bg-green-600 text-white"
                        : "bg-green-50 text-green-700 hover:bg-green-100"
                    }`}
                  >
                    <RotateCcw size={20} />
                    Şoförden İade Al
                  </button>
                </div>
              </section>
            ) : null}

            {canManage && activeStockAction === "LOAD" ? (
              <section className="mt-4 w-full rounded-3xl bg-white p-4 shadow-sm sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-black text-slate-950">
                      Şoföre Mal Yükle
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Ana depodan araç stokuna ürün aktarın.
                    </p>
                  </div>

                  <div className="relative w-full sm:max-w-sm">
                    <Search
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder={t.productSearch}
                      className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div className="mt-6 space-y-6">
                  {groupedFilteredProducts.length === 0 ? (
                    <div className="rounded-2xl bg-slate-50 p-6 text-center font-bold text-slate-500">
                      Aramanıza uygun ürün bulunamadı.
                    </div>
                  ) : (
                    groupedFilteredProducts.map((group) => (
                      <section
                        key={group.categoryName}
                        className={`overflow-hidden rounded-3xl border ${
                          getCategoryCardClasses(group.categoryName).card
                        }`}
                      >
                        <div
                          className={`flex items-center justify-between border-b px-5 py-4 ${
                            getCategoryCardClasses(group.categoryName).header
                          }`}
                        >
                          <div>
                            <h3
                              className={`inline-flex rounded-xl px-4 py-2 text-lg font-black ring-1 ${getCategoryTitleClasses(
                                group.categoryName,
                              )}`}
                            >
                              {group.categoryName}
                            </h3>

                            <p className="mt-0.5 text-xs font-bold text-slate-500">
                              {group.products.length} ürün
                            </p>
                          </div>

                          <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-orange-600 shadow-sm">
                            {group.products.length}
                          </span>
                        </div>

                        <div className="divide-y divide-slate-200 bg-white">
                          {group.products.map((product) => {
                            const driverQuantity =
                              driverStockByProductId.get(product.id) || 0;

                            const requestedQuantity = Number(
                              quantities[product.id] || 0,
                            );

                            const exceedsStock =
                              requestedQuantity > product.stock;

                            return (
                              <article
                                key={product.id}
                                className="grid gap-4 px-5 py-4 transition hover:bg-orange-50/40 sm:grid-cols-[minmax(260px,1fr)_170px_150px] sm:items-center"
                              >
                                <div>
                                  <p className="font-black text-slate-950">
                                    {product.displayName}
                                  </p>

                                  <p className="mt-1 text-sm text-slate-500">
                                    {product.packageInfo || t.noPackageInfo}
                                  </p>
                                </div>

                                <div className="flex flex-wrap gap-2 text-xs font-bold sm:block sm:text-center">
                                  <p className="text-slate-500">{language === "de" ? "Hauptlager" : "Ana stok"}</p>

                                  <p className="mt-1 text-base font-black text-slate-950">
                                    {product.stock}{" "}
                                    {getUnitLabel(product.stockUnit)}
                                  </p>

                                  <p className="mt-1 text-orange-600">
                                    Şoförde: {driverQuantity}{" "}
                                    {getUnitLabel(product.stockUnit)}
                                  </p>
                                </div>

                                <div>
                                  <p className="mb-2 text-center text-xs font-black uppercase tracking-wide text-slate-500">
                                    Yüklenecek
                                  </p>

                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    value={quantities[product.id] || ""}
                                    onChange={(event) =>
                                      updateQuantity(
                                        product.id,
                                        event.target.value,
                                      )
                                    }
                                    placeholder={language === "de" ? "0" : "0"}
                                    className={`w-full rounded-xl border px-4 py-3 text-center text-lg font-black outline-none ${
                                      exceedsStock
                                        ? "border-red-400 bg-red-50 text-red-700"
                                        : "border-slate-200 bg-white focus:border-orange-500"
                                    }`}
                                  />

                                  {exceedsStock ? (
                                    <p className="mt-1 text-center text-xs font-bold text-red-600">
                                      Ana stok yetersiz
                                    </p>
                                  ) : null}
                                </div>
                              </article>
                            );
                          })}
                        </div>
                      </section>
                    ))
                  )}
                </div>

                <label className="mt-6 block">
                  <span className="text-sm font-black text-slate-700">
                    Yükleme notu
                  </span>

                  <textarea
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    maxLength={1000}
                    rows={3}
                    placeholder={t.noteLoad}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-orange-500"
                  />
                </label>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm font-bold text-slate-500">
                    {selectedItems.length} ürün seçildi
                  </div>

                  <button
                    type="button"
                    disabled={
                      saving ||
                      selectedItems.length === 0 ||
                      selectedItems.some(
                        ({ product, quantity }) => quantity > product.stock,
                      )
                    }
                    onClick={submitLoad}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 py-3 font-black text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {saving ? (
                      <Loader2 size={19} className="animate-spin" />
                    ) : (
                      <PackagePlus size={19} />
                    )}

                    {saving ? t.loading : t.loadProducts}
                  </button>
                </div>
              </section>
            ) : null}

            {!canManage ? (
              <div className="mt-8 rounded-3xl bg-amber-50 p-6 font-bold text-amber-700">
                Şoför stoklarını görüntüleyebilirsiniz, ancak ürün yükleme veya
                iade alma yetkiniz bulunmuyor.
              </div>
            ) : null}

            {canManage && activeStockAction === "RETURN" ? (
              <section className="mt-4 rounded-3xl bg-white p-4 shadow-sm sm:p-6">
                <div className="flex items-center gap-3">
                  <RotateCcw className="text-green-600" />

                  <div>
                    <h2 className="text-2xl font-black text-slate-950">
                      Şoförden Mal İade Al
                    </h2>

                    <p className="text-sm text-slate-500">
                      {getPersonName(selectedDriver)}
                    </p>
                  </div>
                </div>

                {driverStocks.length === 0 ? (
                  <div className="mt-5 rounded-2xl bg-slate-50 p-5 text-slate-500">
                    Şoförün araç stokunda ürün bulunmuyor.
                  </div>
                ) : (
                  <>
                    <div className="mt-5 overflow-x-auto">
                      <div className="min-w-[1120px]">
                        <div className="grid grid-cols-[minmax(220px,1fr)_90px_125px_90px_125px_205px] gap-3 border-b border-slate-200 px-4 pb-3 text-xs font-black uppercase text-slate-400">
                          <div>{language === "de" ? "Produkt" : "Ürün"}</div>
                          <div className="text-center">{language === "de" ? "Geladen" : "Yüklenen"}</div>
                          <div className="text-center">{language === "de" ? "Ausgangswert" : "Giden Değeri"}</div>
                          <div className="text-center">{language === "de" ? "Verkauft" : "Satılan"}</div>
                          <div className="text-center">{language === "de" ? "Restwert" : "Kalan Değeri"}</div>
                          <div className="text-center">{language === "de" ? "Rückgabe / Zählung" : "Geri Gelen / Sayım"}</div>
                        </div>

                        <div className="divide-y divide-slate-100">
                          {driverStocks.map((stock) => {
                            const rawValue = returnQuantities[stock.productId];

                            const hasValue =
                              rawValue !== undefined && rawValue !== "";

                            const returnedQuantity = hasValue
                              ? Number(rawValue)
                              : null;

                            const exceedsDriverStock =
                              returnedQuantity !== null &&
                              returnedQuantity > stock.currentQuantity;

                            const missingQuantity =
                              returnedQuantity === null || exceedsDriverStock
                                ? null
                                : stock.currentQuantity - returnedQuantity;

                            const isSaving =
                              savingReturnProductId === stock.productId;

                            return (
                              <article
                                key={stock.id}
                                className="grid grid-cols-[minmax(220px,1fr)_90px_125px_90px_125px_205px] items-center gap-3 px-4 py-4"
                              >
                                <div>
                                  <p className="font-black text-slate-950">
                                    {stock.product.displayName}
                                  </p>

                                  <p className="mt-1 text-xs text-slate-500">
                                    {stock.product.packageInfo ||
                                      t.noPackageInfo}
                                  </p>
                                </div>

                                <div className="text-center">
                                  <p className="text-lg font-black text-orange-600">
                                    {stock.loadedQuantity}
                                  </p>

                                  <p className="text-[10px] font-bold text-slate-400">
                                    {getUnitLabel(stock.product.stockUnit)}
                                  </p>
                                </div>

                                <div className="rounded-xl bg-orange-50 px-2 py-2 text-center">
                                  <p className="text-sm font-black text-orange-700">
                                    {(
                                      stock.loadedQuantity * stock.salePrice
                                    ).toLocaleString("de-DE", {
                                      style: "currency",
                                      currency: "EUR",
                                    })}
                                  </p>

                                  <p className="mt-1 text-[9px] font-bold text-orange-600">
                                    Giden
                                  </p>
                                </div>

                                <div className="text-center">
                                  <p className="text-lg font-black text-blue-600">
                                    {stock.soldQuantity}
                                  </p>

                                  <p className="text-[10px] font-bold text-slate-400">
                                    {getUnitLabel(stock.product.stockUnit)}
                                  </p>
                                </div>

                                <div className="rounded-xl bg-green-50 px-2 py-2 text-center">
                                  <p className="text-sm font-black text-green-700">
                                    {(
                                      stock.currentQuantity * stock.salePrice
                                    ).toLocaleString("de-DE", {
                                      style: "currency",
                                      currency: "EUR",
                                    })}
                                  </p>

                                  <p className="mt-1 text-[9px] font-bold text-green-600">
                                    {stock.currentQuantity}{" "}
                                    {getUnitLabel(stock.product.stockUnit)}{" "}
                                    kaldı
                                  </p>
                                </div>

                                <div>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="text"
                                      inputMode="numeric"
                                      value={
                                        returnQuantities[stock.productId] ?? ""
                                      }
                                      onChange={(event) =>
                                        updateReturnQuantity(
                                          stock.productId,
                                          event.target.value,
                                        )
                                      }
                                      placeholder={language === "de" ? "0" : "0"}
                                      disabled={isSaving}
                                      className={`min-w-0 flex-1 rounded-xl border px-3 py-2 text-center font-black outline-none disabled:bg-slate-100 ${
                                        exceedsDriverStock
                                          ? "border-red-400 bg-red-50 text-red-700"
                                          : "border-slate-200 text-slate-950 focus:border-red-500"
                                      }`}
                                    />

                                    <button
                                      type="button"
                                      onClick={() =>
                                        submitReturn(stock.productId)
                                      }
                                      disabled={
                                        isSaving ||
                                        !hasValue ||
                                        exceedsDriverStock
                                      }
                                      className="rounded-xl bg-red-600 px-3 py-2 text-xs font-black text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                      {isSaving ? "..." : (language === "de" ? "Speichern" : "Kaydet")}
                                    </button>
                                  </div>

                                  {exceedsDriverStock ? (
                                    <p className="mt-1 text-center text-[10px] font-black text-red-600">
                                      {language === "de" ? "Mehr als der Fahrzeugbestand" : "Araçta görünenden fazla"}
                                    </p>
                                  ) : missingQuantity !== null ? (
                                    <p
                                      className={`mt-1 text-center text-[10px] font-black ${
                                        missingQuantity > 0
                                          ? "text-red-600"
                                          : "text-green-600"
                                      }`}
                                    >
                                      {missingQuantity > 0
                                        ? `Eksik: ${missingQuantity} ${getUnitLabel(
                                            stock.product.stockUnit,
                                          )}`
                                        : "Eksik yok"}
                                    </p>
                                  ) : (
                                    <p className="mt-1 text-center text-[10px] font-bold text-slate-400">
                                      Araçta beklenen: {stock.currentQuantity}{" "}
                                      {getUnitLabel(stock.product.stockUnit)}
                                    </p>
                                  )}
                                </div>
                              </article>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <label className="mt-6 block">
                      <span className="text-sm font-black text-slate-700">
                        İade notu
                      </span>

                      <textarea
                        value={returnNote}
                        onChange={(event) => setReturnNote(event.target.value)}
                        maxLength={1000}
                        rows={3}
                        placeholder={t.noteReturn}
                        className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-green-500"
                      />
                    </label>

                    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm font-bold text-slate-500">
                        {selectedReturnItems.length} ürün sayımı girildi
                      </p>

                      <button
                        type="button"
                        disabled={
                          returning ||
                          selectedReturnItems.length === 0 ||
                          selectedReturnItems.some(
                            ({ stock, returnedQuantity }) =>
                              returnedQuantity > stock.currentQuantity,
                          )
                        }
                        onClick={() => submitReturn()}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-6 py-3 font-black text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {returning ? (
                          <Loader2 size={19} className="animate-spin" />
                        ) : (
                          <RotateCcw size={19} />
                        )}

                        {returning
                          ? "Kaydediliyor..."
                          : t.saveCounts}
                      </button>
                    </div>
                  </>
                )}
              </section>
            ) : null}
          </>
        ) : (
          <div className="mt-6 rounded-3xl bg-white p-8 text-center text-slate-500">
            Stok bilgilerini görmek veya ürün yüklemek için bir şoför seçin.
          </div>
        )}
      </div>
    </main>
  );
}
