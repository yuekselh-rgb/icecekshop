"use client";

import {
  ArrowLeft,
  Boxes,
  ClipboardList,
  Layers3,
  Loader2,
  PackagePlus,
  Save,
  ShieldCheck,
  ShoppingBasket,
  Tags,
  Trash2,
  UserRound,
  Users,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import type { Language } from "@/i18n/translations";

type PermissionKey =
  | "viewProducts"
  | "createProduct"
  | "updateProduct"
  | "deleteProduct"
  | "changePrice"
  | "manageOffers"
  | "viewCategories"
  | "createCategory"
  | "updateCategory"
  | "deleteCategory"
  | "viewStock"
  | "addStock"
  | "reduceStock"
  | "deleteWarehouseLog"
  | "viewDriverStock"
  | "manageDriverStock"
  | "viewOrders"
  | "updateOrder"
  | "approveCustomerPayment"
  | "deleteOrder"
  | "printOrder"
  | "viewCustomers"
  | "managePfand"
  | "viewDealerAccounts"
  | "manageDealerPrices"
  | "updateDealer"
  | "createDealer"
  | "viewDealers"
  | "makeBarSale"
  | "viewBarSalesReport"
  | "viewOrderReport"
  | "viewBarCash"
  | "createBarCashIncome"
  | "createBarCashExpense"
  | "deleteBarCashMovement"
  | "viewCashReport"
  | "createCashHandover";

type Permissions = Record<PermissionKey, boolean>;

type AdminResponse = {
  admin: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    adminPermission: Partial<Permissions> | null;
  };
};

const defaultPermissions: Permissions = {
  viewProducts: true,
  createProduct: false,
  updateProduct: false,
  deleteProduct: false,
  changePrice: false,
  manageOffers: false,

  viewCategories: true,
  createCategory: false,
  updateCategory: false,
  deleteCategory: false,

  viewStock: true,
  addStock: false,
  reduceStock: false,
  deleteWarehouseLog: false,

  viewDriverStock: false,
  manageDriverStock: false,

  viewOrders: true,
  updateOrder: false,
  approveCustomerPayment: false,
  deleteOrder: false,
  printOrder: false,

  viewCustomers: false,
  managePfand: false,

  viewDealers: false,
  createDealer: false,
  updateDealer: false,
  manageDealerPrices: false,
  viewDealerAccounts: false,

  makeBarSale: false,
  viewBarSalesReport: false,
  viewOrderReport: false,

  viewBarCash: false,
  createBarCashIncome: false,
  createBarCashExpense: false,
  deleteBarCashMovement: false,
  viewCashReport: false,
  createCashHandover: false,
};

