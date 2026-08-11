"use client";

import { useLanguage } from "@/context/LanguageContext";
import { escapeHtml } from "@/lib/html-escape";
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Loader2,
  Minus,
  Plus,
  Printer,
  Search,
  ShoppingBasket,
  Trash2,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";

type Category = {
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
  price: string | number;
  pfandAmount: string | number;
  stock: number;
  stockUnit: "KASA" | "KARTON" | "PAKET" | "ADET";
  packageInfo: string | null;
  imageUrl: string | null;
  active: boolean;
  categoryId: string;
  category: Category;
};

type AdminUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  companyName: string | null;
};

type Customer = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  companyName: string | null;
  phone: string | null;
  customerType: string | null;
  address: string | null;
};

type CartItem = {
  product: Product;
  quantity: number;
  price: number;
};

type PaymentMethod = "CASH" | "CARD" | "OPEN";

type PfandOption = {
  name: string;
  unitAmount: number;
  quantity: number;
};

function getStockUnitLabel(unit: Product["stockUnit"], language: "de" | "tr") {
  return language === "de"
    ? {
        KASA: "Kiste",
        KARTON: "Karton",
        PAKET: "Paket",
        ADET: "Stück",
      }[unit]
    : {
        KASA: "kasa",
        KARTON: "karton",
        PAKET: "paket",
        ADET: "adet",
      }[unit];
}

const initialPfandOptions: PfandOption[] = [
  {
    name: "Einweg Pfand 0,25 €",
    unitAmount: 0.25,
    quantity: 0,
  },
  {
    name: "Mehrweg Pfand 0,15 €",
    unitAmount: 0.15,
    quantity: 0,
  },
  {
    name: "Mehrweg Pfand 0,08 €",
    unitAmount: 0.08,
    quantity: 0,
  },
  {
    name: "Kasten Pfand 3,30 €",
    unitAmount: 3.3,
    quantity: 0,
  },
];

export default function BarSalesPage() {
  const { language } = useLanguage();

  const t =
    language === "de"
      ? {
          all: "Alle",
          searchProduct: "Produkt suchen...",
          salesCart: "Warenkorb",
          paymentType: "Zahlungsart",
          cash: "Bar",
          card: "Karte",
          open: "Offen",
          completeSale: "Verkauf abschließen",
          addSale: "Zum Verkauf hinzufügen",
          outOfStock: "Nicht auf Lager",
          stock: "Bestand",
          product: "Produkt",
          noPackageInfo: "Keine Verpackungsinformation",
          seller: "Verkäufer",
          saveAndSelectCustomer: "Kunden speichern und auswählen",
          searchCustomer: "Firma, Kunde, Telefon oder E-Mail suchen...",
          selected: "Ausgewählt",
          select: "Auswählen",
          total: "Gesamt",
          pfand: "Pfand",
          companyName: "Firmenname",
          firstName: "Vorname",
          lastName: "Nachname",
          phone: "Telefon",
          emailOptional: "E-Mail (optional)",
          street: "Straße",
          houseNumber: "Nr.",
          postalCode: "PLZ",
          city: "Stadt",
          floor: "Etage",
          doorbellName: "Klingelschild",
          subtotal: "Zwischensumme",
          newPfand: "Neues Pfand",
          returnedPfand: "Zurückgegebenes Pfand",
          noProductsInCategory: "In dieser Kategorie wurden keine Produkte gefunden",
          noProductsHint: "Wählen Sie eine andere Kategorie oder leeren Sie das Suchfeld.",
          showAllProducts: "Alle Produkte anzeigen",
          items: "Artikel",
          noItemsSelected: "Noch keine Produkte ausgewählt.",
          saving: "Wird gespeichert...",
          saleSaved: (orderNumber: string) => `Verkauf gespeichert. Bestellung: ${orderNumber}`,
          printLastSale: "Letzten Verkauf drucken",
          printing: "Wird gedruckt...",
          printLastSaleFailed: "Beleg konnte nicht geladen werden.",
          popupBlocked: "Druckfenster konnte nicht geöffnet werden. Bitte Popup-Blocker des Browsers prüfen.",
          receiptTitle: "Bestellung",
          receiptDate: "Datum",
          receiptStatus: "Status",
          receiptCustomer: "Kunde",
          receiptDeliveryAddress: "Lieferadresse",
          receiptNote: "Kundennotiz",
          receiptProduct: "Produkt",
          receiptQuantity: "Menge",
          receiptUnitPrice: "Stückpreis",
          receiptPfand: "Pfand",
          receiptTotal: "Gesamt",
          receiptSubtotal: "Zwischensumme",
          openAccountCustomer: "Kunde mit offener Rechnung",
          chooseSeller: "Bitte wählen Sie den Kunden aus.",
          closeNewCustomerForm: "Neues Kundenformular schließen",
          saveNewCustomer: "+ Neuen Kunden speichern",
          company: "Firma",
          privateCustomer: "Privatkunde",
          addressOptional: "Adresse, optional",
          noCustomersFound: "Kein Kunde gefunden.",
          openAccountHolder: "Inhaber der offenen Rechnung",
          unpaidAmountNote: "Der offene Betrag wird diesem Kunden zugeordnet.",
        }
      : {
          all: "Alle",
          searchProduct: "Produkt suchen...",
          salesCart: "Satış Sepeti",
          paymentType: "Ödeme Türü",
          cash: "Nakit",
          card: "Kart",
          open: "Açık",
          completeSale: "Satışı Tamamla",
          addSale: "Satışa Ekle",
          outOfStock: "Stokta Yok",
          stock: "Stok",
          product: "Produkt",
          noPackageInfo: "Paket bilgisi yok",
          seller: "Verkäufer",
          saveAndSelectCustomer: "Müşteriyi Kaydet ve Seç",
          searchCustomer: "Firma, müşteri, telefon veya e-posta ara...",
          selected: "Seçildi",
          select: "Seç",
          total: "Toplam",
          pfand: "Pfand",
          companyName: "Firma adı",
          firstName: "Ad",
          lastName: "Soyad",
          phone: "Telefon",
          emailOptional: "E-posta, isteğe bağlı",
          street: "Sokak",
          houseNumber: "No.",
          postalCode: "Posta kodu",
          city: "Şehir",
          floor: "Kat",
          doorbellName: "Zil adı",
          subtotal: "Ara Toplam",
          newPfand: "Yeni Pfand",
          returnedPfand: "Zurückgegebenes Pfand",
          noProductsInCategory: "Bu kategoride ürün bulunamadı",
          noProductsHint: "Başka bir kategori seçin veya arama alanını temizleyin.",
          showAllProducts: "Tüm ürünleri göster",
          items: "ürün",
          noItemsSelected: "Henüz ürün seçilmedi.",
          saving: "Kaydediliyor...",
          saleSaved: (orderNumber: string) => `Satış kaydedildi. Sipariş: ${orderNumber}`,
          printLastSale: "Son satışı yazdır",
          printing: "Yazdırılıyor...",
          printLastSaleFailed: "Fiş yüklenemedi.",
          popupBlocked: "Yazdırma penceresi açılamadı. Tarayıcı popup engelini kontrol edin.",
          receiptTitle: "Sipariş",
          receiptDate: "Tarih",
          receiptStatus: "Durum",
          receiptCustomer: "Müşteri",
          receiptDeliveryAddress: "Teslimat Adresi",
          receiptNote: "Müşteri Notu",
          receiptProduct: "Ürün",
          receiptQuantity: "Adet",
          receiptUnitPrice: "Birim fiyat",
          receiptPfand: "Pfand",
          receiptTotal: "Toplam",
          receiptSubtotal: "Ara Toplam",
          openAccountCustomer: "Açık Hesap Müşterisi",
          chooseSeller: "Lütfen müşteriyi seçin.",
          closeNewCustomerForm: "Yeni müşteri formunu kapat",
          saveNewCustomer: "+ Yeni müşteri kaydet",
          company: "Firma",
          privateCustomer: "Özel Müşteri",
          addressOptional: "Adres, isteğe bağlı",
          noCustomersFound: "Müşteri bulunamadı.",
          openAccountHolder: "Açık hesap sahibi",
          unpaidAmountNote: "Ödenmeyen tutar bu müşteriye kaydedilecek.",
        };


  const [products, setProducts] = useState<Product[]>([]);

  const [categories, setCategories] = useState<Category[]>([]);

  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);

  const [canChangePrice, setCanChangePrice] = useState(false);

  const [cart, setCart] = useState<CartItem[]>([]);

  /*
   * Aynı satış denemesi için sabit kalır, böylece hızlı çift
   * tıklama veya yeniden deneme aynı anahtarı gönderir ve sunucu
   * tarafında tekrar sipariş oluşmasını engeller. Satış başarıyla
   * tamamlanınca (sepet sıfırlanınca) bir sonraki satış için
   * yenilenir.
   */
  const saleIdempotencyKeyRef = useRef<string | null>(null);

  const [customers, setCustomers] = useState<Customer[]>([]);

  const [selectedCustomerId, setSelectedCustomerId] = useState("");

  const [customerSearch, setCustomerSearch] = useState("");

  const [search, setSearch] = useState("");

  const [activeCategory, setActiveCategory] = useState("ALL");
