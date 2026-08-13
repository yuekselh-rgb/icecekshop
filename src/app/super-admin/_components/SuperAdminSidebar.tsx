"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes,
  House,
  LayoutDashboard,
  Lock,
  Menu,
  Package,
  Settings,
  ShieldCheck,
  Store,
  Trash2,
  Truck,
  Users,
} from "lucide-react";

import CompanyBrand from "@/components/company/CompanyBrand";
import LogoutButton from "@/components/LogoutButton";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useLanguage } from "@/context/LanguageContext";

type NavItem = {
  href: string;
  label: { de: string; tr: string };
  icon: React.ComponentType<{ size?: number }>;
};

const navItems: NavItem[] = [
  {
    href: "/super-admin",
    label: { de: "Dashboard", tr: "Panel" },
    icon: LayoutDashboard,
  },
  {
    href: "/super-admin/admins",
    label: { de: "Admin-Verwaltung", tr: "Admin Yönetimi" },
    icon: ShieldCheck,
  },
  {
    href: "/super-admin/customers",
    label: { de: "Kundenverwaltung", tr: "Müşteri Yönetimi" },
    icon: Users,
  },
  {
    href: "/super-admin/drivers",
    label: { de: "Fahrerverwaltung", tr: "Şoför Yönetimi" },
    icon: Truck,
  },
  {
    href: "/super-admin/dealers",
    label: { de: "Händlerverwaltung", tr: "Bayi Yönetimi" },
    icon: Store,
  },
  {
    href: "/super-admin/orders",
    label: { de: "Alle Bestellungen", tr: "Tüm Siparişler" },
    icon: Package,
  },
  {
    href: "/super-admin/stock",
    label: { de: "Lagerverwaltung", tr: "Stok Yönetimi" },
    icon: Boxes,
  },
  {
    href: "/super-admin/trash",
    label: { de: "Papierkorb", tr: "Çöp Kutusu" },
    icon: Trash2,
  },
  {
    href: "/super-admin/settings",
    label: { de: "Einstellungen", tr: "Ayarlar" },
    icon: Settings,
  },
  {
    href: "/super-admin/change-password",
    label: { de: "Passwort ändern", tr: "Şifre Değiştir" },
    icon: Lock,
  },
];

function isActiveHref(pathname: string, href: string) {
  if (href === "/super-admin") {
    return pathname === "/super-admin";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLinks({
  pathname,
  language,
  onNavigate,
}: {
  pathname: string;
  language: "de" | "tr";
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActiveHref(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition ${
              active
                ? "bg-orange-500 text-white"
                : "text-slate-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Icon size={18} />
            {item.label[language]}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarBody({
  pathname,
  language,
  setLanguage,
  t,
  onNavigate,
}: {
  pathname: string;
  language: "de" | "tr";
  setLanguage: (language: "de" | "tr") => void;
  t: { eyebrow: string; shop: string; logout: string };
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col bg-slate-950 text-white">
      <div className="border-b border-white/10 px-5 py-5">
        <div className="w-32">
          <CompanyBrand variant="footer" />
        </div>

        <p className="mt-4 text-xs font-black uppercase tracking-wide text-orange-400">
          {t.eyebrow}
        </p>
      </div>

      <NavLinks pathname={pathname} language={language} onNavigate={onNavigate} />

      <div className="space-y-3 border-t border-white/10 p-4">
        <Link
          href="/"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-300 transition hover:bg-white/10 hover:text-white"
        >
          <House size={18} />
          {t.shop}
        </Link>

        <div className="flex items-center rounded-full border border-white/15 p-1">
          <button
            type="button"
            onClick={() => setLanguage("de")}
            className={`flex-1 rounded-full py-1.5 text-xs font-black transition ${
              language === "de"
                ? "bg-white text-slate-950"
                : "text-slate-300 hover:text-white"
            }`}
          >
            DE
          </button>

          <button
            type="button"
            onClick={() => setLanguage("tr")}
            className={`flex-1 rounded-full py-1.5 text-xs font-black transition ${
              language === "tr"
                ? "bg-white text-slate-950"
                : "text-slate-300 hover:text-white"
            }`}
          >
            TR
          </button>
        </div>

        <LogoutButton label={t.logout} variant="dark" redirectTo="/login" />
      </div>
    </div>
  );
}

export default function SuperAdminSidebar({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const { language, setLanguage } = useLanguage();

  const t = {
    eyebrow: language === "de" ? "Super-Admin" : "Süper Admin",
    shop: language === "de" ? "Zum Shop" : "Mağazaya Git",
    logout: language === "de" ? "Abmelden" : "Çıkış Yap",
    menu: language === "de" ? "Menü" : "Menü",
  };

  return (
    <div className="min-h-screen lg:flex lg:h-screen">
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="fixed inset-y-0 left-0 w-64">
          <SidebarBody
            pathname={pathname}
            language={language}
            setLanguage={setLanguage}
            t={t}
          />
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col lg:h-screen lg:min-h-0">
        <div className="flex items-center justify-between border-b border-white/10 bg-slate-950 px-4 py-3 lg:hidden">
          <div className="w-24">
            <CompanyBrand variant="footer" />
          </div>

          <Sheet>
            <SheetTrigger
              render={
                <button
                  type="button"
                  aria-label={t.menu}
                  className="rounded-full border border-white/20 p-2.5 text-white transition hover:border-orange-400 hover:text-orange-400"
                />
              }
            >
              <Menu size={20} />
            </SheetTrigger>

            <SheetContent
              side="left"
              className="top-0 h-screen w-[300px] border-r-0 bg-transparent p-0"
              showCloseButton={false}
            >
              <SidebarBody
                pathname={pathname}
                language={language}
                setLanguage={setLanguage}
                t={t}
              />
            </SheetContent>
          </Sheet>
        </div>

        <main className="flex-1 overflow-y-auto bg-slate-100 p-6 lg:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}