function getPermissionGroups(language: Language) {
  return language === "de"
    ? [
        {
          title: "Produktverwaltung",
          description:
            "Berechtigungen zum Hinzufügen, Bearbeiten, Bepreisen und Löschen von Produkten.",
          icon: ShoppingBasket,
          permissions: [
            ["viewProducts", "Produkte anzeigen"],
            ["createProduct", "Produkt hinzufügen"],
            ["updateProduct", "Produktdaten bearbeiten"],
            ["changePrice", "Preis ändern"],
            ["manageOffers", "Aktionsprodukte verwalten"],
            ["deleteProduct", "Produkt löschen"],
          ] satisfies [PermissionKey, string][],
        },
        {
          title: "Kategorienverwaltung",
          description:
            "Berechtigungen zum Hinzufügen, Ändern und Löschen von Kategorien.",
          icon: Tags,
          permissions: [
            ["viewCategories", "Kategorien anzeigen"],
            ["createCategory", "Kategorie hinzufügen"],
            ["updateCategory", "Kategorie bearbeiten"],
            ["deleteCategory", "Kategorie löschen"],
          ] satisfies [PermissionKey, string][],
        },
        {
          title: "Lagerverwaltung",
          description: "Lagerbestände anzeigen und ändern.",
          icon: Boxes,
          permissions: [
            ["viewStock", "Lagerbestand anzeigen"],
            ["addStock", "Lagerbestand hinzufügen"],
            ["reduceStock", "Lagerbestand reduzieren"],
          ] satisfies [PermissionKey, string][],
        },
        {
          title: "Fahrzeugbestand-Verwaltung",
          description:
            "Berechtigungen zum Beladen der Fahrer mit Produkten, Anzeigen des Fahrzeugbestands und Korrigieren des Bestands.",
          icon: PackagePlus,
          permissions: [
            ["viewDriverStock", "Fahrzeugbestände anzeigen"],
            ["manageDriverStock", "Fahrzeugbestand beladen und korrigieren"],
          ] satisfies [PermissionKey, string][],
        },
        {
          title: "Bestellverwaltung",
          description: "Bestellungen anzeigen und bearbeiten.",
          icon: ClipboardList,
          permissions: [
            ["viewOrders", "Bestellungen anzeigen"],
            ["updateOrder", "Bestellstatus ändern"],
            ["approveCustomerPayment", "Kundenzahlung bestätigen"],
            ["printOrder", "Bestellung drucken"],
            ["deleteOrder", "Bestellung löschen"],
          ] satisfies [PermissionKey, string][],
        },
        {
          title: "Barverkauf",
          description:
            "Berechtigungen für den Barverkauf und den Barverkaufsbericht.",
          icon: ShoppingBasket,
          permissions: [
            ["makeBarSale", "Barverkauf durchführen"],
            ["viewBarSalesReport", "Barverkaufsbericht anzeigen"],
          ] satisfies [PermissionKey, string][],
        },
        {
          title: "Barkasse",
          description:
            "Barkasse anzeigen sowie Ein- und Auszahlungen vornehmen.",
          icon: WalletCards,
          permissions: [
            ["viewBarCash", "Barkasse anzeigen"],
            ["createBarCashIncome", "Manuelle Einzahlung in die Kasse vornehmen"],
            ["createBarCashExpense", "Auszahlung aus der Kasse vornehmen"],
            ["deleteBarCashMovement", "Kassenbewegung löschen"],
            ["viewCashReport", "Kassenbericht anzeigen"],
            ["createCashHandover", "Kassenübergabe erfassen (auch ohne Kassenzugriff)"],
          ] satisfies [PermissionKey, string][],
        },
        {
          title: "Berichte",
          description: "Bestell- und Zahlungsberichte anzeigen.",
          icon: WalletCards,
          permissions: [
            ["viewOrderReport", "Bestell- und Zahlungsbericht anzeigen"],
          ] satisfies [PermissionKey, string][],
        },
        {
          title: "Händlerverwaltung",
          description:
            "Händler, Händlerkonten und händlerspezifische Produktpreise verwalten.",
          icon: Users,
          permissions: [
            ["viewDealers", "Händler anzeigen"],
            ["createDealer", "Neuen Händler anlegen"],
            ["updateDealer", "Händlerdaten bearbeiten"],
            ["manageDealerPrices", "Händlerspezifische Preise ändern"],
            ["viewDealerAccounts", "Händlerkonten und Salden anzeigen"],
          ] satisfies [PermissionKey, string][],
        },
        {
          title: "Kunden und Pfand",
          description: "Kundendaten und Pfandrückgaben.",
          icon: Users,
          permissions: [
            ["viewCustomers", "Kunden anzeigen"],
            ["managePfand", "Pfandrückgaben verwalten"],
          ] satisfies [PermissionKey, string][],
        },
      ]
    : [
        {
          title: "Ürün Yönetimi",
          description: "Ürün ekleme, düzenleme, fiyat ve silme yetkileri.",
          icon: ShoppingBasket,
          permissions: [
            ["viewProducts", "Ürünleri görüntüleme"],
            ["createProduct", "Ürün ekleme"],
            ["updateProduct", "Ürün bilgilerini düzenleme"],
            ["changePrice", "Fiyat değiştirme"],
            ["manageOffers", "Kampanyalı ürünleri yönetme"],
            ["deleteProduct", "Ürün silme"],
          ] satisfies [PermissionKey, string][],
        },
        {
          title: "Kategori Yönetimi",
          description: "Kategori ekleme, değiştirme ve silme yetkileri.",
          icon: Tags,
          permissions: [
            ["viewCategories", "Kategorileri görüntüleme"],
            ["createCategory", "Kategori ekleme"],
            ["updateCategory", "Kategori düzenleme"],
            ["deleteCategory", "Kategori silme"],
          ] satisfies [PermissionKey, string][],
        },
        {
          title: "Stok Yönetimi",
          description: "Stok miktarlarını görüntüleme ve değiştirme.",
          icon: Boxes,
          permissions: [
            ["viewStock", "Stokları görüntüleme"],
            ["addStock", "Stok ekleme"],
            ["reduceStock", "Stok azaltma"],
          ] satisfies [PermissionKey, string][],
        },
        {
          title: "Şoför Stok Yönetimi",
          description:
            "Şoförlere ürün yükleme, araç stoğunu görüntüleme ve stok düzeltme yetkileri.",
          icon: PackagePlus,
          permissions: [
            ["viewDriverStock", "Şoför stoklarını görüntüleme"],
            ["manageDriverStock", "Şoföre stok yükleme ve düzeltme"],
          ] satisfies [PermissionKey, string][],
        },
        {
          title: "Sipariş Yönetimi",
          description: "Siparişleri görüntüleme ve işlem yapma.",
          icon: ClipboardList,
          permissions: [
            ["viewOrders", "Siparişleri görüntüleme"],
            ["updateOrder", "Sipariş durumunu değiştirme"],
            ["approveCustomerPayment", "Müşteri tahsilatını onaylama"],
            ["printOrder", "Sipariş yazdırma"],
            ["deleteOrder", "Sipariş silme"],
          ] satisfies [PermissionKey, string][],
        },
        {
          title: "Bar Satışı",
          description: "Bar satış işlemi ve bar satış raporu yetkileri.",
          icon: ShoppingBasket,
          permissions: [
            ["makeBarSale", "Bar satışı yapma"],
            ["viewBarSalesReport", "Bar satış raporunu görüntüleme"],
          ] satisfies [PermissionKey, string][],
        },
        {
          title: "Bar Kasası",
          description:
            "Bar kasasını görüntüleme, para girişi ve para çıkışı işlemleri.",
          icon: WalletCards,
          permissions: [
            ["viewBarCash", "Bar kasasını görüntüleme"],
            ["createBarCashIncome", "Kasaya manuel para girişi yapma"],
            ["createBarCashExpense", "Kasadan para çıkışı yapma"],
            ["deleteBarCashMovement", "Kasa hareketini silme"],
            ["viewCashReport", "Kasa raporunu görüntüleme"],
            ["createCashHandover", "Kasa devri kaydetme (kasa erişimi olmadan da)"],
          ] satisfies [PermissionKey, string][],
        },
        {
          title: "Raporlar",
          description: "Sipariş ve tahsilat raporlarını görüntüleme.",
          icon: WalletCards,
          permissions: [
            ["viewOrderReport", "Sipariş ve tahsilat raporunu görüntüleme"],
          ] satisfies [PermissionKey, string][],
        },
        {
          title: "Bayi Yönetimi",
          description:
            "Bayileri, bayi hesaplarını ve bayiye özel ürün fiyatlarını yönetme.",
          icon: Users,
          permissions: [
            ["viewDealers", "Bayileri görüntüleme"],
            ["createDealer", "Yeni bayi oluşturma"],
            ["updateDealer", "Bayi bilgilerini düzenleme"],
            ["manageDealerPrices", "Bayi özel fiyatlarını değiştirme"],
            [
              "viewDealerAccounts",
              "Bayi hesap ve bakiye bilgilerini görüntüleme",
            ],
          ] satisfies [PermissionKey, string][],
        },
        {
          title: "Müşteri ve Pfand",
          description: "Müşteri bilgileri ve Pfand iadeleri.",
          icon: Users,
          permissions: [
            ["viewCustomers", "Müşterileri görüntüleme"],
            ["managePfand", "Pfand iadelerini yönetme"],
          ] satisfies [PermissionKey, string][],
        },
      ];
}