const [pressedProductId, setPressedProductId] = useState<string | null>(null);

  /*
   * Telefonda aktif kategori ekranın dışında kaldığında
   * kategori satırını otomatik kaydırmak için kullanılır.
   */
  const categoryButtonRefs = useRef<Record<string, HTMLButtonElement | null>>(
    {},
  );

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");

  const [pfandOptions, setPfandOptions] =
    useState<PfandOption[]>(initialPfandOptions);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const [lastSaleOrderId, setLastSaleOrderId] = useState<string | null>(null);

  const [printingLastSale, setPrintingLastSale] = useState(false);

  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);

  const [creatingCustomer, setCreatingCustomer] = useState(false);

  const [newCustomerError, setNewCustomerError] = useState("");

  const [newCustomerType, setNewCustomerType] = useState<
    "PRIVATE" | "BUSINESS"
  >("BUSINESS");

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [
        productsResponse,
        categoriesResponse,
        meResponse,
        customersResponse,
      ] = await Promise.all([
        fetch("/api/admin/products"),
        fetch("/api/admin/categories"),
        fetch("/api/admin/me"),
        fetch("/api/admin/customers"),
      ]);

      console.log("PRODUCT RESPONSE STATUS", productsResponse.status);

      const productsData = await productsResponse.json();

      console.log("PRODUCT RESPONSE", productsData);

      const categoriesData = await categoriesResponse.json();

      const meData = await meResponse.json();

      const customersData = await customersResponse.json();

      if (!productsResponse.ok) {
        setError(
          productsData.error ||
            (language === "de"
              ? "Produkte konnten nicht geladen werden."
              : "Ürünler yüklenemedi."),
        );
        return;
      }

      if (!meResponse.ok) {
        setError(
          meData.error ||
            (language === "de"
              ? "Admin-Informationen konnten nicht geladen werden."
              : "Admin bilgisi yüklenemedi."),
        );
        return;
      }

      if (!customersResponse.ok) {
        setError(
          customersData.error ||
            (language === "de"
              ? "Kunden konnten nicht geladen werden."
              : "Müşteriler yüklenemedi."),
        );
        return;
      }

      const activeProducts =
        productsData.products.filter((product: Product) => product.active);

      console.log("ALL PRODUCTS", productsData.products);
