"use client";

import {
  Boxes,
  ChevronDown,
  ChevronUp,
  Loader2,
  MapPin,
  PackageCheck,
  Phone,
  Printer,
  Truck,
  UserPlus,
} from "lucide-react";
import { useEffect, useState } from "react";
import LogoutButton from "@/components/LogoutButton";
import { useLanguage } from "@/context/LanguageContext";

type DriverActivePanel = "ORDERS" | "STOCK" | "CUSTOMERS" | "NEW_CUSTOMER";

type CurrentDriver = {
  firstName: string | null;
  lastName: string | null;
};

type OrderStatus =
  | "NEW"
  | "CONFIRMED"
  | "PREPARING"
  | "READY"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";

type DriverCustomer = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  companyName: string | null;
  phone: string | null;
  customerType: string | null;
  name: string;
  address: string | null;
};

type DriverStockApiSummary = {
  currentTripLoadedValue: number;
};

type DriverStockSummary = {
  productId: string;
  displayName: string;
  stockUnit: string;
  packageInfo: string | null;
  imageUrl: string | null;
  salePrice: number;

  loadedQuantity: number;
  soldQuantity: number;
  returnedQuantity: number;
  adjustmentQuantity: number;
  currentQuantity: number;
};

type OrderItem = {
  id: string;
  name: string;
  quantity: number;
  price: number;
  pfand: number;
};

type PfandReturnItem = {
  id: string;
  name: string;
  quantity: number;
  approvedQuantity: number | null;
  unitAmount: number;
  totalAmount: number;
  approvedTotal: number | null;
};

type PfandReturn = {
  id: string;
  status: string;
  totalAmount: number;
  approvedAmount: number | null;
  items: PfandReturnItem[];
};

type Order = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  deliveryAddress: string;
  customerNote: string | null;
  driverNote: string | null;
  paymentStatus: "OPEN" | "PAID";
  paidAt: string | null;

  driverPaymentReportedAt: string | null;
  driverPaymentReportedAmount: number | null;
  paymentApprovedAt: string | null;
  paymentApprovedById: string | null;

  createdAt: string;
  subtotal: number;
  deliveryFee: number;
  pfandAmount: number;
  totalAmount: number;

  approvedPaymentAmount: number;
  pendingPaymentAmount: number;
  openPaymentAmount: number;
  accountStatus: "OPEN" | "CLOSED";

  user: {
    firstName: string | null;
    lastName: string | null;
    companyName: string | null;
    phone: string | null;
    email: string;
  };

  items: OrderItem[];

  pfandReturns: PfandReturn[];
};

const statusLabels: Record<OrderStatus, { de: string; tr: string }> = {
  NEW: { de: "Neu", tr: "Yeni" },
  CONFIRMED: { de: "Bestätigt", tr: "Onaylandı" },
  PREPARING: { de: "Wird vorbereitet", tr: "Hazırlanıyor" },
  READY: { de: "Bereit", tr: "Hazır" },
  OUT_FOR_DELIVERY: { de: "Unterwegs", tr: "Teslimata Çıktı" },
  DELIVERED: { de: "Geliefert", tr: "Teslim Edildi" },
  CANCELLED: { de: "Storniert", tr: "İptal Edildi" },
};

const driverPfandTypes = [
  {
    key: "0.08",
    label: "0,08 € Pfand",
    unitAmount: 0.08,
  },
  {
    key: "0.15",
    label: "0,15 € Pfand",
    unitAmount: 0.15,
  },
  {
    key: "0.25",
    label: "0,25 € Pfand",
    unitAmount: 0.25,
  },
  {
    key: "3.30",
    label: "3,30 € Kasa",
    unitAmount: 3.3,
  },
] as const;

function getDriverStockUnitLabel(unit: string) {
  const labels: Record<string, string> = {
    KASA: "kasa",
    KARTON: "karton",
    PAKET: "paket",
    ADET: "adet",
  };

  return labels[unit] || unit.toLocaleLowerCase("tr-TR");
}