export default function AdminPermissionsPage() {
  const { language } = useLanguage();

  const params = useParams<{ id: string }>();

  const [admin, setAdmin] = useState<AdminResponse["admin"] | null>(null);

  const [permissions, setPermissions] =
    useState<Permissions>(defaultPermissions);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const enabledCount = useMemo(
    () => Object.values(permissions).filter(Boolean).length,
    [permissions],
  );

  const permissionGroups = useMemo(
    () => getPermissionGroups(language),
    [language],
  );

  useEffect(() => {
    async function loadPermissions() {
      try {
        const response = await fetch(
          `/api/super-admin/admins/${params.id}/permissions`,
        );

        const data: AdminResponse & { error?: string } = await response.json();

        if (!response.ok) {
          setError(
            data.error ||
              (language === "de"
                ? "Admin-Berechtigungen konnten nicht geladen werden."
                : "Admin yetkileri yüklenemedi."),
          );
          return;
        }

        setAdmin(data.admin);

        setPermissions({
          ...defaultPermissions,
          ...(data.admin.adminPermission || {}),
        });
      } catch {
        setError(
          language === "de"
            ? "Admin-Berechtigungen konnten nicht geladen werden."
            : "Admin yetkileri yüklenemedi.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadPermissions();
  }, [params.id]);

  function togglePermission(key: PermissionKey) {
    setSuccess("");

    setPermissions((current) => {
      const next: Permissions = {
        ...current,
        [key]: !current[key],
      };

      /*
       * Bar satışı için ürün, kategori ve stok listelerine
       * okuma erişimi gereklidir.
       */
      if (key === "makeBarSale" && next.makeBarSale) {
        next.viewProducts = true;
        next.viewCategories = true;
        next.viewStock = true;
      }

      if (key === "viewProducts" && !next.viewProducts) {
        next.createProduct = false;
        next.updateProduct = false;
        next.deleteProduct = false;
        next.changePrice = false;
        next.manageOffers = false;
        next.makeBarSale = false;
      }

      if (key === "viewCategories" && !next.viewCategories) {
        next.createCategory = false;
        next.updateCategory = false;
        next.deleteCategory = false;
        next.makeBarSale = false;
      }

      if (key === "viewStock" && !next.viewStock) {
        next.addStock = false;
        next.reduceStock = false;
        next.makeBarSale = false;
        next.manageDriverStock = false;
      }

      if (key === "manageDriverStock" && next.manageDriverStock) {
        next.viewDriverStock = true;
        next.viewProducts = true;
        next.viewStock = true;
      }

      if (key === "viewDriverStock" && !next.viewDriverStock) {
        next.manageDriverStock = false;
      }

      if (key === "viewOrders" && !next.viewOrders) {
        next.updateOrder = false;
        next.approveCustomerPayment = false;
        next.deleteOrder = false;
        next.printOrder = false;
        next.viewOrderReport = false;
      }

      if (
        [
          "createBarCashIncome",
          "createBarCashExpense",
          "deleteBarCashMovement",
        ].includes(key) &&
        next[key]
      ) {
        next.viewBarCash = true;
      }

      if (key === "viewBarCash" && !next.viewBarCash) {
        next.createBarCashIncome = false;
        next.createBarCashExpense = false;
        next.deleteBarCashMovement = false;
      }

      if (
        [
          "createDealer",
          "updateDealer",
          "manageDealerPrices",
          "viewDealerAccounts",
        ].includes(key) &&
        next[key]
      ) {
        next.viewDealers = true;
      }

      if (key === "viewDealers" && !next.viewDealers) {
        next.createDealer = false;
        next.updateDealer = false;
        next.manageDealerPrices = false;
        next.viewDealerAccounts = false;
      }

      /*
       * Alt işlem yetkisi açılırsa gerekli ana görüntüleme
       * yetkisi de otomatik açılır.
       */
      if (
        [
          "createProduct",
          "updateProduct",
          "deleteProduct",
          "changePrice",
          "manageOffers",
        ].includes(key) &&
        next[key]
      ) {
        next.viewProducts = true;
      }

      if (
        ["createCategory", "updateCategory", "deleteCategory"].includes(key) &&
        next[key]
      ) {
        next.viewCategories = true;
      }

      if (["addStock", "reduceStock"].includes(key) && next[key]) {
        next.viewStock = true;
      }

      if (
        [
          "updateOrder",
          "approveCustomerPayment",
          "deleteOrder",
          "printOrder",
          "viewOrderReport",
        ].includes(key) &&
        next[key]
      ) {
        next.viewOrders = true;
      }

      return next;
    });
  }

  function enableAll() {
    setSuccess("");

    setPermissions(
      Object.fromEntries(
        Object.keys(defaultPermissions).map((key) => [key, true]),
      ) as Permissions,
    );
  }

  function disableAll() {
    setSuccess("");

    setPermissions(
      Object.fromEntries(
        Object.keys(defaultPermissions).map((key) => [key, false]),
      ) as Permissions,
    );
  }

  async function savePermissions() {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `/api/super-admin/admins/${params.id}/permissions`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(permissions),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            (language === "de"
              ? "Berechtigungen konnten nicht gespeichert werden."
              : "Yetkiler kaydedilemedi."),
        );
        return;
      }

      setSuccess(
        language === "de"
          ? "Admin-Berechtigungen wurden erfolgreich aktualisiert."
          : "Admin yetkileri başarıyla güncellendi.",
      );
    } catch {
      setError(
        language === "de"
          ? "Berechtigungen konnten nicht gespeichert werden."
          : "Yetkiler kaydedilemedi.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 font-bold text-slate-600">
          <Loader2 className="animate-spin" />
          {language === "de"
            ? "Berechtigungen werden geladen..."
            : "Yetkiler yükleniyor..."}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl">
      <Link
          href="/super-admin/admins"
          className="inline-flex items-center gap-2 font-bold text-slate-600 transition hover:text-orange-500"
        >
          <ArrowLeft size={18} />
          {language === "de" ? "Administratorverwaltung" : "Admin Yönetimi"}
        </Link>

        <section className="mt-6 rounded-[32px] bg-slate-950 p-7 text-white sm:p-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500">
                <ShieldCheck size={28} />
              </div>

              <h1 className="mt-5 text-4xl font-black">{language==="de"?"Administratorberechtigungen":"Admin Yetkileri"}</h1>

              <p className="mt-3 text-slate-400">
                {language==="de"?"Legen Sie fest, welche Aktionen der Administrator im Panel ausführen darf.":"Adminin panelde hangi işlemleri yapabileceğini belirleyin."}
              </p>
            </div>

            <div className="rounded-2xl bg-white/10 p-5">
              <div className="flex items-center gap-3">
                <UserRound className="text-orange-400" />

                <div>
                  <p className="font-black">
                    {admin?.firstName} {admin?.lastName}
                  </p>

                  <p className="text-sm text-slate-400">{admin?.email}</p>
                </div>
              </div>

              <p className="mt-4 text-sm text-slate-300">
                {language === "de"
                  ? `${enabledCount} / ${Object.keys(permissions).length} Berechtigungen aktiv`
                  : `${enabledCount} / ${Object.keys(permissions).length} yetki açık`}
              </p>
            </div>
          </div>
        </section>

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={enableAll}
            className="rounded-xl bg-green-600 px-5 py-3 font-bold text-white transition hover:bg-green-700"
          >
            {language === "de" ? "Alle aktivieren" : "Tümünü Aç"}
          </button>

          <button
            type="button"
            onClick={disableAll}
            className="rounded-xl bg-white px-5 py-3 font-bold text-slate-700 shadow-sm transition hover:text-red-500"
          >
            {language === "de" ? "Alle deaktivieren" : "Tümünü Kapat"}
          </button>
        </div>

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

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {permissionGroups.map((group) => {
            const Icon = group.icon;

            return (
              <section
                key={group.title}
                className="rounded-[28px] bg-white p-6 shadow-sm"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                    <Icon size={23} />
                  </div>

                  <div>
                    <h2 className="text-xl font-black text-slate-950">
                      {group.title}
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      {group.description}
                    </p>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  {group.permissions.map(([key, label]) => {
                    const enabled = permissions[key];

                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => togglePermission(key)}
                        className="flex w-full items-center justify-between gap-4 rounded-2xl border border-slate-200 p-4 text-left transition hover:border-orange-200"
                      >
                        <span className="font-bold text-slate-800">
                          {label}
                        </span>

                        <span
                          className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                            enabled ? "bg-green-500" : "bg-slate-300"
                          }`}
                        >
                          <span
                            className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
                              enabled ? "left-6" : "left-1"
                            }`}
                          />
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        <div className="sticky bottom-4 mt-8 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur">
          <button
            type="button"
            onClick={savePermissions}
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 py-4 font-black text-white transition hover:bg-orange-600 disabled:bg-orange-300 sm:ml-auto sm:w-auto"
          >
            {saving ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                {language === "de" ? "Wird gespeichert..." : "Kaydediliyor..."}
              </>
            ) : (
              <>
                <Save size={20} />
                {language === "de" ? "Berechtigungen speichern" : "Yetkileri Kaydet"}
              </>
            )}
          </button>
        </div>
      </div>
  );
}
