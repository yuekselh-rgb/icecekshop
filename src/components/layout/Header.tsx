"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import CompanyBrand from "@/components/company/CompanyBrand";
import {
  formatNextOpening,
  getDefaultBusinessHours,
  getShopOpenStatus,
  normalizeBusinessHours,
  type BusinessHoursDay,
} from "@/lib/business-hours";

import {
  Crown,
  House,
  LogOut,
  Menu,
  Package,
  Recycle,
  Search,
  Shield,
  ShoppingCart,
  Truck,
  UserRound,
  X
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";


export default function Header({
  initialSettings,
}: {
  initialSettings?: any;
} = {}) {
  const router = useRouter();

  const pathname = usePathname();

  /*
   * Auf der Homepage zeigt der Produktkatalog bereits dort, im
   * Header-Link dann nur dorthin scrollen statt zur separaten
   * /products-Seite zu navigieren. href bleibt bewusst "/products"
   * (kein #produkte-Hash) — sonst bleibt der Hash in der URL hängen
   * und ein Reload landet danach immer wieder mitten auf der Seite.
   */
  const productsHref = "/products";

  function handleProductsClick(event: React.MouseEvent) {
    if (pathname === "/") {
      event.preventDefault();
      document.getElementById("produkte")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  const { totalItems, clearCart } = useCart();

  const { language, setLanguage, translations } = useLanguage();

  const [searchOpen, setSearchOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const hasScrolledForSearchRef = useRef(false);

  useEffect(() => {
    if (!searchOpen) {
      hasScrolledForSearchRef.current = false;
    }
  }, [searchOpen]);

  /*
   * Live-Suche auf der Startseite: während des Tippens wird gefiltert
   * (leicht verzögert, damit nicht bei jedem Tastenanschlag neu gerendert
   * wird) — kein Enter nötig. Auf anderen Seiten bleibt es bei Enter →
   * Weiterleitung zu /products, da es dort keine Live-Ergebnisliste gibt.
   */
  useEffect(() => {
    if (!searchOpen || pathname !== "/") {
      return;
    }

    const trimmed = searchQuery.trim();

    const timeout = setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent("home-search", {
          detail: { query: trimmed },
        }),
      );

      if (trimmed && !hasScrolledForSearchRef.current) {
        hasScrolledForSearchRef.current = true;

        /*
         * Bewusst "home-products" statt des "produkte"-Sentinels: der
         * Sentinel sitzt genau an der Kipp-Schwelle des Sticky-
         * Kategorie-Leiste-Observers (CategorySection). Ändert sich
         * kurz danach die Höhe der gefilterten Ergebnisliste, kippt
         * der Observer hin und her und reißt die Seite sichtbar nach
         * oben — v. a. auf Mobile mit eingeblendeter Tastatur auffällig.
         * "home-products" liegt sicher unterhalb dieser Schwelle.
         */
        document
          .getElementById("home-products")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 250);

    return () => clearTimeout(timeout);
  }, [searchQuery, searchOpen, pathname]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (pathname !== "/") {
      const trimmed = searchQuery.trim();

      router.push(
        trimmed
          ? `/products?search=${encodeURIComponent(trimmed)}`
          : "/products",
      );

      setSearchQuery("");
    }

    setSearchOpen(false);
  }


  const t = {
    ...translations[language].header,
    close: language === "de" ? "Schließen" : "Kapat",
    subtitle:
      language === "de"
        ? "Getränke • Verpackung • Reinigung"
        : "İçecek • Ambalaj • Temizlik",
    logout: language === "de" ? "Abmelden" : "Çıkış Yap",
  };

  const roleLabels: Record<string, { de: string; tr: string }> = {
    SUPER_ADMIN: {
      de: "Super Admin",
      tr: "Süper Admin",
    },
    ADMIN: {
      de: "Admin",
      tr: "Admin",
    },
    DRIVER: {
      de: "Fahrer",
      tr: "Şoför",
    },
    DEALER: {
      de: "Händler",
      tr: "Bayi",
    },
    CUSTOMER: {
      de: "Kunde",
      tr: "Müşteri",
    },
  };

  type CurrentUser = {
    firstName: string | null;
    lastName: string | null;
    companyName: string | null;
    email: string;
    role: string;
  };

  const [currentUser, setCurrentUser] =
    useState<CurrentUser | null>(null);

  const [permissions, setPermissions] =
    useState<Record<string, boolean>>({});

  const [minOrderValueSettings, setMinOrderValueSettings] = useState(
    initialSettings
      ? {
          enabled: Boolean(initialSettings.minOrderValueEnabled),
          value: Number(initialSettings.minOrderValue) || 0,
        }
      : {
          enabled: false,
          value: 0,
        },
  );

  const [businessHoursSettings, setBusinessHoursSettings] = useState<{
    enabled: boolean;
    hours: BusinessHoursDay[];
  }>(
    initialSettings
      ? {
          enabled: Boolean(initialSettings.businessHoursEnabled),
          hours: normalizeBusinessHours(initialSettings.businessHours),
        }
      : {
          enabled: false,
          hours: getDefaultBusinessHours(),
        },
  );

  useEffect(() => {
    /*
     * initialSettings kam bereits vom Server (z. B. Startseite) —
     * kein erneuter Fetch beim Mount nötig.
     */
    if (initialSettings) {
      return;
    }

    async function loadCompanySettings() {
      try {
        const res = await fetch("/api/company-settings");

        if (!res.ok) return;

        const data = await res.json();

        setMinOrderValueSettings({
          enabled: Boolean(data.settings?.minOrderValueEnabled),
          value: Number(data.settings?.minOrderValue) || 0,
        });

        setBusinessHoursSettings({
          enabled: Boolean(data.settings?.businessHoursEnabled),
          hours: normalizeBusinessHours(data.settings?.businessHours),
        });
      } catch (err) {
        console.error(err);
      }
    }

    loadCompanySettings();
  }, [initialSettings]);

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/auth/me");

        if (!res.ok) return;

        const data = await res.json();

        setCurrentUser(data.user);

        if (
          data.user.role === "ADMIN" ||
          data.user.role === "SUPER_ADMIN"
        ) {
          const adminRes = await fetch("/api/admin/me");

          if (adminRes.ok) {
            const adminData = await adminRes.json();
            setPermissions(adminData.permissions);
          }
        }
      } catch (err) {
        console.error(err);
      }
    }

    loadUser();
  }, []);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } finally {
      clearCart();
      router.push("/login");
      router.refresh();
    }
  }

  const fullName =
    currentUser
      ? `${currentUser.firstName ?? ""} ${currentUser.lastName ?? ""}`.trim()
      : "";

  const roleLabel =
    (currentUser?.role
      ? roleLabels[currentUser.role]?.[language]
      : undefined) ?? roleLabels.CUSTOMER[language];

  /*
   * "Mein Konto" führt je nach Rolle zum passenden Bereich, nicht
   * immer zu den Kundenbestellungen — sonst landen Admin/Fahrer dort,
   * wo sie nichts zu suchen haben.
   */
  const accountHref = !currentUser
    ? "/login"
    : currentUser.role === "SUPER_ADMIN"
      ? "/super-admin"
      : currentUser.role === "ADMIN"
        ? "/admin"
        : currentUser.role === "DRIVER"
          ? "/driver"
          : "/orders";

  const shopOpenStatus = getShopOpenStatus(
    businessHoursSettings.enabled,
    businessHoursSettings.hours,
  );

  const showClosedShopBanner =
    businessHoursSettings.enabled &&
    !shopOpenStatus.isOpen &&
    currentUser?.role !== "DEALER";

  return (
    <>
      {showClosedShopBanner ? (
        <div className="bg-amber-50 px-4 py-2 text-center text-sm font-bold text-amber-800">
          {language === "de"
            ? `Aktuell außerhalb der Öffnungszeiten — Ihre Bestellung wird als Vorbestellung angenommen und ab ${formatNextOpening(shopOpenStatus, language)} bearbeitet.`
            : `Şu anda çalışma saatleri dışındayız — siparişiniz ön sipariş olarak alınır ve ${formatNextOpening(shopOpenStatus, language)} itibarıyla işleme alınır.`}
        </div>
      ) : null}

      {minOrderValueSettings.enabled && minOrderValueSettings.value > 0 ? (
        <div className="bg-[#05090A] px-4 py-2 text-center text-sm text-white">
          {language === "de"
            ? `Mindestbestellwert: ${minOrderValueSettings.value.toFixed(2)} €`
            : `Minimum sipariş tutarı: ${minOrderValueSettings.value.toFixed(2)} €`}
        </div>
      ) : null}

      <header className="sticky top-0 z-50 border-b border-[#05090a26] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-4 py-4 lg:px-8">
          <div className="flex items-center gap-6">
            <div className="w-28 shrink-0 lg:w-32">
              <CompanyBrand variant="footer" initialSettings={initialSettings} />
            </div>

          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger
              render={
                <button
                  type="button"
                  aria-label={t.menu}
                  className="rounded-full border border-[#05090a26] p-2.5 transition hover:border-[#0E6FAE] hover:text-[#0E6FAE] lg:hidden"
                />
              }
            >
              <Menu size={22} />
            </SheetTrigger>

            <SheetContent side="left" className="top-0 h-screen w-[340px] border-r border-[#05090a26] bg-white p-0">
              <div
                className="flex h-full flex-col"
                onClick={(event) => {
                  if ((event.target as HTMLElement).closest("a")) {
                    setMobileMenuOpen(false);
                  }
                }}
              >

                <div className="border-b border-[#05090a26] p-6">
                  <h2 className="text-xl font-bold text-[#05090A]">
                    {t.menu}
                  </h2>
                  <p className="mt-1 text-sm text-[#505253]">
                    {t.subtitle}
                  </p>

                  {currentUser && (
                    <div className="mt-5 rounded-none border border-[#05090a26] bg-[#F2F2F2] p-4">
                      <div className="mb-2 flex items-center gap-3">

                        {currentUser.role === "SUPER_ADMIN" ? (
                          <Crown className="text-amber-500" size={28} />
                        ) : currentUser.role === "ADMIN" ? (
                          <Shield className="text-[#0E6FAE]" size={28} />
                        ) : currentUser.role === "DRIVER" ? (
                          <Truck className="text-emerald-500" size={28} />
                        ) : (
                          <UserRound className="text-[#505253]" size={28} />
                        )}

                        <div>
                          <div className="font-bold text-[#05090A]">
                            {fullName || currentUser.companyName}
                          </div>

                          <div className="text-sm text-[#505253]">
                            {roleLabel}
                          </div>
                        </div>

                      </div>

                      <div className="text-xs text-[#828484]">
                        {currentUser.email}
                      </div>

                      <button
                        type="button"
                        onClick={handleLogout}
                        className="mt-3 flex w-full items-center justify-center gap-2 rounded-none border border-red-100 py-2.5 text-sm font-bold text-red-500 transition hover:bg-red-50"
                      >
                        <LogOut size={16} />
                        {t.logout}
                      </button>
                    </div>
                  )}
                </div>

                
<nav className="flex flex-1 flex-col overflow-y-auto p-5">

  {(() => {
    const isDriver = currentUser?.role === "DRIVER";
    const isAdmin =
      currentUser?.role === "ADMIN" ||
      currentUser?.role === "SUPER_ADMIN";

    return (
      <>

  <div className="space-y-2">

    {isDriver && (
      <>
        <Link
          href="/driver"
          className="flex items-center gap-3 rounded-none px-4 py-3 font-semibold transition hover:bg-[#EAF2F8] hover:text-[#0E6FAE]"
        >
          <Truck size={20} />
          <span>{t.driverPanel}</span>
        </Link>

        <Link
          href="/driver?tab=orders"
          className="flex items-center gap-3 rounded-none px-4 py-3 font-semibold transition hover:bg-[#EAF2F8] hover:text-[#0E6FAE]"
        >
          <Package size={20} />
          <span>{t.incomingOrders}</span>
        </Link>

        <Link
          href="/driver?tab=stock"
          className="flex items-center gap-3 rounded-none px-4 py-3 font-semibold transition hover:bg-[#EAF2F8] hover:text-[#0E6FAE]"
        >
          <Package size={20} />
          <span>{t.vehicleStock}</span>
        </Link>
      </>
    )}


    {!isDriver && (
      <>

        {isAdmin && (
          <>

            {currentUser?.role === "SUPER_ADMIN" && (
              <Link
                href="/super-admin"
                className="flex items-center gap-3 rounded-none px-4 py-3 font-semibold transition hover:bg-[#EAF2F8] hover:text-[#0E6FAE]"
              >
                <Crown size={20}/>
                <span>{t.superAdmin}</span>
              </Link>
            )}

            <Link href="/admin" className="flex items-center gap-3 rounded-none px-4 py-3 font-semibold transition hover:bg-[#EAF2F8] hover:text-[#0E6FAE]">
              <Shield size={20}/>
              <span>{t.admin}</span>
            </Link>

            {permissions.viewOrders && (
              <Link href="/admin/orders" className="flex items-center gap-3 rounded-none px-4 py-3 font-semibold transition hover:bg-[#EAF2F8] hover:text-[#0E6FAE]">
                <Package size={20}/>
                <span>{t.orders}</span>
              </Link>
            )}

            {permissions.viewProducts && (
              <Link href="/admin/products" className="flex items-center gap-3 rounded-none px-4 py-3 font-semibold transition hover:bg-[#EAF2F8] hover:text-[#0E6FAE]">
                <Package size={20}/>
                <span>{t.products}</span>
              </Link>
            )}

            {permissions.viewDriverStock && (
              <Link href="/admin/driver-stock" className="flex items-center gap-3 rounded-none px-4 py-3 font-semibold transition hover:bg-[#EAF2F8] hover:text-[#0E6FAE]">
                <Truck size={20}/>
                <span>{t.driverStocks}</span>
              </Link>
            )}

            {permissions.viewDealers && (
              <Link href="/admin/dealers" className="flex items-center gap-3 rounded-none px-4 py-3 font-semibold transition hover:bg-[#EAF2F8] hover:text-[#0E6FAE]">
                <UserRound size={20}/>
                <span>{t.dealers}</span>
              </Link>
            )}
          </>
        )}

        <Link href="/" className="flex items-center gap-3 rounded-none px-4 py-3 font-semibold transition hover:bg-[#EAF2F8] hover:text-[#0E6FAE]">
      <House size={20}/>
      <span>{t.home}</span>
    </Link>

    <Link href={productsHref} onClick={handleProductsClick} className="flex items-center gap-3 rounded-none px-4 py-3 font-semibold transition hover:bg-[#EAF2F8] hover:text-[#0E6FAE]">
      <Package size={20}/>
      <span>{t.products}</span>
    </Link>

    <Link href="/pfand" className="flex items-center gap-3 rounded-none px-4 py-3 font-semibold transition hover:bg-[#EAF2F8] hover:text-[#0E6FAE]">
      <Recycle size={20}/>
      <span>{t.pfand}</span>
    </Link>

    <Link href={accountHref} className="flex items-center gap-3 rounded-none px-4 py-3 font-semibold transition hover:bg-[#EAF2F8] hover:text-[#0E6FAE]">
      <UserRound size={20}/>
      <span>{t.account}</span>
    </Link>

    <Link href="/cart" className="flex items-center justify-between rounded-none bg-[#F2F2F2] px-4 py-3 font-semibold transition hover:bg-[#EAF2F8]">
      <div className="flex items-center gap-3">
        <ShoppingCart size={20}/>
        <span>{t.cartText}</span>
      </div>

      <span className="rounded-full bg-[#0E6FAE] px-2 py-1 text-xs font-bold text-white">
        {totalItems}
      </span>
    </Link>

      </>
    )}

  </div>

  <div className="mt-auto border-t border-[#05090a26] pt-5">

    <div className="grid grid-cols-2 gap-2">

      <button
        onClick={() => setLanguage("de")}
        className={`rounded-none py-2 font-bold ${
          language==="de"
          ? "bg-[#0E6FAE] text-white"
          : "border border-[#05090a26]"
        }`}
      >
        DE
      </button>

      <button
        onClick={() => setLanguage("tr")}
        className={`rounded-none py-2 font-bold ${
          language==="tr"
          ? "bg-[#0E6FAE] text-white"
          : "border border-[#05090a26]"
        }`}
      >
        TR
      </button>

    </div>

  </div>

      </>
    );
  })()}
</nav>


              </div>
            </SheetContent>
          </Sheet>

          <nav className="hidden items-center gap-1 lg:flex">
            <Link href={productsHref} onClick={handleProductsClick} className="rounded-full px-4 py-2 font-semibold text-[#05090A] transition hover:bg-[#EAF2F8]">
              {t.products}
            </Link>
            <Link href="/pfand" className="rounded-full px-4 py-2 font-semibold text-[#05090A] transition hover:bg-[#EAF2F8]">
              {t.pfand}
            </Link>
            <Link href="/register" className="rounded-full px-4 py-2 font-semibold text-[#05090A] transition hover:bg-[#EAF2F8]">
              {language === "de" ? "Gastro" : "İşletmeler"}
            </Link>
          </nav>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden items-center rounded-full border border-[#05090a26] p-1 sm:flex">
              <button
                type="button"
                onClick={() => setLanguage("de")}
                className={`rounded-full px-3 py-1.5 text-xs font-black transition ${
                  language === "de"
                    ? "bg-[#05090A] text-white"
                    : "text-[#505253] hover:text-[#05090A]"
                }`}
              >
                DE
              </button>

              <button
                type="button"
                onClick={() => setLanguage("tr")}
                className={`rounded-full px-3 py-1.5 text-xs font-black transition ${
                  language === "tr"
                    ? "bg-[#05090A] text-white"
                    : "text-[#505253] hover:text-[#05090A]"
                }`}
              >
                TR
              </button>
            </div>

            <button
              type="button"
              aria-label={t.search}
              onClick={() => setSearchOpen((open) => !open)}
              className={`rounded-full border p-2.5 transition hover:border-[#0E6FAE] hover:text-[#0E6FAE] ${
                searchOpen
                  ? "border-[#0E6FAE] text-[#0E6FAE]"
                  : "border-[#05090a26]"
              }`}
            >
              <Search size={20} />
            </button>

            <Link
              href={accountHref}
              aria-label={t.account}
              className="rounded-full border border-[#05090a26] p-2.5 transition hover:border-[#0E6FAE] hover:text-[#0E6FAE]"
            >
              <UserRound size={20} />
            </Link>

            {currentUser ? (
              <button
                type="button"
                aria-label={t.logout}
                onClick={handleLogout}
                className="hidden rounded-full border border-[#05090a26] p-2.5 text-[#505253] transition hover:border-red-400 hover:text-red-500 sm:block"
              >
                <LogOut size={20} />
              </button>
            ) : null}

            <Link
              href="/cart"
              aria-label={t.cart}
              className="relative rounded-full bg-[#05090A] p-2.5 text-white transition hover:bg-[#0E6FAE]"
            >
              <ShoppingCart size={20} />

              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#0E6FAE] px-1 text-xs font-bold text-white">
                {totalItems}
              </span>
            </Link>
          </div>
        </div>

        {searchOpen ? (
          <div className="border-t border-[#05090a26] bg-white px-4 py-4 lg:px-8">
            <form
              onSubmit={submitSearch}
              className="relative mx-auto max-w-7xl"
            >
              <Search
                size={20}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#828484]"
              />

              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={t.search}
                className="w-full rounded-[12px] border border-[#05090a26] py-3 pl-12 pr-12 outline-none transition focus:border-[#0E6FAE]"
              />

              <button
                type="button"
                aria-label={t.close}
                onClick={() => setSearchOpen(false)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-[#828484] hover:text-[#05090A]"
              >
                <X size={18} />
              </button>
            </form>
          </div>
        ) : null}
      </header>
    </>
  );
}
