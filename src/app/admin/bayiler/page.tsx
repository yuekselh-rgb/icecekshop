"use client";

import { useLanguage } from "@/context/LanguageContext";

import {
  ArrowLeft,
  BadgeEuro,
  Building2,
  Loader2,
  MapPin,
  PackageSearch,
  Pencil,
  Plus,
  Save,
  UserRound,
  WalletCards,
  X,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { getCategoryTheme } from "@/lib/category-theme";

type Dealer = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  companyName: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: string;

  dealerProfile: {
    id: string;
    dealerNumber: string;
    companyName: string;
    contactName: string | null;
    phone: string | null;
    taxNumber: string | null;
    street: string | null;
    houseNumber: string | null;
    postalCode: string | null;
    city: string | null;
    country: string;
    creditLimit: number;
    currentBalance: number;
    note: string | null;
    active: boolean;
  } | null;

  _count: {
    dealerPrices: number;
  };
};

type Permissions = {
  viewDealers: boolean;
  createDealer: boolean;
  updateDealer: boolean;
  manageDealerPrices: boolean;
  viewDealerAccounts: boolean;
};

type DealerPriceProduct = {
  id: string;
  name: string;
  nameTr: string | null;
  nameDe: string | null;
  price: number;
  pfandAmount: number;
  packageInfo: string | null;
  stockUnit: string;
  category: {
    id: string;
    name: string;
    nameTr: string | null;
    nameDe: string | null;
  };
  customPrice: number | null;
};

type DealerEditForm = {
  dealerNumber: string;
  companyName: string;
  contactName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  taxNumber: string;
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
  country: string;
  creditLimit: string;
  note: string;
  isActive: boolean;
};

const emptyDealerEditForm: DealerEditForm = {
  dealerNumber: "",
  companyName: "",
  contactName: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  taxNumber: "",
  street: "",
  houseNumber: "",
  postalCode: "",
  city: "",
  country: "Deutschland",
  creditLimit: "0",
  note: "",
  isActive: true,
};

function getDealerPriceCategoryStyle(categoryId: string) {
  const theme = getCategoryTheme(categoryId);

  return {
    backgroundColor: theme.background,
    borderColor: theme.border,
    color: theme.text,
  };
}

