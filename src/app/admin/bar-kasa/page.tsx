"use client";

import { useLanguage } from "@/context/LanguageContext";
import {
  ArrowDownCircle,
  ArrowLeft,
  ArrowUpCircle,
  Loader2,
  Minus,
  Pencil,
  Plus,
  Trash2,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type PurchaseItem = {
  id?: string;
  categoryId: string;
  productId: string;
  productName?: string;

  quantity?: number;
  unitPrice?: number;
  totalAmount?: number;

  packageCount: number;
  unitsPerPackage: number;
  packagePrice: number;
  purchaseUnit: string;
  stockUnit: string;
  salePrice: number;
  pfandAmount: number;
};

type Movement = {
  id: string;
  direction: "IN" | "OUT";
  category: string;
  amount: number;
  companyName: string | null;
  description: string | null;
  createdAt: string;
  purchaseItems: PurchaseItem[];
};

type Supplier = {
  id: string;
  name: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  street: string | null;
  houseNumber: string | null;
  postalCode: string | null;
  city: string | null;
  country: string;
  taxNumber: string | null;
  customerNumber: string | null;
  note: string | null;
};

type ProductCategory = {
  id: string;
  name: string;
  nameTr: string | null;
  nameDe: string | null;
  slug: string;
  type: "DRINK" | "PACKAGING" | "TAKEAWAY" | "CLEANING" | "OTHER";
};

type Product = {
  id: string;
  name: string;
  nameTr: string | null;
  nameDe: string | null;
  categoryId: string;
  category: ProductCategory;
  stock: number;
  stockUnit: string;
  purchasePrice: number;
  price: number;
  pfandAmount: number;
  packageInfo: string | null;
};

type StockUnitOption = {
  id: string;
  code: string;
  nameTr: string;
  nameDe: string;
  active: boolean;
  sortOrder: number;
};

type Permissions = {
  createBarCashIncome: boolean;
  createBarCashExpense: boolean;
  deleteBarCashMovement: boolean;
};

function getStockUnitLabel(code: string, stockUnits: StockUnitOption[]) {
  const unit = stockUnits.find((item) => item.code === code);

  return (
    unit?.nameTr.toLocaleLowerCase("tr-TR") || code.toLocaleLowerCase("tr-TR")
  );
}


function createCategorySlug(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/ä/g, "a")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function createEmptyPurchaseItem(): PurchaseItem {
  return {
    categoryId: "",
    productId: "",
    packageCount: 1,
    unitsPerPackage: 1,
    packagePrice: 0,
    purchaseUnit: "ADET",
    stockUnit: "ADET",
    salePrice: 0,
    pfandAmount: 0,
  };
}

export default function BarCashPage() {
  const { language } = useLanguage();

const categoryLabels: Record<string, string> =
    language === "de"
      ? {
          BAR_SALE: "Barverkauf",
          PFAND_COLLECTION: "Pfandrücknahme",
          SUPPLIER_PAYMENT: "Lieferantenzahlung",
          GOODS_PURCHASE: "Wareneinkauf",
          FUEL: "Kraftstoff",
          PERSONNEL: "Personal",
          RENT: "Miete",
          MANUAL_INCOME: "Manuelle Einnahme",
          OTHER_EXPENSE: "Sonstige Ausgaben",
        }
      : {
          BAR_SALE: "Bar Satışı",
          PFAND_COLLECTION: "Pfand Tahsilatı",
          SUPPLIER_PAYMENT: "Tedarikçi Ödemesi",
          GOODS_PURCHASE: "Mal Alımı",
          FUEL: "Yakıt",
          PERSONNEL: "Personel",
          RENT: "Kira",
          MANUAL_INCOME: "Manuel Gelir",
          OTHER_EXPENSE: "Diğer Gider",
        };


  const t =
    language === "de"
      ? {
          save: "Speichern",
          companyName: "Firmenname",
          description: "Beschreibung",
          amount: "Betrag (€)",
          invoiceOrDescription: "Rechnungsnummer oder Beschreibung",
          cashMovements: "Kassenbewegungen",
          goodsPurchase: "Wareneingang speichern und Lager aktualisieren",
          companyNotSpecified: "Firma nicht angegeben",
          selectProduct: "Produkt auswählen",
          selectCategoryFirst: "Zuerst Kategorie auswählen",

          adminPanel: "Adminbereich",
          cashTitle: "Kasse",
          cashDescription: "Verfolgen Sie Barverkäufe, Wareneinkäufe, Pfandrücknahmen und Kassenausgaben.",
          totalIncome: "Gesamte Einnahmen",
          totalExpense: "Gesamte Ausgaben",
          currentBalance: "Aktueller Kontostand",
          newCashMovement: "Neue Kassenbewegung",
          cashIn: "Geldeingang",
          cashOut: "Geldausgang",
          category: "Kategorie",
          selectCategory: "Kategorie auswählen",
          noPermission: "Sie haben keine Berechtigung für diese Aktion.",

          supplier: "Lieferant",
          selectSupplier: "Lieferant auswählen",
          selectOrCreateSupplier: "Vorhandenen Lieferanten auswählen oder neu anlegen.",
          closeForm: "Formular schließen",
          newSupplier: "+ Neuer Lieferant",
          saveSupplier: "Lieferanten speichern",
          newSupplierTitle: "Neuen Lieferanten anlegen",
          contactPerson: "Ansprechpartner",
          phone: "Telefon",
          email: "E-Mail",
          street: "Straße",
          houseNumber: "Hausnummer",
          postalCode: "PLZ",
          city: "Stadt",
          country: "Land",
          taxNumber: "Steuernummer",
          customerNumber: "Kunden-/Firmennummer",
          supplierNote: "Lieferantennotiz",
          customerNo: "Kundennr.",
          newCategory: "+ Neue Kategorie",
          categoryNameTr: "Türkischer Kategoriename",
          categoryNameDe: "Deutscher Kategoriename",


        }
      : {
          save: "Speichern",
          companyName: "Firmenname",
          description: "Beschreibung",
          amount: "Tutar (€)",
          invoiceOrDescription: "Fatura numarası veya açıklama",
          cashMovements: "Kassenbewegungen",
          goodsPurchase: "Wareneingang speichern und Lager aktualisieren",
          companyNotSpecified: "Firma nicht angegeben",
          selectProduct: "Produkt auswählen",
          selectCategoryFirst: "Önce kategori seçin",

          adminPanel: "Admin Paneli",
          cashTitle: "Kasse",
          cashDescription: "Nakit satışları, mal alımlarını, Pfand tahsilatlarını ve kasa giderlerini takip edin.",
          totalIncome: "Gesamte Einnahmen",
          totalExpense: "Gesamte Ausgaben",
          currentBalance: "Güncel Bakiye",
          newCashMovement: "Neue Kassenbewegung",
          cashIn: "Geldeingang",
          cashOut: "Geldausgang",
          category: "Kategorie",
          selectCategory: "Kategorie auswählen",
          noPermission: "Bu işlem için yetkiniz bulunmuyor.",

          supplier: "Firma",
          selectSupplier: "Lieferant auswählen",
          selectOrCreateSupplier: "Kayıtlı firmayı seçin veya yeni firma oluşturun.",
          closeForm: "Formu kapat",
          newSupplier: "+ Neuer Lieferant",
          saveSupplier: "Lieferanten speichern",
          newSupplierTitle: "Neuen Lieferanten anlegen",
          contactPerson: "Yetkili kişi",
          phone: "Telefon",
          email: "E-posta",
          street: "Sokak",
          houseNumber: "Kapı numarası",
          postalCode: "Posta kodu",
          city: "Şehir",
          country: "Ülke",
          taxNumber: "Vergi numarası",
          customerNumber: "Kunden-/Firmennummer",
          supplierNote: "Lieferantennotiz",
          customerNo: "Kundennr.",

          newCategory: "+ Neue Kategorie",
          categoryNameTr: "Türkçe kategori adı",
          categoryNameDe: "Almanca kategori adı",
          saveCategory: "Kategorie speichern",

          drink: "İçecek",
          packaging: "Ambalaj",
          takeAway: "Take Away",
          cleaning: "Temizlik",
          other: "Diğer",

          currentStock: "Mevcut stok",
          lastPurchasePrice: "Son kasa alış fiyatı",
          purchaseInfo: "Einkaufsinformationen",
          salesInfo: "Verkaufsinformationen",

          newUnit: "+ Neue Einheit",
          trPalette: "Türkçe: Palet",
          dePalette: "Almanca: Palette",

          purchasePackage: "Einkaufsverpackung",
          purchaseQuantity: "Alınan miktar",
          packageContent: "Ambalaj içeriği",
          salesUnit: "Verkaufseinheit",

          addToStock: "Stoğa eklenecek",
          addAnotherProduct: "Başka ürün ekle",
          totalPurchase: "Gesamter Wareneinkauf",

          stock: "Bestand",
          editUnit: "Birimi Düzenle",
          addUnit: "Birimi Ekle",
          purchase: "Einkauf",
          piece: "adet",
          pfand: "Pfand",

        };


  const [movements, setMovements] = useState<Movement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [productCategories, setProductCategories] = useState<ProductCategory[]>(
    [],
  );

  const [stockUnits, setStockUnits] = useState<StockUnitOption[]>([]);

  const [showStockUnitFormFor, setShowStockUnitFormFor] = useState<
    number | null
  >(null);

  const [savingStockUnit, setSavingStockUnit] = useState(false);

  const [stockUnitError, setStockUnitError] = useState("");

  const [editingStockUnitId, setEditingStockUnitId] = useState("");

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  const [selectedSupplierId, setSelectedSupplierId] = useState("");

  const [showSupplierForm, setShowSupplierForm] = useState(false);

  const [savingSupplier, setSavingSupplier] = useState(false);

  const [supplierError, setSupplierError] = useState("");

  const [showCategoryForm, setShowCategoryForm] = useState(false);

  const [savingCategory, setSavingCategory] = useState(false);

  const [categoryError, setCategoryError] = useState("");

  const [summary, setSummary] = useState({
    totalIn: 0,
    totalOut: 0,
    balance: 0,
  });

  const [permissions, setPermissions] = useState<Permissions | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [direction, setDirection] = useState<"IN" | "OUT">("OUT");

  const [category, setCategory] = useState("");

  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([
    createEmptyPurchaseItem(),
  ]);

  const isGoodsPurchase = direction === "OUT" && category === "GOODS_PURCHASE";

  const purchaseTotal = useMemo(
    () =>
      Number(
        purchaseItems
          .reduce(
            (total, item) => total + item.packageCount * item.packagePrice,
            0,
          )
          .toFixed(2),
      ),
    [purchaseItems],
  );

  const selectedSupplier =
    suppliers.find((supplier) => supplier.id === selectedSupplierId) || null;

  const loadCash = useCallback(async () => {
    try {
      const [cashResponse, categoriesResponse, stockUnitsResponse] =
        await Promise.all([
          fetch("/api/admin/bar-cash"),
          fetch("/api/admin/categories"),
          fetch("/api/admin/stock-units"),
        ]);

      const cashData = await cashResponse.json();
      const categoriesData = await categoriesResponse.json();

      const stockUnitsData = await stockUnitsResponse.json();

      if (!cashResponse.ok) {
        setError(
          cashData.error ||
            (language === "de"
              ? "Kasse konnte nicht geladen werden."
              : "Gerçek kasa yüklenemedi."),
        );
        return;
      }

      if (!categoriesResponse.ok) {
        setError(categoriesData.error || language === "de" ? "Produktkategorien konnten nicht geladen werden." : "Produktkategorien yüklenemedi.");
        return;
      }

      if (!stockUnitsResponse.ok) {
        setError(
          stockUnitsData.error ||
            (language === "de"
              ? "Lagereinheiten konnten nicht geladen werden."
              : "Bestand birimleri yüklenemedi."),
        );
        return;
      }

      setMovements(cashData.movements || []);
      setProducts(cashData.products || []);
      setSummary(cashData.summary);
      setPermissions(cashData.permissions);

      setStockUnits(stockUnitsData.units || []);

      setProductCategories(
        [...(categoriesData.categories || [])].sort(
          (a: ProductCategory, b: ProductCategory) =>
            (a.nameTr || a.name).localeCompare(b.nameTr || b.name, "tr"),
        ),
      );
    } catch {
      setError(
        language === "de"
          ? "Kasse und Produktkategorien konnten nicht geladen werden."
          : "Gerçek kasa ve ürün kategorileri yüklenemedi."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSuppliers = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/suppliers");

      const data = await response.json();

      if (!response.ok) {
        setSupplierError(
          data.error ||
            (language === "de"
              ? "Lieferanten konnten nicht geladen werden."
              : "Firmalar yüklenemedi."),
        );
        return;
      }

      setSuppliers(data.suppliers || []);
    } catch {
      setSupplierError(language === "de" ? "Lieferanten konnten nicht geladen werden." : "Firmalar yüklenemedi.");
    }
  }, []);

  useEffect(() => {
    loadCash();
    loadSuppliers();
  }, [loadCash, loadSuppliers]);

  function updatePurchaseItem(index: number, patch: Partial<PurchaseItem>) {
    setPurchaseItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              ...patch,
            }
          : item,
      ),
    );
  }

  function selectPurchaseProduct(index: number, productId: string) {
    const product = products.find((item) => item.id === productId);

    updatePurchaseItem(index, {
      productId,

      categoryId: product?.categoryId || "",

      unitsPerPackage: product?.packageInfo
        ? Math.max(1, Number(product.packageInfo.match(/\d+/)?.[0] || 1))
        : 1,

      purchaseUnit: product?.stockUnit || "ADET",

      stockUnit: product?.stockUnit || "ADET",

      packagePrice: product?.purchasePrice || 0,

      salePrice: product?.price || 0,

      pfandAmount: product?.pfandAmount || 0,
    });
  }

  function addPurchaseItem() {
    setPurchaseItems((current) => [...current, createEmptyPurchaseItem()]);
  }

  function removePurchaseItem(index: number) {
    setPurchaseItems((current) => {
      if (current.length === 1) {
        return [createEmptyPurchaseItem()];
      }

      return current.filter((_, itemIndex) => itemIndex !== index);
    });
  }

  async function createStockUnit(
    event: FormEvent<HTMLFormElement>,
    purchaseItemIndex: number,
  ) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    const nameTr = String(formData.get("stockUnitNameTr") || "").trim();

    const nameDe = String(formData.get("stockUnitNameDe") || "").trim();

    if (!nameTr || !nameDe) {
      setStockUnitError("Türkçe ve Almanca birim adı zorunludur.");
      return;
    }

    if (
      editingStockUnitId &&
      !stockUnits.some((unit) => unit.id === editingStockUnitId)
    ) {
      setStockUnitError("Düzenlenecek birim bulunamadı.");
      return;
    }

    setSavingStockUnit(true);
    setStockUnitError("");
    setError("");
    setSuccess("");

    const isEditing = Boolean(editingStockUnitId);

    try {
      const response = await fetch("/api/admin/stock-units", {
        method: isEditing ? "PATCH" : "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          ...(isEditing
            ? {
                id: editingStockUnitId,
              }
            : {}),

          nameTr,
          nameDe,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setStockUnitError(
          data.error ||
            (isEditing ? "Birim düzenlenemedi." : "Yeni birim kaydedilemedi."),
        );
        return;
      }

      const savedUnit = data.unit as StockUnitOption;

      setStockUnits((current) =>
        [...current.filter((unit) => unit.id !== savedUnit.id), savedUnit].sort(
          (a, b) =>
            a.sortOrder - b.sortOrder || a.nameTr.localeCompare(b.nameTr, "tr"),
        ),
      );

      if (!isEditing) {
        updatePurchaseItem(purchaseItemIndex, {
          purchaseUnit: savedUnit.code,
          stockUnit: savedUnit.code,
        });
      }

      setEditingStockUnitId("");
      setShowStockUnitFormFor(null);
      setStockUnitError("");

      form.reset();

      setSuccess(
        isEditing
          ? `${savedUnit.nameTr} birimi başarıyla düzenlendi.`
          : `${savedUnit.nameTr} birimi eklendi ve alış/satış birimi olarak seçildi.`,
      );
    } catch {
      setStockUnitError(
        isEditing ? "Birim düzenlenemedi." : "Yeni birim kaydedilemedi.",
      );
    } finally {
      setSavingStockUnit(false);
    }
  }

  async function createProductCategory(
    event: FormEvent<HTMLFormElement>,
    purchaseItemIndex: number,
  ) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    const nameTr = String(formData.get("nameTr") || "").trim();
    const nameDe = String(formData.get("nameDe") || "").trim();
    const type = String(formData.get("type") || "OTHER");

    if (!nameTr || !nameDe) {
      setCategoryError("Türkçe ve Almanca kategori adı zorunludur.");
      return;
    }

    setSavingCategory(true);
    setCategoryError("");

    try {
      const response = await fetch("/api/admin/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nameTr,
          nameDe,
          slug: createCategorySlug(nameTr),
          type,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setCategoryError(data.error || "Kategorie eklenemedi.");
        return;
      }

      const createdCategory = data.category as ProductCategory;

      setProductCategories((current) =>
        [
          createdCategory,
          ...current.filter((category) => category.id !== createdCategory.id),
        ].sort((a, b) =>
          (a.nameTr || a.name).localeCompare(b.nameTr || b.name, "tr"),
        ),
      );

      updatePurchaseItem(purchaseItemIndex, {
        categoryId: createdCategory.id,
        productId: "",
      });

      setShowCategoryForm(false);
      setCategoryError("");
      form.reset();

      setSuccess("Yeni ürün kategorisi kaydedildi ve otomatik seçildi.");
    } catch {
      setCategoryError("Kategorie eklenemedi.");
    } finally {
      setSavingCategory(false);
    }
  }

  async function createSupplier(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSavingSupplier(true);
    setSupplierError("");

    const form = event.currentTarget;

    const formData = new FormData(form);

    try {
      const response = await fetch("/api/admin/suppliers", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          name: formData.get("name"),

          contactName: formData.get("contactName"),

          phone: formData.get("phone"),

          email: formData.get("email"),

          street: formData.get("street"),

          houseNumber: formData.get("houseNumber"),

          postalCode: formData.get("postalCode"),

          city: formData.get("city"),

          country: formData.get("country"),

          taxNumber: formData.get("taxNumber"),

          customerNumber: formData.get("customerNumber"),

          note: formData.get("note"),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setSupplierError(data.error || "Firma kaydedilemedi.");
        return;
      }

      await loadSuppliers();

      setSelectedSupplierId(data.supplier.id);

      setShowSupplierForm(false);

      form.reset();

      setSuccess("Firma kaydedildi ve seçildi.");
    } catch {
      setSupplierError("Firma kaydedilemedi.");
    } finally {
      setSavingSupplier(false);
    }
  }

  async function submitMovement() {
    const container = document.getElementById("cash-movement-form");

    if (!container) {
      setError(language === "de" ? "Kassenformular wurde nicht gefunden." : "Kasa hareketi formu bulunamadı.");
      return;
    }

    const fields = Array.from(
      container.querySelectorAll<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >("input, select, textarea"),
    );

    const invalidField = fields.find((field) => !field.checkValidity());

    if (invalidField) {
      invalidField.reportValidity();
      return;
    }

    const getFieldValue = (name: string) => {
      const field = container.querySelector<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >(`[name="${name}"]`);

      return field?.value || "";
    };

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const body = isGoodsPurchase
        ? {
            direction: "OUT",
            category: "GOODS_PURCHASE",

            supplierId: selectedSupplierId,

            companyName: selectedSupplier?.name || "",

            description: getFieldValue("description"),

            purchaseItems,
          }
        : {
            direction,
            category,
            amount: getFieldValue("amount"),
            companyName: getFieldValue("companyName"),
            description: getFieldValue("description"),
          };

      const response = await fetch("/api/admin/bar-cash", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            (language === "de"
              ? "Kassenbewegung konnte nicht gespeichert werden."
              : "Kasa hareketi kaydedilemedi."),
        );
        return;
      }

      for (const fieldName of ["amount", "companyName", "description"]) {
        const field = container.querySelector<
          HTMLInputElement | HTMLTextAreaElement
        >(`[name="${fieldName}"]`);

        if (field) {
          field.value = "";
        }
      }

      setCategory("");

      setSelectedSupplierId("");

      setPurchaseItems([createEmptyPurchaseItem()]);

      setSuccess(data.message);

      await loadCash();
    } catch {
      setError(language === "de" ? "Kassenbewegung konnte nicht gespeichert werden." : "Kasa hareketi kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteMovement(movement: Movement) {
    if (!window.confirm("Bu kasa hareketi silinsin mi?")) {
      return;
    }

    setError("");
    setSuccess("");

    const response = await fetch(`/api/admin/bar-cash?id=${movement.id}`, {
      method: "DELETE",
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.error || language === "de" ? "Kassenbewegung konnte nicht gelöscht werden." : "Kasa hareketi silinemedi.");
      return;
    }

    setSuccess(data.message);
    await loadCash();
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <Loader2 className="animate-spin text-orange-500" />
      </main>
    );
  }

  const canCreate =
    direction === "IN"
      ? permissions?.createBarCashIncome
      : permissions?.createBarCashExpense;

  return (
    <main className="min-h-screen bg-slate-100 p-4 sm:p-6 lg:p-10">
      <div className="w-full">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 font-bold text-slate-600 hover:text-orange-500"
        >
          <ArrowLeft size={18} />
          Admin Paneli
        </Link>

        <section className="mt-6 rounded-[32px] bg-slate-950 p-7 text-white sm:p-10">
          <WalletCards className="text-orange-400" />

          <h1 className="mt-4 text-4xl font-black">{t.cashTitle}</h1>

          <p className="mt-3 text-slate-400">
            {t.cashDescription}
          </p>
        </section>

        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="font-bold text-slate-500">{t.totalIncome}</p>
            <p className="mt-2 text-3xl font-black text-green-700">
              {summary.totalIn.toLocaleString("de-DE", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              €
            </p>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="font-bold text-slate-500">{t.totalExpense}</p>
            <p className="mt-2 text-3xl font-black text-red-600">
              {summary.totalOut.toLocaleString("de-DE", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              €
            </p>
          </div>

          <div className="rounded-3xl bg-orange-500 p-6 text-white shadow-sm">
            <p className="font-bold text-orange-100">{t.currentBalance}</p>
            <p className="mt-2 text-3xl font-black">
              {summary.balance.toLocaleString("de-DE", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              €
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

        <div className="mt-8 grid min-w-0 gap-6 xl:grid-cols-2">
          <section className="min-w-0 w-full rounded-[28px] bg-white p-5 shadow-sm lg:p-6">
            <h2 className="text-2xl font-black text-slate-950">
              Neue Kassenbewegung
            </h2>

            <div className="mt-5 grid gap-3 md:grid-cols-[1fr_1fr_1.4fr]">
              <button
                type="button"
                onClick={() => {
                  setDirection("IN");
                  setCategory("");
                }}
                className={`rounded-xl border px-4 py-3 font-black transition ${
                  direction === "IN"
                    ? "border-green-600 bg-green-600 text-white"
                    : "border-green-200 bg-white text-green-700 hover:bg-green-50"
                }`}
              >
                Geldeingang
              </button>

              <button
                type="button"
                onClick={() => {
                  setDirection("OUT");
                  setCategory("");
                }}
                className={`rounded-xl border px-4 py-3 font-black transition ${
                  direction === "OUT"
                    ? "border-red-600 bg-red-600 text-white"
                    : "border-red-200 bg-white text-red-700 hover:bg-red-50"
                }`}
              >
                Geldausgang
              </button>

              <label className="text-sm font-bold text-slate-600">
                Kategorie
                <select
                  required
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-orange-500"
                >
                  <option value="">{t.selectCategory}</option>

                  {direction === "IN" ? (
                    <>
                      <option value="PFAND_COLLECTION">{categoryLabels.PFAND_COLLECTION}</option>
                      <option value="MANUAL_INCOME">{language === "de" ? "Manuelle Einnahme" : "Manuel Gelir"}</option>
                    </>
                  ) : (
                    <>
                      <option value="SUPPLIER_PAYMENT">
                        Tedarikçi Ödemesi
                      </option>
                      <option value="GOODS_PURCHASE">{categoryLabels.GOODS_PURCHASE}</option>
                      <option value="FUEL">{categoryLabels.FUEL}</option>
                      <option value="PERSONNEL">{language === "de" ? "Personal" : "Personel"}</option>
                      <option value="RENT">{language === "de" ? "Miete" : "Kira"}</option>
                      <option value="OTHER_EXPENSE">{categoryLabels.OTHER_EXPENSE}</option>
                    </>
                  )}
                </select>
              </label>
            </div>

            {!canCreate ? (
              <div className="mt-4 rounded-xl bg-orange-50 p-4 font-bold text-orange-700">
                {t.noPermission}
              </div>
            ) : (
              <div id="cash-movement-form" className="mt-5 space-y-4">
                {isGoodsPurchase ? (
                  <>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-black text-slate-900">{t.supplier}</p>

                          <p className="mt-1 text-xs text-slate-500">
                            {t.selectOrCreateSupplier}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setShowSupplierForm((current) => !current);

                            setSupplierError("");
                          }}
                          className="rounded-xl border border-orange-300 bg-white px-3 py-2 text-sm font-black text-orange-600"
                        >
                          {showSupplierForm ? t.closeForm : t.newSupplier}
                        </button>
                      </div>

                      <select
                        required
                        value={selectedSupplierId}
                        onChange={(event) =>
                          setSelectedSupplierId(event.target.value)
                        }
                        className="mt-4 w-full rounded-xl border border-slate-200 bg-white px-4 py-3"
                      >
                        <option value="">{t.selectSupplier}</option>

                        {suppliers.map((supplier) => (
                          <option key={supplier.id} value={supplier.id}>
                            {supplier.name}
                            {supplier.city ? ` · ${supplier.city}` : ""}
                          </option>
                        ))}
                      </select>

                      {selectedSupplier ? (
                        <div className="mt-3 rounded-xl bg-white p-4 text-sm text-slate-600">
                          <p className="font-black text-slate-900">
                            {selectedSupplier.name}
                          </p>

                          {selectedSupplier.contactName ? (
                            <p className="mt-1">
                              Yetkili: {selectedSupplier.contactName}
                            </p>
                          ) : null}

                          {selectedSupplier.phone ? (
                            <p>Telefon: {selectedSupplier.phone}</p>
                          ) : null}

                          {selectedSupplier.email ? (
                            <p>E-posta: {selectedSupplier.email}</p>
                          ) : null}

                          {selectedSupplier.street || selectedSupplier.city ? (
                            <p className="mt-2">
                              {[
                                selectedSupplier.street,
                                selectedSupplier.houseNumber,
                              ]
                                .filter(Boolean)
                                .join(" ")}
                              {selectedSupplier.street ||
                              selectedSupplier.houseNumber
                                ? ", "
                                : ""}
                              {[
                                selectedSupplier.postalCode,
                                selectedSupplier.city,
                              ]
                                .filter(Boolean)
                                .join(" ")}
                            </p>
                          ) : null}

                          {selectedSupplier.customerNumber ? (
                            <p className="mt-1">
                              {t.customerNo}: {selectedSupplier.customerNumber}
                            </p>
                          ) : null}
                        </div>
                      ) : null}

                      {supplierError ? (
                        <div className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-600">
                          {supplierError}
                        </div>
                      ) : null}
                    </div>

                    {showSupplierForm ? (
                      <form
                        onSubmit={createSupplier}
                        className="rounded-2xl border border-orange-200 bg-orange-50 p-4"
                      >
                        <h3 className="font-black text-orange-900">
                          {t.newSupplierTitle}
                        </h3>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <input
                            required
                            name="name"
                            placeholder={`${t.companyName} *`}
                            className="rounded-xl border border-orange-200 bg-white px-3 py-3 sm:col-span-2"
                          />

                          <input
                            name="contactName"
                            placeholder={t.contactPerson}
                            className="rounded-xl border border-orange-200 bg-white px-3 py-3"
                          />

                          <input
                            name="phone"
                            placeholder={t.phone}
                            className="rounded-xl border border-orange-200 bg-white px-3 py-3"
                          />

                          <input
                            name="email"
                            type="email"
                            placeholder={t.email}
                            className="rounded-xl border border-orange-200 bg-white px-3 py-3 sm:col-span-2"
                          />

                          <input
                            name="street"
                            placeholder={t.street}
                            className="rounded-xl border border-orange-200 bg-white px-3 py-3"
                          />

                          <input
                            name="houseNumber"
                            placeholder={t.houseNumber}
                            className="rounded-xl border border-orange-200 bg-white px-3 py-3"
                          />

                          <input
                            name="postalCode"
                            placeholder={t.postalCode}
                            className="rounded-xl border border-orange-200 bg-white px-3 py-3"
                          />

                          <input
                            name="city"
                            placeholder={t.city}
                            className="rounded-xl border border-orange-200 bg-white px-3 py-3"
                          />

                          <input
                            name="country"
                            defaultValue="Deutschland"
                            placeholder={t.country}
                            className="rounded-xl border border-orange-200 bg-white px-3 py-3 sm:col-span-2"
                          />

                          <input
                            name="taxNumber"
                            placeholder={t.taxNumber}
                            className="rounded-xl border border-orange-200 bg-white px-3 py-3"
                          />

                          <input
                            name="customerNumber"
                            placeholder={t.customerNumber}
                            className="rounded-xl border border-orange-200 bg-white px-3 py-3"
                          />

                          <textarea
                            name="note"
                            rows={2}
                            placeholder={t.supplierNote}
                            className="rounded-xl border border-orange-200 bg-white px-3 py-3 sm:col-span-2"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={savingSupplier}
                          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 font-black text-white disabled:opacity-50"
                        >
                          {savingSupplier ? (
                            <Loader2 size={18} className="animate-spin" />
                          ) : (
                            <Plus size={18} />
                          )}
                          {t.saveSupplier}
                        </button>
                      </form>
                    ) : null}

                    <div className="space-y-3">
                      {purchaseItems.map((item, index) => {
                        const selectedProduct = products.find(
                          (product) => product.id === item.productId,
                        );

                        return (
                          <div
                            key={index}
                            className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <p className="font-black text-slate-800">
                                Produkt {index + 1}
                              </p>

                              <button
                                type="button"
                                onClick={() => removePurchaseItem(index)}
                                className="rounded-lg bg-red-50 p-2 text-red-600"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>

                            <div className="mt-3 grid gap-3 md:grid-cols-2">
                              <div>
                                <div className="flex items-end justify-between gap-2">
                                  <label className="flex-1 text-xs font-bold text-slate-600">
                                    Produktkategorie
                                    <select
                                      required
                                      value={item.categoryId}
                                      onChange={(event) =>
                                        updatePurchaseItem(index, {
                                          categoryId: event.target.value,
                                          productId: "",
                                        })
                                      }
                                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-500"
                                    >
                                      <option value="">{t.selectCategory}</option>

                                      {productCategories.map((category) => (
                                        <option
                                          key={category.id}
                                          value={category.id}
                                        >
                                          {category.nameTr ||
                                            category.nameDe ||
                                            category.name}
                                        </option>
                                      ))}
                                    </select>
                                  </label>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setShowCategoryForm(
                                        (current) => !current,
                                      );
                                      setCategoryError("");
                                    }}
                                    className="mb-0 rounded-lg border border-orange-300 bg-white px-3 py-2.5 text-xs font-black text-orange-600 hover:bg-orange-50"
                                  >
                                    {showCategoryForm
                                      ? t.closeForm
                                      : t.newCategory}
                                  </button>
                                </div>

                                {showCategoryForm ? (
                                  <form
                                    onSubmit={(event) =>
                                      createProductCategory(event, index)
                                    }
                                    className="mt-3 rounded-xl border border-orange-200 bg-orange-50 p-3"
                                  >
                                    <div className="grid gap-2 sm:grid-cols-2">
                                      <input
                                        required
                                        name="nameTr"
                                        placeholder={t.categoryNameTr}
                                        className="rounded-lg border border-orange-200 bg-white px-3 py-2 text-sm"
                                      />

                                      <input
                                        required
                                        name="nameDe"
                                        placeholder={t.categoryNameDe}
                                        className="rounded-lg border border-orange-200 bg-white px-3 py-2 text-sm"
                                      />

                                      <select
                                        name="type"
                                        defaultValue="OTHER"
                                        className="rounded-lg border border-orange-200 bg-white px-3 py-2 text-sm sm:col-span-2"
                                      >
                                        <option value="DRINK">{t.drink}</option>
                                        <option value="PACKAGING">
                                          Ambalaj
                                        </option>
                                        <option value="TAKEAWAY">
                                          Take Away
                                        </option>
                                        <option value="CLEANING">
                                          Temizlik
                                        </option>
                                        <option value="OTHER">{t.other}</option>
                                      </select>
                                    </div>

                                    {categoryError ? (
                                      <div className="mt-2 rounded-lg bg-red-50 p-2 text-xs font-bold text-red-600">
                                        {categoryError}
                                      </div>
                                    ) : null}

                                    <button
                                      type="submit"
                                      disabled={savingCategory}
                                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-orange-500 px-3 py-2 text-sm font-black text-white disabled:opacity-50"
                                    >
                                      {savingCategory ? (
                                        <Loader2
                                          size={16}
                                          className="animate-spin"
                                        />
                                      ) : (
                                        <Plus size={16} />
                                      )}
                                      {t.saveCategory}
                                    </button>
                                  </form>
                                ) : null}
                              </div>

                              <label className="text-xs font-bold text-slate-600">
                                Produkt
                                <select
                                  required
                                  value={item.productId}
                                  disabled={!item.categoryId}
                                  onChange={(event) =>
                                    selectPurchaseProduct(
                                      index,
                                      event.target.value,
                                    )
                                  }
                                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                                >
                                  <option value="">
                                    {item.categoryId
                                      ? t.selectProduct
                                      : t.selectCategoryFirst}
                                  </option>

                                  {products
                                    .filter(
                                      (product) =>
                                        product.categoryId === item.categoryId,
                                    )
                                    .map((product) => (
                                      <option
                                        key={product.id}
                                        value={product.id}
                                      >
                                        {product.nameTr ||
                                          product.nameDe ||
                                          product.name}{" "}
                                        · Bestand: {product.stock}{" "}
                                        {getStockUnitLabel(
                                          product.stockUnit,
                                          stockUnits,
                                        )}
                                      </option>
                                    ))}
                                </select>
                              </label>
                            </div>

                            {selectedProduct ? (
                              <p className="mt-2 text-xs font-semibold text-slate-500">
                                {t.currentStock}: {selectedProduct.stock}{" "}
                                {getStockUnitLabel(
                                  selectedProduct.stockUnit,
                                  stockUnits,
                                )}
                                {selectedProduct.packageInfo
                                  ? ` · Paket: ${selectedProduct.packageInfo}`
                                  : ""}
                                {" · "}{t.lastPurchasePrice}:{" "}
                                {selectedProduct.purchasePrice.toFixed(2)} €
                              </p>
                            ) : null}

                            <div className="mt-4 border-t border-slate-200 pt-4">
                              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                                <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs font-black uppercase tracking-wide">
                                  <span className="text-blue-700">
                                    {t.purchaseInfo}
                                  </span>

                                  <span className="text-orange-600">
                                    {t.salesInfo}
                                  </span>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowStockUnitFormFor((current) =>
                                      current === index ? null : index,
                                    );

                                    setStockUnitError("");
                                  }}
                                  className="rounded-lg border border-orange-300 bg-white px-3 py-2 text-xs font-black normal-case text-orange-600 transition hover:bg-orange-50"
                                >
                                  {showStockUnitFormFor === index
                                    ? t.closeForm
                                    : t.newUnit}
                                </button>
                              </div>

                              {showStockUnitFormFor === index ? (
                                <form
                                  onSubmit={(event) =>
                                    createStockUnit(event, index)
                                  }
                                  className="mt-3 rounded-xl border border-orange-200 bg-orange-50 p-4"
                                >
                                  <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                      <h4 className="font-black text-slate-900">
                                        {editingStockUnitId
                                          ? "Einkaufs-/Verkaufseinheit bearbeiten"
                                          : "Neue Einkaufs-/Verkaufseinheit hinzufügen"}
                                      </h4>

                                      <p className="mt-1 text-xs text-slate-500">
                                        Sie können eine neue Einheit hinzufügen oder eine vorhandene
                                        birimin Türkçe ve Almanca adını
                                        değiştirebilirsiniz.
                                      </p>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingStockUnitId("");
                                          setStockUnitError("");
                                        }}
                                        className={`rounded-lg px-3 py-2 text-xs font-black transition ${
                                          !editingStockUnitId
                                            ? "bg-orange-500 text-white"
                                            : "border border-orange-200 bg-white text-orange-600"
                                        }`}
                                      >
                                        + Neu hinzufügen
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          const currentCode =
                                            item.stockUnit || item.purchaseUnit;

                                          const currentUnit = stockUnits.find(
                                            (unit) => unit.code === currentCode,
                                          );

                                          setEditingStockUnitId(
                                            currentUnit?.id ||
                                              stockUnits[0]?.id ||
                                              "",
                                          );

                                          setStockUnitError("");
                                        }}
                                        disabled={stockUnits.length === 0}
                                        className={`rounded-lg px-3 py-2 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                          editingStockUnitId
                                            ? "bg-slate-950 text-white"
                                            : "border border-slate-300 bg-white text-slate-700"
                                        }`}
                                      >
                                        Düzenle
                                      </button>
                                    </div>
                                  </div>

                                  {editingStockUnitId ? (
                                    <label className="mt-4 block">
                                      <span className="text-xs font-black text-slate-700">
                                        Düzenlenecek birim
                                      </span>

                                      <select
                                        value={editingStockUnitId}
                                        onChange={(event) => {
                                          const unitId = event.target.value;

                                          const selectedUnit = stockUnits.find(
                                            (unit) => unit.id === unitId,
                                          );

                                          setEditingStockUnitId(unitId);
                                          setStockUnitError("");

                                          const formElement =
                                            event.currentTarget.form;

                                          if (formElement && selectedUnit) {
                                            const nameTrInput =
                                              formElement.elements.namedItem(
                                                "stockUnitNameTr",
                                              ) as HTMLInputElement | null;

                                            const nameDeInput =
                                              formElement.elements.namedItem(
                                                "stockUnitNameDe",
                                              ) as HTMLInputElement | null;

                                            if (nameTrInput) {
                                              nameTrInput.value =
                                                selectedUnit.nameTr;
                                            }

                                            if (nameDeInput) {
                                              nameDeInput.value =
                                                selectedUnit.nameDe;
                                            }
                                          }
                                        }}
                                        className="mt-1 w-full rounded-lg border border-orange-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-500"
                                      >
                                        {stockUnits.map((unit) => (
                                          <option key={unit.id} value={unit.id}>
                                            {unit.nameTr} / {unit.nameDe}
                                          </option>
                                        ))}
                                      </select>

                                      <p className="mt-1 text-[10px] font-medium text-slate-500">
                                        Teknik kod değiştirilmez. Eski ürünler
                                        ve kasa kayıtları bağlı kalır.
                                      </p>
                                    </label>
                                  ) : null}

                                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                    <input
                                      key={`tr-${editingStockUnitId}`}
                                      required
                                      name="stockUnitNameTr"
                                      defaultValue={
                                        stockUnits.find(
                                          (unit) =>
                                            unit.id === editingStockUnitId,
                                        )?.nameTr || ""
                                      }
                                      placeholder={t.trPalette}
                                      className="rounded-lg border border-orange-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-500"
                                    />

                                    <input
                                      key={`de-${editingStockUnitId}`}
                                      required
                                      name="stockUnitNameDe"
                                      defaultValue={
                                        stockUnits.find(
                                          (unit) =>
                                            unit.id === editingStockUnitId,
                                        )?.nameDe || ""
                                      }
                                      placeholder={t.dePalette}
                                      className="rounded-lg border border-orange-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-500"
                                    />
                                  </div>

                                  {stockUnitError ? (
                                    <div className="mt-3 rounded-lg bg-red-50 p-3 text-xs font-bold text-red-600">
                                      {stockUnitError}
                                    </div>
                                  ) : null}

                                  <button
                                    type="submit"
                                    disabled={savingStockUnit}
                                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    {savingStockUnit ? (
                                      <Loader2
                                        size={17}
                                        className="animate-spin"
                                      />
                                    ) : editingStockUnitId ? (
                                      <Pencil size={17} />
                                    ) : (
                                      <Plus size={17} />
                                    )}

                                    {editingStockUnitId
                                      ? t.editUnit
                                      : t.addUnit}
                                  </button>
                                </form>
                              ) : null}

                              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                <label className="text-xs font-bold text-slate-600">
                                  <span className="block">{t.purchasePackage}</span>
                                  <span className="mt-0.5 block text-[10px] font-medium leading-4 text-slate-400">
                                    Produkt vom Lieferanten als Kiste, Karton, Paket oder Stück einkaufen
                                    olarak nasıl aldığınızı seçin.
                                  </span>
                                  <select
                                    required
                                    value={item.purchaseUnit}
                                    onChange={(event) =>
                                      updatePurchaseItem(index, {
                                        purchaseUnit: event.target.value,
                                      })
                                    }
                                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                                  >
                                    {stockUnits.map((unit) => (
                                      <option key={unit.id} value={unit.code}>
                                        {unit.nameTr}
                                      </option>
                                    ))}
                                  </select>
                                </label>

                                <label className="text-xs font-bold text-slate-600">
                                  <span className="block">{t.purchaseQuantity}</span>
                                  <span className="mt-0.5 block text-[10px] font-medium leading-4 text-slate-400">
                                    Anzahl der Kisten, Kartons, Pakete oder Stück
                                    aldığınızı girin.
                                  </span>
                                  <input
                                    required
                                    type="number"
                                    min="1"
                                    step="1"
                                    value={item.packageCount}
                                    onChange={(event) =>
                                      updatePurchaseItem(index, {
                                        packageCount:
                                          event.target.value === ""
                                            ? 0
                                            : Math.max(
                                                1,
                                                Number(event.target.value),
                                              ),
                                      })
                                    }
                                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                                  />
                                </label>

                                <label className="text-xs font-bold text-slate-600">
                                  <span className="block">{t.packageContent}</span>
                                  <span className="mt-0.5 block text-[10px] font-medium leading-4 text-slate-400">
                                    Bir alış ambalajının içinde kaç satış birimi
                                    bulunduğunu girin.
                                  </span>
                                  <input
                                    required
                                    type="number"
                                    min="1"
                                    step="1"
                                    value={item.unitsPerPackage}
                                    onChange={(event) =>
                                      updatePurchaseItem(index, {
                                        unitsPerPackage:
                                          event.target.value === ""
                                            ? 0
                                            : Math.max(
                                                1,
                                                Number(event.target.value),
                                              ),
                                      })
                                    }
                                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                                  />
                                </label>

                                <label className="text-xs font-bold text-slate-600">
                                  <span className="block">
                                    Ambalaj alış fiyatı
                                  </span>
                                  <span className="mt-0.5 block text-[10px] font-medium leading-4 text-slate-400">
                                    Bir kasa, karton, paket veya adedin firmadan
                                    alış fiyatıdır.
                                  </span>
                                  <div className="relative mt-1">
                                    <input
                                      required
                                      type="number"
                                      min="0.01"
                                      step="0.01"
                                      value={item.packagePrice}
                                      onChange={(event) =>
                                        updatePurchaseItem(index, {
                                          packagePrice:
                                            event.target.value === ""
                                              ? 0
                                              : Math.max(
                                                  0,
                                                  Number(event.target.value),
                                                ),
                                        })
                                      }
                                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 pr-8 text-sm outline-none focus:border-blue-500"
                                    />

                                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                                      €
                                    </span>
                                  </div>
                                </label>

                                <label className="text-xs font-bold text-slate-600">
                                  <span className="block">{t.salesUnit}</span>
                                  <span className="mt-0.5 block text-[10px] font-medium leading-4 text-slate-400">
                                    Verkaufseinheit des Produkts
                                    veya adet olarak nasıl satılacağını seçin.
                                  </span>
                                  <select
                                    required
                                    value={item.stockUnit}
                                    onChange={(event) =>
                                      updatePurchaseItem(index, {
                                        stockUnit: event.target.value,
                                      })
                                    }
                                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-500"
                                  >
                                    {stockUnits.map((unit) => (
                                      <option key={unit.id} value={unit.code}>
                                        {unit.nameTr}
                                      </option>
                                    ))}
                                  </select>
                                </label>

                                <label className="text-xs font-bold text-slate-600">
                                  <span className="block">
                                    Produkt satış fiyatı
                                  </span>
                                  <span className="mt-0.5 block text-[10px] font-medium leading-4 text-slate-400">
                                    Verkaufspreis ohne Pfand
                                    fiyatıdır.
                                  </span>
                                  <div className="relative mt-1">
                                    <input
                                      required
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={item.salePrice}
                                      onChange={(event) =>
                                        updatePurchaseItem(index, {
                                          salePrice:
                                            event.target.value === ""
                                              ? 0
                                              : Math.max(
                                                  0,
                                                  Number(event.target.value),
                                                ),
                                        })
                                      }
                                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 pr-8 text-sm outline-none focus:border-orange-500"
                                    />

                                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                                      €
                                    </span>
                                  </div>
                                </label>

                                <label className="text-xs font-bold text-slate-600">
                                  <span className="block">{language === "de" ? "Pfand" : "Pfand"}</span>
                                  <span className="mt-0.5 block text-[10px] font-medium leading-4 text-slate-400">
                                    Produkt fiyatına ayrıca eklenecek depozito
                                    tutarıdır.
                                  </span>
                                  <div className="relative mt-1">
                                    <input
                                      required
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={item.pfandAmount}
                                      onChange={(event) =>
                                        updatePurchaseItem(index, {
                                          pfandAmount:
                                            event.target.value === ""
                                              ? 0
                                              : Math.max(
                                                  0,
                                                  Number(event.target.value),
                                                ),
                                        })
                                      }
                                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 pr-8 text-sm outline-none focus:border-orange-500"
                                    />

                                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                                      €
                                    </span>
                                  </div>
                                </label>

                                <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5">
                                  <p className="text-xs font-bold text-slate-500">
                                    Satır toplamı
                                  </p>
                                  <p className="mt-0.5 text-[10px] font-medium leading-4 text-slate-400">
                                    {t.purchaseQuantity} × ambalaj alış fiyatı.
                                  </p>

                                  <p className="mt-1 text-lg font-black text-slate-950">
                                    {(
                                      item.packageCount * item.packagePrice
                                    ).toLocaleString("de-DE", {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })}{" "}
                                    €
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-3 text-sm">
                              <p className="font-bold text-slate-600">
                                {t.addToStock}:{" "}
                                <strong className="text-slate-950">
                                  {item.purchaseUnit === item.stockUnit
                                    ? item.packageCount
                                    : item.packageCount *
                                      item.unitsPerPackage}{" "}
                                  {getStockUnitLabel(
                                    item.stockUnit,
                                    stockUnits,
                                  )}
                                </strong>
                              </p>

                              <p className="mt-1 font-bold text-slate-600">
                                Einkauf:{" "}
                                <strong className="text-slate-950">
                                  {item.packageCount}{" "}
                                  {getStockUnitLabel(
                                    item.purchaseUnit,
                                    stockUnits,
                                  )}
                                </strong>
                                {" · "}{t.packageContent}:{" "}
                                <strong className="text-slate-950">
                                  {item.unitsPerPackage}{" "}
                                  {getStockUnitLabel(
                                    item.stockUnit,
                                    stockUnits,
                                  )}
                                </strong>
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={addPurchaseItem}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-orange-300 bg-orange-50 px-4 py-3 font-black text-orange-600"
                    >
                      <Plus size={18} />
                      {t.addAnotherProduct}
                    </button>

                    <div className="rounded-2xl bg-slate-950 p-5 text-white">
                      <p className="text-sm font-bold text-slate-400">
                        {t.totalPurchase}
                      </p>

                      <p className="mt-1 text-3xl font-black">
                        {purchaseTotal.toLocaleString("de-DE", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        €
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <input
                      required
                      name="amount"
                      type="number"
                      min="0.01"
                      step="0.01"
                      placeholder={t.amount}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3"
                    />

                    <input
                      name="companyName"
                      placeholder={t.companyName}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3"
                    />
                  </>
                )}

                <textarea
                  name="description"
                  placeholder={
                    isGoodsPurchase
                      ? t.invoiceOrDescription
                      : t.description
                  }
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3"
                />

                <button
                  type="button"
                  onClick={() => void submitMovement()}
                  disabled={saving}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-4 font-black text-white disabled:opacity-50"
                >
                  {saving ? <Loader2 className="animate-spin" /> : <Plus />}
                  {isGoodsPurchase
                    ? (language === "de"
                        ? "Wareneingang speichern und Lager aktualisieren"
                        : t.goodsPurchase)
                    : (language === "de" ? "Speichern" : t.save)}
                </button>
              </div>
            )}
          </section>

          <section className="min-w-0 w-full rounded-[28px] bg-white p-5 shadow-sm lg:p-6">
            <h2 className="text-2xl font-black text-slate-950">
              {t.cashMovements}
            </h2>

            {movements.length === 0 ? (
              <p className="mt-6 text-slate-500">
                {language === "de" ? "Noch keine Kassenbewegungen vorhanden." : "Henüz kasa hareketi bulunmuyor."}
              </p>
            ) : (
              <div className="mt-6 space-y-3">
                {movements.map((movement) => (
                  <article
                    key={movement.id}
                    className="rounded-2xl border border-slate-200 p-4"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                          movement.direction === "IN"
                            ? "bg-green-50 text-green-600"
                            : "bg-red-50 text-red-600"
                        }`}
                      >
                        {movement.direction === "IN" ? (
                          <ArrowUpCircle />
                        ) : (
                          <ArrowDownCircle />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="font-black text-slate-950">
                          {categoryLabels[movement.category] ||
                            movement.category}
                        </p>

                        <p className="text-sm font-bold text-slate-600">
                          {movement.companyName || t.companyNotSpecified}
                        </p>

                        {movement.description ? (
                          <p className="mt-1 text-sm text-slate-500">
                            {movement.description}
                          </p>
                        ) : null}

                        <p className="mt-1 text-xs text-slate-400">
                          {new Date(movement.createdAt).toLocaleString("de-DE")}
                        </p>
                      </div>

                      <strong
                        className={
                          movement.direction === "IN"
                            ? "text-green-700"
                            : "text-red-600"
                        }
                      >
                        {movement.direction === "IN" ? "+" : "-"}
                        {movement.amount.toLocaleString("de-DE", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        €
                      </strong>

                      {permissions?.deleteBarCashMovement &&
                      movement.category !== "BAR_SALE" &&
                      movement.category !== "GOODS_PURCHASE" ? (
                        <button
                          type="button"
                          onClick={() => deleteMovement(movement)}
                          className="rounded-xl bg-red-50 p-3 text-red-600"
                        >
                          <Trash2 size={18} />
                        </button>
                      ) : null}
                    </div>

                    {movement.purchaseItems.length > 0 ? (
                      <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
                        {movement.purchaseItems.map((item) => (
                          <div
                            key={item.id}
                            className="flex flex-col gap-1 rounded-xl bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div>
                              <p className="font-bold text-slate-800">
                                {item.productName}
                              </p>

                              <p className="text-sm text-slate-500">
                                {item.packageCount &&
                                item.unitsPerPackage &&
                                item.packagePrice !== null &&
                                item.packagePrice !== undefined ? (
                                  <>
                                    {item.packageCount} {language === "de" ? "Kiste" : "kasa"} · {t.packageContent}:{" "}
                                    {item.unitsPerPackage} {t.piece} · language === "de" ? "Kistenpreis" : t.lastPurchasePrice{" "}
                                    {item.packagePrice.toLocaleString("de-DE", {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })}{" "}
                                    €
                                  </>
                                ) : (
                                  <>
                                    {item.quantity || 0} {language === "de" ? "Stk." : t.piece} ×{" "}
                                    {(item.unitPrice || 0).toLocaleString(
                                      "de-DE",
                                      {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      },
                                    )}{" "}
                                    €
                                  </>
                                )}
                              </p>
                            </div>

                            <strong className="text-slate-900">
                              {(item.totalAmount || 0).toLocaleString("de-DE", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}{" "}
                              €
                            </strong>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
