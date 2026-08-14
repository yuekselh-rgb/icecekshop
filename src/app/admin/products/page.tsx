"use client";

import {
  ArrowLeft,
  FolderPlus,
  GripVertical,
  ImageIcon,
  Loader2,
  PackageCheck,
  PackagePlus,
  PackageX,
  Pencil,
  Plus,
  Save,
  Trash2,
  Upload,
  X,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { ChangeEvent, Fragment, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { getCategoryTheme } from "@/lib/category-theme";

type CategoryType = "DRINK" | "PACKAGING" | "TAKEAWAY" | "CLEANING" | "OTHER";

type PackageUnit = "STUECK" | "G" | "KG" | "ML" | "L";

type Category = {
  id: string;
  name: string;
  nameTr: string | null;
  nameDe: string | null;
  slug: string;
  type: CategoryType;
  sortOrder: number;
};

type Product = {
  id: string;
  name: string;
  nameTr: string | null;
  nameDe: string | null;
  slug: string;
  description: string | null;
  descriptionTr: string | null;
  descriptionDe: string | null;
  price: string | number;
  oldPrice: string | number | null;
  isOffer: boolean;
  pfandAmount: string | number;
  stock: number;
  stockUnit: "KASA" | "KARTON" | "PAKET" | "ADET";
  unitsPerPackage: number;
  minStock: number;
  packageInfo: string | null;
  packageCount: number | null;
  unitAmount: string | number | null;
  unitType: PackageUnit | null;
  imageUrl: string | null;
  imageScale: number;
  imagePositionX: number;
  imagePositionY: number;
  active: boolean;
  soldOut: boolean;
  sortOrder: number;
  categoryId: string;
  category: Category;
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
  viewProducts: boolean;
  createProduct: boolean;
  updateProduct: boolean;
  deleteProduct: boolean;
  changePrice: boolean;
  manageOffers: boolean;
  viewCategories: boolean;
  createCategory: boolean;
  updateCategory: boolean;
  deleteCategory: boolean;
  viewStock: boolean;
  addStock: boolean;
  reduceStock: boolean;
};

const emptyProductForm = {
  nameTr: "",
  nameDe: "",
  slug: "",
  descriptionTr: "",
  descriptionDe: "",
  price: "",
  oldPrice: "",
  isOffer: false,
  pfandAmount: "0",
  stock: "0",
  stockUnit: "ADET",
  unitsPerPackage: "1",
  minStock: "0",
  packageInfo: "",
  imageUrl: "",
  imageScale: "1",
  imagePositionX: "0",
  imagePositionY: "0",
  categoryId: "",
  soldOut: false,
};

const emptyCategoryForm = {
  nameTr: "",
  nameDe: "",
  slug: "",
  type: "OTHER" as CategoryType,
};

const categoryTypeLabels: Record<
  CategoryType,
  {
    de: string;
    tr: string;
  }
> = {
  DRINK: {
    de: "Getränk",
    tr: "İçecek",
  },
  PACKAGING: {
    de: "Verpackung",
    tr: "Ambalaj",
  },
  TAKEAWAY: {
    de: "Take Away",
    tr: "Take Away",
  },
  CLEANING: {
    de: "Reinigung",
    tr: "Temizlik",
  },
  OTHER: {
    de: "Sonstiges",
    tr: "Diğer",
  },
};

const unitLabels: Record<PackageUnit, string> = {
  STUECK: "Stück",
  G: "g",
  KG: "kg",
  ML: "ml",
  L: "l",
};

function createSlug(value: string) {
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

export default function AdminProductsPage() {
  const { language } = useLanguage();

  const [products, setProducts] = useState<Product[]>([]);

  const [categories, setCategories] = useState<Category[]>([]);

  const [draggedCategoryId, setDraggedCategoryId] = useState<string | null>(null);

  const [dragOverCategoryId, setDragOverCategoryId] = useState<string | null>(null);

  const [draggedProductId, setDraggedProductId] = useState<string | null>(null);

  const [dragOverProductId, setDragOverProductId] = useState<string | null>(null);

  const [permissions, setPermissions] = useState<Permissions | null>(null);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [imageUploading, setImageUploading] = useState(false);

  const [imageUploadError, setImageUploadError] = useState("");

  const [categorySaving, setCategorySaving] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const [showProductForm, setShowProductForm] = useState(false);

  const [showCategoryForm, setShowCategoryForm] = useState(false);

  const productFormRef = useRef<HTMLElement | null>(null);

  const categoryFormRef = useRef<HTMLElement | null>(null);

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [form, setForm] = useState(emptyProductForm);

  const [pfandEnabled, setPfandEnabled] = useState(false);

  const [categoryForm, setCategoryForm] = useState(emptyCategoryForm);

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  useEffect(() => {
    if (showProductForm) {
      productFormRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [showProductForm, editingProduct?.id]);

  useEffect(() => {
    if (showCategoryForm) {
      categoryFormRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [showCategoryForm, editingCategory?.id]);

  const [showStockUnitForm, setShowStockUnitForm] = useState(false);

  const [savingStockUnit, setSavingStockUnit] = useState(false);

  const [stockUnitError, setStockUnitError] = useState("");

  const [newStockUnit, setNewStockUnit] = useState({
    nameTr: "",
    nameDe: "",
  });

  const [stockUnits, setStockUnits] = useState<StockUnitOption[]>([]);

  const [stockUnitMode, setStockUnitMode] = useState<"CREATE" | "EDIT">(
    "CREATE",
  );

  const [editingStockUnitId, setEditingStockUnitId] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [
        meResponse,
        productsResponse,
        categoriesResponse,
        stockUnitsResponse,
      ] = await Promise.all([
        fetch("/api/admin/me"),
        fetch("/api/admin/products"),
        fetch("/api/admin/categories"),
        fetch("/api/admin/stock-units"),
      ]);

      const meData = await meResponse.json();

      const productsData = await productsResponse.json();

      const categoriesData = await categoriesResponse.json();

      const stockUnitsData = await stockUnitsResponse.json();

      if (!meResponse.ok) {
        setError(
          meData.error ||
            (language === "de"
              ? "Berechtigungen konnten nicht geladen werden."
              : "Yetkiler yüklenemedi."),
        );
        return;
      }

      setPermissions(meData.permissions);

      if (productsResponse.ok) {
        setProducts(productsData.products);
      } else {
        setError(
          productsData.error ||
            (language === "de"
              ? "Produkte konnten nicht geladen werden."
              : "Ürünler yüklenemedi."),
        );
      }

      if (categoriesResponse.ok) {
        setCategories(categoriesData.categories);
      } else {
        setError(
          categoriesData.error ||
            (language === "de"
              ? "Kategorien konnten nicht geladen werden."
              : "Kategoriler yüklenemedi."),
        );
      }

      if (stockUnitsResponse.ok) {
        setStockUnits(stockUnitsData.units || []);
      } else {
        setError(
          stockUnitsData.error ||
            (language === "de"
              ? "Lagereinheiten konnten nicht geladen werden."
              : "Stok birimleri yüklenemedi."),
        );
      }
    } catch {
      setError(
        language === "de"
          ? "Beim Laden der Daten ist ein Fehler aufgetreten."
          : "Veriler yüklenirken hata oluştu.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const selectedCategory =
    categories.find((category) => category.id === form.categoryId) || null;

  const groupedProducts = useMemo(() => {
    return categories
      .map((category) => ({
        category,
        products: products
          .filter((product) => product.categoryId === category.id)
          .sort((a, b) => a.sortOrder - b.sortOrder),
      }))
      .filter((group) => group.products.length > 0);
  }, [categories, products]);


  async function persistCategoryOrder(updated: Category[]) {
    const previous = categories;

    const reordered = updated.map((category, i) => ({
      ...category,
      sortOrder: i + 1,
    }));

    setCategories(reordered);

    try {
      const response = await fetch("/api/admin/categories", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          categories: reordered.map((c) => ({
            id: c.id,
            sortOrder: c.sortOrder,
          })),
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);

        setCategories(previous);
        setError(
          data?.error ||
            (language === "de"
              ? "Kategoriereihenfolge konnte nicht gespeichert werden."
              : "Kategori sıralaması kaydedilemedi."),
        );
      }
    } catch {
      setCategories(previous);
      setError(
        language === "de"
          ? "Kategoriereihenfolge konnte nicht gespeichert werden."
          : "Kategori sıralaması kaydedilemedi.",
      );
    }
  }

  async function moveCategory(categoryId: string, direction: -1 | 1) {
    const index = categories.findIndex((c) => c.id === categoryId);
    const target = index + direction;

    if (index === -1 || target < 0 || target >= categories.length) {
      return;
    }

    const updated = [...categories];

    [updated[index], updated[target]] = [
      updated[target],
      updated[index],
    ];

    await persistCategoryOrder(updated);
  }

  function handleCategoryDrop(targetCategoryId: string) {
    const draggedId = draggedCategoryId;

    setDraggedCategoryId(null);
    setDragOverCategoryId(null);

    if (!draggedId || draggedId === targetCategoryId) {
      return;
    }

    const updated = [...categories];

    const fromIndex = updated.findIndex((c) => c.id === draggedId);
    const toIndex = updated.findIndex((c) => c.id === targetCategoryId);

    if (fromIndex === -1 || toIndex === -1) {
      return;
    }

    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);

    persistCategoryOrder(updated);
  }

  async function persistProductOrder(
    categoryId: string,
    reorderedGroupProducts: Product[],
  ) {
    const previous = products;

    const reordered = reorderedGroupProducts.map((product, i) => ({
      ...product,
      sortOrder: i + 1,
    }));

    setProducts((current) =>
      current.map(
        (product) =>
          reordered.find((updated) => updated.id === product.id) || product,
      ),
    );

    try {
      const response = await fetch("/api/admin/products", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          products: reordered.map((product) => ({
            id: product.id,
            sortOrder: product.sortOrder,
          })),
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);

        setProducts(previous);
        setError(
          data?.error ||
            (language === "de"
              ? "Produktreihenfolge konnte nicht gespeichert werden."
              : "Ürün sıralaması kaydedilemedi."),
        );
      }
    } catch {
      setProducts(previous);
      setError(
        language === "de"
          ? "Produktreihenfolge konnte nicht gespeichert werden."
          : "Ürün sıralaması kaydedilemedi.",
      );
    }
  }

  async function moveProduct(
    categoryId: string,
    productId: string,
    direction: -1 | 1,
  ) {
    const groupProducts = products.filter(
      (product) => product.categoryId === categoryId,
    );

    const index = groupProducts.findIndex((p) => p.id === productId);
    const target = index + direction;

    if (index === -1 || target < 0 || target >= groupProducts.length) {
      return;
    }

    const updated = [...groupProducts];

    [updated[index], updated[target]] = [updated[target], updated[index]];

    await persistProductOrder(categoryId, updated);
  }

  function handleProductDrop(categoryId: string, targetProductId: string) {
    const draggedId = draggedProductId;

    setDraggedProductId(null);
    setDragOverProductId(null);

    if (!draggedId || draggedId === targetProductId) {
      return;
    }

    const groupProducts = products.filter(
      (product) => product.categoryId === categoryId,
    );

    const fromIndex = groupProducts.findIndex((p) => p.id === draggedId);
    const toIndex = groupProducts.findIndex((p) => p.id === targetProductId);

    if (fromIndex === -1 || toIndex === -1) {
      return;
    }

    const updated = [...groupProducts];

    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);

    persistProductOrder(categoryId, updated);
  }

  function updateProductForm(
    key: keyof typeof emptyProductForm,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function updateCategoryForm(
    key: keyof typeof emptyCategoryForm,
    value: string,
  ) {
    setCategoryForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function openCreateProductForm() {
    setEditingProduct(null);
    setForm(emptyProductForm);
    setPfandEnabled(false);
    setShowCategoryForm(false);
    setShowProductForm(true);
    setError("");
    setSuccess("");
  }

  function openCategoryForm() {
    setCategoryForm(emptyCategoryForm);
    setShowProductForm(false);
    setShowCategoryForm(true);
    setError("");
    setSuccess("");
  }


  function openEditCategory(category: Category) {
    setEditingCategory(category);

    setCategoryForm({
      nameTr: category.nameTr || category.name,
      nameDe: category.nameDe || category.name,
      slug: category.slug,
      type: category.type,
    });

    setShowProductForm(false);
    setShowCategoryForm(true);
    setError("");
    setSuccess("");
  }


  function openEditForm(product: Product) {
    setEditingProduct(product);

    setPfandEnabled(Number(product.pfandAmount || 0) > 0);

    setForm({
      nameTr: product.nameTr || product.name,
      nameDe: product.nameDe || product.name,
      slug: product.slug,
      descriptionTr: product.descriptionTr || "",
      descriptionDe: product.descriptionDe || "",
      price: String(product.price),
      oldPrice: product.oldPrice !== null ? String(product.oldPrice) : "",
      isOffer: product.isOffer,
      pfandAmount: String(product.pfandAmount),
      stock: String(product.stock),
      stockUnit: product.stockUnit || "ADET",
      unitsPerPackage: String(product.unitsPerPackage || 1),
      minStock: String(product.minStock),
      packageInfo: product.packageInfo || "",
      imageUrl: product.imageUrl || "",
      imageScale: String(product.imageScale ?? 1),
      imagePositionX: String(product.imagePositionX ?? 0),
      imagePositionY: String(product.imagePositionY ?? 0),
      categoryId: product.categoryId,
      soldOut: product.soldOut,
    });

    setShowCategoryForm(false);
    setShowProductForm(true);
    setError("");
    setSuccess("");
  }

  function handleProductNameTr(value: string) {
    setForm((current) => ({
      ...current,
      nameTr: value,
      slug: editingProduct || current.slug ? current.slug : createSlug(value),
    }));
  }

  function handleCategoryNameTr(value: string) {
    setCategoryForm((current) => ({
      ...current,
      nameTr: value,
      slug: createSlug(value),
    }));
  }

  function handleCategoryChange(categoryId: string) {
    setForm((current) => ({
      ...current,
      categoryId,
    }));
  }

  async function saveStockUnit() {
    const nameTr = newStockUnit.nameTr.trim();
    const nameDe = newStockUnit.nameDe.trim();

    if (!nameTr || !nameDe) {
      setStockUnitError(
        language === "de"
          ? "Türkischer und deutscher Einheitenname sind erforderlich."
          : "Türkçe ve Almanca birim adı zorunludur.",
      );
      return;
    }

    if (stockUnitMode === "EDIT" && !editingStockUnitId) {
      setStockUnitError(
        language === "de"
          ? "Wählen Sie die zu bearbeitende Einheit aus."
          : "Düzenlenecek birimi seçin.",
      );
      return;
    }

    setSavingStockUnit(true);
    setStockUnitError("");
    setError("");
    setSuccess("");

    try {
      const isEditing = stockUnitMode === "EDIT";

      const response = await fetch("/api/admin/stock-units", {
        method: isEditing ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          isEditing
            ? {
                id: editingStockUnitId,
                nameTr,
                nameDe,
              }
            : {
                nameTr,
                nameDe,
              },
        ),
      });

      const data = await response.json();

      if (!response.ok) {
        setStockUnitError(
          data.error ||
            (language === "de"
              ? isEditing
                ? "Einheit konnte nicht bearbeitet werden."
                : "Neue Einheit konnte nicht hinzugefügt werden."
              : isEditing
                ? "Birim düzenlenemedi."
                : "Yeni birim eklenemedi."),
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

      setForm((current) => ({
        ...current,
        stockUnit: savedUnit.code,
      }));

      setNewStockUnit({
        nameTr: "",
        nameDe: "",
      });

      setEditingStockUnitId("");
      setStockUnitMode("CREATE");
      setShowStockUnitForm(false);

      const savedUnitName =
        language === "de" ? savedUnit.nameDe : savedUnit.nameTr;

      setSuccess(
        language === "de"
          ? isEditing
            ? `Einheit „${savedUnitName}" erfolgreich bearbeitet.`
            : `Einheit „${savedUnitName}" gespeichert und automatisch ausgewählt.`
          : isEditing
            ? `${savedUnitName} birimi başarıyla düzenlendi.`
            : `${savedUnitName} birimi kaydedildi ve otomatik seçildi.`,
      );
    } catch {
      setStockUnitError(
        language === "de"
          ? stockUnitMode === "EDIT"
            ? "Einheit konnte nicht bearbeitet werden."
            : "Neue Einheit konnte nicht hinzugefügt werden."
          : stockUnitMode === "EDIT"
            ? "Birim düzenlenemedi."
            : "Yeni birim eklenemedi.",
      );
    } finally {
      setSavingStockUnit(false);
    }
  }

  async function handleCategorySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setCategorySaving(true);
    setError("");
    setSuccess("");

    const isEditing = Boolean(editingCategory);

    try {
      const response = await fetch(
        isEditing
          ? `/api/admin/categories/${editingCategory!.id}`
          : "/api/admin/categories",
        {
          method: isEditing ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(categoryForm),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            (language === "de"
              ? isEditing
                ? "Kategorie konnte nicht aktualisiert werden."
                : "Kategorie konnte nicht hinzugefügt werden."
              : isEditing
                ? "Kategori güncellenemedi."
                : "Kategori eklenemedi."),
        );
        return;
      }

      if (isEditing) {
        setCategories((current) =>
          current.map((c) =>
            c.id === data.category.id ? data.category : c,
          ),
        );

        setForm((current) => ({
          ...current,
          categoryId: data.category.id,
        }));

        setSuccess(
          language === "de"
            ? "Kategorie erfolgreich aktualisiert."
            : "Kategori başarıyla güncellendi.",
        );
      } else {
        setCategories((current) =>
          [...current, data.category].sort((a, b) =>
            (a.nameTr || a.name).localeCompare(
              b.nameTr || b.name,
              "tr",
            ),
          ),
        );

        setForm((current) => ({
          ...current,
          categoryId: data.category.id,
        }));

        setSuccess(
          language === "de"
            ? "Kategorie erfolgreich hinzugefügt."
            : "Kategori başarıyla eklendi.",
        );
      }

      setEditingCategory(null);
      setCategoryForm(emptyCategoryForm);

      setShowCategoryForm(false);
      setShowProductForm(true);
    } catch {
      setError(
        language === "de"
          ? isEditing
            ? "Beim Aktualisieren der Kategorie ist ein Fehler aufgetreten."
            : "Beim Hinzufügen der Kategorie ist ein Fehler aufgetreten."
          : isEditing
            ? "Kategori güncellenirken hata oluştu."
            : "Kategori eklenirken hata oluştu.",
      );
    } finally {
      setCategorySaving(false);
    }
  }


  function changeImageScale(amount: number) {
    setForm((current) => {
      const currentScale = Number(current.imageScale || 1);

      const nextScale = Math.min(
        8,
        Math.max(0.25, Number((currentScale + amount).toFixed(2))),
      );

      return {
        ...current,
        imageScale: String(nextScale),
      };
    });
  }

  function moveImage(axis: "x" | "y", amount: number) {
    setForm((current) => {
      const key = axis === "x" ? "imagePositionX" : "imagePositionY";

      const currentPosition = Number(current[key] || 0);

      const nextPosition = Math.min(
        100,
        Math.max(-100, currentPosition + amount),
      );

      return {
        ...current,
        [key]: String(nextPosition),
      };
    });
  }

  function centerImage() {
    setForm((current) => ({
      ...current,
      imagePositionX: "0",
      imagePositionY: "0",
    }));
  }

  function resetImageSettings() {
    setForm((current) => ({
      ...current,
      imageScale: "1",
      imagePositionX: "0",
      imagePositionY: "0",
    }));
  }

  async function handleImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) {
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      setImageUploadError(
        language === "de"
          ? "Das Bild darf höchstens 4 MB groß sein."
          : "Resim en fazla 4 MB olabilir.",
      );
      return;
    }

    setImageUploading(true);

    setImageUploadError("");

    setError("");

    try {
      const uploadData = new FormData();

      uploadData.append("file", file);

      const response = await fetch("/api/admin/product-image-upload", {
        method: "POST",
        body: uploadData,
      });

      const data = await response.json();

      if (!response.ok) {
        setImageUploadError(
          data.error ||
            (language === "de"
              ? "Bild konnte nicht hochgeladen werden."
              : "Resim yüklenemedi."),
        );
        return;
      }

      setForm((current) => ({
        ...current,
        imageUrl: data.imageUrl,
      }));

      setSuccess(
        language === "de"
          ? "Produktbild hochgeladen."
          : "Ürün resmi yüklendi.",
      );
    } catch {
      setImageUploadError(
        language === "de"
          ? "Bild konnte nicht hochgeladen werden."
          : "Resim yüklenemedi.",
      );
    } finally {
      setImageUploading(false);
    }
  }

  async function handleProductSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    const isEditing = Boolean(editingProduct);

    try {
      const response = await fetch(
        isEditing
          ? `/api/admin/products/${editingProduct?.id}`
          : "/api/admin/products",
        {
          method: isEditing ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...form,

            price: form.price === "" ? undefined : Number(form.price),

            oldPrice: form.oldPrice === "" ? null : Number(form.oldPrice),

            pfandAmount: pfandEnabled ? Number(form.pfandAmount || 0) : 0,

            stock: Number(form.stock || 0),

            stockUnit: form.stockUnit,

            unitsPerPackage: Math.max(1, Number(form.unitsPerPackage || 1)),

            minStock: Number(form.minStock || 0),

            packageInfo: form.packageInfo.trim(),
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            (language === "de"
              ? "Vorgang fehlgeschlagen."
              : "İşlem başarısız."),
        );
        return;
      }

      setSuccess(
        language === "de"
          ? isEditing
            ? "Produkt erfolgreich aktualisiert."
            : "Produkt erfolgreich hinzugefügt."
          : isEditing
            ? "Ürün başarıyla güncellendi."
            : "Ürün başarıyla eklendi.",
      );

      setShowProductForm(false);
      setEditingProduct(null);
      setForm(emptyProductForm);
      setPfandEnabled(false);

      await loadData();
    } catch {
      setError(
        language === "de"
          ? "Beim Vorgang ist ein Fehler aufgetreten."
          : "İşlem sırasında hata oluştu.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleProductOffer(product: Product) {
    if (!permissions?.manageOffers) {
      setError(
        language === "de"
          ? "Sie sind nicht berechtigt, Angebotsprodukte zu verwalten."
          : "Kampanyalı ürünleri yönetme yetkiniz yok.",
      );
      return;
    }

    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isOffer: !product.isOffer,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            (language === "de"
              ? "Angebotsstatus konnte nicht geändert werden."
              : "Angebot durumu değiştirilemedi."),
        );
        return;
      }

      setSuccess(
        language === "de"
          ? product.isOffer
            ? "Produkt aus dem Angebot entfernt."
            : "Produkt zum Angebot hinzugefügt."
          : product.isOffer
            ? "Ürün Angebot bölümünden çıkarıldı."
            : "Ürün Angebot bölümüne eklendi.",
      );

      await loadData();
    } catch {
      setError(
        language === "de"
          ? "Beim Ändern des Angebotsstatus ist ein Fehler aufgetreten."
          : "Angebot durumu değiştirilirken hata oluştu.",
      );
    }
  }

  async function deleteProduct(product: Product) {
    const productName =
      language === "de"
        ? product.nameDe || product.name
        : product.nameTr || product.name;

    const confirmed = window.confirm(
      language === "de"
        ? `Soll „${productName}" gelöscht werden?`
        : `${productName} ürünü silinsin mi?`,
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/admin/products/${product.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            (language === "de"
              ? "Produkt konnte nicht gelöscht werden."
              : "Ürün silinemedi."),
        );
        return;
      }

      setSuccess(
        data.message ||
          (language === "de"
            ? "Produkt erfolgreich gelöscht."
            : "Ürün başarıyla silindi."),
      );

      await loadData();
    } catch {
      setError(
        language === "de"
          ? "Produkt konnte nicht gelöscht werden."
          : "Ürün silinemedi.",
      );
    }
  }

  async function deleteCategory(category: Category) {
    const categoryName =
      language === "de"
        ? category.nameDe || category.name
        : category.nameTr || category.name;

    const confirmed = window.confirm(
      language === "de"
        ? `Soll die Kategorie „${categoryName}" gelöscht werden?`
        : `${categoryName} kategorisi silinsin mi?`,
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/admin/categories/${category.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            (language === "de"
              ? "Kategorie konnte nicht gelöscht werden."
              : "Kategori silinemedi."),
        );
        return;
      }

      setSuccess(
        data.message ||
          (language === "de"
            ? "Kategorie erfolgreich gelöscht."
            : "Kategori başarıyla silindi."),
      );

      await loadData();
    } catch {
      setError(
        language === "de"
          ? "Kategorie konnte nicht gelöscht werden."
          : "Kategori silinemedi.",
      );
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="flex items-center gap-3 font-bold text-slate-600">
          <Loader2 className="animate-spin" />
          {language === "de" ? "Produkte werden geladen..." : "Ürünler yükleniyor..."}
        </div>
      </main>
    );
  }

  const productFormBlock = showProductForm ? (
          <section
            ref={productFormRef}
            className="mt-6 rounded-[24px] bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl font-black text-slate-950">
                {editingProduct
                  ? language === "de"
                    ? "Produkt bearbeiten"
                    : "Ürünü Düzenle"
                  : language === "de"
                    ? "Neues Produkt hinzufügen"
                    : "Yeni Ürün Ekle"}
              </h2>

              <button
                type="button"
                onClick={() => setShowProductForm(false)}
                className="rounded-xl bg-slate-100 p-2 text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleProductSubmit}
              className="mt-5 grid gap-4 sm:grid-cols-2"
            >
              <Input
                label={
                  language === "de"
                    ? "Türkischer Produktname *"
                    : "Türkçe Ürün Adı *"
                }
                value={form.nameTr}
                onChange={handleProductNameTr}
              />

              <Input
                label={
                  language === "de"
                    ? "Deutscher Produktname *"
                    : "Almanca Ürün Adı *"
                }
                value={form.nameDe}
                onChange={(value) => updateProductForm("nameDe", value)}
              />

              <Input
                label="Slug *"
                value={form.slug}
                onChange={(value) => updateProductForm("slug", value)}
              />

              <label className="block">
                <span className="text-sm font-bold text-slate-700">
                  {language === "de" ? "Kategorie *" : "Kategori *"}
                </span>

                <select
                  required
                  value={form.categoryId}
                  onChange={(event) => handleCategoryChange(event.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 outline-none focus:border-orange-500"
                >
                  <option value="">{language === "de" ? "Kategorie auswählen" : "Kategori seçin"}</option>

                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {language === "de" ? (category.nameDe || category.name) : (category.nameTr || category.name)}
                      
                    </option>
                  ))}
                </select>
              </label>

              <Input
                label={
                  language === "de"
                    ? "Verpackungsinformation *"
                    : "Ambalaj Bilgisi *"
                }
                value={form.packageInfo}
                onChange={(value) => updateProductForm("packageInfo", value)}
              />

              <Input
                label={language === "de" ? "Preis *" : "Fiyat *"}
                type="number"
                step="0.01"
                disabled={!permissions?.changePrice}
                value={form.price}
                onChange={(value) => updateProductForm("price", value)}
              />

              <Input
                label={
                  language === "de"
                    ? "Preis vor Angebot"
                    : "İndirim Öncesi Fiyat"
                }
                type="number"
                step="0.01"
                required={false}
                disabled={!permissions?.manageOffers}
                value={form.oldPrice}
                onChange={(value) => updateProductForm("oldPrice", value)}
              />

              <div className="flex flex-col justify-end">
                <button
                  type="button"
                  disabled={!permissions?.manageOffers}
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      isOffer: !current.isOffer,
                    }))
                  }
                  className={`flex min-h-[58px] w-full items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
                    form.isOffer
                      ? "border-green-300 bg-green-50"
                      : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-black text-slate-950">
                      {language === "de" ? "Angebotsprodukt" : "Kampanyalı Ürün"}
                    </p>

                    <p className="mt-0.5 truncate text-[11px] font-bold text-slate-500">
                      {language === "de"
                        ? "Im Bereich „Unsere Angebote“ anzeigen"
                        : "„Kampanyalarımız” bölümünde göster"}
                    </p>
                  </div>

                  <span
                    className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                      form.isOffer ? "bg-green-500" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${
                        form.isOffer ? "left-6" : "left-1"
                      }`}
                    />
                  </span>
                </button>

                {!permissions?.manageOffers ? (
                  <p className="mt-1.5 text-[11px] font-bold text-slate-400">
                    {language === "de"
                      ? "Erfordert Super-Admin-Rechte."
                      : "Süper Admin yetkisi gerekir."}
                  </p>
                ) : form.isOffer ? (
                  <p className="mt-1.5 text-[11px] font-bold text-green-700">
                    {language === "de" ? "Angebot aktiv" : "Kampanya aktif"}
                  </p>
                ) : null}
              </div>

              <div className="sm:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <button
                  type="button"
                  onClick={() => {
                    setPfandEnabled((current) => {
                      const nextValue = !current;

                      if (!nextValue) {
                        setForm((currentForm) => ({
                          ...currentForm,
                          pfandAmount: "0",
                        }));
                      }

                      return nextValue;
                    });
                  }}
                  className={`flex w-full items-center justify-between gap-4 rounded-xl border px-4 py-3 text-left transition ${
                    pfandEnabled
                      ? "border-orange-300 bg-orange-50"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div>
                    <p className="text-sm font-black text-slate-950">
                      {language === "de" ? "Pfandprodukt" : "Pfandlı Ürün"}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {language === "de"
                        ? "Beim Aktivieren wird das Pfand zum Produktpreis addiert und im Verkauf angezeigt."
                        : "Açıldığında Pfand ürün fiyatına eklenir ve satış ekranlarında gösterilir."}
                    </p>
                  </div>

                  <span
                    className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                      pfandEnabled ? "bg-orange-500" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
                        pfandEnabled ? "left-6" : "left-1"
                      }`}
                    />
                  </span>
                </button>

                {pfandEnabled ? (
                  <div className="mt-4">
                    <Input
                      label={language === "de" ? "Pfandbetrag" : "Pfand Tutarı"}
                      type="number"
                      step="0.01"
                      value={form.pfandAmount}
                      onChange={(value) =>
                        updateProductForm("pfandAmount", value)
                      }
                    />

                    <p className="mt-2 text-xs font-semibold text-orange-600">
                      {language === "de"
                      ? "Beispiel: Produkt 18,90 €, Pfand 6,00 €, angezeigter Gesamtpreis 24,90 €."
                      : "Örnek: Ürün 18,90 € ve Pfand 6,00 € ise müşteriye gösterilen toplam fiyat 24,90 € olur."}
                    </p>
                  </div>
                ) : (
                  <p className="mt-3 text-xs font-bold text-slate-500">
                    {language === "de"
                      ? "Pfand ist deaktiviert. Für dieses Produkt wird kein Pfand berechnet."
                      : "Pfand devre dışı. Bu ürün için Pfand hesaplanmaz."}
                  </p>
                )}
              </div>

              <div className="block">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-bold text-slate-700">
                    {language === "de"
                      ? "Verkaufs- / Lagereinheit"
                      : "Satış / Stok Birimi"}
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      setShowStockUnitForm((current) => {
                        const nextValue = !current;

                        if (!nextValue) {
                          setStockUnitMode("CREATE");
                          setEditingStockUnitId("");
                          setNewStockUnit({
                            nameTr: "",
                            nameDe: "",
                          });
                        }

                        return nextValue;
                      });

                      setStockUnitError("");
                    }}
                    className="text-xs font-black text-orange-500 transition hover:text-orange-600"
                  >
                    {showStockUnitForm
                      ? language === "de"
                        ? "Formular schließen"
                        : "Formu Kapat"
                      : language === "de"
                        ? "+ Hinzufügen / Bearbeiten"
                        : "+ Ekle / Düzenle"}
                  </button>
                </div>

                <select
                  value={form.stockUnit}
                  onChange={(event) =>
                    updateProductForm("stockUnit", event.target.value)
                  }
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 outline-none focus:border-orange-500"
                >
                  {stockUnits.map((unit) => (
                    <option key={unit.id} value={unit.code}>
                      {language === "de" ? unit.nameDe : unit.nameTr}
                    </option>
                  ))}
                </select>

                <p className="mt-1 text-[11px] text-slate-500">
                  {language === "de"
                    ? "Diese Einheit wird im Verkauf und Lager verwendet."
                    : "Bu birim satış ve stokta kullanılır."}
                </p>

                {showStockUnitForm ? (
                  <div className="mt-3 rounded-xl border border-orange-200 bg-orange-50 p-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-orange-950">
                          {stockUnitMode === "EDIT"
                            ? language === "de" ? "Verkaufs-/Lagereinheit bearbeiten" : "Satış / stok birimini düzenle"
                            : language === "de" ? "Neue Verkaufs-/Lagereinheit" : "Yeni satış / stok birimi"}
                        </p>

                        <p className="mt-1 text-[11px] font-medium text-slate-500">
                          {stockUnitMode === "EDIT"
                            ? language === "de" ? "Sie können die deutsche und türkische Bezeichnung bearbeiten." : "Kayıtlı birimin Türkçe ve Almanca adını değiştirebilirsiniz."
                            : language === "de" ? "Beispiel: Palette, Flasche oder Rolle." : "Örnek: Palet / Palette, Şişe / Flasche veya Rulo / Rolle."}
                        </p>
                      </div>

                      <div className="flex rounded-lg border border-orange-200 bg-white p-1">
                        <button
                          type="button"
                          onClick={() => {
                            setStockUnitMode("CREATE");
                            setEditingStockUnitId("");
                            setNewStockUnit({
                              nameTr: "",
                              nameDe: "",
                            });
                            setStockUnitError("");
                          }}
                          className={`rounded-md px-3 py-2 text-xs font-black transition ${
                            stockUnitMode === "CREATE"
                              ? "bg-orange-500 text-white"
                              : "text-orange-600 hover:bg-orange-50"
                          }`}
                        >
                          {language === "de" ? "+ Neu hinzufügen" : "+ Yeni Ekle"}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const selectedUnit =
                              stockUnits.find(
                                (unit) => unit.code === form.stockUnit,
                              ) || stockUnits[0];

                            setStockUnitMode("EDIT");
                            setEditingStockUnitId(selectedUnit?.id || "");
                            setNewStockUnit({
                              nameTr: selectedUnit?.nameTr || "",
                              nameDe: selectedUnit?.nameDe || "",
                            });
                            setStockUnitError("");
                          }}
                          className={`rounded-md px-3 py-2 text-xs font-black transition ${
                            stockUnitMode === "EDIT"
                              ? "bg-slate-950 text-white"
                              : "text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          {language === "de" ? "Bearbeiten" : "Düzenle"}
                        </button>
                      </div>
                    </div>

                    {stockUnitMode === "EDIT" ? (
                      <label className="mt-3 block">
                        <span className="text-[11px] font-black text-slate-600">
                          {language === "de"
                            ? "Zu bearbeitende Einheit"
                            : "Düzenlenecek birim"}
                        </span>

                        <select
                          value={editingStockUnitId}
                          onChange={(event) => {
                            const unit = stockUnits.find(
                              (item) => item.id === event.target.value,
                            );

                            setEditingStockUnitId(event.target.value);

                            setNewStockUnit({
                              nameTr: unit?.nameTr || "",
                              nameDe: unit?.nameDe || "",
                            });

                            if (unit) {
                              updateProductForm("stockUnit", unit.code);
                            }

                            setStockUnitError("");
                          }}
                          className="mt-1 w-full rounded-lg border border-orange-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-500"
                        >
                          <option value="">{language === "de" ? "Einheit auswählen" : "Birim seçin"}</option>

                          {stockUnits.map((unit) => (
                            <option key={unit.id} value={unit.id}>
                              {language === "de" ? unit.nameDe : unit.nameTr}
                            </option>
                          ))}
                        </select>

                        <p className="mt-1 text-[10px] font-medium text-slate-500">
                          {language === "de"
                            ? "Der technische Code wird nicht geändert. Bestehende Produkte und Bestandsdaten bleiben mit dieser Einheit verknüpft."
                            : "Teknik kod değiştirilmez. Eski ürün ve kasa kayıtları bu birime bağlı kalır."}
                        </p>
                      </label>
                    ) : null}

                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <input
                        type="text"
                        value={newStockUnit.nameTr}
                        onChange={(event) =>
                          setNewStockUnit((current) => ({
                            ...current,
                            nameTr: event.target.value,
                          }))
                        }
                        placeholder={language === "de" ? "Türkisch: Palette" : "Türkçe: Palet"}
                        className="min-w-0 rounded-lg border border-orange-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-500"
                      />

                      <input
                        type="text"
                        value={newStockUnit.nameDe}
                        onChange={(event) =>
                          setNewStockUnit((current) => ({
                            ...current,
                            nameDe: event.target.value,
                          }))
                        }
                        placeholder={language === "de" ? "Deutsch: Palette" : "Almanca: Palette"}
                        className="min-w-0 rounded-lg border border-orange-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-500"
                      />
                    </div>

                    {stockUnitError ? (
                      <div className="mt-2 rounded-lg bg-red-50 p-2 text-xs font-bold text-red-600">
                        {stockUnitError}
                      </div>
                    ) : null}

                    <button
                      type="button"
                      disabled={
                        savingStockUnit ||
                        (stockUnitMode === "EDIT" && !editingStockUnitId)
                      }
                      onClick={saveStockUnit}
                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-black text-white transition hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {savingStockUnit ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : stockUnitMode === "EDIT" ? (
                        <span aria-hidden="true">✎</span>
                      ) : (
                        <Plus size={16} />
                      )}

                      {stockUnitMode === "EDIT"
                        ? language === "de"
                          ? "Einheit aktualisieren"
                          : "Birimi Güncelle"
                        : language === "de"
                          ? "Einheit speichern"
                          : "Birimi Kaydet"}
                    </button>
                  </div>
                ) : null}
              </div>

              <Input
                label={
                  language === "de"
                    ? "Verkaufseinheiten pro Verpackung"
                    : "Ambalaj Başına Satış Birimi"
                }
                type="number"
                value={form.unitsPerPackage}
                onChange={(value) =>
                  updateProductForm("unitsPerPackage", value)
                }
              />

              <Input
                label={
                  language === "de"
                    ? `Lagerbestand (${
                        {
                          KASA: "Kiste",
                          KARTON: "Karton",
                          PAKET: "Paket",
                          ADET: "Stück",
                        }[form.stockUnit]
                      })`
                    : `Stok (${
                        {
                          KASA: "kasa",
                          KARTON: "karton",
                          PAKET: "paket",
                          ADET: "adet",
                        }[form.stockUnit]
                      })`
                }
                type="number"
                disabled={
                  editingProduct
                    ? !permissions?.addStock && !permissions?.reduceStock
                    : !permissions?.addStock
                }
                value={form.stock}
                onChange={(value) => updateProductForm("stock", value)}
              />

              <Input
                label={language === "de" ? "Mindestbestand" : "Minimum Stok"}
                type="number"
                value={form.minStock}
                onChange={(value) => updateProductForm("minStock", value)}
              />

              <button
                type="button"
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    soldOut: !current.soldOut,
                  }))
                }
                aria-pressed={form.soldOut}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition sm:col-span-2 ${
                  form.soldOut
                    ? "border-red-200 bg-red-50 hover:bg-red-100"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                {form.soldOut ? (
                  <PackageX size={22} className="shrink-0 text-red-600" />
                ) : (
                  <PackageCheck size={22} className="shrink-0 text-slate-400" />
                )}

                <span>
                  <span
                    className={`block text-sm font-bold ${
                      form.soldOut ? "text-red-700" : "text-slate-900"
                    }`}
                  >
                    {form.soldOut
                      ? language === "de"
                        ? "Als ausverkauft markiert"
                        : "Tükendi olarak işaretlendi"
                      : language === "de"
                        ? "Als ausverkauft markieren"
                        : "Ürünü tükendi olarak işaretle"}
                  </span>

                  <span className="block text-xs text-slate-500">
                    {language === "de"
                      ? "Unabhängig vom Lagerbestand: Produkt bleibt im Shop sichtbar, kann aber nicht bestellt werden."
                      : "Stok miktarından bağımsız: Ürün mağazada görünür kalır ama sipariş edilemez."}
                  </span>
                </span>
              </button>

              <div className="sm:col-span-2">
                <span className="text-sm font-bold text-slate-700">
                  {language === "de" ? "Produktbild" : "Ürün Görseli"}
                </span>

                <div className="mt-1.5 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="grid gap-3 lg:grid-cols-[1fr_140px]">
                    <div>
                      <label className="block">
                        <span className="text-[11px] font-bold text-slate-500">
                          {language === "de"
                            ? "Emoji oder Bild-URL"
                            : "Emoji veya görsel URL"}
                        </span>

                        <input
                          value={form.imageUrl}
                          onChange={(event) => {
                            updateProductForm("imageUrl", event.target.value);

                            setImageUploadError("");
                          }}
                          placeholder={language === "de" ? "🥤 oder https://... oder /uploads/..." : "🥤 veya https://... veya /uploads/..."}
                          className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-orange-500"
                        />
                      </label>

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-slate-950 px-3 py-2 text-[11px] font-black text-white transition hover:bg-orange-500">
                          {imageUploading ? (
                            <Loader2 size={15} className="animate-spin" />
                          ) : (
                            <Upload size={15} />
                          )}

                          {imageUploading
                            ? language === "de"
                              ? "Wird hochgeladen..."
                              : "Yükleniyor..."
                            : language === "de"
                              ? "Vom Computer wählen"
                              : "Bilgisayardan Seç"}

                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            disabled={imageUploading}
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </label>

                        {form.imageUrl ? (
                          <button
                            type="button"
                            onClick={() => {
                              updateProductForm("imageUrl", "");

                              setImageUploadError("");
                            }}
                            className="rounded-lg bg-red-50 px-3 py-2 text-[11px] font-black text-red-600"
                          >
                            {language === "de"
                              ? "Bild entfernen"
                              : "Görseli Kaldır"}
                          </button>
                        ) : null}
                      </div>

                      <p className="mt-1.5 text-[10px] text-slate-500">
                        {language === "de"
                          ? "JPG, PNG, WEBP oder GIF · Max. 4 MB"
                          : "JPG, PNG, WEBP veya GIF · En fazla 4 MB"}
                      </p>

                      {imageUploadError ? (
                        <div className="mt-2 rounded-lg bg-red-50 p-2 text-xs font-bold text-red-600">
                          {imageUploadError}
                        </div>
                      ) : null}
                    </div>

                    <div className="flex h-24 w-full items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white lg:w-[140px]">
                      {form.imageUrl &&
                      (form.imageUrl.startsWith("http://") ||
                        form.imageUrl.startsWith("https://") ||
                        form.imageUrl.startsWith("/") ||
                        form.imageUrl.startsWith("data:image/") ||
                        form.imageUrl.startsWith("blob:")) ? (
                        <img
                          src={form.imageUrl}
                          alt={language === "de" ? "Produktbildvorschau" : "Ürün görseli önizlemesi"}
                          className="h-full w-full object-contain"
                          style={{
                            transform: `translate(${Number(
                              form.imagePositionX || 0,
                            )}px, ${Number(
                              form.imagePositionY || 0,
                            )}px) scale(${Number(form.imageScale || 1)})`,
                          }}
                        />
                      ) : form.imageUrl ? (
                        <span className="text-4xl">{form.imageUrl}</span>
                      ) : (
                        <div className="text-center text-slate-400">
                          <ImageIcon size={26} className="mx-auto" />

                          <p className="mt-1 text-[10px] font-bold">{language === "de" ? "Vorschau" : "Önizleme"}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {form.imageUrl ? (
                    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-200 pt-3">
                      <span className="mr-1 text-[11px] font-black text-slate-600">
                        {language === "de" ? "Größe" : "Boyut"}
                      </span>

                      <button
                        type="button"
                        onClick={() => changeImageScale(-0.1)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-sm font-black transition hover:border-orange-500 hover:text-orange-500"
                        title={language === "de" ? "Verkleinern" : "Küçült"}
                      >
                        −
                      </button>

                      <span className="min-w-14 rounded-lg bg-white px-2 py-1.5 text-center text-[11px] font-black text-slate-800">
                        {Number(form.imageScale || 1).toFixed(2)}x
                      </span>

                      <button
                        type="button"
                        onClick={() => changeImageScale(0.1)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-sm font-black transition hover:border-orange-500 hover:text-orange-500"
                        title={language === "de" ? "Vergrößern" : "Büyüt"}
                      >
                        +
                      </button>

                      <span className="ml-2 mr-1 text-[11px] font-black text-slate-600">
                        {language === "de" ? "Position" : "Konum"}
                      </span>

                      <button
                        type="button"
                        onClick={() => moveImage("x", -5)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-sm font-black transition hover:border-orange-500"
                        title={language === "de" ? "Nach links" : "Sola taşı"}
                      >
                        ←
                      </button>

                      <button
                        type="button"
                        onClick={() => moveImage("y", -5)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-sm font-black transition hover:border-orange-500"
                        title={language === "de" ? "Nach oben" : "Yukarı taşı"}
                      >
                        ↑
                      </button>

                      <button
                        type="button"
                        onClick={() => moveImage("y", 5)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-sm font-black transition hover:border-orange-500"
                        title={language === "de" ? "Nach unten" : "Aşağı taşı"}
                      >
                        ↓
                      </button>

                      <button
                        type="button"
                        onClick={() => moveImage("x", 5)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-sm font-black transition hover:border-orange-500"
                        title={language === "de" ? "Nach rechts" : "Sağa taşı"}
                      >
                        →
                      </button>

                      <span className="rounded-lg bg-orange-50 px-2 py-1.5 text-[10px] font-black text-orange-600">
                        X: {form.imagePositionX} · Y: {form.imagePositionY}
                      </span>

                      <button
                        type="button"
                        onClick={centerImage}
                        className="rounded-lg bg-slate-950 px-3 py-2 text-[10px] font-black text-white"
                      >
                        {language === "de" ? "Zentrieren" : "Ortala"}
                      </button>

                      <button
                        type="button"
                        onClick={resetImageSettings}
                        className="rounded-lg bg-slate-200 px-3 py-2 text-[10px] font-black text-slate-700 transition hover:bg-slate-300"
                      >
                        {language === "de" ? "Zurücksetzen" : "Sıfırla"}
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-3 sm:col-span-2 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
                <Textarea
                  label={
                    language === "de"
                      ? "Türkische Beschreibung"
                      : "Türkçe Açıklama"
                  }
                  value={form.descriptionTr}
                  onChange={(value) =>
                    updateProductForm("descriptionTr", value)
                  }
                />

                <Textarea
                  label={
                    language === "de"
                      ? "Deutsche Beschreibung"
                      : "Almanca Açıklama"
                  }
                  value={form.descriptionDe}
                  onChange={(value) =>
                    updateProductForm("descriptionDe", value)
                  }
                />

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex h-[65px] items-center justify-center gap-1.5 rounded-lg bg-orange-500 px-5 text-xs font-black text-white transition hover:bg-orange-600 disabled:bg-orange-300 lg:min-w-36"
                >
                  {saving ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Save size={15} />
                  )}
                  {language === "de" ? "Produkt speichern" : "Ürünü Kaydet"}
                </button>
              </div>
            </form>
          </section>
  ) : null;

  return (
    <main className="min-h-screen bg-slate-100 p-4 sm:p-6 lg:p-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 font-bold text-slate-600 transition hover:text-orange-500"
          >
            <ArrowLeft size={18} />
            {language === "de" ? "Admin-Panel" : "Admin Paneli"}
          </Link>

          <div className="flex flex-wrap gap-3">
            {permissions?.createCategory ? (
              <button
                type="button"
                onClick={openCategoryForm}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-black text-slate-900 shadow-sm transition hover:text-orange-500"
              >
                <FolderPlus size={19} />
                {language === "de" ? "Neue Kategorie" : "Yeni Kategori"}
              </button>
            ) : null}

            {permissions?.createProduct ? (
              <button
                type="button"
                onClick={openCreateProductForm}
                className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 font-black text-white transition hover:bg-orange-600"
              >
                <Plus size={19} />
                {language === "de" ? "Neues Produkt" : "Yeni Ürün"}
              </button>
            ) : null}
          </div>
        </div>

        <section className="mt-6 rounded-[32px] bg-slate-950 p-7 text-white sm:p-10">
          <PackagePlus size={30} className="text-orange-400" />

          <h1 className="mt-4 text-4xl font-black">{language === "de" ? "Produktverwaltung" : "Ürün Yönetimi"}</h1>

          <p className="mt-3 text-slate-400">
            {language === "de"
              ? "Verwalten Sie Produkte nach Kategorien und bearbeiten Sie Verpackungs- und Mengeneinheiten."
              : "Ürünleri kategorilere göre yönetebilir, ambalaj ve miktar birimlerini düzenleyebilirsiniz."}
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

        {showCategoryForm ? (
          <section
            ref={categoryFormRef}
            className="mt-8 rounded-[28px] bg-white p-6 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black">{editingCategory ? (language === "de" ? "Kategorie bearbeiten" : "Kategori Düzenle") : (language === "de" ? "Neue Kategorie hinzufügen" : "Yeni Kategori Ekle")}</h2>

              <button
                type="button"
                onClick={() => setShowCategoryForm(false)}
                className="rounded-xl bg-slate-100 p-2"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleCategorySubmit}
              className="mt-6 grid gap-5 sm:grid-cols-2"
            >
              <Input
                label={
                  language === "de"
                    ? "Türkischer Kategoriename *"
                    : "Türkçe Kategori Adı *"
                }
                value={categoryForm.nameTr}
                onChange={handleCategoryNameTr}
              />

              <Input
                label={
                  language === "de"
                    ? "Deutscher Kategoriename *"
                    : "Almanca Kategori Adı *"
                }
                value={categoryForm.nameDe}
                onChange={(value) => updateCategoryForm("nameDe", value)}
              />

              <Input
                label="Slug *"
                value={categoryForm.slug}
                onChange={(value) => updateCategoryForm("slug", value)}
              />

              <label className="block">
                <span className="text-sm font-bold text-slate-700">
                  {language === "de" ? "Kategorietyp *" : "Kategori Türü *"}
                </span>

                <select
                  value={categoryForm.type}
                  onChange={(event) =>
                    updateCategoryForm("type", event.target.value)
                  }
                  className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-orange-500"
                >
                  {Object.entries(categoryTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {language === "de" ? label.de : label.tr}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="submit"
                disabled={categorySaving}
                className="flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-4 font-black text-white sm:col-span-2"
              >
                {categorySaving ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Save size={19} />
                )}
                {editingCategory
                  ? language === "de"
                    ? "Kategorie aktualisieren"
                    : "Kategoriyi Güncelle"
                  : language === "de"
                    ? "Kategorie speichern"
                    : "Kategoriyi Kaydet"}
              </button>
            </form>
          </section>
        ) : null}

        {!editingProduct ? productFormBlock : null}

        <div className="mt-8 space-y-7">
          {groupedProducts.map((group) => {
            const categoryTheme = getCategoryTheme(group.category.id);
            const isDragOver = dragOverCategoryId === group.category.id;

            return (
              <section
                key={group.category.id}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (draggedCategoryId && draggedCategoryId !== group.category.id) {
                    setDragOverCategoryId(group.category.id);
                  }
                }}
                onDragLeave={() => {
                  setDragOverCategoryId((current) =>
                    current === group.category.id ? null : current,
                  );
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  handleCategoryDrop(group.category.id);
                }}
                className={`overflow-hidden rounded-[28px] border bg-white shadow-sm transition-colors ${
                  isDragOver ? "border-slate-900" : "border-slate-200"
                }`}
              >
                <div
                  className="mb-5 border-b px-6 pb-4 pt-5"
                  style={{
                    borderColor: categoryTheme.border,
                    backgroundColor: categoryTheme.headerBackground,
                    boxShadow: `inset 6px 0 0 ${categoryTheme.accent}`,
                  }}
                >
                  <p
                    className="text-sm font-black"
                    style={{
                      color: categoryTheme.softText,
                    }}
                  >
                    {language === "de"
                      ? categoryTypeLabels[group.category.type].de
                      : categoryTypeLabels[group.category.type].tr}
                  </p>

                  <div className="mt-1 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        draggable
                        onDragStart={() => setDraggedCategoryId(group.category.id)}
                        onDragEnd={() => {
                          setDraggedCategoryId(null);
                          setDragOverCategoryId(null);
                        }}
                        className="cursor-grab rounded-lg p-2 text-slate-400 hover:bg-white hover:text-slate-600 active:cursor-grabbing"
                        title={language === "de" ? "Zum Verschieben ziehen" : "Taşımak için sürükleyin"}
                      >
                        <GripVertical size={18}/>
                      </span>

                      <h2
                        className="text-xl font-black"
                        style={{
                          color: categoryTheme.text,
                        }}
                      >
                        {language === "de"
                          ? (group.category.nameDe || group.category.name)
                          : (group.category.nameTr || group.category.name)}
                      </h2>
                    </div>

                    <div className="flex gap-2">

                      <button
                        type="button"
                        onClick={() => openEditCategory(group.category)}
                        className="rounded-lg bg-white p-2 hover:bg-slate-100"
                        title={language === "de" ? "Kategorie bearbeiten" : "Kategori Düzenle"}
                      >
                        <Pencil size={18}/>
                      </button>
                      {permissions?.deleteCategory && (
                        <button
                          type="button"
                          onClick={() => deleteCategory(group.category)}
                          className="rounded-lg bg-red-50 p-2 text-red-500 hover:bg-red-100"
                          title={language === "de" ? "Kategorie löschen" : "Kategori Sil"}
                        >
                          <Trash2 size={18}/>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => moveCategory(group.category.id, -1)}
                        className="rounded-lg bg-white p-2 hover:bg-slate-100"
                      >
                        <ChevronUp size={18}/>
                      </button>

                      <button
                        type="button"
                        onClick={() => moveCategory(group.category.id, 1)}
                        className="rounded-lg bg-white p-2 hover:bg-slate-100"
                      >
                        <ChevronDown size={18}/>
                      </button>
                    </div>
                  </div>
                </div>
                <div className="space-y-3 px-6 pb-6">
                  {group.products.map((product) => (
                    <Fragment key={product.id}>
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        if (draggedProductId && draggedProductId !== product.id) {
                          setDragOverProductId(product.id);
                        }
                      }}
                      onDragLeave={() => {
                        setDragOverProductId((current) =>
                          current === product.id ? null : current,
                        );
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        handleProductDrop(group.category.id, product.id);
                      }}
                      className={`flex flex-col gap-4 rounded-2xl border bg-white p-5 transition-colors lg:flex-row lg:items-center ${
                        dragOverProductId === product.id
                          ? "border-slate-900"
                          : "border-slate-200"
                      }`}
                    >
                      {permissions?.updateProduct ? (
                        <div className="flex items-center gap-1 lg:flex-col">
                          <span
                            draggable
                            onDragStart={() => setDraggedProductId(product.id)}
                            onDragEnd={() => {
                              setDraggedProductId(null);
                              setDragOverProductId(null);
                            }}
                            className="cursor-grab rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 active:cursor-grabbing"
                            title={language === "de" ? "Zum Verschieben ziehen" : "Taşımak için sürükleyin"}
                          >
                            <GripVertical size={16} />
                          </span>

                          <div className="flex gap-1 lg:flex-col">
                            <button
                              type="button"
                              onClick={() => moveProduct(group.category.id, product.id, -1)}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                              title={language === "de" ? "Nach oben" : "Yukarı taşı"}
                            >
                              <ChevronUp size={16} />
                            </button>

                            <button
                              type="button"
                              onClick={() => moveProduct(group.category.id, product.id, 1)}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                              title={language === "de" ? "Nach unten" : "Aşağı taşı"}
                            >
                              <ChevronDown size={16} />
                            </button>
                          </div>
                        </div>
                      ) : null}

                      <div className="flex-1">
                        <h3 className="text-lg font-black text-slate-950">
                          {language === "de" ? (product.nameDe || product.name) : (product.nameTr || product.name)}
                        </h3>

                        <p className="text-sm text-slate-500">
                          {language === "de"
                            ? (product.nameDe || product.name)
                            : (product.nameTr || product.name)}
                        </p>

                        <p className="mt-2 font-bold text-slate-500">
                          {product.packageInfo ||
                            (language === "de"
                              ? "Keine Verpackungsinformation"
                              : "Ambalaj bilgisi yok")}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {product.isOffer ? (
                            <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-black text-green-700">
                              {language === "de" ? "Angebot aktiv" : "Kampanya aktif"}
                            </span>
                          ) : null}

                          {product.soldOut ? (
                            <span className="inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-black text-red-700">
                              {language === "de" ? "Ausverkauft" : "Tükendi"}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div>
                        <p className="font-black">
                          {Number(product.price).toFixed(2)} €
                        </p>

                        <p className="text-sm text-slate-500">
                          {language === "de" ? "Lagerbestand" : "Stok"}:{" "}
                          {product.stock}{" "}
                          {language === "de"
                            ? {
                                KASA: "Kiste",
                                KARTON: "Karton",
                                PAKET: "Paket",
                                ADET: "Stück",
                              }[product.stockUnit || "ADET"]
                            : {
                                KASA: "kasa",
                                KARTON: "karton",
                                PAKET: "paket",
                                ADET: "adet",
                              }[product.stockUnit || "ADET"]}
                        </p>

                        <p className="mt-1 text-xs font-semibold text-slate-400">
                          {language === "de"
                            ? `Verpackungsinhalt: ${product.unitsPerPackage || 1} Verkaufseinheiten`
                            : `Paket içeriği: ${product.unitsPerPackage || 1} satış birimi`}
                        </p>

                        {Number(product.pfandAmount) > 0 ? (
                          <p className="mt-1 text-xs font-bold text-orange-600">
                            +
                            {Number(product.pfandAmount).toLocaleString(
                              "de-DE",
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              },
                            )}{" "}
                            € Pfand
                          </p>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {permissions?.manageOffers ? (
                          <button
                            type="button"
                            onClick={() => toggleProductOffer(product)}
                            className={`rounded-xl px-4 py-3 text-xs font-black transition ${
                              product.isOffer
                                ? "bg-green-100 text-green-700 hover:bg-red-50 hover:text-red-600"
                                : "bg-orange-50 text-orange-600 hover:bg-orange-500 hover:text-white"
                            }`}
                          >
                            {product.isOffer
                              ? language === "de"
                                ? "Aus Angebot entfernen"
                                : "Kampanyadan Kaldır"
                              : language === "de"
                                ? "Zum Angebot hinzufügen"
                                : "Kampanyaya Ekle"}
                          </button>
                        ) : null}

                        {permissions?.updateProduct ||
                        permissions?.changePrice ||
                        permissions?.manageOffers ||
                        permissions?.addStock ||
                        permissions?.reduceStock ? (
                          <button
                            type="button"
                            onClick={() => openEditForm(product)}
                            className="rounded-xl bg-slate-950 p-3 text-white transition hover:bg-orange-500"
                          >
                            <Pencil size={18} />
                          </button>
                        ) : null}

                        {permissions?.deleteProduct ? (
                          <button
                            type="button"
                            onClick={() => deleteProduct(product)}
                            className="rounded-xl bg-red-50 p-3 text-red-500"
                          >
                            <Trash2 size={18} />
                          </button>
                        ) : null}
                      </div>
                    </div>

                    {editingProduct?.id === product.id
                      ? productFormBlock
                      : null}
                    </Fragment>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  step,
  disabled = false,
  required = true,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  step?: string;
  disabled?: boolean;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-700">{label}</span>

      <input
        required={required}
        type={type}
        step={step}
        disabled={disabled}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 outline-none focus:border-orange-500 disabled:bg-slate-100"
      />
    </label>
  );
}

function Textarea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-700">{label}</span>

      <textarea
        rows={2}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 min-h-16 w-full resize-y rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-500"
      />
    </label>
  );
}