export default function DriverPage() {
  const { language } = useLanguage();

  const [currentDriver, setCurrentDriver] = useState<CurrentDriver | null>(
    null,
  );

  const [orders, setOrders] = useState<Order[]>([]);

  const [driverStocks, setDriverStocks] = useState<DriverStockSummary[]>([]);

  const [driverStockSummary, setDriverStockSummary] =
    useState<DriverStockApiSummary>({
      currentTripLoadedValue: 0,
    });

  const [driverStockLoading, setDriverStockLoading] = useState(true);

  const [driverStockError, setDriverStockError] = useState("");

  const [activePanel, setActivePanel] = useState<DriverActivePanel>("ORDERS");

  const [showDriverStock, setShowDriverStock] = useState(false);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const [success, setSuccess] = useState("");

  const [historySearch, setHistorySearch] = useState("");
  const [historyDate, setHistoryDate] = useState("");


  /*
   * Her sipariş için şoförün müşteriden fiilen aldığı tutar.
   * Anahtar: Sipariş ID
   * Değer: Input içindeki tutar
   */
  const [paymentAmounts, setPaymentAmounts] = useState<Record<string, string>>(
    {},
  );

  const [pfandQuantities, setPfandQuantities] = useState<
    Record<string, number>
  >({});

  const [newPfandOrderId, setNewPfandOrderId] = useState<string | null>(null);

  const [newPfandValues, setNewPfandValues] = useState<Record<string, string>>(
    {},
  );

  const [showDelivered, setShowDelivered] = useState(false);

  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [savingCustomer, setSavingCustomer] = useState(false);

  const [customers, setCustomers] = useState<DriverCustomer[]>([]);
  const [customerLoading, setCustomerLoading] = useState(true);
  const [customerError, setCustomerError] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");

  /*
   * Müşteri kartına tıklanınca açılan araçtan satış ekranı.
   */
  const [selectedSaleCustomer, setSelectedSaleCustomer] =
    useState<DriverCustomer | null>(null);

  const [driverSaleQuantities, setDriverSaleQuantities] = useState<
    Record<string, string>
  >({});

  const [driverSalePaymentMethod, setDriverSalePaymentMethod] = useState<
    "CASH" | "CARD" | "OPEN"
  >("CASH");

  const [driverSaleNote, setDriverSaleNote] = useState("");

  /*
   * Araçtan satış sırasında müşteriden alınan boş kasa/şişe Pfandları.
   * Anahtar: driverPfandTypes içindeki Pfand anahtarı
   * Değer: Müşterinin verdiği adet
   */
  const [driverSalePfandValues, setDriverSalePfandValues] = useState<
    Record<string, string>
  >({});

  const [savingDriverSale, setSavingDriverSale] = useState(false);
  const [driverSaleError, setDriverSaleError] = useState("");

  const [customerForm, setCustomerForm] = useState({
    customerType: "BUSINESS",
    companyName: "",
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    street: "",
    houseNumber: "",
    postalCode: "",
    city: "",
  });

  async function loadCurrentDriver() {
    try {
      const response = await fetch("/api/auth/me", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        return;
      }

      setCurrentDriver({
        firstName: data.user?.firstName || null,
        lastName: data.user?.lastName || null,
      });
    } catch {
      /*
       * Şoför adı yüklenemese bile panel çalışmaya devam eder.
       */
    }
  }

  async function loadCustomers(silent = false) {
    if (!silent) {
      setCustomerLoading(true);
    }

    setCustomerError("");

    try {
      const response = await fetch("/api/sofor/customers", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        setCustomerError(data.error || "Müşteriler yüklenemedi.");
        return;
      }

      setCustomers(data.customers || []);
    } catch {
      setCustomerError("Müşteriler yüklenirken bağlantı hatası oluştu.");
    } finally {
      if (!silent) {
        setCustomerLoading(false);
      }
    }
  }

  function updateCustomerField(field: string, value: string) {
    setCustomerForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function clearCustomerForm() {
    setCustomerForm({
      customerType: "BUSINESS",
      companyName: "",
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      street: "",
      houseNumber: "",
      postalCode: "",
      city: "",
    });
  }

  async function createCustomer() {
    if (
      customerForm.customerType === "BUSINESS" &&
      !customerForm.companyName.trim()
    ) {
      setError("Firma adı zorunludur.");
      return;
    }

    if (
      customerForm.customerType === "PRIVATE" &&
      !customerForm.firstName.trim() &&
      !customerForm.lastName.trim()
    ) {
      setError("Müşterinin adını veya soyadını girin.");
      return;
    }

    if (!customerForm.phone.trim()) {
      setError("Telefon numarası zorunludur.");
      return;
    }

    setSavingCustomer(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/sofor/customers", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(customerForm),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Müşteri oluşturulamadı.");
        return;
      }

      setSuccess(`${data.customer?.name || "Müşteri"} başarıyla oluşturuldu.`);

      clearCustomerForm();

      await loadCustomers(true);

      setShowCustomerForm(false);
      setActivePanel("CUSTOMERS");
      setCustomerSearch("");
    } catch {
      setError("Müşteri oluşturulurken bağlantı hatası oluştu.");
    } finally {
      setSavingCustomer(false);
    }
  }

  const filteredCustomers = customers.filter((customer) => {
    const normalizedSearch = customerSearch.trim().toLocaleLowerCase("tr-TR");

    if (!normalizedSearch) {
      return true;
    }

    return [
      customer.name,
      customer.companyName,
      customer.firstName,
      customer.lastName,
      customer.phone,
      customer.email,
      customer.address,
    ]
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase("tr-TR")
      .includes(normalizedSearch);
  });

  function openCustomerSale(customer: DriverCustomer) {
    setSelectedSaleCustomer(customer);
    setDriverSaleQuantities({});
    setDriverSalePaymentMethod("CASH");
    setDriverSaleNote("");
    setDriverSalePfandValues({});
    setDriverSaleError("");
    setError("");
    setSuccess("");

    /*
     * Müşteriye tıklandığında en güncel araç stoğunu getir.
     */
    loadDriverStocks();
  }

  function closeCustomerSale() {
    setSelectedSaleCustomer(null);
    setDriverSaleQuantities({});
    setDriverSalePaymentMethod("CASH");
    setDriverSaleNote("");
    setDriverSalePfandValues({});
    setDriverSaleError("");
  }

  function getSelectedDriverSaleItems() {
    return driverStocks
      .map((stock) => ({
        productId: stock.productId,
        quantity: Number(driverSaleQuantities[stock.productId] || 0),
      }))
      .filter((item) => Number.isInteger(item.quantity) && item.quantity > 0);
  }

  function getDriverSaleSubtotal() {
    return Number(
      driverStocks
        .reduce((total, stock) => {
          const quantity = Number(driverSaleQuantities[stock.productId] || 0);

          if (!Number.isFinite(quantity) || quantity <= 0) {
            return total;
          }

          return total + quantity * stock.salePrice;
        }, 0)
        .toFixed(2),
    );
  }

  function getDriverSalePfandItems() {
    return driverPfandTypes
      .map((pfandType) => {
        const quantity = Number(driverSalePfandValues[pfandType.key] || 0);

        return {
          key: pfandType.key,
          name: pfandType.label,
          quantity: Number.isInteger(quantity) && quantity > 0 ? quantity : 0,
          unitAmount: pfandType.unitAmount,
        };
      })
      .filter((item) => item.quantity > 0);
  }

  function getDriverSalePfandReturnTotal() {
    return Number(
      getDriverSalePfandItems()
        .reduce((total, item) => total + item.quantity * item.unitAmount, 0)
        .toFixed(2),
    );
  }

  function getDriverSalePayableTotal() {
    return Math.max(
      0,
      Number(
        (getDriverSaleSubtotal() - getDriverSalePfandReturnTotal()).toFixed(2),
      ),
    );
  }

  async function submitDriverSale() {
    if (!selectedSaleCustomer) {
      setDriverSaleError("Satış yapılacak müşteri seçilmedi.");
      return;
    }

    const items = getSelectedDriverSaleItems();

    if (items.length === 0) {
      setDriverSaleError("Satılacak en az bir ürün ve miktar girin.");
      return;
    }

    for (const item of items) {
      const stock = driverStocks.find(
        (currentStock) => currentStock.productId === item.productId,
      );

      if (!stock) {
        setDriverSaleError("Seçilen ürün araç stokunda bulunamadı.");
        return;
      }

      if (item.quantity > stock.currentQuantity) {
        setDriverSaleError(
          `${stock.displayName} için araçta en fazla ` +
            `${stock.currentQuantity} ${getDriverStockUnitLabel(
              stock.stockUnit,
            )} bulunuyor.`,
        );
        return;
      }
    }

    setSavingDriverSale(true);
    setDriverSaleError("");
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/sofor/sales", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          customerId: selectedSaleCustomer.id,
          paymentMethod: driverSalePaymentMethod,
          note: driverSaleNote.trim(),
          items,
          pfandItems: getDriverSalePfandItems(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setDriverSaleError(data.error || "Müşteri satışı kaydedilemedi.");
        return;
      }

      setSuccess(
        data.message || `${selectedSaleCustomer.name} için satış kaydedildi.`,
      );

      if (data?.order?.id) {
        window.open(
          `/sofor/fis/${data.order.id}`,
          "_blank",
          "width=420,height=900"
        );
      }

      setSelectedSaleCustomer(null);
      setDriverSaleQuantities({});
      setDriverSalePaymentMethod("CASH");
      setDriverSaleNote("");
      setDriverSalePfandValues({});
      setDriverSaleError("");

      /*
       * Satıştan sonra araç stoğu ve sipariş kayıtları yenilenir.
       */
      await Promise.all([
        loadDriverStocks(),
        loadOrders(),
        loadCustomers(true),
      ]);
    } catch {
      setDriverSaleError("Satış kaydedilirken bağlantı hatası oluştu.");
    } finally {
      setSavingDriverSale(false);
    }
  }

  async function loadDriverStocks() {
    setDriverStockLoading(true);
    setDriverStockError("");

    try {
      const response = await fetch("/api/sofor/stock", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        setDriverStockError(data.error || "Araç stok bilgileri yüklenemedi.");

        return;
      }

      setDriverStocks(data.stocks || []);

      setDriverStockSummary({
        currentTripLoadedValue: Number(
          data.summary?.currentTripLoadedValue || 0,
        ),
      });
    } catch {
      setDriverStockError("Araç stok bilgileri yüklenirken hata oluştu.");
    } finally {
      setDriverStockLoading(false);
    }
  }

  async function loadOrders() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/sofor/orders");

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Teslimatlar yüklenemedi.");
        return;
      }

      setOrders(data.orders);
    } catch {
      setError("Teslimatlar yüklenirken hata oluştu.");
    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    loadCurrentDriver();
    loadOrders();
    loadDriverStocks();
    loadCustomers();
  }, []);


  const deliveredOrders = orders.filter((order) => {
    if (order.status !== "DELIVERED") return false;

    const customerName = (
      order.user.companyName ||
      `${order.user.firstName ?? ""} ${order.user.lastName ?? ""}`
    ).toLowerCase();

    if (
      historySearch &&
      !customerName.includes(historySearch.toLowerCase())
    ) {
      return false;
    }

    if (historyDate) {
      return (
        new Date(order.createdAt).toISOString().slice(0, 10) === historyDate
      );
    }

    return true;
  });

  const deliveredOrderCount = deliveredOrders.length;

  const deliveredOrderTotal = deliveredOrders.reduce(
    (sum, order) => sum + Number(order.totalAmount),
    0,
  );


  async function updateDeliveryStatus(
    order: Order,
    action: "OUT_FOR_DELIVERY" | "DELIVERED" | "PAID" | "OPEN_PAYMENT",
    reportedAmount?: number,
  ) {
    setUpdatingOrderId(order.id);

    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/sofor/orders/${order.id}`, {
        method: "PATCH",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          action,

          ...(action === "PAID"
            ? {
                amount: reportedAmount,
              }
            : {}),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Sipariş güncellenemedi.");
        return;
      }

      /*
       * PATCH cevabı hesaplanan ödeme alanlarını içermeyebilir.
       * Bu nedenle eksik data.order nesnesini state'e yazmak yerine
       * siparişleri tam API cevabıyla yeniden yüklüyoruz.
       */
      await loadOrders();

      if (action === "PAID") {
        setPaymentAmounts((current) => ({
          ...current,
          [order.id]: "",
        }));
      }

      setSuccess(data.message || "Sipariş güncellendi.");
    } catch {
      setError("Sipariş güncellenirken hata oluştu.");
    } finally {
      setUpdatingOrderId(null);
    }
  }

  function resetNewPfandForm() {
    setNewPfandValues({});
  }

  function getNewPfandTotal() {
    return Number(
      driverPfandTypes
        .reduce((total, pfandType) => {
          const quantity = Number(newPfandValues[pfandType.key] || 0);

          return total + quantity * pfandType.unitAmount;
        }, 0)
        .toFixed(2),
    );
  }

  async function createPfand(order: Order) {
    const pfandItems = driverPfandTypes.map((pfandType) => ({
      key: pfandType.key,

      quantity: Number(newPfandValues[pfandType.key] || 0),
    }));

    if (getNewPfandTotal() <= 0) {
      setError("En az bir Pfand adedi girin.");
      return;
    }

    setUpdatingOrderId(order.id);

    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/sofor/orders/${order.id}`, {
        method: "PATCH",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          action: "CREATE_PFAND",

          pfandItems,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (
          response.status === 409 &&
          data.error === "Bu sipariş için zaten bir Pfand kaydı bulunuyor."
        ) {
          await loadOrders();

          setNewPfandOrderId(null);
          resetNewPfandForm();

          setError(
            "Bu sipariş için Pfand kaydı zaten oluşturulmuş. Mevcut kayıt yeniden yüklendi.",
          );

          return;
        }

        setError(data.error || "Pfand kaydı oluşturulamadı.");
        return;
      }

      setOrders((current) =>
        current.map((currentOrder) =>
          currentOrder.id === order.id ? data.order : currentOrder,
        ),
      );

      setNewPfandOrderId(null);

      resetNewPfandForm();

      setSuccess(data.message || "Pfand kaydedildi.");
    } catch {
      setError("Pfand kaydedilirken hata oluştu.");
    } finally {
      setUpdatingOrderId(null);
    }
  }

  function getDriverOrderTotal(order: Order) {
    const pfandReturn = order.pfandReturns[0];

    const pfandReturnAmount = pfandReturn
      ? pfandReturn.items.reduce(
          (total, item) => total + getPfandQuantity(item) * item.unitAmount,
          0,
        )
      : 0;

    return Math.max(
      0,
      order.subtotal +
        order.pfandAmount +
        order.deliveryFee -
        pfandReturnAmount,
    );
  }

  function getDriverOpenPaymentAmount(order: Order) {
    return Number(
      Math.max(
        0,
        Number(
          order.openPaymentAmount ??
            Number(order.totalAmount || 0) -
              Number(order.approvedPaymentAmount || 0),
        ),
      ).toFixed(2),
    );
  }

  function getPfandQuantity(item: PfandReturnItem) {
    if (pfandQuantities[item.id] !== undefined) {
      return pfandQuantities[item.id];
    }

    return item.quantity;
  }

  function changePfandQuantity(item: PfandReturnItem, difference: number) {
    const current = getPfandQuantity(item);

    const next = Math.max(0, current + difference);

    setPfandQuantities((previous) => ({
      ...previous,

      [item.id]: next,
    }));
  }

  function setPfandQuantity(item: PfandReturnItem, value: number) {
    const next = Math.max(0, Math.floor(Number.isFinite(value) ? value : 0));

    setPfandQuantities((previous) => ({
      ...previous,

      [item.id]: next,
    }));
  }

  async function savePfand(order: Order) {
    const pfandReturn = order.pfandReturns[0];

    if (!pfandReturn) {
      return;
    }

    setUpdatingOrderId(order.id);

    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/sofor/orders/${order.id}`, {
        method: "PATCH",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          action: "UPDATE_PFAND",

          pfandItems: pfandReturn.items.map((item) => ({
            id: item.id,

            approvedQuantity: getPfandQuantity(item),
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Pfand miktarları kaydedilemedi.");

        return;
      }

      await loadOrders();

      setPfandQuantities((previous) => {
        const next = {
          ...previous,
        };

        for (const item of pfandReturn.items) {
          delete next[item.id];
        }

        return next;
      });

      setSuccess(data.message || "Pfand miktarları kaydedildi.");
    } catch {
      setError("Pfand miktarları kaydedilirken hata oluştu.");
    } finally {
      setUpdatingOrderId(null);
    }
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-slate-100 p-2 sm:p-3 lg:p-4">
      <div className="w-full max-w-none">
        <section className="rounded-[32px] bg-slate-950 p-7 text-white sm:p-10">
          <div className="flex items-start justify-between gap-5">
            <div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500">
                <Truck size={28} />
              </div>

              <h1 className="mt-5 text-4xl font-black">
                {[currentDriver?.firstName, currentDriver?.lastName]
                  .filter(Boolean)
                  .join(" ") || "Şoför"}
              </h1>

              <p className="mt-3 text-slate-400">{language === "de" ? "Fahrerpanel" : "Şoför Paneli"}</p>
            </div>

            <LogoutButton
              variant="dark"
              label={language === "de" ? "Abmelden" : "Çıkış"}
            />
          </div>
        </section>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <button
            type="button"
            onClick={() => {
              setActivePanel("ORDERS");
              setShowDriverStock(false);
              setShowCustomerForm(false);
            }}
            className="flex h-full w-full items-center justify-between gap-4 rounded-2xl bg-orange-500 p-4 text-left text-white shadow-sm transition hover:bg-orange-600"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20">
                <PackageCheck size={22} />
              </div>

              <div>
                <h2 className="text-xl font-black">{language === "de" ? "Eingehende Bestellungen" : "Gelen Siparişler"}</h2>

                <p className="mt-0.5 text-xs text-orange-50">
                  Size atanan aktif siparişleri ve teslimatları görüntüleyin.
                </p>
              </div>
            </div>

            <span className="rounded-xl bg-white px-4 py-2 text-sm font-black text-orange-600">
              {activePanel === "ORDERS" ? "Açık" : "Göster"}
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActivePanel("STOCK");
              setShowDriverStock(true);
              setShowCustomerForm(false);
              loadDriverStocks();
            }}
            className="flex h-full w-full items-center justify-between gap-4 rounded-2xl bg-white p-4 text-left shadow-sm transition hover:bg-slate-50"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                <Boxes size={22} />
              </div>

              <div>
                <h2 className="text-xl font-black text-slate-950">
                  Araç Stoklarım
                </h2>

                <p className="mt-0.5 text-xs text-slate-500">
                  Yüklenen, satılan ve araçta güncel kalan ürünler
                </p>
              </div>
            </div>

            <span className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-black text-slate-700">
              {activePanel === "STOCK" ? "Açık" : "Göster"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActivePanel("CUSTOMERS");
              setShowDriverStock(false);
              setShowCustomerForm(false);
              setSelectedSaleCustomer(null);
              setDriverSaleError("");
              loadCustomers();
            }}
            className={`flex h-full w-full items-center justify-between gap-3 rounded-2xl border p-4 text-left shadow-sm transition ${
              activePanel === "CUSTOMERS"
                ? "border-green-600 bg-green-600 text-white"
                : "border-green-200 bg-green-50 text-green-950 hover:bg-green-100"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                  activePanel === "CUSTOMERS"
                    ? "bg-white/20 text-white"
                    : "bg-white text-green-600"
                }`}
              >
                <UserPlus size={18} />
              </div>

              <div>
                <h2 className="text-base font-black">{language === "de" ? "Kunden" : "Müşteriler"}</h2>

                <p
                  className={`mt-0.5 text-xs ${
                    activePanel === "CUSTOMERS"
                      ? "text-green-50"
                      : "text-green-700"
                  }`}
                >
                  Kayıtlı müşterileri görüntüleyin ve satış yapın.
                </p>
              </div>
            </div>

            <span
              className={`rounded-lg px-3 py-1.5 text-xs font-black ${
                activePanel === "CUSTOMERS"
                  ? "bg-white text-green-700"
                  : "bg-green-600 text-white"
              }`}
            >
              {activePanel === "CUSTOMERS" ? "Açık" : "Göster"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActivePanel("NEW_CUSTOMER");
              setShowDriverStock(false);
              setShowCustomerForm(true);
              setSelectedSaleCustomer(null);
              setDriverSaleError("");
              setError("");
              setSuccess("");
              clearCustomerForm();
            }}
            className={`flex h-full w-full items-center justify-between gap-3 rounded-2xl border p-4 text-left shadow-sm transition ${
              activePanel === "NEW_CUSTOMER"
                ? "border-emerald-600 bg-emerald-600 text-white"
                : "border-emerald-200 bg-emerald-50 text-emerald-950 hover:bg-emerald-100"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                  activePanel === "NEW_CUSTOMER"
                    ? "bg-white/20 text-white"
                    : "bg-white text-emerald-600"
                }`}
              >
                <UserPlus size={18} />
              </div>

              <div>
                <h2 className="text-base font-black">{language === "de" ? "Neuer Kunde" : "Yeni Müşteri"}</h2>

                <p
                  className={`mt-0.5 text-xs ${
                    activePanel === "NEW_CUSTOMER"
                      ? "text-emerald-50"
                      : "text-emerald-700"
                  }`}
                >
                  Sisteme yeni firma veya özel müşteri ekleyin.
                </p>
              </div>
            </div>

            <span
              className={`rounded-lg px-3 py-1.5 text-xs font-black ${
                activePanel === "NEW_CUSTOMER"
                  ? "bg-white text-emerald-700"
                  : "bg-emerald-600 text-white"
              }`}
            >
              {activePanel === "NEW_CUSTOMER" ? "Açık" : "Oluştur"}
            </span>
          </button>
        </div>

        {activePanel === "CUSTOMERS" && !selectedSaleCustomer ? (
          <section className="mt-4 rounded-[28px] bg-white p-5 shadow-sm sm:p-7">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-950">
                  Kayıtlı Müşteriler
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Admin, şoför veya müşteri kaydıyla oluşturulan bütün aktif
                  müşteriler.
                </p>
              </div>

              <div className="rounded-xl bg-green-50 px-4 py-2 font-black text-green-700">
                {customers.length} müşteri
              </div>
            </div>

            <div className="mt-5">
              <input
                type="search"
                value={customerSearch}
                onChange={(event) => setCustomerSearch(event.target.value)}
                placeholder={language === "de" ? "Name, Firma, Telefon, E-Mail oder Adresse suchen..." : "İsim, firma, telefon, e-posta veya adres ara..."}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-green-500 focus:bg-white"
              />
            </div>

            {customerError ? (
              <div className="mt-4 rounded-xl bg-red-50 p-4 font-bold text-red-600">
                {customerError}
              </div>
            ) : customerLoading ? (
              <div className="mt-4 flex items-center gap-3 rounded-xl bg-slate-50 p-5 font-bold text-slate-500">
                <Loader2 size={19} className="animate-spin" />
                Müşteriler yükleniyor...
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="mt-4 rounded-xl bg-slate-50 p-5 text-slate-500">
                Aramaya uygun kayıtlı müşteri bulunamadı.
              </div>
            ) : (
              <div className="mt-4 max-h-[420px] overflow-y-auto rounded-2xl border border-slate-200">
                <div className="divide-y divide-slate-100">
                  {filteredCustomers.map((customer) => (
                    <article
                      key={customer.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => openCustomerSale(customer)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          openCustomerSale(customer);
                        }
                      }}
                      className="flex cursor-pointer flex-col gap-3 p-4 transition hover:bg-green-50 lg:flex-row lg:items-center lg:justify-between"
                    >
                      <div className="min-w-0 overflow-hidden">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-black text-slate-950">
                            {customer.name}
                          </p>

                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase text-slate-600">
                            {customer.customerType === "PRIVATE"
                              ? "Özel"
                              : "Firma"}
                          </span>
                        </div>

                        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-500">
                          {customer.phone ? (
                            <span>
                              <strong className="text-slate-700">
                                Telefon:
                              </strong>{" "}
                              {customer.phone}
                            </span>
                          ) : null}

                          {customer.email &&
                          !customer.email.endsWith("@paketmarket.local") ? (
                            <span>
                              <strong className="text-slate-700">
                                E-posta:
                              </strong>{" "}
                              {customer.email}
                            </span>
                          ) : null}
                        </div>

                        {customer.address ? (
                          <p className="mt-1 text-sm text-slate-500">
                            <strong className="text-slate-700">{language === "de" ? "Adresse:" : "Adres:"}</strong>{" "}
                            {customer.address}
                          </p>
                        ) : (
                          <p className="mt-1 text-xs font-bold text-amber-600">
                            Adres kaydı bulunmuyor
                          </p>
                        )}
                      </div>

                      {customer.phone ? (
                        <span className="shrink-0 rounded-xl bg-green-600 px-4 py-2 text-sm font-black text-white">
                          Satış Yap
                        </span>
                      ) : null}
                    </article>
                  ))}
                </div>
              </div>
            )}
          </section>
        ) : null}

        {activePanel === "NEW_CUSTOMER" ? (
          <section className="mt-4 rounded-[28px] bg-white p-5 shadow-sm sm:p-7">
            <div>
              <h2 className="text-xl font-black text-slate-950">
                Yeni Müşteri Oluştur
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Müşteri listede yoksa bilgilerini girerek sisteme kaydedin.
              </p>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-black text-slate-700">
                  Müşteri türü
                </span>

                <select
                  value={customerForm.customerType}
                  onChange={(event) =>
                    updateCustomerField("customerType", event.target.value)
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-bold outline-none focus:border-green-500"
                >
                  <option value="BUSINESS">{language === "de" ? "Firma" : "Firma"}</option>
                  <option value="PRIVATE">{language === "de" ? "Privatkunde" : "Özel müşteri"}</option>
                </select>
              </label>

              {customerForm.customerType === "BUSINESS" ? (
                <label className="block">
                  <span className="text-sm font-black text-slate-700">
                    Firma adı *
                  </span>

                  <input
                    type="text"
                    value={customerForm.companyName}
                    onChange={(event) =>
                      updateCustomerField("companyName", event.target.value)
                    }
                    placeholder={language === "de" ? "Firmenname" : "Firma adı"}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-green-500"
                  />
                </label>
              ) : (
                <>
                  <label className="block">
                    <span className="text-sm font-black text-slate-700">
                      Ad *
                    </span>

                    <input
                      type="text"
                      value={customerForm.firstName}
                      onChange={(event) =>
                        updateCustomerField("firstName", event.target.value)
                      }
                      placeholder={language === "de" ? "Vorname" : "Ad"}
                      className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-green-500"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-black text-slate-700">
                      Soyad
                    </span>

                    <input
                      type="text"
                      value={customerForm.lastName}
                      onChange={(event) =>
                        updateCustomerField("lastName", event.target.value)
                      }
                      placeholder={language === "de" ? "Nachname" : "Soyad"}
                      className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-green-500"
                    />
                  </label>
                </>
              )}

              <label className="block">
                <span className="text-sm font-black text-slate-700">
                  Telefon *
                </span>

                <input
                  type="tel"
                  value={customerForm.phone}
                  onChange={(event) =>
                    updateCustomerField("phone", event.target.value)
                  }
                  placeholder={language === "de" ? "Telefonnummer" : "Telefon numarası"}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-green-500"
                />
              </label>

              <label className="block">
                <span className="text-sm font-black text-slate-700">
                  E-posta
                </span>

                <input
                  type="email"
                  value={customerForm.email}
                  onChange={(event) =>
                    updateCustomerField("email", event.target.value)
                  }
                  placeholder={language === "de" ? "E-Mail (optional)" : "E-posta isteğe bağlı"}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-green-500"
                />
              </label>

              <label className="block">
                <span className="text-sm font-black text-slate-700">{language === "de" ? "Straße" : "Sokak"}</span>

                <input
                  type="text"
                  value={customerForm.street}
                  onChange={(event) =>
                    updateCustomerField("street", event.target.value)
                  }
                  placeholder={language === "de" ? "Straße" : "Sokak"}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-green-500"
                />
              </label>

              <label className="block">
                <span className="text-sm font-black text-slate-700">
                  Kapı numarası
                </span>

                <input
                  type="text"
                  value={customerForm.houseNumber}
                  onChange={(event) =>
                    updateCustomerField("houseNumber", event.target.value)
                  }
                  placeholder={language === "de" ? "Hausnummer" : "Kapı numarası"}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-green-500"
                />
              </label>

              <label className="block">
                <span className="text-sm font-black text-slate-700">
                  Posta kodu
                </span>

                <input
                  type="text"
                  inputMode="numeric" pattern="[0-9]*"
                  maxLength={5}
                  value={customerForm.postalCode}
                  onChange={(event) =>
                    updateCustomerField(
                      "postalCode",
                      event.target.value.replace(/[^\d]/g, ""),
                    )
                  }
                  placeholder={language === "de" ? "PLZ" : "Posta kodu"}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-green-500"
                />
              </label>

              <label className="block">
                <span className="text-sm font-black text-slate-700">{language === "de" ? "Stadt" : "Şehir"}</span>

                <input
                  type="text"
                  value={customerForm.city}
                  onChange={(event) =>
                    updateCustomerField("city", event.target.value)
                  }
                  placeholder={language === "de" ? "Stadt" : "Şehir"}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-green-500"
                />
              </label>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  clearCustomerForm();
                  setShowCustomerForm(false);
                  setActivePanel("CUSTOMERS");
                  setError("");
                  setSuccess("");
                }}
                disabled={savingCustomer}
                className="rounded-xl bg-slate-100 px-6 py-3 font-black text-slate-700 transition hover:bg-slate-200 disabled:opacity-50"
              >
                İptal
              </button>

              <button
                type="button"
                onClick={createCustomer}
                disabled={savingCustomer}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-6 py-3 font-black text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingCustomer ? (
                  <Loader2 size={19} className="animate-spin" />
                ) : (
                  <UserPlus size={19} />
                )}

                {savingCustomer ? "Kaydediliyor..." : "Müşteriyi Kaydet"}
              </button>
            </div>
          </section>
        ) : null}

        {activePanel === "CUSTOMERS" && selectedSaleCustomer ? (
          <section className="mt-4 overflow-hidden rounded-[28px] bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-green-50 p-5 sm:p-7">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-green-600">
                    Müşteriye araçtan satış
                  </p>

                  <h2 className="mt-1 text-2xl font-black text-slate-950">
                    {selectedSaleCustomer.name}
                  </h2>

                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-600">
                    {selectedSaleCustomer.phone ? (
                      <span>
                        <strong>{language === "de" ? "Telefon:" : "Telefon:"}</strong> {selectedSaleCustomer.phone}
                      </span>
                    ) : null}

                    {selectedSaleCustomer.address ? (
                      <span>
                        <strong>{language === "de" ? "Adresse:" : "Adres:"}</strong> {selectedSaleCustomer.address}
                      </span>
                    ) : null}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closeCustomerSale}
                  disabled={savingDriverSale}
                  className="rounded-xl bg-white px-5 py-3 font-black text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:opacity-50"
                >
                  Müşteri Listesine Dön
                </button>
              </div>
            </div>

            <div className="p-5 sm:p-7">
              {driverSaleError ? (
                <div className="mb-5 rounded-2xl bg-red-50 p-4 font-bold text-red-600">
                  {driverSaleError}
                </div>
              ) : null}

              {driverStockError ? (
                <div className="rounded-2xl bg-red-50 p-5 font-bold text-red-600">
                  {driverStockError}
                </div>
              ) : driverStockLoading ? (
                <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-5 font-bold text-slate-500">
                  <Loader2 size={20} className="animate-spin" />
                  Araç stokları yükleniyor...
                </div>
              ) : driverStocks.length === 0 ? (
                <div className="rounded-2xl bg-amber-50 p-5 font-bold text-amber-700">
                  Araçta satılabilecek ürün bulunmuyor.
                </div>
              ) : (
                <>
                  <div className="rounded-xl border border-slate-200 bg-white">
                    {/* TELEFON GÖRÜNÜMÜ */}
                    <div className="divide-y divide-slate-200 sm:hidden">
                      {driverStocks.map((stock) => {
                        const enteredQuantity = Number(
                          driverSaleQuantities[stock.productId] || 0,
                        );

                        return (
                          <article
                            key={stock.productId}
                            className="px-3 py-2.5"
                          >
                            <div className="flex min-w-0 items-center justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <p className="break-words text-[13px] font-black leading-4 text-slate-950">
                                  {stock.displayName}
                                </p>

                                <p className="mt-0.5 break-words text-[10px] leading-3 text-slate-500">
                                  {stock.packageInfo || "Paket bilgisi yok"}
                                </p>
                              </div>

                              <div className="min-w-[54px] shrink-0 rounded-lg bg-green-50 px-2 py-1.5 text-center">
                                <p className="text-base font-black leading-none text-green-700">
                                  {stock.currentQuantity}
                                </p>

                                <p className="mt-0.5 text-[8px] font-black uppercase text-green-600">
                                  Araçta
                                </p>
                              </div>
                            </div>

                            <div className="mt-2 grid grid-cols-[minmax(0,1fr)_92px] items-end gap-2">
                              <div className="min-w-0 rounded-lg bg-slate-50 px-2.5 py-1.5">
                                <p className="text-[8px] font-black uppercase tracking-wide text-slate-400">
                                  Birim fiyat
                                </p>

                                <p className="mt-0.5 truncate text-[13px] font-black text-slate-900">
                                  {stock.salePrice.toLocaleString("de-DE", {
                                    style: "currency",
                                    currency: "EUR",
                                  })}
                                </p>
                              </div>

                              <div className="min-w-0">
                                <label
                                  htmlFor={`mobile-sale-${stock.productId}`}
                                  className="mb-0.5 block text-center text-[8px] font-black uppercase leading-3 text-slate-500"
                                >
                                  Satış miktarı
                                </label>

                                <input
                                  id={`mobile-sale-${stock.productId}`}
                                  type="text"
                                  inputMode="numeric"
                                  min={0}
                                  max={stock.currentQuantity}
                                  step={1}
                                  value={
                                    driverSaleQuantities[stock.productId] || ""
                                  }
                                  onFocus={(e) => {
                                    const input = e.currentTarget;

                                    requestAnimationFrame(() => {
                                      input?.scrollIntoView({
                                        block: "center",
                                        inline: "nearest",
                                        behavior: "auto",
                                      });
                                    });
                                  }}
                                  onChange={(event) => {
                                    const rawValue = event.target.value;

                                    if (rawValue === "") {
                                      setDriverSaleQuantities((current) => ({
                                        ...current,
                                        [stock.productId]: "",
                                      }));

                                      return;
                                    }

                                    const quantity = Math.max(
                                      0,
                                      Math.min(
                                        stock.currentQuantity,
                                        Math.floor(Number(rawValue) || 0),
                                      ),
                                    );

                                    setDriverSaleQuantities((current) => ({
                                      ...current,
                                      [stock.productId]: String(quantity),
                                    }));
                                  }}
                                  className="block h-9 w-full min-w-0 max-w-full appearance-none rounded-lg border-2 border-slate-200 bg-white px-1 text-center text-sm font-black text-slate-950 outline-none transition focus:border-green-500"
                                />
                              </div>
                            </div>

                            {enteredQuantity > 0 ? (
                              <div className="mt-1.5 flex items-center justify-between rounded-lg bg-green-50 px-2.5 py-1.5">
                                <span className="text-[8px] font-black uppercase text-green-700">
                                  Satır toplamı
                                </span>

                                <strong className="text-[13px] font-black text-green-800">
                                  {(
                                    enteredQuantity * stock.salePrice
                                  ).toLocaleString("de-DE", {
                                    style: "currency",
                                    currency: "EUR",
                                  })}
                                </strong>
                              </div>
                            ) : null}
                          </article>
                        );
                      })}
                    </div>

                    {/* TABLET VE BİLGİSAYAR GÖRÜNÜMÜ */}
                    <div className="hidden overflow-x-auto sm:block">
                      <div className="min-w-[720px]">
                        <div className="grid grid-cols-[minmax(240px,1fr)_120px_130px_150px] gap-3 bg-slate-50 px-5 py-3 text-xs font-black uppercase text-slate-500">
                          <div>{language === "de" ? "Produkt" : "Ürün"}</div>
                          <div className="text-center">{language === "de" ? "Im Fahrzeug" : "Araçta"}</div>
                          <div className="text-center">{language === "de" ? "Stückpreis" : "Birim fiyat"}</div>
                          <div className="text-center">{language === "de" ? "Verkaufsmenge" : "Satış miktarı"}</div>
                        </div>

                        <div className="divide-y divide-slate-100">
                          {driverStocks.map((stock) => {
                            const enteredQuantity = Number(
                              driverSaleQuantities[stock.productId] || 0,
                            );

                            return (
                              <article
                                key={stock.productId}
                                className="grid grid-cols-[minmax(240px,1fr)_120px_130px_150px] items-center gap-3 px-5 py-4"
                              >
                                <div className="min-w-0">
                                  <p className="break-words font-black text-slate-950">
                                    {stock.displayName}
                                  </p>

                                  <p className="mt-1 break-words text-xs text-slate-500">
                                    {stock.packageInfo || "Paket bilgisi yok"}
                                  </p>
                                </div>

                                <div className="text-center">
                                  <p className="text-lg font-black text-green-700">
                                    {stock.currentQuantity}
                                  </p>

                                  <p className="text-[10px] font-bold text-slate-400">
                                    {getDriverStockUnitLabel(stock.stockUnit)}
                                  </p>
                                </div>

                                <div className="text-center font-black text-slate-800">
                                  {stock.salePrice.toLocaleString("de-DE", {
                                    style: "currency",
                                    currency: "EUR",
                                  })}
                                </div>

                                <div>
                                  <input
                                    type="number"
                                    min={0}
                                    max={stock.currentQuantity}
                                    step={1}
                                    value={
                                      driverSaleQuantities[stock.productId] ||
                                      ""
                                    }
                                    onChange={(event) => {
                                      const rawValue = event.target.value;

                                      if (rawValue === "") {
                                        setDriverSaleQuantities((current) => ({
                                          ...current,
                                          [stock.productId]: "",
                                        }));

                                        return;
                                      }

                                      const quantity = Math.max(
                                        0,
                                        Math.min(
                                          stock.currentQuantity,
                                          Math.floor(Number(rawValue) || 0),
                                        ),
                                      );

                                      setDriverSaleQuantities((current) => ({
                                        ...current,
                                        [stock.productId]: String(quantity),
                                      }));
                                    }}
                                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-center font-black outline-none transition focus:border-green-500"
                                  />

                                  {enteredQuantity > 0 ? (
                                    <p className="mt-1 text-center text-[10px] font-bold text-green-600">
                                      {(
                                        enteredQuantity * stock.salePrice
                                      ).toLocaleString("de-DE", {
                                        style: "currency",
                                        currency: "EUR",
                                      })}
                                    </p>
                                  ) : null}
                                </div>
                              </article>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
                    <div className="space-y-5">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="text-base font-black text-slate-950">
                              Ödeme Şekli
                            </p>

                            <p className="mt-1 text-xs font-bold text-slate-500">
                              Müşterinin ödeme türünü seçin.
                            </p>
                          </div>

                          <span className="rounded-full bg-slate-900 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-white">
                            Zorunlu
                          </span>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                          {[
                            {
                              value: "CASH",
                              label: "Nakit",
                              description: "Para şoför tarafından alındı",
                              icon: "€",
                              active:
                                "border-amber-500 bg-amber-500 text-white ring-4 ring-amber-100",
                              passive:
                                "border-amber-200 bg-amber-50 text-amber-950 hover:bg-amber-100",
                            },
                            {
                              value: "CARD",
                              label: "Kart",
                              description: "Kart ile ödeme yapıldı",
                              icon: "▣",
                              active:
                                "border-blue-600 bg-blue-600 text-white ring-4 ring-blue-100",
                              passive:
                                "border-blue-200 bg-blue-50 text-blue-950 hover:bg-blue-100",
                            },
                            {
                              value: "OPEN",
                              label: "Açık Hesap",
                              description: "Ödeme daha sonra alınacak",
                              icon: "↗",
                              active:
                                "border-rose-600 bg-rose-600 text-white ring-4 ring-rose-100",
                              passive:
                                "border-rose-200 bg-rose-50 text-rose-950 hover:bg-rose-100",
                            },
                          ].map((method) => {
                            const selected =
                              driverSalePaymentMethod === method.value;

                            return (
                              <button
                                key={method.value}
                                type="button"
                                aria-pressed={selected}
                                onClick={() =>
                                  setDriverSalePaymentMethod(
                                    method.value as "CASH" | "CARD" | "OPEN",
                                  )
                                }
                                className={`relative flex min-h-[100px] w-full items-center gap-3 rounded-2xl border-2 px-4 py-4 text-left shadow-sm transition active:scale-[0.98] ${
                                  selected ? method.active : method.passive
                                }`}
                              >
                                <span
                                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl font-black ${
                                    selected
                                      ? "bg-white/20 text-white"
                                      : "bg-white shadow-sm"
                                  }`}
                                >
                                  {method.icon}
                                </span>

                                <span className="min-w-0">
                                  <span className="block text-lg font-black">
                                    {method.label}
                                  </span>

                                  <span
                                    className={`mt-1 block text-xs font-bold leading-4 ${
                                      selected ? "text-white/90" : "opacity-70"
                                    }`}
                                  >
                                    {method.description}
                                  </span>
                                </span>

                                {selected ? (
                                  <span className="absolute right-3 top-3 rounded-full bg-white px-2 py-1 text-[9px] font-black uppercase text-slate-900">
                                    Seçildi
                                  </span>
                                ) : null}
                              </button>
                            );
                          })}
                        </div>

                        <div
                          className={`mt-4 rounded-xl px-4 py-3 text-sm font-black ${
                            driverSalePaymentMethod === "CASH"
                              ? "bg-amber-100 text-amber-900"
                              : driverSalePaymentMethod === "CARD"
                                ? "bg-blue-100 text-blue-900"
                                : "bg-rose-100 text-rose-900"
                          }`}
                        >
                          Seçilen ödeme:{" "}
                          {driverSalePaymentMethod === "CASH"
                            ? "Nakit"
                            : driverSalePaymentMethod === "CARD"
                              ? "Kart"
                              : "Açık Hesap"}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:p-5">
                        <div>
                          <p className="font-black text-amber-950">
                            Müşteriden Alınan Pfand
                          </p>

                          <p className="mt-1 text-xs text-amber-700">
                            Müşterinin verdiği boş kasa veya şişeleri girin.
                            Pfand tutarı satış hesabından düşer.
                          </p>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-2 sm:gap-3">
                          {driverPfandTypes.map((pfandType) => (
                            <label
                              key={pfandType.key}
                              className="min-w-0 rounded-xl border border-amber-100 bg-white p-3 shadow-sm"
                            >
                              <span className="text-xs font-black text-slate-700">
                                {pfandType.label}
                              </span>

                              <input
                                type="number"
                                min={0}
                                step={1}
                                value={
                                  driverSalePfandValues[pfandType.key] || ""
                                }
                                onChange={(event) => {
                                  const rawValue = event.target.value;

                                  if (rawValue === "") {
                                    setDriverSalePfandValues((current) => ({
                                      ...current,
                                      [pfandType.key]: "",
                                    }));

                                    return;
                                  }

                                  const quantity = Math.max(
                                    0,
                                    Math.floor(Number(rawValue) || 0),
                                  );

                                  setDriverSalePfandValues((current) => ({
                                    ...current,
                                    [pfandType.key]: String(quantity),
                                  }));
                                }}
                                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-center font-black outline-none focus:border-amber-500"
                              />
                            </label>
                          ))}
                        </div>

                        <div className="mt-4 flex items-center justify-between rounded-xl bg-amber-100 px-4 py-3">
                          <span className="text-sm font-black text-amber-900">
                            Pfand İadesi
                          </span>

                          <strong className="text-xl text-amber-950">
                            -
                            {getDriverSalePfandReturnTotal().toLocaleString(
                              "de-DE",
                              {
                                style: "currency",
                                currency: "EUR",
                              },
                            )}
                          </strong>
                        </div>
                      </div>

                      <label className="block">
                        <span className="text-sm font-black text-slate-700">
                          Satış notu
                        </span>

                        <textarea
                          rows={3}
                          value={driverSaleNote}
                          onChange={(event) =>
                            setDriverSaleNote(event.target.value)
                          }
                          placeholder={language === "de" ? "Optionale Verkaufsnotiz..." : "İsteğe bağlı satış notu..."}
                          className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-green-500"
                        />
                      </label>
                    </div>

                    <div className="min-w-0 rounded-2xl bg-slate-950 p-5 text-white shadow-xl lg:sticky lg:top-4">
                      <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                        Satış toplamı
                      </p>

                      <div className="mt-4 space-y-3 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">{language === "de" ? "Produktsumme" : "Ürün toplamı"}</span>

                          <strong>
                            {getDriverSaleSubtotal().toLocaleString("de-DE", {
                              style: "currency",
                              currency: "EUR",
                            })}
                          </strong>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-amber-300">
                            Müşterinin verdiği Pfand
                          </span>

                          <strong className="text-amber-300">
                            -
                            {getDriverSalePfandReturnTotal().toLocaleString(
                              "de-DE",
                              {
                                style: "currency",
                                currency: "EUR",
                              },
                            )}
                          </strong>
                        </div>

                        <div className="border-t border-white/20 pt-3">
                          <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                            Müşteriden Alınacak
                          </p>

                          <p className="mt-1 text-3xl font-black">
                            {getDriverSalePayableTotal().toLocaleString(
                              "de-DE",
                              {
                                style: "currency",
                                currency: "EUR",
                              },
                            )}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={submitDriverSale}
                        disabled={
                          savingDriverSale ||
                          getSelectedDriverSaleItems().length === 0
                        }
                        className="mt-5 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-green-600 px-5 py-4 text-base font-black text-white shadow-lg transition hover:bg-green-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {savingDriverSale ? (
                          <Loader2 size={20} className="animate-spin" />
                        ) : null}

                        {savingDriverSale
                          ? "Satış Kaydediliyor..."
                          : "Satışı Tamamla"}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>
        ) : null}

        {activePanel === "STOCK" ? (
          <section className="mt-6 overflow-hidden rounded-[28px] bg-white shadow-sm">
            <div className="border-t border-slate-100 p-4 sm:p-6">
              {!driverStockLoading && !driverStockError ? (
                <div className="mb-6 grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-violet-200 bg-violet-50 p-5">
                    <p className="text-xs font-black uppercase tracking-wide text-violet-700">
                      Bu Tur Yüklenen Mal Değeri
                    </p>

                    <p className="mt-2 text-3xl font-black text-violet-950">
                      {driverStockSummary.currentTripLoadedValue.toLocaleString(
                        "de-DE",
                        {
                          style: "currency",
                          currency: "EUR",
                        },
                      )}
                    </p>

                    <p className="mt-1 text-xs font-bold text-violet-700">
                      Araç tamamen boşaltılana kadar sabit kalır
                    </p>
                  </div>

                  <div className="rounded-2xl border border-orange-200 bg-orange-50 p-5">
                    <p className="text-xs font-black uppercase tracking-wide text-orange-700">
                      Araçta Kalan Mal Değeri
                    </p>

                    <p className="mt-2 text-3xl font-black text-orange-950">
                      {driverStocks
                        .reduce(
                          (total, stock) =>
                            total + stock.currentQuantity * stock.salePrice,
                          0,
                        )
                        .toLocaleString("de-DE", {
                          style: "currency",
                          currency: "EUR",
                        })}
                    </p>

                    <p className="mt-1 text-xs font-bold text-orange-700">
                      Araçta şu anda bulunan ürünlerin satış değeri
                    </p>
                  </div>

                  <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
                    <p className="text-xs font-black uppercase tracking-wide text-blue-700">
                      Satılan Mal Değeri
                    </p>

                    <p className="mt-2 text-3xl font-black text-blue-950">
                      {driverStocks
                        .reduce(
                          (total, stock) =>
                            total + stock.soldQuantity * stock.salePrice,
                          0,
                        )
                        .toLocaleString("de-DE", {
                          style: "currency",
                          currency: "EUR",
                        })}
                    </p>

                    <p className="mt-1 text-xs font-bold text-blue-700">
                      Şoförün sattığı ürünlerin satış değeri
                    </p>
                  </div>
                </div>
              ) : null}

              {driverStockError ? (
                <div className="rounded-2xl bg-red-50 p-4 font-bold text-red-600">
                  {driverStockError}
                </div>
              ) : driverStockLoading ? (
                <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-5 font-bold text-slate-500">
                  <Loader2 size={19} className="animate-spin" />
                  Araç stokları yükleniyor...
                </div>
              ) : driverStocks.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 p-5 text-slate-500">
                  Araç stokunda veya stok hareketlerinde henüz ürün bulunmuyor.
                </div>
              ) : (
                <div>
                  {/* TELEFON GÖRÜNÜMÜ */}
                  <div className="space-y-3 sm:hidden">
                    {driverStocks.map((stock) => (
                      <article
                        key={stock.productId}
                        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                      >
                        <div className="flex min-w-0 items-start justify-between gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3">
                          <div className="min-w-0 flex-1">
                            <p className="break-words text-sm font-black leading-5 text-slate-950">
                              {stock.displayName}
                            </p>

                            <p className="mt-0.5 break-words text-[10px] leading-4 text-slate-500">
                              {stock.packageInfo || "Paket bilgisi yok"}
                            </p>
                          </div>

                          <div className="shrink-0 rounded-xl bg-emerald-100 px-3 py-2 text-center">
                            <p className="text-xl font-black leading-none text-emerald-800">
                              {stock.currentQuantity}
                            </p>

                            <p className="mt-1 text-[8px] font-black uppercase text-emerald-700">
                              Araçta
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 p-3">
                          <div className="min-w-0 rounded-xl bg-orange-50 p-3">
                            <p className="text-[9px] font-black uppercase tracking-wide text-orange-600">
                              Yüklenen
                            </p>

                            <p className="mt-1 text-lg font-black leading-none text-orange-700">
                              {stock.loadedQuantity}
                            </p>

                            <p className="mt-1 text-[9px] font-bold text-orange-600">
                              {getDriverStockUnitLabel(stock.stockUnit)}
                            </p>
                          </div>

                          <div className="min-w-0 rounded-xl bg-orange-50 p-3">
                            <p className="text-[9px] font-black uppercase tracking-wide text-orange-600">
                              Giden değeri
                            </p>

                            <p className="mt-1 truncate text-sm font-black text-orange-800">
                              {(
                                stock.loadedQuantity * stock.salePrice
                              ).toLocaleString("de-DE", {
                                style: "currency",
                                currency: "EUR",
                              })}
                            </p>
                          </div>

                          <div className="min-w-0 rounded-xl bg-blue-50 p-3">
                            <p className="text-[9px] font-black uppercase tracking-wide text-blue-600">
                              Satılan
                            </p>

                            <p className="mt-1 text-lg font-black leading-none text-blue-700">
                              {stock.soldQuantity}
                            </p>

                            <p className="mt-1 text-[9px] font-bold text-blue-600">
                              {getDriverStockUnitLabel(stock.stockUnit)}
                            </p>
                          </div>

                          <div className="min-w-0 rounded-xl bg-green-50 p-3">
                            <p className="text-[9px] font-black uppercase tracking-wide text-green-600">
                              Kalan değeri
                            </p>

                            <p className="mt-1 truncate text-sm font-black text-green-800">
                              {(
                                stock.currentQuantity * stock.salePrice
                              ).toLocaleString("de-DE", {
                                style: "currency",
                                currency: "EUR",
                              })}
                            </p>

                            <p className="mt-1 text-[9px] font-bold text-green-600">
                              {stock.currentQuantity}{" "}
                              {getDriverStockUnitLabel(stock.stockUnit)} kaldı
                            </p>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>

                  {/* TABLET VE BİLGİSAYAR GÖRÜNÜMÜ */}
                  <div className="hidden overflow-x-auto sm:block">
                    <div className="min-w-[760px]">
                      <div className="grid grid-cols-[minmax(210px,1fr)_90px_120px_90px_120px_90px] gap-3 border-b border-slate-200 px-4 pb-3 text-xs font-black uppercase text-slate-400">
                        <div>{language === "de" ? "Produkt" : "Ürün"}</div>
                        <div className="text-center">{language === "de" ? "Geladen" : "Yüklenen"}</div>
                        <div className="text-center">{language === "de" ? "Ausgangswert" : "Giden Değeri"}</div>
                        <div className="text-center">{language === "de" ? "Verkauft" : "Satılan"}</div>
                        <div className="text-center">{language === "de" ? "Restwert" : "Kalan Değeri"}</div>
                        <div className="text-center">{language === "de" ? "Aktuell im Fahrzeug" : "Araçta Güncel"}</div>
                      </div>

                      <div className="divide-y divide-slate-100">
                        {driverStocks.map((stock) => (
                          <article
                            key={stock.productId}
                            className="grid grid-cols-[minmax(210px,1fr)_90px_120px_90px_120px_90px] items-center gap-3 px-4 py-4"
                          >
                            <div className="min-w-0">
                              <p className="break-words font-black text-slate-950">
                                {stock.displayName}
                              </p>

                              <p className="mt-1 break-words text-xs text-slate-500">
                                {stock.packageInfo || "Paket bilgisi yok"}
                              </p>
                            </div>

                            <div className="text-center">
                              <p className="text-lg font-black text-orange-600">
                                {stock.loadedQuantity}
                              </p>

                              <p className="text-[10px] font-bold text-slate-400">
                                {getDriverStockUnitLabel(stock.stockUnit)}
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
                                {getDriverStockUnitLabel(stock.stockUnit)}
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
                                {getDriverStockUnitLabel(stock.stockUnit)} kaldı
                              </p>
                            </div>

                            <div className="rounded-xl bg-emerald-50 px-2 py-2 text-center">
                              <p className="text-lg font-black text-emerald-700">
                                {stock.currentQuantity}
                              </p>

                              <p className="text-[10px] font-bold text-emerald-600">
                                {getDriverStockUnitLabel(stock.stockUnit)}
                              </p>

                              <p className="mt-1 text-[9px] font-bold text-emerald-600">
                                Araçta mevcut
                              </p>
                            </div>
                          </article>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        ) : null}

        {activePanel === "ORDERS" ? (
          <section id="gelen-siparisler" className="mt-8">
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <PackageCheck className="text-orange-500" />

                <div>
                  <h2 className="text-2xl font-black text-slate-950">
                    {showDelivered ? "Teslim Edilenler" : "Aktif Teslimatlar"}
                  </h2>

                  <p className="mt-0.5 text-xs text-slate-500">
                    {showDelivered
                      ? "Teslim ettiğiniz siparişleri görüntülüyorsunuz."
                      : "Henüz teslim etmediğiniz siparişleri görüntülüyorsunuz."}
                  </p>
                </div>
              </div>

              {showDelivered && (
                <input
                  type="date"
                  value={historyDate}
                  onChange={(e)=>setHistoryDate(e.target.value)}
                  className="rounded-xl border border-slate-300 px-3 py-3 font-bold"
                />
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowDelivered((current) => !current)}
                  className={`rounded-xl px-5 py-3 font-black transition ${
                    showDelivered
                      ? "bg-slate-950 text-white hover:bg-slate-800"
                      : "bg-green-600 text-white hover:bg-green-700"
                  }`}
                >
                  {showDelivered
                    ? "Aktif Teslimatları Göster"
                    : "Teslim Edilenler"}
                </button>

                {showDelivered && (
                  <button
                    type="button"
                    onClick={() => window.open("/sofor/gun-sonu","_blank","width=1200,height=900")}
                    className="rounded-xl bg-red-600 px-5 py-3 font-black text-white hover:bg-red-700"
                  >
                    Gün Sonu Kapat
                  </button>
                )}
              </div>
            </div>

            {showDelivered ? (
              <div className="mb-5">
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e)=>setHistorySearch(e.target.value)}
                  placeholder="Müşteri ara..."
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-bold outline-none focus:border-orange-500"
                />
              </div>
            ) : null}

            {showDelivered ? (
              <div className="mb-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl bg-white p-5 shadow">
                  <p className="text-xs font-bold uppercase text-slate-500">
                    Teslim Edilen Sipariş
                  </p>

                  <p className="mt-2 text-3xl font-black text-slate-900">
                    {deliveredOrderCount}
                  </p>
                </div>

                <div className="rounded-2xl bg-green-50 p-5 shadow">
                  <p className="text-xs font-bold uppercase text-green-700">
                    Toplam Satış
                  </p>

                  <p className="mt-2 text-3xl font-black text-green-700">
                    {deliveredOrderTotal.toLocaleString("de-DE", {
                      style: "currency",
                      currency: "EUR",
                    })}
                  </p>
                </div>
              </div>
            ) : null}

            {error ? (
              <div className="rounded-2xl bg-red-50 p-5 font-bold text-red-600">
                {error}
              </div>
            ) : null}

            {success ? (
              <div className="mb-5 rounded-2xl bg-green-50 p-5 font-bold text-green-700">
                {success}
              </div>
            ) : null}

            



{loading ? (


              <div className="flex items-center gap-3 rounded-[28px] bg-white p-7 font-bold text-slate-500">
                <Loader2 className="animate-spin" />
                Teslimatlar yükleniyor...
              </div>
            ) : orders.filter((order) =>
                showDelivered
                  ? order.status === "DELIVERED"
                  : order.status !== "DELIVERED",
              ).length === 0 ? (
              <div className="rounded-[28px] bg-white p-7 text-slate-500">
                {showDelivered
                  ? "Henüz teslim edilmiş sipariş bulunmuyor."
                  : "Size atanmış aktif sipariş bulunmuyor."}
              </div>
            ) : (
              <div className="space-y-4">
                {orders
                  .filter((order) => {
                    if (showDelivered) {
                      if (order.status !== "DELIVERED") return false;

                      const customerName =
                        (
                          order.user.companyName ||
                          `${order.user.firstName || ""} ${order.user.lastName || ""}`
                        ).toLowerCase();

                      if (!customerName.includes(historySearch.toLowerCase()))
                      return false;

                    if (historyDate) {
                      const d = new Date(order.createdAt)
                        .toISOString()
                        .slice(0,10);

                      return d === historyDate;
                    }

                    return true;
                  }

                  return order.status !== "DELIVERED";
                  })
                  .map((order) => {
                    const expanded = expandedOrderId === order.id;

                    const customerName =
                      order.user.companyName ||
                      `${order.user.firstName || ""} ${order.user.lastName || ""}`.trim();

                    return (
                      <article
                        key={order.id}
                        className="overflow-hidden rounded-[28px] bg-white shadow-sm"
                      >
                        <div className="p-6">
                          <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
                            <div className="flex-1">
                              <p className="text-sm font-black text-orange-500">
                                {order.orderNumber}
                              </p>

                              <h3 className="mt-1 text-xl font-black text-slate-950">
                                {customerName}
                              </h3>

                              <p className="mt-0.5 text-xs text-slate-500">
                                {new Date(order.createdAt).toLocaleString(
                                  "de-DE",
                                )}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs font-bold uppercase text-slate-400">
                                Durum
                              </p>

                              <p className="mt-1 font-black text-slate-950">
                                {statusLabels[order.status][language]}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs font-bold uppercase text-slate-400">
                                Toplam
                              </p>

                              <p className="mt-1 font-black text-slate-950">
                                {getDriverOrderTotal(order).toFixed(2)} €
                              </p>
                            </div>

                            <div className="min-w-44">
                              <p className="text-xs font-bold uppercase text-slate-400">
                                Ödeme
                              </p>

                              {order.driverPaymentReportedAt ? (
                                <>
                                  <p className="mt-1 font-black text-green-700">
                                    Admin Onayladı
                                  </p>

                                  <p className="mt-1 text-[10px] font-bold text-green-600">
                                    Para kasaya işlendi
                                  </p>
                                </>
                              ) : order.paymentStatus === "PAID" ? (
                                <>
                                  <p className="mt-1 font-black text-amber-600">
                                    Para Alındı
                                  </p>

                                  <p className="mt-1 text-[10px] font-bold text-amber-700">
                                    Admin kasa onayı bekleniyor
                                  </p>

                                  {order.driverPaymentReportedAmount !==
                                  null ? (
                                    <div className="mt-2 space-y-1 rounded-xl bg-amber-50 p-3">
                                      <div className="flex items-center justify-between gap-3">
                                        <span className="text-[10px] font-black uppercase text-amber-700">
                                          Bildirilen tutar
                                        </span>

                                        <strong className="text-sm text-amber-900">
                                          {order.driverPaymentReportedAmount.toLocaleString(
                                            "de-DE",
                                            {
                                              style: "currency",
                                              currency: "EUR",
                                            },
                                          )}
                                        </strong>
                                      </div>

                                      <div className="flex items-center justify-between gap-3">
                                        <span className="text-[10px] font-black uppercase text-red-600">
                                          Siparişte açık
                                        </span>

                                        <strong className="text-sm text-red-700">
                                          {Number(
                                            order.openPaymentAmount ??
                                              Math.max(
                                                0,
                                                Number(order.totalAmount || 0) -
                                                  Number(
                                                    order.approvedPaymentAmount ||
                                                      0,
                                                  ),
                                              ),
                                          ).toLocaleString("de-DE", {
                                            style: "currency",
                                            currency: "EUR",
                                          })}
                                        </strong>
                                      </div>

                                      {order.pendingPaymentAmount > 0.009 ? (
                                        <p className="pt-1 text-[10px] font-bold text-amber-700">
                                          Bildirilen ödeme admin tarafından
                                          onaylandıktan sonra açık tutardan
                                          düşecektir.
                                        </p>
                                      ) : null}
                                    </div>
                                  ) : null}

                                  <button
                                    type="button"
                                    disabled={updatingOrderId === order.id}
                                    onClick={() =>
                                      updateDeliveryStatus(
                                        order,
                                        "OPEN_PAYMENT",
                                      )
                                    }
                                    className="mt-2 w-full rounded-xl bg-slate-700 px-3 py-2 text-sm font-black text-white transition hover:bg-slate-800 disabled:opacity-50"
                                  >
                                    {updatingOrderId === order.id
                                      ? "Kaydediliyor..."
                                      : "Para Bildirimini Geri Al"}
                                  </button>
                                </>
                              ) : (
                                <>
                                  <p className="mt-1 font-black text-red-600">
                                    Ödeme Açık
                                  </p>

                                  <div className="mt-2 rounded-xl bg-red-50 p-3">
                                    <p className="text-[10px] font-black uppercase text-red-600">
                                      Kalan açık tutar
                                    </p>

                                    <p className="mt-1 text-xl font-black text-red-700">
                                      {Number(
                                        order.openPaymentAmount ??
                                          Math.max(
                                            0,
                                            Number(order.totalAmount || 0) -
                                              Number(
                                                order.approvedPaymentAmount ||
                                                  0,
                                              ),
                                          ),
                                      ).toLocaleString("de-DE", {
                                        style: "currency",
                                        currency: "EUR",
                                      })}
                                    </p>

                                    {order.approvedPaymentAmount > 0.009 ? (
                                      <p className="mt-1 text-[10px] font-bold text-green-700">
                                        Daha önce onaylanan:{" "}
                                        {order.approvedPaymentAmount.toLocaleString(
                                          "de-DE",
                                          {
                                            style: "currency",
                                            currency: "EUR",
                                          },
                                        )}
                                      </p>
                                    ) : (
                                      <p className="mt-1 text-[10px] font-bold text-slate-500">
                                        Henüz onaylanmış ödeme bulunmuyor
                                      </p>
                                    )}
                                  </div>

                                  <label className="mt-2 block">
                                    <span className="text-[10px] font-black uppercase text-slate-500">
                                      Müşteriden alınan
                                    </span>

                                    <div className="relative mt-1">
                                      <input
                                        type="number"
                                        inputMode="decimal"
                                        min="0.01"
                                        max={getDriverOpenPaymentAmount(order)}
                                        step="0.01"
                                        value={paymentAmounts[order.id] || ""}
                                        onChange={(event) =>
                                          setPaymentAmounts((current) => ({
                                            ...current,
                                            [order.id]: event.target.value,
                                          }))
                                        }
                                        placeholder={language === "de" ? "0,00" : "0,00"}
                                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 pr-8 text-sm font-black text-slate-950 outline-none focus:border-green-500"
                                      />

                                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-black text-slate-500">
                                        €
                                      </span>
                                    </div>
                                  </label>

                                  {Number(paymentAmounts[order.id] || 0) > 0 ? (
                                    <div className="mt-2 rounded-xl bg-red-50 px-3 py-2">
                                      <p className="text-[10px] font-black uppercase text-red-600">
                                        Açık kalacak
                                      </p>

                                      <p className="mt-0.5 text-sm font-black text-red-700">
                                        {Math.max(
                                          0,
                                          getDriverOpenPaymentAmount(order) -
                                            Number(
                                              paymentAmounts[order.id] || 0,
                                            ),
                                        ).toLocaleString("de-DE", {
                                          style: "currency",
                                          currency: "EUR",
                                        })}
                                      </p>
                                    </div>
                                  ) : null}

                                  <button
                                    type="button"
                                    disabled={
                                      updatingOrderId === order.id ||
                                      !Number.isFinite(
                                        Number(paymentAmounts[order.id]),
                                      ) ||
                                      Number(paymentAmounts[order.id]) <= 0 ||
                                      Number(paymentAmounts[order.id]) >
                                        getDriverOpenPaymentAmount(order)
                                    }
                                    onClick={() =>
                                      updateDeliveryStatus(
                                        order,
                                        "PAID",
                                        Number(paymentAmounts[order.id]),
                                      )
                                    }
                                    className="mt-2 w-full rounded-xl bg-green-600 px-3 py-2 text-sm font-black text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-40"
                                  >
                                    {updatingOrderId === order.id
                                      ? "Bildiriliyor..."
                                      : "Ödemeyi Bildir"}
                                  </button>
                                </>
                              )}
                            </div>

                            {order.status !== "DELIVERED" ? (
                              <div className="min-w-48">
                                {order.status === "OUT_FOR_DELIVERY" ? (
                                  <button
                                    type="button"
                                    disabled={updatingOrderId === order.id}
                                    onClick={() =>
                                      updateDeliveryStatus(order, "DELIVERED")
                                    }
                                    className="w-full rounded-xl bg-green-600 px-4 py-3 font-black text-white transition hover:bg-green-700 disabled:opacity-50"
                                  >
                                    {updatingOrderId === order.id
                                      ? "Kaydediliyor..."
                                      : "Teslim Ettim"}
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    disabled={updatingOrderId === order.id}
                                    onClick={() =>
                                      updateDeliveryStatus(
                                        order,
                                        "OUT_FOR_DELIVERY",
                                      )
                                    }
                                    className="w-full rounded-xl bg-orange-500 px-4 py-3 font-black text-white transition hover:bg-orange-600 disabled:opacity-50"
                                  >
                                    {updatingOrderId === order.id
                                      ? "Kaydediliyor..."
                                      : "Teslimata Çıktım"}
                                  </button>
                                )}
                              </div>
                            ) : (
                              <div className="rounded-xl bg-green-50 px-4 py-3 font-black text-green-700">
                                Teslim Edildi
                              </div>
                            )}

                            <button
                              type="button"
                              onClick={() =>
                                window.open(
                                  `/sofor/fis/${order.id}`,
                                  "_blank",
                                  "width=420,height=900"
                                )
                              }
                              className="flex h-11 items-center gap-2 rounded-xl bg-slate-900 px-3 text-sm font-black text-white transition hover:bg-slate-700"
                            >
                              <Printer size={17} />
                              Fiş Yazdır
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setExpandedOrderId(expanded ? null : order.id)
                              }
                              className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700"
                            >
                              {expanded ? (
                                <ChevronUp size={20} />
                              ) : (
                                <ChevronDown size={20} />
                              )}
                            </button>
                          </div>

                          <div className="mt-5 grid gap-4 sm:grid-cols-2">
                            <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                              <div className="flex items-center gap-2 font-bold text-slate-950">
                                <MapPin size={18} className="text-orange-500" />
                                Teslimat Adresi
                              </div>

                              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">
                                {order.deliveryAddress}
                              </p>
                            </div>

                            <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                              <div className="flex items-center gap-2 font-bold text-slate-950">
                                <Phone size={18} className="text-orange-500" />
                                Müşteri
                              </div>

                              <p className="mt-2 text-sm text-slate-600">
                                {customerName}
                              </p>

                              <p className="text-sm text-slate-600">
                                {order.user.phone || "Telefon yok"}
                              </p>
                            </div>
                          </div>
                        </div>

                        {expanded ? (
                          <div className="border-t border-slate-200 p-6">
                            <h4 className="text-sm font-black text-slate-950">
                              Sipariş Ürünleri
                            </h4>

                            <div className="mt-3 space-y-2">
                              {order.items.map((item) => (
                                <div
                                  key={item.id}
                                  className="flex items-center justify-between rounded-xl bg-slate-50 p-4"
                                >
                                  <div>
                                    <p className="font-bold text-slate-950">
                                      {item.name}
                                    </p>

                                    <p className="text-sm text-slate-500">
                                      Adet: {item.quantity}
                                    </p>
                                  </div>

                                  <p className="text-sm font-black text-slate-950">
                                    {(item.price * item.quantity).toFixed(2)} €
                                  </p>
                                </div>
                              ))}
                            </div>

                            {order.customerNote ? (
                              <div className="mt-5 rounded-2xl bg-amber-50 p-4">
                                <p className="text-sm font-black text-amber-900">
                                  Müşteri Notu
                                </p>

                                <p className="mt-1 text-sm text-amber-800">
                                  {order.customerNote}
                                </p>
                              </div>
                            ) : null}

                            {order.pfandReturns.length > 0 ? (
                              <div className="mt-4 w-full max-w-[520px] rounded-xl border border-slate-200 bg-white p-2.5">
                                <div className="mb-2">
                                  <h4 className="text-sm font-black text-slate-950">
                                    Pfand İadesi
                                  </h4>

                                  <p className="text-[11px] text-slate-500">
                                    Müşterinin bildirdiği miktarı kontrol edin
                                    ve gerçek alınan miktarı girin.
                                  </p>
                                </div>

                                <div className="overflow-hidden rounded-lg border border-slate-200">
                                  <div className="grid grid-cols-[1fr_105px_60px] items-center gap-1 bg-slate-100 px-2 py-1 text-[10px] font-black uppercase text-slate-500">
                                    <div>{language === "de" ? "Pfandart" : "Pfand Türü"}</div>

                                    <div className="text-center">
                                      Şoförün Aldığı
                                    </div>

                                    <div className="text-right">{language === "de" ? "Betrag" : "Tutar"}</div>
                                  </div>

                                  {order.pfandReturns[0].items.map((item) => {
                                    const currentQuantity =
                                      getPfandQuantity(item);

                                    return (
                                      <div
                                        key={item.id}
                                        className="grid grid-cols-[1fr_105px_60px] items-center gap-1 border-t border-slate-200 px-2 py-1"
                                      >
                                        <div className="min-w-0">
                                          <p className="truncate text-[11px] font-bold text-slate-950">
                                            {item.name}
                                          </p>

                                          <p className="text-[9px] text-slate-400">
                                            Birim: {item.unitAmount.toFixed(2)}{" "}
                                            €
                                          </p>
                                        </div>

                                        <div className="flex items-center justify-center gap-1">
                                          <button
                                            type="button"
                                            disabled={
                                              order.status === "DELIVERED" ||
                                              updatingOrderId === order.id
                                            }
                                            onClick={() =>
                                              changePfandQuantity(item, -1)
                                            }
                                            className="flex h-5 w-5 items-center justify-center rounded bg-slate-200 text-[10px] font-black text-slate-900 hover:bg-slate-300 disabled:opacity-40"
                                          >
                                            -
                                          </button>

                                          <input
                                            type="number"
                                            min={0}
                                            step={1}
                                            value={currentQuantity}
                                            disabled={
                                              order.status === "DELIVERED" ||
                                              updatingOrderId === order.id
                                            }
                                            onChange={(event) =>
                                              setPfandQuantity(
                                                item,
                                                Number(event.target.value),
                                              )
                                            }
                                            className="h-5 w-9 rounded border border-slate-200 bg-white text-center text-[10px] font-black text-slate-950 outline-none focus:border-orange-500 disabled:bg-slate-100"
                                          />

                                          <button
                                            type="button"
                                            disabled={
                                              order.status === "DELIVERED" ||
                                              updatingOrderId === order.id
                                            }
                                            onClick={() =>
                                              changePfandQuantity(item, 1)
                                            }
                                            className="flex h-5 w-5 items-center justify-center rounded bg-orange-500 text-[10px] font-black text-white hover:bg-orange-600 disabled:opacity-40"
                                          >
                                            +
                                          </button>
                                        </div>

                                        <div className="text-right text-[11px] font-black text-slate-950">
                                          {(
                                            currentQuantity * item.unitAmount
                                          ).toFixed(2)}{" "}
                                          €
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>

                                <div className="mt-2 flex items-center justify-between rounded-lg bg-orange-50 px-2 py-1">
                                  <div className="flex items-center gap-4">
                                    <div>
                                      <p className="text-[9px] font-bold text-orange-800">
                                        Pfand İadesi
                                      </p>

                                      <p className="text-xs font-black text-orange-950">
                                        {order.pfandReturns[0].items
                                          .reduce(
                                            (total, item) =>
                                              total +
                                              getPfandQuantity(item) *
                                                item.unitAmount,
                                            0,
                                          )
                                          .toFixed(2)}{" "}
                                        €
                                      </p>
                                    </div>

                                    <div className="border-l border-orange-200 pl-4">
                                      <p className="text-[9px] font-bold text-orange-800">
                                        Müşteriden Alınacak
                                      </p>

                                      <p className="text-sm font-black text-orange-950">
                                        {getDriverOrderTotal(order).toFixed(2)}{" "}
                                        €
                                      </p>
                                    </div>
                                  </div>

                                  {order.status !== "DELIVERED" ? (
                                    <button
                                      type="button"
                                      disabled={updatingOrderId === order.id}
                                      onClick={() => savePfand(order)}
                                      className="rounded-md bg-orange-500 px-2.5 py-1.5 text-[10px] font-black text-white transition hover:bg-orange-600 disabled:opacity-50"
                                    >
                                      {updatingOrderId === order.id
                                        ? "Kaydediliyor..."
                                        : "Pfand Miktarını Kaydet"}
                                    </button>
                                  ) : (
                                    <div className="rounded-md bg-green-100 px-2 py-1 text-[10px] font-black text-green-700">
                                      Pfand Kesinleşti
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="mt-4 w-full max-w-[520px] rounded-xl border border-green-200 bg-green-50 p-3">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                  <div>
                                    <h4 className="text-sm font-black text-slate-950">
                                      Pfand Teslimi
                                    </h4>

                                    <p className="mt-1 text-[11px] text-slate-600">
                                      Müşterinin verdiği Pfandları sayın ve
                                      müşteriden alınacak tutardan düşün.
                                    </p>
                                  </div>

                                  {order.status !== "DELIVERED" ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setNewPfandOrderId((current) =>
                                          current === order.id
                                            ? null
                                            : order.id,
                                        );

                                        resetNewPfandForm();
                                      }}
                                      className="rounded-lg bg-green-600 px-3 py-2 text-xs font-black text-white transition hover:bg-green-700"
                                    >
                                      {newPfandOrderId === order.id
                                        ? "Pfand Girişini Kapat"
                                        : "Pfand Gir"}
                                    </button>
                                  ) : (
                                    <span className="rounded-lg bg-slate-200 px-3 py-2 text-[10px] font-black text-slate-500">
                                      Sipariş Teslim Edildi
                                    </span>
                                  )}
                                </div>

                                {newPfandOrderId === order.id &&
                                order.status !== "DELIVERED" ? (
                                  <div className="mt-3">
                                    <div className="grid gap-2 sm:grid-cols-2">
                                      {driverPfandTypes.map((pfandType) => (
                                        <label
                                          key={pfandType.key}
                                          className="rounded-lg bg-white p-3"
                                        >
                                          <span className="text-[11px] font-black text-slate-700">
                                            {pfandType.label}
                                          </span>

                                          <input
                                            type="number"
                                            min="0"
                                            max="9999"
                                            step="1"
                                            inputMode="numeric"
                                            value={
                                              newPfandValues[pfandType.key] ||
                                              ""
                                            }
                                            disabled={
                                              updatingOrderId === order.id
                                            }
                                            onChange={(event) =>
                                              setNewPfandValues((current) => ({
                                                ...current,

                                                [pfandType.key]:
                                                  event.target.value.replace(
                                                    /\D/g,
                                                    "",
                                                  ),
                                              }))
                                            }
                                            placeholder={language === "de" ? "Menge" : "Adet"}
                                            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold outline-none focus:border-green-500 disabled:bg-slate-100"
                                          />
                                        </label>
                                      ))}
                                    </div>

                                    <div className="mt-3 rounded-lg bg-white p-3">
                                      <div className="flex justify-between gap-4">
                                        <span className="text-xs font-bold text-slate-600">
                                          Alınan Pfand
                                        </span>

                                        <strong className="text-sm text-green-700">
                                          {getNewPfandTotal().toLocaleString(
                                            "de-DE",
                                            {
                                              style: "currency",
                                              currency: "EUR",
                                            },
                                          )}
                                        </strong>
                                      </div>

                                      <div className="mt-2 flex justify-between gap-4 border-t border-slate-100 pt-2">
                                        <span className="text-xs font-black text-slate-950">
                                          Müşteriden Alınacak
                                        </span>

                                        <strong className="text-sm text-slate-950">
                                          {Math.max(
                                            0,
                                            order.subtotal +
                                              order.pfandAmount +
                                              order.deliveryFee -
                                              getNewPfandTotal(),
                                          ).toLocaleString("de-DE", {
                                            style: "currency",
                                            currency: "EUR",
                                          })}
                                        </strong>
                                      </div>
                                    </div>

                                    <button
                                      type="button"
                                      disabled={
                                        updatingOrderId === order.id ||
                                        getNewPfandTotal() <= 0
                                      }
                                      onClick={() => createPfand(order)}
                                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-3 text-xs font-black text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                                    >
                                      {updatingOrderId === order.id ? (
                                        <>
                                          <Loader2
                                            size={16}
                                            className="animate-spin"
                                          />
                                          Pfand Kaydediliyor...
                                        </>
                                      ) : (
                                        "Pfandı Kaydet ve Hesaptan Düş"
                                      )}
                                    </button>
                                  </div>
                                ) : null}
                              </div>
                            )}
                          </div>
                        ) : null}
                      </article>
                    );
                  })}
              </div>
            )}
          </section>
        ) : null}
      </div>
    </main>
  );
}
