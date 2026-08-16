"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Boxes,
  ChevronLeft,
  ChevronRight,
  House,
  LayoutDashboard,
  Lock,
  Menu,
  Package,
  Settings,
  Shield,
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
    href: "/admin",
    label: { de: "Zum Admin-Panel", tr: "Admin Paneline Git" },
    icon: Shield,
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

const SIDEBAR_COLLAPSED_KEY = "super-admin-sidebar-collapsed";

function isActiveHref(pathname: string, href: string) {
  if (href === "/super-admin") {
    return pathname === "/super-admin";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLinks({
  pathname,
  language,
  collapsed = false,
  onNavigate,
}: {
  pathname: string;
  language: "de" | "tr";
  collapsed?: boolean;
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
            title={collapsed ? item.label[language] : undefined}
            className={`flex items-center rounded-xl py-2.5 text-sm font-bold transition ${
              collapsed ? "justify-center px-2.5" : "gap-3 px-3"
            } ${
              active
                ? "bg-orange-500 text-white"
                : "text-slate-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Icon size={18} />
            {!collapsed ? item.label[language] : null}
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
  collapsed = false,
  onToggleCollapsed,
  onNavigate,
}: {
  pathname: string;
  language: "de" | "tr";
  setLanguage: (language: "de" | "tr") => void;
  t: {
    eyebrow: string;
    shop: string;
    logout: string;
    collapse: string;
    expand: string;
  };
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col bg-slate-950 text-white">
      <div className="border-b border-white/10 px-3 py-5">
        <div
          className={`flex items-center ${
            collapsed ? "justify-center" : "justify-between gap-2 px-2"
          }`}
        >
          {!collapsed ? (
            <div className="w-28">
              <CompanyBrand variant="footer" />
            </div>
          ) : null}

          {onToggleCollapsed ? (
            <button
              type="button"
              onClick={onToggleCollapsed}
              aria-label={collapsed ? t.expand : t.collapse}
              title={collapsed ? t.expand : t.collapse}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/15 text-slate-300 transition hover:border-orange-400 hover:text-orange-400"
            >
              {collapsed ? (
                <ChevronRight size={16} />
              ) : (
                <ChevronLeft size={16} />
              )}
            </button>
          ) : null}
        </div>

        {!collapsed ? (
          <p className="mt-4 px-2 text-xs font-black uppercase tracking-wide text-orange-400">
            {t.eyebrow}
          </p>
        ) : null}
      </div>

      <NavLinks
        pathname={pathname}
        language={language}
        collapsed={collapsed}
        onNavigate={onNavigate}
      />

      <div
        className={`space-y-3 border-t border-white/10 p-4 ${
          collapsed ? "px-2.5" : ""
        }`}
      >
        <Link
          href="/"
          onClick={onNavigate}
          title={collapsed ? t.shop : undefined}
          className={`flex items-center rounded-xl py-2.5 text-sm font-bold text-slate-300 transition hover:bg-white/10 hover:text-white ${
            collapsed ? "justify-center px-2.5" : "gap-3 px-3"
          }`}
        >
          <House size={18} />
          {!collapsed ? t.shop : null}
        </Link>

        {!collapsed ? (
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
        ) : (
          <button
            type="button"
            onClick={() => setLanguage(language === "de" ? "tr" : "de")}
            title={language === "de" ? "DE" : "TR"}
            className="flex h-9 w-full items-center justify-center rounded-full border border-white/15 text-xs font-black text-slate-300 transition hover:border-orange-400 hover:text-orange-400"
          >
            {language.toUpperCase()}
          </button>
        )}

        {collapsed ? (
          <LogoutButton label="" variant="dark" redirectTo="/login" />
        ) : (
          <LogoutButton label={t.logout} variant="dark" redirectTo="/login" />
        )}
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

  const [collapsed, setCollapsed] = useState(false);

  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY);

    if (stored === "1") {
      setCollapsed(true);
    }

    setHydrated(true);
  }, []);

  function toggleCollapsed() {
    setCollapsed((current) => {
      const next = !current;

      window.localStorage.setItem(
        SIDEBAR_COLLAPSED_KEY,
        next ? "1" : "0",
      );

      return next;
    });
  }

  const t = {
    eyebrow: language === "de" ? "Super-Admin" : "Süper Admin",
    shop: language === "de" ? "Zum Shop" : "Mağazaya Git",
    logout: language === "de" ? "Abmelden" : "Çıkış Yap",
    menu: language === "de" ? "Menü" : "Menü",
    collapse: language === "de" ? "Sidebar einklappen" : "Kenar çubuğunu daralt",
    expand: language === "de" ? "Sidebar ausklappen" : "Kenar çubuğunu genişlet",
  };

  return (
    <div className="min-h-screen lg:flex lg:h-screen">
      <aside
        className={`hidden shrink-0 lg:block ${
          collapsed ? "w-20" : "w-64"
        } ${hydrated ? "transition-[width] duration-200" : ""}`}
      >
        <div
          className={`fixed inset-y-0 left-0 ${
            collapsed ? "w-20" : "w-64"
          }`}
        >
          <SidebarBody
            pathname={pathname}
            language={language}
            setLanguage={setLanguage}
            t={t}
            collapsed={collapsed}
            onToggleCollapsed={toggleCollapsed}
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