export default function DealerManagementPage() {

  const { language } = useLanguage();

  const t =
    language === "de"
      ? {
          title: "Händlerverwaltung",
          open: "Öffnen",
          close: "Schließen",
          companyName: "Firmenname",
          contactPerson: "Ansprechpartner",
          firstName: "Vorname",
          lastName: "Nachname",
          phone: "Telefon",
          taxNumber: "Steuernummer",
          street: "Straße",
          houseNumber: "Hausnummer",
          postalCode: "PLZ",
          city: "Stadt",
          country: "Land",
          note: "Notiz",
          unnamedDealer: "Unbenannter Händler",
          active: "Aktiv",
          passive: "Passiv",
          noContact: "Kein Ansprechpartner",
          searchProduct: "Produkt oder Kategorie suchen",
          useStandardPrice: "Standardpreis wird verwendet",
          sameAsNormalPrice: "Gleich wie Normalpreis",
          saveChanges: "Änderungen speichern",
          product: "Produkt",
          pfand: "Pfand",
          dealerTotal: "Händlersumme",
          addDealerTitle: "Neuen Händler hinzufügen",
          addDealerCloseHint: "Händlerformular schließen",
          addDealerOpenHint: "Öffnen, um ein neues Händlerkonto zu erstellen",
          dealerNumber: "Händlernummer",
          email: "E-Mail",
          tempPassword: "Vorläufiges Passwort",
          creditLimit: "Kreditlimit",
          creditLimitHint:
            "Maximaler Betrag, den der Händler auf offener Rechnung beziehen kann.",
          creating: "Wird erstellt...",
          createDealerAccount: "Händlerkonto erstellen",
        }
      : {
          title: "Bayi Yönetimi",
          open: "Aç",
          close: "Kapat",
          companyName: "Firma adı",
          contactPerson: "Yetkili adı soyadı",
          firstName: "Giriş hesabı adı",
          lastName: "Giriş hesabı soyadı",
          phone: "Telefon",
          taxNumber: "Vergi numarası",
          street: "Sokak",
          houseNumber: "No.",
          postalCode: "Posta kodu",
          city: "Şehir",
          country: "Ülke",
          note: "Bayi hakkında not",
          unnamedDealer: "İsimsiz bayi",
          active: "Aktif",
          passive: "Pasif",
          noContact: "Yetkili belirtilmedi",
          searchProduct: "Ürün veya kategori ara",
          useStandardPrice: "Standart fiyat kullanılacak",
          sameAsNormalPrice: "Normal fiyatla aynı",
          saveChanges: "Değişiklikleri Kaydet",
          product: "Ürün",
          pfand: "Pfand",
          dealerTotal: "Bayi toplamı",
          addDealerTitle: "Yeni Bayi Ekle",
          addDealerCloseHint: "Bayi ekleme formunu kapat",
          addDealerOpenHint: "Yeni bir bayi hesabı oluşturmak için açın",
          dealerNumber: "Bayi numarası",
          email: "E-posta",
          tempPassword: "Geçici şifre",
          creditLimit: "Kredi limiti",
          creditLimitHint: "Bayinin açık hesapla alabileceği azami tutar.",
          creating: "Oluşturuluyor...",
          createDealerAccount: "Bayi Hesabı Oluştur",
        };


  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [permissions, setPermissions] = useState<Permissions | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  /*
   * Yeni bayi formu sayfa ilk açıldığında kapalıdır.
   * Kullanıcı "Yeni Bayi Ekle" kartına basınca açılır.
   */
  const [showCreateDealerForm, setShowCreateDealerForm] = useState(false);

  const [editingDealerId, setEditingDealerId] = useState<string | null>(null);

  const [editSaving, setEditSaving] = useState(false);

  const [editForm, setEditForm] = useState<DealerEditForm>(emptyDealerEditForm);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [dealerPriceDealerId, setDealerPriceDealerId] = useState<string | null>(
    null,
  );

  const [dealerPriceDealerName, setDealerPriceDealerName] = useState("");

  const [dealerPriceProducts, setDealerPriceProducts] = useState<
    DealerPriceProduct[]
  >([]);

  const [dealerPriceValues, setDealerPriceValues] = useState<
    Record<string, string>
  >({});

  const [loadingDealerPrices, setLoadingDealerPrices] = useState(false);
  const [savingDealerPrices, setSavingDealerPrices] = useState(false);
  const [dealerPriceError, setDealerPriceError] = useState("");
  const [dealerPriceSearch, setDealerPriceSearch] = useState("");

  async function loadDealers() {
    setError("");

    try {
      const [dealerResponse, meResponse] = await Promise.all([
        fetch("/api/admin/dealers"),
        fetch("/api/admin/me"),
      ]);

      const dealerData = await dealerResponse.json();
      const meData = await meResponse.json();

      if (!meResponse.ok) {
        setError(meData.error || "Yetkiler yüklenemedi.");
        return;
      }

      setPermissions(meData.permissions);

      if (!dealerResponse.ok) {
        setError(dealerData.error || "Bayiler yüklenemedi.");
        return;
      }

      setDealers(dealerData.dealers || []);
    } catch {
      setError("Bayiler yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDealers();
  }, []);

  async function createDealer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch("/api/admin/dealers", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          dealerNumber: formData.get("dealerNumber"),

          companyName: formData.get("companyName"),

          contactName: formData.get("contactName"),

          firstName: formData.get("firstName"),

          lastName: formData.get("lastName"),

          email: formData.get("email"),
          phone: formData.get("phone"),
          password: formData.get("password"),

          taxNumber: formData.get("taxNumber"),

          street: formData.get("street"),

          houseNumber: formData.get("houseNumber"),

          postalCode: formData.get("postalCode"),

          city: formData.get("city"),

          country: formData.get("country"),

          creditLimit: formData.get("creditLimit"),

          note: formData.get("note"),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Bayi oluşturulamadı.");
        return;
      }

      setSuccess("Bayi hesabı başarıyla oluşturuldu.");

      form.reset();

      await loadDealers();
    } catch {
      setError("Bayi oluşturulamadı.");
    } finally {
      setSaving(false);
    }
  }

  function openDealerEdit(dealer: Dealer) {
    const profile = dealer.dealerProfile;

    if (!profile) {
      setError("Bayi profili bulunamadı.");
      return;
    }

    setEditingDealerId(dealer.id);

    setEditForm({
      dealerNumber: profile.dealerNumber || "",
      companyName: profile.companyName || dealer.companyName || "",
      contactName: profile.contactName || "",
      firstName: dealer.firstName || "",
      lastName: dealer.lastName || "",
      email: dealer.email || "",
      phone: profile.phone || dealer.phone || "",
      taxNumber: profile.taxNumber || "",
      street: profile.street || "",
      houseNumber: profile.houseNumber || "",
      postalCode: profile.postalCode || "",
      city: profile.city || "",
      country: profile.country || "Deutschland",
      creditLimit: String(profile.creditLimit || 0),
      note: profile.note || "",
      isActive: dealer.isActive && profile.active,
    });

    setError("");
    setSuccess("");
  }

  function closeDealerEdit() {
    setEditingDealerId(null);
    setEditForm(emptyDealerEditForm);
  }

  function updateDealerEditForm(
    key: keyof DealerEditForm,
    value: string | boolean,
  ) {
    setEditForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function saveDealerEdit() {
    if (!editingDealerId) {
      return;
    }

    setEditSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/admin/dealers/${editingDealerId}`, {
        method: "PATCH",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          ...editForm,

          creditLimit: Number(editForm.creditLimit || 0),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Bayi bilgileri güncellenemedi.");
        return;
      }

      setSuccess(data.message || "Bayi bilgileri güncellendi.");

      closeDealerEdit();

      await loadDealers();
    } catch {
      setError("Bayi bilgileri güncellenemedi.");
    } finally {
      setEditSaving(false);
    }
  }

  async function openDealerPrices(dealer: Dealer) {
    if (!permissions?.manageDealerPrices) {
      setError("Bayi özel fiyatlarını değiştirme yetkiniz yok.");
      return;
    }

    const profile = dealer.dealerProfile;

    setDealerPriceDealerId(dealer.id);
    setDealerPriceDealerName(
      profile?.companyName || dealer.companyName || dealer.email,
    );

    setDealerPriceProducts([]);
    setDealerPriceValues({});
    setDealerPriceSearch("");
    setDealerPriceError("");
    setLoadingDealerPrices(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/admin/dealers/${dealer.id}/prices`);

      const data = await response.json();

      if (!response.ok) {
        setDealerPriceError(data.error || "Bayi özel fiyatları yüklenemedi.");
        return;
      }

      const products = (data.products || []) as DealerPriceProduct[];

      setDealerPriceProducts(products);

      setDealerPriceValues(
        Object.fromEntries(
          products.map((product) => [
            product.id,
            product.customPrice === null ? "" : String(product.customPrice),
          ]),
        ),
      );
    } catch {
      setDealerPriceError("Bayi özel fiyatları yüklenemedi.");
    } finally {
      setLoadingDealerPrices(false);
    }
  }

  function closeDealerPrices() {
    setDealerPriceDealerId(null);
    setDealerPriceDealerName("");
    setDealerPriceProducts([]);
    setDealerPriceValues({});
    setDealerPriceSearch("");
    setDealerPriceError("");
  }

  async function saveDealerPrices() {
    if (!dealerPriceDealerId) {
      return;
    }

    setSavingDealerPrices(true);
    setDealerPriceError("");
    setError("");
    setSuccess("");

    try {
      const prices = dealerPriceProducts.map((product) => {
        const rawValue = dealerPriceValues[product.id]?.trim() || "";

        return {
          productId: product.id,
          price: rawValue === "" ? null : Number(rawValue),
        };
      });

      const invalidPrice = prices.find(
        (item) =>
          item.price !== null &&
          (!Number.isFinite(item.price) || item.price < 0),
      );

      if (invalidPrice) {
        setDealerPriceError(
          "Özel fiyat sıfır veya pozitif bir tutar olmalıdır.",
        );
        return;
      }

      const response = await fetch(
        `/api/admin/dealers/${dealerPriceDealerId}/prices`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prices,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setDealerPriceError(data.error || "Bayi özel fiyatları kaydedilemedi.");
        return;
      }

      setSuccess(`${dealerPriceDealerName} için özel fiyatlar kaydedildi.`);

      await loadDealers();

      await openDealerPrices({
        ...dealers.find((dealer) => dealer.id === dealerPriceDealerId)!,
      });
    } catch {
      setDealerPriceError("Bayi özel fiyatları kaydedilemedi.");
    } finally {
      setSavingDealerPrices(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 p-2 sm:p-3 lg:p-4">
      <div className="w-full">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 font-bold text-slate-600 transition hover:text-orange-500"
        >
          <ArrowLeft size={18} />
          Admin Paneli
        </Link>

        <section className="mt-6 rounded-[32px] bg-slate-950 p-7 text-white sm:p-10">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500">
            <Building2 size={28} />
          </div>

          <h1 className="mt-5 text-4xl font-black">{t.title}</h1>

          <p className="mt-3 max-w-3xl text-slate-400">
            Toptan satış yapan bayileri oluşturun, hesap bilgilerini
            görüntüleyin ve daha sonra bayiye özel ürün fiyatlarını yönetin.
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

        <div
          className={`mt-6 grid gap-6 ${
            dealerPriceDealerId || !showCreateDealerForm
              ? "grid-cols-1"
              : "xl:grid-cols-[430px_minmax(0,1fr)]"
          }`}
        >
          {permissions?.createDealer ? (
            <section
              className={`h-fit rounded-[28px] bg-white p-6 shadow-sm ${
                dealerPriceDealerId ? "hidden" : ""
              }`}
            >
              <button
                type="button"
                aria-expanded={showCreateDealerForm}
                onClick={() => setShowCreateDealerForm((current) => !current)}
                className="flex w-full items-center justify-between gap-4 text-left"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                    <Plus
                      size={22}
                      className={`transition-transform ${
                        showCreateDealerForm ? "rotate-45" : ""
                      }`}
                    />
                  </div>

                  <div className="min-w-0">
                    <h2 className="text-2xl font-black text-slate-950">
                      {t.addDealerTitle}
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      {showCreateDealerForm
                        ? t.addDealerCloseHint
                        : t.addDealerOpenHint}
                    </p>
                  </div>
                </div>

                <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1.5 text-sm font-black text-slate-600">
                  {showCreateDealerForm ? t.close : t.open}
                </span>
              </button>

              {showCreateDealerForm ? (
                <form onSubmit={createDealer} className="mt-6 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                    <label className="block">
                      <span className="text-sm font-bold text-slate-700">
                        {t.dealerNumber} *
                      </span>

                      <input
                        required
                        name="dealerNumber"
                        placeholder={language === "de" ? "z.B. HND-001" : "Örn. BAYI-001"}
                        className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-orange-500"
                      />
                    </label>

                    <label className="block">
                      <span className="text-sm font-bold text-slate-700">
                        {t.companyName} *
                      </span>

                      <input
                        required
                        name="companyName"
                        placeholder={t.companyName}
                        className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-orange-500"
                      />
                    </label>

                    <label className="block">
                      <span className="text-sm font-bold text-slate-700">
                        {t.contactPerson}
                      </span>

                      <input
                        name="contactName"
                        placeholder={t.contactPerson}
                        className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-orange-500"
                      />
                    </label>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <input
                        name="firstName"
                        placeholder={t.firstName}
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-orange-500"
                      />

                      <input
                        name="lastName"
                        placeholder={t.lastName}
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-orange-500"
                      />
                    </div>

                    <label className="block">
                      <span className="text-sm font-bold text-slate-700">
                        {t.email} *
                      </span>

                      <input
                        required
                        name="email"
                        type="email"
                        placeholder={language === "de" ? "haendler@firma.de" : "bayi@firma.de"}
                        className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-orange-500"
                      />
                    </label>

                    <label className="block">
                      <span className="text-sm font-bold text-slate-700">
                        {t.phone}
                      </span>

                      <input
                        name="phone"
                        type="tel"
                        placeholder={t.phone}
                        className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-orange-500"
                      />
                    </label>

                    <label className="block">
                      <span className="text-sm font-bold text-slate-700">
                        {t.tempPassword} *
                      </span>

                      <input
                        required
                        name="password"
                        type="password"
                        minLength={8}
                        placeholder={language === "de" ? "Mindestens 8 Zeichen" : "En az 8 karakter"}
                        className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-orange-500"
                      />
                    </label>

                    <label className="block">
                      <span className="text-sm font-bold text-slate-700">
                        {t.taxNumber}
                      </span>

                      <input
                        name="taxNumber"
                        placeholder={t.taxNumber}
                        className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-orange-500"
                      />
                    </label>

                    <div className="grid gap-3 sm:grid-cols-[1fr_110px]">
                      <input
                        name="street"
                        placeholder={t.street}
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-orange-500"
                      />

                      <input
                        name="houseNumber"
                        placeholder={t.houseNumber}
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-orange-500"
                      />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-[130px_1fr]">
                      <input
                        name="postalCode"
                        placeholder={t.postalCode}
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-orange-500"
                      />

                      <input
                        name="city"
                        placeholder={t.city}
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-orange-500"
                      />
                    </div>

                    <input
                      name="country"
                      defaultValue="Deutschland"
                      placeholder={t.country}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-orange-500"
                    />

                    <label className="block">
                      <span className="text-sm font-bold text-slate-700">
                        {t.creditLimit}
                      </span>

                      <div className="relative mt-1.5">
                        <input
                          name="creditLimit"
                          type="number"
                          min="0"
                          step="0.01"
                          defaultValue="0"
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-10 outline-none focus:border-orange-500"
                        />

                        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                          €
                        </span>
                      </div>

                      <p className="mt-1 text-[11px] text-slate-500">
                        {t.creditLimitHint}
                      </p>
                    </label>

                    <textarea
                      name="note"
                      rows={3}
                      placeholder={t.note}
                      className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-orange-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-4 font-black text-white transition hover:bg-orange-600 disabled:bg-orange-300"
                  >
                    {saving ? (
                      <>
                        <Loader2 size={19} className="animate-spin" />
                        {t.creating}
                      </>
                    ) : (
                      <>
                        <Plus size={19} />
                        {t.createDealerAccount}
                      </>
                    )}
                  </button>
                </form>
              ) : null}
            </section>
          ) : (
            <section
              className={`h-fit rounded-[28px] bg-white p-6 shadow-sm ${
                dealerPriceDealerId ? "hidden" : ""
              }`}
            >
              <p className="font-bold text-slate-600">
                Yeni bayi oluşturma yetkiniz bulunmuyor.
              </p>
            </section>
          )}

          <section
            className={`min-w-0 rounded-[28px] bg-white shadow-sm ${
              dealerPriceDealerId ? "p-3 sm:p-4" : "p-6"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-black text-slate-950">
                  Kayıtlı Bayiler
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Toplam {dealers.length} bayi hesabı
                </p>
              </div>

              <Building2 className="text-orange-500" />
            </div>

            {loading ? (
              <div className="mt-8 flex items-center gap-2 font-bold text-slate-500">
                <Loader2 size={20} className="animate-spin" />
                Bayiler yükleniyor...
              </div>
            ) : dealers.length === 0 ? (
              <div className="mt-8 rounded-2xl bg-slate-50 p-8 text-center">
                <Building2 size={36} className="mx-auto text-slate-300" />

                <p className="mt-3 font-bold text-slate-500">
                  Henüz bayi hesabı bulunmuyor.
                </p>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {dealers.map((dealer) => {
                  const profile = dealer.dealerProfile;

                  return (
                    <article
                      key={dealer.id}
                      className="rounded-2xl border border-slate-200 p-5"
                    >
                      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                          <Building2 size={23} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-black text-slate-950">
                              {profile?.companyName ||
                                dealer.companyName ||
                                t.unnamedDealer}
                            </h3>

                            <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-black text-orange-600">
                              {profile?.dealerNumber}
                            </span>

                            <span
                              className={`rounded-full px-3 py-1 text-xs font-black ${
                                dealer.isActive && profile?.active
                                  ? "bg-green-50 text-green-700"
                                  : "bg-red-50 text-red-600"
                              }`}
                            >
                              {dealer.isActive && profile?.active
                                ? t.active
                                : t.passive}
                            </span>
                          </div>

                          <div className="mt-3 grid gap-2 text-sm text-slate-500 sm:grid-cols-2">
                            <p className="flex items-center gap-2">
                              <UserRound size={15} />
                              {profile?.contactName ||
                                `${dealer.firstName || ""} ${
                                  dealer.lastName || ""
                                }`.trim() ||
                                t.noContact}
                            </p>

                            <p className="truncate">{dealer.email}</p>

                            {profile?.phone || dealer.phone ? (
                              <p>Telefon: {profile?.phone || dealer.phone}</p>
                            ) : null}

                            {profile?.city ? (
                              <p className="flex items-center gap-2">
                                <MapPin size={15} />
                                {profile.postalCode} {profile.city}
                              </p>
                            ) : null}
                          </div>

                          {profile?.note ? (
                            <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                              {profile.note}
                            </p>
                          ) : null}
                        </div>

                        <div className="grid shrink-0 grid-cols-2 gap-2 lg:w-[260px]">
                          <div className="rounded-xl bg-slate-50 p-3">
                            <div className="flex items-center gap-2 text-slate-400">
                              <BadgeEuro size={15} />

                              <span className="text-[11px] font-bold uppercase">
                                Kredi limiti
                              </span>
                            </div>

                            <p className="mt-1 font-black text-slate-950">
                              {Number(profile?.creditLimit || 0).toLocaleString(
                                "de-DE",
                                {
                                  style: "currency",
                                  currency: "EUR",
                                },
                              )}
                            </p>
                          </div>

                          <div className="rounded-xl bg-slate-50 p-3">
                            <div className="flex items-center gap-2 text-slate-400">
                              <WalletCards size={15} />

                              <span className="text-[11px] font-bold uppercase">
                                Bakiye
                              </span>
                            </div>

                            <p
                              className={`mt-1 font-black ${
                                Number(profile?.currentBalance || 0) > 0
                                  ? "text-red-600"
                                  : "text-slate-950"
                              }`}
                            >
                              {Number(
                                profile?.currentBalance || 0,
                              ).toLocaleString("de-DE", {
                                style: "currency",
                                currency: "EUR",
                              })}
                            </p>
                          </div>

                          <div className="col-span-2 flex items-center justify-between rounded-xl bg-blue-50 p-3 text-blue-700">
                            <div className="flex items-center gap-2">
                              <PackageSearch size={16} />

                              <span className="text-xs font-black">
                                Özel fiyat
                              </span>
                            </div>

                            <span className="font-black">
                              {dealer._count.dealerPrices}
                            </span>
                          </div>

                          {permissions?.manageDealerPrices ? (
                            <button
                              type="button"
                              onClick={() => openDealerPrices(dealer)}
                              className="col-span-2 flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white transition hover:bg-blue-700"
                            >
                              <PackageSearch size={16} />
                              Özel Fiyatları Yönet
                            </button>
                          ) : null}

                          {permissions?.updateDealer ? (
                            <button
                              type="button"
                              onClick={() => openDealerEdit(dealer)}
                              className="col-span-2 flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:bg-orange-500"
                            >
                              <Pencil size={16} />
                              Bayiyi Düzenle
                            </button>
                          ) : null}
                        </div>
                      </div>

                      {dealerPriceDealerId === dealer.id ? (
                        <div className="mt-5 w-full rounded-2xl border border-blue-200 bg-blue-50 p-3 sm:p-4">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <h4 className="text-lg font-black text-slate-950">
                                Bayiye Özel Ürün Fiyatları
                              </h4>

                              <p className="mt-1 text-xs text-slate-500">
                                {dealerPriceDealerName} için yalnızca ürün
                                fiyatını değiştirin. Pfand tutarı üründen
                                otomatik gelir ve sabit kalır. Boş bırakılan
                                ürünlerde normal ürün fiyatı kullanılır.
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={closeDealerPrices}
                              className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-black text-blue-700"
                            >
                              Kapat
                            </button>
                          </div>

                          {dealerPriceError ? (
                            <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-600">
                              {dealerPriceError}
                            </div>
                          ) : null}

                          {loadingDealerPrices ? (
                            <div className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-white p-8 font-bold text-slate-500">
                              <Loader2 size={20} className="animate-spin" />
                              Ürünler yükleniyor...
                            </div>
                          ) : (
                            <>
                              <input
                                type="search"
                                value={dealerPriceSearch}
                                onChange={(event) =>
                                  setDealerPriceSearch(event.target.value)
                                }
                                placeholder={t.searchProduct}
                                className="mt-4 w-full rounded-xl border border-blue-200 bg-white px-4 py-3 outline-none focus:border-blue-200"
                              />

                              <div className="mt-4 min-h-[520px] max-h-[calc(100vh-190px)] space-y-3 overflow-y-auto pr-1">
                                {dealerPriceProducts
                                  .filter((product) => {
                                    const search = dealerPriceSearch
                                      .trim()
                                      .toLocaleLowerCase("tr-TR");

                                    if (!search) {
                                      return true;
                                    }

                                    const searchableText = [
                                      product.nameTr,
                                      product.nameDe,
                                      product.name,
                                      product.category.nameTr,
                                      product.category.nameDe,
                                      product.category.name,
                                      product.packageInfo,
                                    ]
                                      .filter(Boolean)
                                      .join(" ")
                                      .toLocaleLowerCase("tr-TR");

                                    return searchableText.includes(search);
                                  })
                                  .map(
                                    (
                                      product,
                                      productIndex,
                                      filteredProducts,
                                    ) => {
                                      const rawCustomPrice =
                                        dealerPriceValues[product.id] || "";

                                      const parsedCustomPrice =
                                        rawCustomPrice.trim() === ""
                                          ? null
                                          : Number(rawCustomPrice);

                                      const fixedPfand = Number(
                                        product.pfandAmount || 0,
                                      );

                                      const normalTotal =
                                        product.price + fixedPfand;

                                      const dealerProductPrice =
                                        parsedCustomPrice === null ||
                                        !Number.isFinite(parsedCustomPrice)
                                          ? product.price
                                          : parsedCustomPrice;

                                      const dealerTotal =
                                        dealerProductPrice + fixedPfand;

                                      /*
                                       * Fiyat farkı sadece ürün fiyatına göre
                                       * hesaplanır. Pfand sabittir ve bayi özel
                                       * fiyatıyla değiştirilemez.
                                       */
                                      const difference =
                                        parsedCustomPrice === null ||
                                        !Number.isFinite(parsedCustomPrice)
                                          ? null
                                          : parsedCustomPrice - product.price;

                                      const categoryName =
                                        product.category.nameTr ||
                                        product.category.nameDe ||
                                        product.category.name ||
                                        "Diğer";

                                      const previousProduct =
                                        filteredProducts[productIndex - 1];

                                      const showCategoryHeader =
                                        productIndex === 0 ||
                                        previousProduct?.category.id !==
                                          product.category.id;

                                      const categoryProductCount =
                                        filteredProducts.filter(
                                          (filteredProduct) =>
                                            filteredProduct.category.id ===
                                            product.category.id,
                                        ).length;

                                      return (
                                        <div key={product.id}>
                                          {showCategoryHeader ? (
                                            <div
                                              style={getDealerPriceCategoryStyle(
                                                product.category.id,
                                              )}
                                              className="mb-3 mt-6 rounded-2xl border px-4 py-3 first:mt-0"
                                            >
                                              <div className="flex flex-wrap items-center justify-between gap-3">
                                                <div>
                                                  <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-80">
                                                    Ürün kategorisi
                                                  </p>

                                                  <h5 className="mt-0.5 text-lg font-black">
                                                    {categoryName}
                                                  </h5>
                                                </div>

                                                <span className="rounded-full border border-white/70 bg-white/65 px-3 py-1 text-xs font-black shadow-sm">
                                                  {categoryProductCount} ürün
                                                </span>
                                              </div>
                                            </div>
                                          ) : null}

                                          <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[minmax(220px,1fr)_190px_220px] xl:grid-cols-[minmax(280px,1fr)_220px_260px]">
                                            <div className="min-w-0">
                                              <p className="font-black text-slate-950">
                                                {product.nameTr ||
                                                  product.nameDe ||
                                                  product.name}
                                              </p>

                                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                                <span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-500">
                                                  {categoryName}
                                                </span>

                                                {product.packageInfo ? (
                                                  <span className="text-xs font-semibold text-slate-500">
                                                    {product.packageInfo}
                                                  </span>
                                                ) : null}
                                              </div>
                                            </div>

                                            <div className="rounded-lg bg-slate-50 px-3 py-2">
                                              <p className="text-[10px] font-black uppercase text-slate-400">
                                                Normal satış
                                              </p>

                                              <div className="mt-1 space-y-0.5 text-[11px]">
                                                <div className="flex justify-between gap-2 text-slate-500">
                                                  <span>{language === "de" ? "Produkt" : "Ürün"}</span>

                                                  <span className="font-bold">
                                                    {product.price.toLocaleString(
                                                      "de-DE",
                                                      {
                                                        style: "currency",
                                                        currency: "EUR",
                                                      },
                                                    )}
                                                  </span>
                                                </div>

                                                {fixedPfand > 0 ? (
                                                  <div className="flex justify-between gap-2 text-orange-600">
                                                    <span>{language === "de" ? "Pfand" : "Pfand"}</span>

                                                    <span className="font-bold">
                                                      {fixedPfand.toLocaleString(
                                                        "de-DE",
                                                        {
                                                          style: "currency",
                                                          currency: "EUR",
                                                        },
                                                      )}
                                                    </span>
                                                  </div>
                                                ) : null}

                                                <div className="flex justify-between gap-2 border-t border-slate-200 pt-1 text-slate-950">
                                                  <span className="font-black">
                                                    Toplam
                                                  </span>

                                                  <span className="font-black">
                                                    {normalTotal.toLocaleString(
                                                      "de-DE",
                                                      {
                                                        style: "currency",
                                                        currency: "EUR",
                                                      },
                                                    )}
                                                  </span>
                                                </div>
                                              </div>
                                            </div>

                                            <label className="block">
                                              <span className="text-[10px] font-black uppercase text-blue-700">
                                                Bayi ürün fiyatı
                                              </span>

                                              <p className="mt-0.5 text-[9px] font-bold text-slate-400">
                                                Pfand hariç
                                              </p>

                                              <div className="relative mt-1">
                                                <input
                                                  type="number"
                                                  min="0"
                                                  step="0.01"
                                                  value={rawCustomPrice}
                                                  onChange={(event) =>
                                                    setDealerPriceValues(
                                                      (current) => ({
                                                        ...current,
                                                        [product.id]:
                                                          event.target.value,
                                                      }),
                                                    )
                                                  }
                                                  placeholder={product.price.toFixed(
                                                    2,
                                                  )}
                                                  className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2 pr-9 font-bold outline-none focus:border-blue-200"
                                                />

                                                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                                                  €
                                                </span>
                                              </div>

                                              {fixedPfand > 0 ? (
                                                <div className="mt-2 rounded-lg bg-orange-50 px-2.5 py-2 text-[10px]">
                                                  <div className="flex justify-between gap-2 text-orange-700">
                                                    <span>{language === "de" ? "Festes Pfand" : "Sabit Pfand"}</span>

                                                    <span className="font-black">
                                                      {fixedPfand.toLocaleString(
                                                        "de-DE",
                                                        {
                                                          style: "currency",
                                                          currency: "EUR",
                                                        },
                                                      )}
                                                    </span>
                                                  </div>

                                                  <div className="mt-1 flex justify-between gap-2 border-t border-orange-100 pt-1 text-slate-950">
                                                    <span className="font-black">
                                                      Bayi toplamı
                                                    </span>

                                                    <span className="font-black">
                                                      {dealerTotal.toLocaleString(
                                                        "de-DE",
                                                        {
                                                          style: "currency",
                                                          currency: "EUR",
                                                        },
                                                      )}
                                                    </span>
                                                  </div>
                                                </div>
                                              ) : (
                                                <p className="mt-1 text-[10px] font-black text-blue-700">
                                                  Bayi toplamı:{" "}
                                                  {dealerTotal.toLocaleString(
                                                    "de-DE",
                                                    {
                                                      style: "currency",
                                                      currency: "EUR",
                                                    },
                                                  )}
                                                </p>
                                              )}

                                              <p
                                                className={`mt-1 text-[10px] font-bold ${
                                                  difference === null
                                                    ? "text-slate-400"
                                                    : difference < 0
                                                      ? "text-green-700"
                                                      : difference > 0
                                                        ? "text-red-600"
                                                        : "text-slate-500"
                                                }`}
                                              >
                                                {difference === null
                                                  ? t.useStandardPrice
                                                  : difference === 0
                                                    ? t.sameAsNormalPrice
                                                    : `${difference > 0 ? "+" : ""}${difference.toLocaleString(
                                                        "de-DE",
                                                        {
                                                          style: "currency",
                                                          currency: "EUR",
                                                        },
                                                      )} fark`}
                                              </p>
                                            </label>
                                          </div>
                                        </div>
                                      );
                                    },
                                  )}

                                {dealerPriceProducts.length === 0 ? (
                                  <div className="rounded-xl bg-white p-6 text-center font-bold text-slate-500">
                                    Aktif ürün bulunamadı.
                                  </div>
                                ) : null}
                              </div>

                              <button
                                type="button"
                                disabled={savingDealerPrices}
                                onClick={saveDealerPrices}
                                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-50 px-5 py-4 font-black text-slate-800 transition hover:bg-blue-700 disabled:opacity-50"
                              >
                                {savingDealerPrices ? (
                                  <>
                                    <Loader2
                                      size={18}
                                      className="animate-spin"
                                    />
                                    Fiyatlar kaydediliyor...
                                  </>
                                ) : (
                                  <>
                                    <BadgeEuro size={18} />
                                    Özel Fiyatları Kaydet
                                  </>
                                )}
                              </button>
                            </>
                          )}
                        </div>
                      ) : null}

                      {editingDealerId === dealer.id ? (
                        <div className="mt-5 rounded-2xl border border-orange-200 bg-orange-50 p-4 sm:p-5">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <h4 className="text-lg font-black text-slate-950">
                                Bayi Bilgilerini Düzenle
                              </h4>

                              <p className="mt-1 text-xs text-slate-500">
                                Bakiye ve özel fiyat kayıtları korunur.
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={closeDealerEdit}
                              className="flex items-center gap-1 rounded-lg border border-orange-200 bg-white px-3 py-2 text-xs font-black text-orange-600"
                            >
                              <X size={15} />
                              Kapat
                            </button>
                          </div>

                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <label className="block">
                              <span className="text-xs font-bold text-slate-600">
                                Bayi numarası *
                              </span>

                              <input
                                value={editForm.dealerNumber}
                                onChange={(event) =>
                                  updateDealerEditForm(
                                    "dealerNumber",
                                    event.target.value,
                                  )
                                }
                                className="mt-1 w-full rounded-xl border border-orange-200 bg-white px-3 py-2.5 outline-none focus:border-orange-500"
                              />
                            </label>

                            <label className="block">
                              <span className="text-xs font-bold text-slate-600">
                                Firma adı *
                              </span>

                              <input
                                value={editForm.companyName}
                                onChange={(event) =>
                                  updateDealerEditForm(
                                    "companyName",
                                    event.target.value,
                                  )
                                }
                                className="mt-1 w-full rounded-xl border border-orange-200 bg-white px-3 py-2.5 outline-none focus:border-orange-500"
                              />
                            </label>

                            <label className="block sm:col-span-2">
                              <span className="text-xs font-bold text-slate-600">
                                Yetkili kişi
                              </span>

                              <input
                                value={editForm.contactName}
                                onChange={(event) =>
                                  updateDealerEditForm(
                                    "contactName",
                                    event.target.value,
                                  )
                                }
                                className="mt-1 w-full rounded-xl border border-orange-200 bg-white px-3 py-2.5 outline-none focus:border-orange-500"
                              />
                            </label>

                            <input
                              value={editForm.firstName}
                              onChange={(event) =>
                                updateDealerEditForm(
                                  "firstName",
                                  event.target.value,
                                )
                              }
                              placeholder={t.firstName}
                              className="rounded-xl border border-orange-200 bg-white px-3 py-2.5 outline-none focus:border-orange-500"
                            />

                            <input
                              value={editForm.lastName}
                              onChange={(event) =>
                                updateDealerEditForm(
                                  "lastName",
                                  event.target.value,
                                )
                              }
                              placeholder={t.lastName}
                              className="rounded-xl border border-orange-200 bg-white px-3 py-2.5 outline-none focus:border-orange-500"
                            />

                            <label className="block">
                              <span className="text-xs font-bold text-slate-600">
                                E-posta *
                              </span>

                              <input
                                type="email"
                                value={editForm.email}
                                onChange={(event) =>
                                  updateDealerEditForm(
                                    "email",
                                    event.target.value,
                                  )
                                }
                                className="mt-1 w-full rounded-xl border border-orange-200 bg-white px-3 py-2.5 outline-none focus:border-orange-500"
                              />
                            </label>

                            <label className="block">
                              <span className="text-xs font-bold text-slate-600">
                                Telefon
                              </span>

                              <input
                                value={editForm.phone}
                                onChange={(event) =>
                                  updateDealerEditForm(
                                    "phone",
                                    event.target.value,
                                  )
                                }
                                className="mt-1 w-full rounded-xl border border-orange-200 bg-white px-3 py-2.5 outline-none focus:border-orange-500"
                              />
                            </label>

                            <label className="block">
                              <span className="text-xs font-bold text-slate-600">
                                Vergi numarası
                              </span>

                              <input
                                value={editForm.taxNumber}
                                onChange={(event) =>
                                  updateDealerEditForm(
                                    "taxNumber",
                                    event.target.value,
                                  )
                                }
                                className="mt-1 w-full rounded-xl border border-orange-200 bg-white px-3 py-2.5 outline-none focus:border-orange-500"
                              />
                            </label>

                            <label className="block">
                              <span className="text-xs font-bold text-slate-600">
                                Kredi limiti
                              </span>

                              <div className="relative mt-1">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={editForm.creditLimit}
                                  onChange={(event) =>
                                    updateDealerEditForm(
                                      "creditLimit",
                                      event.target.value,
                                    )
                                  }
                                  className="w-full rounded-xl border border-orange-200 bg-white px-3 py-2.5 pr-9 outline-none focus:border-orange-500"
                                />

                                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                                  €
                                </span>
                              </div>
                            </label>

                            <div className="grid gap-3 sm:col-span-2 sm:grid-cols-[1fr_110px]">
                              <input
                                value={editForm.street}
                                onChange={(event) =>
                                  updateDealerEditForm(
                                    "street",
                                    event.target.value,
                                  )
                                }
                                placeholder={t.street}
                                className="rounded-xl border border-orange-200 bg-white px-3 py-2.5 outline-none focus:border-orange-500"
                              />

                              <input
                                value={editForm.houseNumber}
                                onChange={(event) =>
                                  updateDealerEditForm(
                                    "houseNumber",
                                    event.target.value,
                                  )
                                }
                                placeholder={t.houseNumber}
                                className="rounded-xl border border-orange-200 bg-white px-3 py-2.5 outline-none focus:border-orange-500"
                              />
                            </div>

                            <input
                              value={editForm.postalCode}
                              onChange={(event) =>
                                updateDealerEditForm(
                                  "postalCode",
                                  event.target.value,
                                )
                              }
                              placeholder={t.postalCode}
                              className="rounded-xl border border-orange-200 bg-white px-3 py-2.5 outline-none focus:border-orange-500"
                            />

                            <input
                              value={editForm.city}
                              onChange={(event) =>
                                updateDealerEditForm("city", event.target.value)
                              }
                              placeholder={t.city}
                              className="rounded-xl border border-orange-200 bg-white px-3 py-2.5 outline-none focus:border-orange-500"
                            />

                            <input
                              value={editForm.country}
                              onChange={(event) =>
                                updateDealerEditForm(
                                  "country",
                                  event.target.value,
                                )
                              }
                              placeholder={t.country}
                              className="rounded-xl border border-orange-200 bg-white px-3 py-2.5 outline-none focus:border-orange-500 sm:col-span-2"
                            />

                            <textarea
                              rows={3}
                              value={editForm.note}
                              onChange={(event) =>
                                updateDealerEditForm("note", event.target.value)
                              }
                              placeholder={t.note}
                              className="resize-y rounded-xl border border-orange-200 bg-white px-3 py-2.5 outline-none focus:border-orange-500 sm:col-span-2"
                            />

                            <button
                              type="button"
                              onClick={() =>
                                updateDealerEditForm(
                                  "isActive",
                                  !editForm.isActive,
                                )
                              }
                              className={`flex items-center justify-between rounded-xl border p-3 text-left sm:col-span-2 ${
                                editForm.isActive
                                  ? "border-green-300 bg-green-50"
                                  : "border-red-200 bg-red-50"
                              }`}
                            >
                              <span>
                                <span className="block text-sm font-black text-slate-900">
                                  Bayi hesabı
                                </span>

                                <span className="mt-0.5 block text-xs text-slate-500">
                                  {editForm.isActive
                                    ? "Bayi sisteme giriş yapabilir."
                                    : "Bayi hesabı kapalı olacaktır."}
                                </span>
                              </span>

                              <span
                                className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                                  editForm.isActive
                                    ? "bg-green-500"
                                    : "bg-slate-300"
                                }`}
                              >
                                <span
                                  className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
                                    editForm.isActive ? "left-6" : "left-1"
                                  }`}
                                />
                              </span>
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={saveDealerEdit}
                            disabled={editSaving}
                            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3.5 font-black text-white transition hover:bg-orange-600 disabled:opacity-50"
                          >
                            {editSaving ? (
                              <Loader2 size={18} className="animate-spin" />
                            ) : (
                              <Save size={18} />
                            )}

                            {editSaving
                              ? "Kaydediliyor..."
                              : t.saveChanges}
                          </button>
                        </div>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
