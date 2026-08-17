import { getAdminWithPermissions } from "@/lib/admin-auth";
import {
  House,
  ArrowLeft,
  Boxes,
  ClipboardList,
  FileBarChart,
  Lock,
  PackageSearch,
  RotateCcw,
  ShoppingBasket,
  ReceiptText,
  Truck,
  Users,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import AdminHero from "./_components/AdminHero";
import LogoutButton from "@/components/LogoutButton";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const admin = await getAdminWithPermissions();

  if (!admin) {
    redirect("/login");
  }

  const fullName = [admin.user.firstName, admin.user.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  const adminName = fullName || admin.user.companyName || admin.user.email;

  const headersList =
    await (await import("next/headers")).headers();

  const lang =
    headersList.get("accept-language")?.startsWith("de")
      ? "de"
      : "tr";

  const cards = [
    {
      title: lang === "de" ? "Barverkauf" : "Bar Satışı",
      description: lang === "de" ? "Direkten Verkauf im Geschäft durchführen." : "Mağazada doğrudan ürün satışı oluşturun.",
      href: "/admin/bar-sales",
      icon: ShoppingBasket,
      permission: admin.permissions.makeBarSale,
      featured: true,
    },
    {
      title: lang === "de" ? "Barverkaufsbericht" : "Bar Satış Raporu",
      description:
        lang === "de" ? "Barverkäufe nach Personal, Produkt und Zahlungsart anzeigen." : "Personel, ürün ve ödeme bazında bar satışlarını görüntüleyin.",
      href: "/admin/bar-sales-report",
      icon: ReceiptText,
      permission: admin.permissions.viewBarSalesReport,
      featured: false,
    },
    {
      title: lang === "de" ? "Kasse" : "Gerçek Kasa",
      description:
        lang === "de" ? "Kassenbewegungen und aktuellen Bestand verwalten." : "Fiziksel kasanın giriş, çıkış ve güncel bakiyesini yönetin.",
      href: "/admin/bar-cash",
      icon: WalletCards,
      permission: admin.permissions.viewBarCash,
      featured: false,
    },
    {
      title: lang === "de" ? "Kassenbericht" : "Kasa Raporu",
      description:
        lang === "de" ? "Z-Bericht: Einnahmen, Ausgaben und offene Rechnungen." : "Z Raporu: Gelir, gider ve veresiye özeti.",
      href: "/admin/cash-report",
      icon: FileBarChart,
      permission: admin.permissions.viewCashReport,
      featured: false,
    },
    {
      title: lang === "de" ? "Fahrerlager" : "Şoför Stokları",
      description:
        lang === "de" ? "Fahrerbestand und Bewegungen verwalten." : "Şoförlere mal yükleyin, araç stoklarını ve satış hareketlerini yönetin.",
      href: "/admin/driver-stock",
      icon: Truck,
      permission: admin.permissions.viewDriverStock,
      featured: false,
    },
    {
      title: lang === "de" ? "Bestellungen" : "Siparişler",
      description: lang === "de" ? "Neue und vergangene Bestellungen verwalten." : "Yeni ve geçmiş siparişleri yönetin.",
      href: "/admin/orders",
      icon: ClipboardList,
      permission: admin.permissions.viewOrders,
      featured: false,
    },
    {
      title: lang === "de" ? "Produkte" : "Ürünler",
      description: lang === "de" ? "Produkte und Preise verwalten." : "Ürünleri ve fiyat bilgilerini yönetin.",
      href: "/admin/products",
      icon: PackageSearch,
      permission: admin.permissions.viewProducts,
      featured: false,
    },
    {
      title: lang === "de" ? "Lagerverwaltung" : "Stok Yönetimi",
      description: lang === "de" ? "Produktbestände verwalten." : "Ürün stoklarını görüntüleyin ve düzenleyin.",
      href: "/admin/stock",
      icon: Boxes,
      permission: admin.permissions.viewStock,
      featured: false,
    },
    {
      title: lang === "de" ? "Kunden" : "Müşteriler",
      description: lang === "de" ? "Registrierte Kunden anzeigen." : "Kayıtlı müşteri hesaplarını görüntüleyin.",
      href: "/admin/customers",
      icon: Users,
      permission: admin.permissions.viewCustomers,
      featured: false,
    },
    {
      title: lang === "de" ? "Pfandrückgaben" : "Pfand İadeleri",
      description: lang === "de" ? "Pfandrückgaben verwalten." : "Pfand iadelerini görüntüleyin ve yönetin.",
      href: "/admin/pfand",
      icon: RotateCcw,
      permission: admin.permissions.managePfand,
      featured: false,
    },
    {
      title: lang === "de" ? "Passwort ändern" : "Şifre Değiştir",
      description:
        lang === "de" ? "Ihr eigenes Passwort ändern." : "Kendi şifrenizi değiştirin.",
      href: "/admin/change-password",
      icon: Lock,
      permission: true,
      featured: false,
    },
  ].filter((card) => card.permission);

  return (
    <main className="min-h-screen bg-slate-100 p-6 lg:p-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-4 flex justify-end gap-3">
          {admin.user.role === "SUPER_ADMIN" ||
          admin.user.role === "PLATFORM_OWNER" ? (
            <Link
              href="/super-admin"
              className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 font-semibold text-white shadow transition hover:bg-orange-600"
            >
              <ArrowLeft size={18} />
              {lang === "de" ? "Zurück zu Super-Admin" : "Süper Admin'e Dön"}
            </Link>
          ) : null}

          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 font-semibold text-slate-900 shadow transition hover:bg-slate-100"
          >
            <House size={18} />
            Ana Sayfa
          </Link>

          <LogoutButton
            label={lang === "de" ? "Abmelden" : "Çıkış Yap"}
          />
        </div>

        <AdminHero adminName={adminName} />


        

        {cards.length === 0 ? (
          <section className="mt-8 rounded-3xl bg-white p-10 text-center">
            <h2 className="text-2xl font-black text-slate-950">
              {lang === "de" ? "Keine Berechtigung" : "Yetkiniz bulunmuyor"}
            </h2>

            <p className="mt-3 text-slate-500">
              {lang === "de" ? "Ihnen wurde noch keine Berechtigung durch den Super-Admin erteilt." : "Super Admin tarafından henüz herhangi bir panel yetkisi verilmemiş."}
            </p>
          </section>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((card) => {
              const Icon = card.icon;

              return (
                <Link
                  key={card.href}
                  href={card.href}
                  className={`group rounded-3xl p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${
                    card.featured ? "bg-orange-500 text-white" : "bg-white"
                  }`}
                >
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl transition ${
                      card.featured
                        ? "bg-white/20 text-white"
                        : "bg-orange-50 text-orange-500 group-hover:bg-orange-500 group-hover:text-white"
                    }`}
                  >
                    <Icon size={23} />
                  </div>

                  <h2
                    className={`mt-5 text-xl font-black ${
                      card.featured ? "text-white" : "text-slate-950"
                    }`}
                  >
                    {card.title}
                  </h2>

                  <p
                    className={`mt-2 text-sm leading-6 ${
                      card.featured ? "text-orange-50" : "text-slate-500"
                    }`}
                  >
                    {card.description}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