console.log("ACTIVE PRODUCTS", activeProducts.length);

      setProducts(activeProducts);

      if (categoriesResponse.ok) {
        setCategories(categoriesData.categories || []);
      }

      setAdminUser(meData.user);

      setCanChangePrice(Boolean(meData.permissions?.changePrice));

      setCustomers(customersData.customers || []);
    } catch {
      setError(language === "de" ? "Daten konnten nicht geladen werden." : "Bilgiler yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }

  /*
   * Geçici olarak kapatıldı.
   * Filtre testi için.
   */
  useEffect(() => {
    loadData();
  }, []);

  /*
   * Kategoriler bar ve ürün listesinde aynı sırada gösterilir.
   */
  const categoryTypeOrder: Record<string, number> = {
    DRINK: 1,
    PACKAGING: 2,
    TAKEAWAY: 4,
    CLEANING: 5,
    OTHER: 99,
  };

  const getCategoryOrder = (category: Category) => {
    const normalizedSlug = category.slug.toLocaleLowerCase("tr-TR");

    /*
     * Sıcak içecek kategorisi API tarafında OTHER olabileceği için
     * slug üzerinden üçüncü sıraya yerleştiriyoruz.
     */
    if (
      normalizedSlug.includes("sicak") ||
      normalizedSlug.includes("kahve") ||
      normalizedSlug.includes("coffee") ||
      normalizedSlug.includes("heiss")
    ) {
      return 3;
    }

    return categoryTypeOrder[category.type] ?? 99;
  };

  const sortedCategories = useMemo(() => {
    return [...categories].sort((first, second) => {
      const orderDifference =
        getCategoryOrder(first) - getCategoryOrder(second);

      if (orderDifference !== 0) {
        return orderDifference;
      }

      return (
        language === "de"
          ? (first.nameDe || first.name || first.slug)
          : (first.nameTr || first.name || first.slug)
      ).localeCompare(
        language === "de"
          ? (second.nameDe || second.name || second.slug)
          : (second.nameTr || second.name || second.slug),
        language === "de" ? "de" : "tr",
      );
    });
  }, [categories]);

  const categoryButtons = [
    {
      value: "ALL",
      label: "Alle",
    },
    ...sortedCategories.map((category) => ({
      value: category.id,
      label:
        language === "de"
          ? (category.nameDe || category.name || category.slug)
          : (category.nameTr || category.name || category.slug),
    })),
  ];

  /*
   * Kategori butonları artık ürünleri gizlemez.
   * Bütün ürünler kategori sırasına göre gösterilir.
   * Arama alanı kullanılmaya devam eder.
   */
  const filteredProducts = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("tr-TR");
console.log("FILTER", {
      activeCategory,
      productCount: products.length,
    });


    return [...products]
      .filter((product) => {
        const searchableText = [
          product.name,
          product.nameTr,
          product.nameDe,
          product.packageInfo,
          product.category?.name,
          product.category?.nameTr,
          product.category?.nameDe,
        ]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase("tr-TR");

        const matchesSearch =
          !query || searchableText.includes(query);

        return matchesSearch;
      })

    .sort((first, second) => {
        const firstOrder = first.category
          ? getCategoryOrder(first.category)
          : 999;

        const secondOrder = second.category
          ? getCategoryOrder(second.category)
          : 999;

        if (firstOrder !== secondOrder) {
          return firstOrder - secondOrder;
        }

        return (first.nameTr || first.name).localeCompare(
          second.nameTr || second.name,
          "tr",
        );
      });
  }, [products, search, activeCategory]);

  
  const scrollToProductCategory = (categoryId: string) => {
    const container = document.getElementById("bar-sale-scroll");

    if (!container) return;

    if (categoryId === "ALL") {
      container.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      setActiveCategory("ALL");
      return;
    }

    const firstProduct = document.querySelector<HTMLElement>(
      `[data-bar-sale-category="${categoryId}"]`,
    );

    if (!firstProduct) return;

    const containerRect = container.getBoundingClientRect();
    const productRect = firstProduct.getBoundingClientRect();

    container.scrollTo({
      top:
        container.scrollTop +
        productRect.top -
        containerRect.top -
        20,
      behavior: "smooth",
    });

    setActiveCategory(categoryId);
  };


  useEffect(() => {
    const container = document.getElementById("bar-sale-scroll");

    if (!container) return;

    const onScroll = () => {
      const products = document.querySelectorAll<HTMLElement>(
        "[data-bar-sale-category]",
      );

      let current = "ALL";

      products.forEach((product) => {
        const rect = product.getBoundingClientRect();

        if (rect.top < 170) {
          current = product.dataset.barSaleCategory || "ALL";
        }
      });

      setActiveCategory(current);
    };

    container.addEventListener("scroll", onScroll);
    onScroll();

    return () => container.removeEventListener("scroll", onScroll);
  }, [filteredProducts]);

const adminName =
    [adminUser?.firstName, adminUser?.lastName]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    adminUser?.companyName ||
    adminUser?.email ||
    "-";

  const filteredCustomers = useMemo(() => {
    const query = customerSearch.trim().toLocaleLowerCase("tr-TR");

    if (!query) {
      return customers;
    }

    return customers.filter((customer) => {
      const fullName = [customer.firstName, customer.lastName]
        .filter(Boolean)
        .join(" ");

      const text = [
        customer.companyName,
        fullName,
        customer.email,
        customer.phone,
        customer.address,
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("tr-TR");

      return text.includes(query);
    });
  }, [customers, customerSearch]);

  const selectedCustomer =
    customers.find((customer) => customer.id === selectedCustomerId) || null;

  function getCustomerName(customer: Customer) {
    const fullName = [customer.firstName, customer.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();

    return customer.companyName || fullName || customer.email;
  }

  function addProduct(product: Product) {
    setError("");
    setSuccess("");

    if (product.stock <= 0) {
      const productLabel =
        language === "de"
          ? product.nameDe || product.name
          : product.nameTr || product.name;

      setError(
        language === "de"
          ? `${productLabel} ist nicht auf Lager. Einheit: ${getStockUnitLabel(product.stockUnit, language)}`
          : `${productLabel} stokta yok. Birim: ${getStockUnitLabel(product.stockUnit, language)}`,
      );
      return;
    }

    setPressedProductId(product.id);

    setTimeout(() => {
      setCart((current) => {
      const existing = current.find((item) => item.product.id === product.id);

      if (existing) {
        if (existing.quantity >= product.stock) {
          return current;
        }

        return current.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item,
        );
      }

      return [
        ...current,
        {
          product,
          quantity: 1,
          price: Number(product.price),
        },
      ];
      });
    }, 0);

    setTimeout(() => {
      setPressedProductId(null);
    }, 500);
  }

  function changeQuantity(productId: string, amount: number) {
    setCart((current) =>
      current
        .map((item) => {
          if (item.product.id !== productId) {
            return item;
          }

          const quantity = Math.min(
            item.product.stock,
            Math.max(0, item.quantity + amount),
          );

          return {
            ...item,
            quantity,
          };
        })
        .filter((item) => item.quantity > 0),
    );
  }

  function setItemPrice(productId: string, value: number) {
    setCart((current) =>
      current.map((item) =>
        item.product.id === productId
          ? {
              ...item,
              price: Number.isFinite(value) ? Math.max(0, value) : 0,
            }
          : item,
      ),
    );
  }

  function changePfandQuantity(unitAmount: number, amount: number) {
    setPfandOptions((current) =>
      current.map((option) =>
        option.unitAmount === unitAmount
          ? {
              ...option,
              quantity: Math.max(0, option.quantity + amount),
            }
          : option,
      ),
    );
  }

  const subtotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );

  const pfandAmount = cart.reduce(
    (total, item) => total + Number(item.product.pfandAmount) * item.quantity,
    0,
  );

  const pfandReturnAmount = pfandOptions.reduce(
    (total, option) => total + option.unitAmount * option.quantity,
    0,
  );

  const totalAmount = Math.max(0, subtotal + pfandAmount - pfandReturnAmount);

  async function createCustomer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;

    const formData = new FormData(form);

    setCreatingCustomer(true);

    setNewCustomerError("");

    try {
      const response = await fetch("/api/admin/customers", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          customerType: newCustomerType,

          companyName: formData.get("companyName"),

          firstName: formData.get("firstName"),

          lastName: formData.get("lastName"),

          phone: formData.get("phone"),

          email: formData.get("email"),

          street: formData.get("street"),

          houseNumber: formData.get("houseNumber"),

          postalCode: formData.get("postalCode"),

          city: formData.get("city"),

          floor: formData.get("floor"),

          doorbellName: formData.get("doorbellName"),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setNewCustomerError(
          data.error ||
            (language === "de"
              ? "Kunde konnte nicht gespeichert werden."
              : "Müşteri kaydedilemedi."),
        );
        return;
      }

      const createdCustomer = data.customer;

      setCustomers((current) => [
        createdCustomer,
        ...current.filter((customer) => customer.id !== createdCustomer.id),
      ]);

      setSelectedCustomerId(createdCustomer.id);

      setCustomerSearch("");

      setShowNewCustomerForm(false);

      setSuccess(
        data.message ||
          (language === "de"
            ? "Kunde wurde gespeichert und ausgewählt."
            : "Müşteri kaydedildi ve seçildi."),
      );

      form.reset();

      setNewCustomerType("BUSINESS");
    } catch {
      setNewCustomerError(
        language === "de"
          ? "Kunde konnte nicht gespeichert werden."
          : "Müşteri kaydedilemedi.",
      );
    } finally {
      setCreatingCustomer(false);
    }
  }

  async function completeSale() {
    if (cart.length === 0) {
      setError(language === "de" ? "Der Verkaufswarenkorb ist leer." : "Satış sepeti boş.");
      return;
    }

    if (paymentMethod === "OPEN" && !selectedCustomerId) {
      setError(
        language === "de"
          ? "Wählen Sie für einen Verkauf auf offener Rechnung einen Kunden aus."
          : "Açık hesap satışı için müşteri seçin.",
      );
      return;
    }

    if (!saleIdempotencyKeyRef.current) {
      saleIdempotencyKeyRef.current = crypto.randomUUID();
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/admin/bar-sales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idempotencyKey: saleIdempotencyKeyRef.current,

          paymentMethod,

          customerId: paymentMethod === "OPEN" ? selectedCustomerId : null,

          items: cart.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
            price: item.price,
          })),
          pfandItems: pfandOptions
            .filter((option) => option.quantity > 0)
            .map((option) => ({
              name: option.name,
              unitAmount: option.unitAmount,
              quantity: option.quantity,
            })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            (language === "de"
              ? "Verkauf konnte nicht gespeichert werden."
              : "Satış kaydedilemedi."),
        );
        return;
      }

      setSuccess(t.saleSaved(data.order.orderNumber));
      setLastSaleOrderId(data.order.id);

      saleIdempotencyKeyRef.current = null;

      setCart([]);
      setSearch("");
      setSelectedCustomerId("");
      setCustomerSearch("");
      setPfandOptions(initialPfandOptions);

      await loadData();
    } catch {
      setError(
        language === "de"
          ? "Verkauf konnte nicht gespeichert werden."
          : "Satış kaydedilemedi.",
      );
    } finally {
      setSaving(false);
    }
  }

  function hasNavigableAddress(order: { paymentStatus: string; deliveryAddress: string }) {
    return (
      order.paymentStatus === "OPEN" &&
      !order.deliveryAddress.startsWith("Barverkauf") &&
      !order.deliveryAddress.startsWith("Bar Satışı")
    );
  }

  function getMapsQuery(order: { deliveryAddress: string }) {
    return order.deliveryAddress
      .split("\n")
      .filter((line) => !line.startsWith("Telefon:"))
      .join(", ");
  }

  async function getDeliveryQrCode(order: { deliveryAddress: string }) {
    const redirectUrl = `${window.location.origin}/api/maps-redirect?address=${encodeURIComponent(getMapsQuery(order))}`;

    try {
      return await QRCode.toDataURL(redirectUrl, {
        width: 160,
        margin: 1,
      });
    } catch {
      return null;
    }
  }

  async function printLastSale() {
    if (!lastSaleOrderId) {
      return;
    }

    setError("");
    setPrintingLastSale(true);

    try {
      const response = await fetch(`/api/admin/orders/${lastSaleOrderId}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t.printLastSaleFailed);
        return;
      }

      const order = data.order;

      const deliveryQrCode = hasNavigableAddress(order)
        ? await getDeliveryQrCode(order)
        : null;

      const popup = window.open("", "_blank", "width=900,height=700");

      if (!popup) {
        setError(t.popupBlocked);
        return;
      }

      popup.document.write(`
        <!doctype html>
        <html lang="${language === "de" ? "de" : "tr"}">
          <head>
            <meta charset="utf-8" />
            <title>${escapeHtml(order.orderNumber)}</title>

            <style>
              body {
                font-family: Arial, sans-serif;
                padding: 32px;
                color: #0f172a;
              }

              h1 {
                margin-bottom: 4px;
              }

              table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 24px;
              }

              th,
              td {
                border-bottom: 1px solid #ddd;
                padding: 10px;
                text-align: left;
              }

              .totals {
                margin-top: 24px;
                max-width: 360px;
                margin-left: auto;
              }

              .row {
                display: flex;
                justify-content: space-between;
                padding: 6px 0;
              }

              .address {
                white-space: pre-line;
                line-height: 1.6;
              }

              .total {
                border-top: 2px solid #0f172a;
                margin-top: 8px;
                padding-top: 12px;
                font-size: 18px;
              }
            </style>
          </head>

          <body>
            <h1>
              ${t.receiptTitle}
              ${escapeHtml(order.orderNumber)}
            </h1>

            <p>
              ${t.receiptDate}:
              ${new Date(order.createdAt).toLocaleString("de-DE")}
            </p>

            <h2>${t.receiptCustomer}</h2>

            <p>
              ${order.user?.companyName ? `${escapeHtml(order.user.companyName)}<br />` : ""}

              ${escapeHtml(order.user?.firstName || "")}
              ${escapeHtml(order.user?.lastName || "")}<br />

              ${escapeHtml(order.user?.email || "")}
            </p>

            <h2>${t.receiptDeliveryAddress}</h2>

            <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 16px;">
              <p class="address">
                ${escapeHtml(order.deliveryAddress || "")}
              </p>

              ${
                deliveryQrCode
                  ? `<img src="${deliveryQrCode}" width="120" height="120" alt="QR" />`
                  : ""
              }
            </div>

            ${
              order.customerNote
                ? `
                  <h2>${t.receiptNote}</h2>
                  <p>${escapeHtml(order.customerNote)}</p>
                `
                : ""
            }

            <table>
              <thead>
                <tr>
                  <th>${t.receiptProduct}</th>
                  <th>${t.receiptQuantity}</th>
                  <th>${t.receiptUnitPrice}</th>
                  <th>${t.receiptPfand}</th>
                  <th>${t.receiptTotal}</th>
                </tr>
              </thead>

              <tbody>
                ${order.items
                  .map(
                    (item: { name: string; quantity: number; price: number; pfand: number }) => `
                      <tr>
                        <td>${escapeHtml(item.name)}</td>
                        <td>${item.quantity}</td>
                        <td>${item.price.toFixed(2)} €</td>
                        <td>${(item.pfand * item.quantity).toFixed(2)} €</td>
                        <td>${((Number(item.price) + Number(item.pfand || 0)) * item.quantity).toFixed(2)} €</td>
                      </tr>
                    `,
                  )
                  .join("")}
              </tbody>
            </table>

            <div class="totals">
              <div class="row">
                <span>${t.receiptSubtotal}</span>
                <strong>${Number(order.subtotal).toFixed(2)} €</strong>
              </div>

              <div class="row total">
                <span>${t.receiptTotal}</span>
                <strong>${Number(order.totalAmount).toFixed(2)} €</strong>
              </div>
            </div>
          </body>
        </html>
      `);

      popup.document.close();
      popup.focus();

      setTimeout(() => {
        popup.print();
      }, 250);
    } catch {
      setError(t.printLastSaleFailed);
    } finally {
      setPrintingLastSale(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="flex items-center gap-3 font-bold text-slate-500">
          <Loader2 className="animate-spin" />
          {language === "de" ? "Wird geladen..." : "Yükleniyor..."}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-5 lg:p-8">
      <div className="w-full">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-orange-500"
            >
              <ArrowLeft size={17} />
              Adminbereich
            </Link>

            <h1 className="mt-3 text-4xl font-black text-slate-950">
              {language === "de" ? "Barverkauf" : "Bar Satışı"}
            </h1>

            <p className="mt-2 text-slate-500">
              Verkäufer:{" "}
              <strong className="text-slate-950">{adminName}</strong>
            </p>
          </div>

          <div className="rounded-2xl bg-slate-950 px-5 py-4 text-white">
            <p className="text-xs text-slate-400">{t.total}</p>

            <p className="mt-1 text-2xl font-black">
              {totalAmount.toFixed(2)} €
            </p>
          </div>
        </div>

        {error ? (
          <div className="mb-5 rounded-2xl bg-red-50 p-4 font-bold text-red-600">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="mb-5 flex items-center gap-3 rounded-2xl bg-green-50 p-4 font-bold text-green-700">
            <CheckCircle2 size={21} />
            {success}
          </div>
        ) : null}

        <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <section className="flex h-[calc(100vh-120px)] min-w-0 flex-col rounded-[28px] bg-white p-3 shadow-sm sm:p-5">
            <div className="relative">
              <Search
                size={20}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t.searchProduct}
                className="w-full rounded-2xl border border-slate-200 py-4 pl-12 pr-4 outline-none transition focus:border-orange-500"
              />
            </div>

            <div className="sticky top-0 z-40 -mx-3 mt-4 border-y border-slate-200 bg-white px-3 py-3 shadow-sm sm:-mx-5 sm:px-5">
              <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {categoryButtons.map((category) => (
                  <button
                    key={category.value}
                    ref={(element) => {
                      categoryButtonRefs.current[category.value] = element;
                    }}
                    type="button"
                    onClick={() => scrollToProductCategory(category.value)}
                    className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-black transition ${
                      activeCategory === category.value
                        ? "border border-sky-300 bg-sky-100 text-sky-800 shadow-md"
                        : "border border-slate-200 bg-white text-slate-600 hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700"
                    }`}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
            </div>

            <div id="bar-sale-scroll" className="flex-1 overflow-y-auto">

            <div className="mt-3 flex items-center justify-between gap-4">
              <p className="text-sm font-semibold text-slate-500">
                {filteredProducts.length} Produkte
              </p>
            </div>

            {filteredProducts.length > 0 ? (
              <div
                id="bar-sale-product-grid"
                className="mt-4 grid min-w-0 scroll-mt-28 grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
              >
                {filteredProducts.map((product) => (
                  <article
                    key={product.id}
                    data-bar-sale-category={product.categoryId}
                    className="group flex w-full min-w-0 max-w-full scroll-mt-28 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition duration-200 hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-lg sm:rounded-2xl"
                  >
                    <button
                      type="button"
                      onClick={() => addProduct(product)}
                      disabled={product.stock <= 0}
                      className="flex h-full w-full min-w-0 max-w-full flex-col overflow-hidden text-left disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <div className="relative flex h-28 w-full min-w-0 items-center justify-center overflow-hidden bg-slate-100 sm:h-48">
                        {product.imageUrl &&
                        (product.imageUrl.startsWith("http://") ||
                          product.imageUrl.startsWith("https://") ||
                          product.imageUrl.startsWith("/") ||
                          product.imageUrl.startsWith("data:image/") ||
                          product.imageUrl.startsWith("blob:")) ? (
                          <img
                            src={product.imageUrl}
                            alt={language === "de"
  ? (product.nameDe || product.name)
  : (product.nameTr || product.name)}
                            className="h-full w-full object-contain p-1.5 transition duration-300 group-hover:scale-105 sm:p-2"
                          />
                        ) : (
                          <span className="text-5xl transition duration-300 group-hover:scale-110 sm:text-7xl">
                            {product.imageUrl || "📦"}
                          </span>
                        )}

                        <span
                          className={`absolute right-2 top-2 rounded-full px-2 py-1 text-[10px] font-black shadow-sm ${
                            product.stock > 0
                              ? "bg-white text-green-600"
                              : "bg-red-50 text-red-600"
                          }`}
                        >
                          {product.stock > 0
                            ? language === "de" ? `Bestand: ${product.stock}` : `Stok: ${product.stock}`
                            : language === "de" ? "Nicht auf Lager" : "Stokta yok"}
                        </span>
                      </div>

                      <div className="flex min-w-0 flex-1 flex-col px-2 pb-2 pt-2 sm:px-3">
                        <div className="flex min-w-0 items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="uppercase tracking-wide text-[11px] font-extrabold text-orange-500">
                              {language === "de"
  ? (product.category?.nameDe || product.category?.name || t.product)
  : (product.category?.nameTr || product.category?.name || t.product)}
                            </p>

                            <h2 className="mt-0.5 truncate text-sm font-black leading-4 text-slate-950">
                              {language === "de"
  ? (product.nameDe || product.name)
  : (product.nameTr || product.name)}
                            </h2>

                            <p className="mt-0.5 truncate text-[10px] text-slate-500">
                              {product.packageInfo || t.noPackageInfo}
                            </p>
                          </div>

                          <span className="shrink-0 rounded-lg bg-slate-100 px-2 py-1 text-[9px] font-black text-slate-500">
                            {getStockUnitLabel(product.stockUnit, language)}
                          </span>
                        </div>

                        <div className="mt-2 rounded-xl bg-slate-50 p-2 text-[10px]">
                          <div className="flex justify-between gap-2 text-slate-600">
                            <span>{t.product}</span>
                            <strong>
                              {Number(product.price).toFixed(2)} €
                            </strong>
                          </div>

                          {Number(product.pfandAmount || 0) > 0 ? (
                            <div className="mt-1 flex justify-between gap-2 text-slate-600">
                              <span>{t.pfand}</span>
                              <strong>
                                {Number(product.pfandAmount).toFixed(2)} €
                              </strong>
                            </div>
                          ) : null}

                          <div className="mt-1 flex justify-between gap-2 border-t border-slate-200 pt-1 text-slate-950">
                            <span className="font-black">{t.total}</span>
                            <strong>
                              {(
                                Number(product.price) +
                                Number(product.pfandAmount)
                              ).toFixed(2)}{" "}
                              €
                            </strong>
                          </div>
                        </div>

                        <div className="mt-2 flex items-center gap-2">
                          <div
                            className={`flex h-8 flex-1 items-center justify-center rounded-lg px-2 text-[10px] font-black text-white transition ${
                              product.stock > 0
                                ? pressedProductId === product.id
                                  ? "bg-yellow-400 text-black scale-95"
                                  : "bg-slate-950 group-hover:bg-orange-500"
                                : "bg-slate-300"
                            }`}
                          >
                            {product.stock > 0
  ? pressedProductId === product.id
    ? "✓ Hinzugefügt"
    : t.addSale
  : t.outOfStock}
                          </div>
                        </div>
                      </div>
                    </button>
                  </article>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center">
                <p className="text-lg font-black text-slate-950">
                  {t.noProductsInCategory}
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  {t.noProductsHint}
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setActiveCategory("ALL");
                  }}
                  className="mt-5 rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-orange-500"
                >
                  {t.showAllProducts}
                </button>
              </div>
            )}
            </div>
          </section>

          <aside className="h-fit rounded-[28px] bg-white p-5 shadow-sm lg:sticky lg:top-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                  <ShoppingBasket size={22} />
                </div>

                <div>
                  <h2 className="font-black text-slate-950">{t.salesCart}</h2>

                  <p className="text-sm text-slate-500">{cart.length} {t.items}</p>
                </div>
              </div>

              {lastSaleOrderId ? (
                <button
                  type="button"
                  onClick={printLastSale}
                  disabled={printingLastSale}
                  className="flex items-center gap-2 rounded-xl bg-slate-950 px-3 py-2 text-xs font-bold text-white transition hover:bg-slate-800 disabled:opacity-50"
                >
                  {printingLastSale ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Printer size={14} />
                  )}
                  {printingLastSale ? t.printing : t.printLastSale}
                </button>
              ) : null}
            </div>

            <div className="mt-5 space-y-3">
              {cart.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-500">
                  {t.noItemsSelected}
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="rounded-2xl border border-slate-200 p-3"
                  >
                    <div className="flex justify-between gap-3">
                      <div>
                        <p className="font-bold text-slate-950">
                          {language === "de"
                            ? (item.product.nameDe || item.product.name)
                            : (item.product.nameTr || item.product.name)}
                        </p>

                        <div className="mt-1 space-y-1 text-xs text-slate-500">
                          {canChangePrice ? (
                            <label className="flex items-center gap-2">
                              <span>{t.product}:</span>

                              <input
                                type="number"
                                min={0}
                                step={0.01}
                                value={item.price}
                                onChange={(event) =>
                                  setItemPrice(
                                    item.product.id,
                                    Number(event.target.value),
                                  )
                                }
                                onFocus={(event) => event.target.select()}
                                className="w-20 rounded-lg border border-slate-200 px-2 py-1 text-right font-bold text-slate-900 outline-none focus:border-orange-500"
                              />

                              <span>€</span>

                              {item.price !== Number(item.product.price) ? (
                                <span className="text-slate-400 line-through">
                                  {Number(item.product.price).toFixed(2)} €
                                </span>
                              ) : null}
                            </label>
                          ) : (
                            <p>
                              {t.product}: {item.price.toFixed(2)} €
                            </p>
                          )}

                          {Number(item.product.pfandAmount || 0) > 0 ? (
                            <p>
                              Pfand:{" "}
                              {Number(item.product.pfandAmount).toFixed(2)} €
                            </p>
                          ) : null}

                          <p className="font-black text-slate-700">
                            {language === "de" ? "Einheit gesamt" : "Birim toplam"}:{" "}
                            {(
                              item.price +
                              Number(item.product.pfandAmount)
                            ).toFixed(2)}{" "}
                            €
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setCart((current) =>
                            current.filter(
                              (cartItem) =>
                                cartItem.product.id !== item.product.id,
                            ),
                          )
                        }
                        className="text-red-500"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center rounded-xl border border-slate-200">
                        <button
                          type="button"
                          onClick={() => changeQuantity(item.product.id, -1)}
                          className="flex h-9 w-9 items-center justify-center"
                        >
                          <Minus size={15} />
                        </button>

                        <span className="min-w-8 text-center text-sm font-black">
                          {item.quantity}
                        </span>

                        <button
                          type="button"
                          onClick={() => changeQuantity(item.product.id, 1)}
                          className="flex h-9 w-9 items-center justify-center"
                        >
                          <Plus size={15} />
                        </button>
                      </div>

                      <strong>
                        {(
                          (item.price + Number(item.product.pfandAmount)) *
                          item.quantity
                        ).toFixed(2)}{" "}
                        €
                      </strong>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-5 border-t border-slate-200 pt-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-slate-950">
                    Zurückgegebenes Pfand
                  </p>

                  <p className="mt-0.5 truncate text-[10px] text-slate-500">
                    Pfandmengen eingeben, die der Kunde zurückgebracht hat.
                  </p>
                </div>

                <strong className="rounded-xl bg-green-50 px-3 py-2 text-sm text-green-700">
                  -{pfandReturnAmount.toFixed(2)} €
                </strong>
              </div>

              <div className="mt-4 space-y-2">
                {pfandOptions.map((option) => (
                  <div
                    key={option.unitAmount}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3"
                  >
                    <div>
                      <p className="text-sm font-bold text-slate-950">
                        {option.name}
                      </p>

                      <p className="mt-0.5 text-xs text-slate-500">
                        {option.unitAmount.toFixed(2)} € × {option.quantity}
                      </p>
                    </div>

                    <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50">
                      <button
                        type="button"
                        onClick={() =>
                          changePfandQuantity(option.unitAmount, -1)
                        }
                        disabled={option.quantity <= 0}
                        className="flex h-9 w-9 items-center justify-center disabled:text-slate-300"
                      >
                        <Minus size={15} />
                      </button>

                      <span className="min-w-9 text-center text-sm font-black">
                        {option.quantity}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          changePfandQuantity(option.unitAmount, 1)
                        }
                        className="flex h-9 w-9 items-center justify-center"
                      >
                        <Plus size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 border-t border-slate-200 pt-5">
              <p className="text-sm font-bold text-slate-700">{t.paymentType}</p>

              <div className="mt-3 grid grid-cols-3 gap-2">
                {[
                  {
                    value: "CASH" as const,
                    label: t.cash,
                    icon: WalletCards,
                  },
                  {
                    value: "CARD" as const,
                    label: t.card,
                    icon: CreditCard,
                  },
                  {
                    value: "OPEN" as const,
                    label: t.open,
                    icon: WalletCards,
                  },
                ].map((method) => {
                  const Icon = method.icon;

                  return (
                    <button
                      key={method.value}
                      type="button"
                      onClick={() => setPaymentMethod(method.value)}
                      className={`rounded-xl border p-3 text-xs font-black transition ${
                        paymentMethod === method.value
                          ? "border-orange-500 bg-orange-50 text-orange-600"
                          : "border-slate-200 text-slate-600"
                      }`}
                    >
                      <Icon size={18} className="mx-auto mb-1" />

                      {method.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {paymentMethod === "OPEN" ? (
              <div className="mt-5 rounded-2xl border border-orange-200 bg-orange-50 p-4">
                <div>
                  <p className="font-black text-orange-900">
                    {t.openAccountCustomer}
                  </p>

                  <p className="mt-1 text-xs text-orange-700">
                    {t.chooseSeller}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowNewCustomerForm((current) => !current);

                    setNewCustomerError("");
                  }}
                  className="mt-3 w-full rounded-xl border border-orange-300 bg-white px-4 py-3 text-sm font-black text-orange-600 transition hover:bg-orange-100"
                >
                  {showNewCustomerForm
                    ? t.closeNewCustomerForm
                    : t.saveNewCustomer}
                </button>

                {showNewCustomerForm ? (
                  <form
                    onSubmit={createCustomer}
                    className="mt-3 rounded-2xl border border-orange-200 bg-white p-4"
                  >
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setNewCustomerType("BUSINESS")}
                        className={`rounded-xl border px-3 py-2 text-xs font-black ${
                          newCustomerType === "BUSINESS"
                            ? "border-orange-500 bg-orange-50 text-orange-600"
                            : "border-slate-200 text-slate-600"
                        }`}
                      >
                        {t.company}
                      </button>

                      <button
                        type="button"
                        onClick={() => setNewCustomerType("PRIVATE")}
                        className={`rounded-xl border px-3 py-2 text-xs font-black ${
                          newCustomerType === "PRIVATE"
                            ? "border-orange-500 bg-orange-50 text-orange-600"
                            : "border-slate-200 text-slate-600"
                        }`}
                      >
                        {t.privateCustomer}
                      </button>
                    </div>

                    <div className="mt-3 grid gap-2">
                      {newCustomerType === "BUSINESS" ? (
                        <input
                          required
                          name="companyName"
                          placeholder={t.companyName + " *"}
                          className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-orange-500"
                        />
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            required
                            name="firstName"
                            placeholder={t.firstName + " *"}
                            className="min-w-0 rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-orange-500"
                          />

                          <input
                            name="lastName"
                            placeholder={t.lastName}
                            className="min-w-0 rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-orange-500"
                          />
                        </div>
                      )}

                      <input
                        required
                        name="phone"
                        type="tel"
                        placeholder={t.phone + " *"}
                        className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-orange-500"
                      />

                      <input
                        name="email"
                        type="email"
                        placeholder={t.emailOptional}
                        className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-orange-500"
                      />

                      <p className="pt-1 text-xs font-black text-slate-600">
                        {t.addressOptional}
                      </p>

                      <div className="grid grid-cols-[1fr_90px] gap-2">
                        <input
                          name="street"
                          placeholder={t.street}
                          className="min-w-0 rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-orange-500"
                        />

                        <input
                          name="houseNumber"
                          placeholder={t.houseNumber}
                          className="min-w-0 rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-orange-500"
                        />
                      </div>

                      <div className="grid grid-cols-[100px_1fr] gap-2">
                        <input
                          name="postalCode"
                          inputMode="numeric"
                          maxLength={5}
                          placeholder={t.postalCode}
                          className="min-w-0 rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-orange-500"
                        />

                        <input
                          name="city"
                          placeholder={t.city}
                          className="min-w-0 rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-orange-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <input
                          name="floor"
                          placeholder={t.floor}
                          className="min-w-0 rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-orange-500"
                        />

                        <input
                          name="doorbellName"
                          placeholder={t.doorbellName}
                          className="min-w-0 rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-orange-500"
                        />
                      </div>
                    </div>

                    {newCustomerError ? (
                      <div className="mt-3 rounded-xl bg-red-50 p-3 text-xs font-bold text-red-600">
                        {newCustomerError}
                      </div>
                    ) : null}

                    <button
                      type="submit"
                      disabled={creatingCustomer}
                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white disabled:opacity-50"
                    >
                      {creatingCustomer ? (
                        <>
                          <Loader2 size={17} className="animate-spin" />
                          {t.saving}
                        </>
                      ) : (
                        t.saveAndSelectCustomer
                      )}
                    </button>
                  </form>
                ) : null}

                <div className="relative mt-3">
                  <Search
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    value={customerSearch}
                    onChange={(event) => setCustomerSearch(event.target.value)}
                    placeholder={t.searchCustomer}
                    className="w-full rounded-xl border border-orange-200 bg-white py-3 pl-10 pr-3 text-sm outline-none focus:border-orange-500"
                  />
                </div>

                <div className="mt-3 max-h-56 space-y-2 overflow-y-auto">
                  {filteredCustomers.length === 0 ? (
                    <div className="rounded-xl bg-white p-3 text-sm font-bold text-slate-500">
                      {t.noCustomersFound}
                    </div>
                  ) : (
                    filteredCustomers.map((customer) => {
                      const selected = selectedCustomerId === customer.id;

                      return (
                        <button
                          key={customer.id}
                          type="button"
                          onClick={() => setSelectedCustomerId(customer.id)}
                          className={`w-full rounded-xl border p-3 text-left transition ${
                            selected
                              ? "border-orange-500 bg-white shadow-sm"
                              : "border-orange-100 bg-white/70 hover:border-orange-300"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate font-black text-slate-950">
                                {getCustomerName(customer)}
                              </p>

                              <p className="mt-1 truncate text-xs text-slate-500">
                                {customer.email}
                              </p>

                              {customer.phone ? (
                                <p className="mt-1 text-xs font-bold text-slate-600">
                                  {customer.phone}
                                </p>
                              ) : null}

                              {customer.address ? (
                                <p className="mt-0.5 truncate text-[10px] text-slate-500">
                                  {customer.address}
                                </p>
                              ) : null}
                            </div>

                            <span
                              className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black ${
                                selected
                                  ? "bg-orange-500 text-white"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {selected ? t.selected : t.select}
                            </span>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>

                {selectedCustomer ? (
                  <div className="mt-3 rounded-xl bg-slate-950 p-3 text-white">
                    <p className="text-xs font-bold text-orange-400">
                      {t.openAccountHolder}
                    </p>

                    <p className="mt-1 font-black">
                      {getCustomerName(selectedCustomer)}
                    </p>

                    <p className="mt-1 text-xs text-slate-300">
                      {t.unpaidAmountNote}
                    </p>
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="mt-5 space-y-2 rounded-2xl bg-slate-50 p-4 text-sm">
              <div className="flex justify-between">
                <span>{t.subtotal}</span>
                <strong>{subtotal.toFixed(2)} €</strong>
              </div>

              <div className="flex justify-between">
                <span>{t.newPfand}</span>
                <strong>{pfandAmount.toFixed(2)} €</strong>
              </div>

              <div className="flex justify-between text-green-700">
                <span>{t.returnedPfand}</span>
                <strong>-{pfandReturnAmount.toFixed(2)} €</strong>
              </div>

              <div className="flex justify-between border-t border-slate-200 pt-2 text-base">
                <span className="font-black">{t.total}</span>

                <strong>{totalAmount.toFixed(2)} €</strong>
              </div>
            </div>

            <button
              type="button"
              onClick={completeSale}
              disabled={
                saving ||
                cart.length === 0 ||
                (paymentMethod === "OPEN" && !selectedCustomerId)
              }
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 px-5 py-4 font-black text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {saving ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  {t.saving}
                </>
              ) : (
                t.completeSale
              )}
            </button>
          </aside>
        </div>
      </div>
    </main>
  );
}
