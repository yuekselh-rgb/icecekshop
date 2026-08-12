"use client";

import { FormEvent, useEffect, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";

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


export default function Header() {
  const router = useRouter();

  const { totalItems, clearCart } = useCart();

  const { language, setLanguage, translations } = useLanguage();

  const [searchOpen, setSearchOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = searchQuery.trim();

    router.push(
      trimmed
        ? `/products?search=${encodeURIComponent(trimmed)}`
        : "/products",
    );

    setSearchOpen(false);
    setSearchQuery("");
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

  const [minOrderValueSettings, setMinOrderValueSettings] = useState({
    enabled: false,
    value: 0,
  });

  useEffect(() => {
    async function loadCompanySettings() {
      try {
        const res = await fetch("/api/company-settings");

        if (!res.ok) return;

        const data = await res.json();

        setMinOrderValueSettings({
          enabled: Boolean(data.settings?.minOrderValueEnabled),
          value: Number(data.settings?.minOrderValue) || 0,
        });
      } catch (err) {
        console.error(err);
      }
    }

    loadCompanySettings();
  }, []);

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

  return (
    <>
      {minOrderValueSettings.enabled && minOrderValueSettings.value > 0 ? (
        <div className="bg-[#05090A] px-4 py-2 text-center text-sm text-white">
          {language === "de"
            ? `Mindestbestellwert: ${minOrderValueSettings.value.toFixed(2)} €`
            : `Minimum sipariş tutarı: ${minOrderValueSettings.value.toFixed(2)} €`}
        </div>
      ) : null}

      <header className="sticky top-0 z-50 border-b border-[#05090a26] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-4 py-4 lg:px-8">
          <Sheet>
            <SheetTrigger
              render={
                <button
                  type="button"
                  aria-label={t.menu}
                  className="rounded-full border border-[#05090a26] p-2.5 transition hover:border-[#1B4965] hover:text-[#1B4965]"
                />
              }
            >
              <Menu size={22} />
            </SheetTrigger>

            <SheetContent side="left" className="top-0 h-screen w-[340px] border-r border-[#05090a26] bg-white p-0">
              <div className="flex h-full flex-col">

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
                          <Shield className="text-[#1B4965]" size={28} />
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
          className="flex items-center gap-3 rounded-none px-4 py-3 font-semibold transition hover:bg-[#E8ECEF] hover:text-[#1B4965]"
        >
          <Truck size={20} />
          <span>{t.driverPanel}</span>
        </Link>

        <Link
          href="/driver?tab=orders"
          className="flex items-center gap-3 rounded-none px-4 py-3 font-semibold transition hover:bg-[#E8ECEF] hover:text-[#1B4965]"
        >
          <Package size={20} />
          <span>{t.incomingOrders}</span>
        </Link>

        <Link
          href="/driver?tab=stock"
          className="flex items-center gap-3 rounded-none px-4 py-3 font-semibold transition hover:bg-[#E8ECEF] hover:text-[#1B4965]"
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
                className="flex items-center gap-3 rounded-none px-4 py-3 font-semibold transition hover:bg-[#E8ECEF] hover:text-[#1B4965]"
              >
                <Crown size={20}/>
                <span>{t.superAdmin}</span>
              </Link>
            )}

            <Link href="/admin" className="flex items-center gap-3 rounded-none px-4 py-3 font-semibold transition hover:bg-[#E8ECEF] hover:text-[#1B4965]">
              <Shield size={20}/>
              <span>{t.admin}</span>
            </Link>

            {permissions.viewOrders && (
              <Link href="/admin/orders" className="flex items-center gap-3 rounded-none px-4 py-3 font-semibold transition hover:bg-[#E8ECEF] hover:text-[#1B4965]">
                <Package size={20}/>
                <span>{t.orders}</span>
              </Link>
            )}

            {permissions.viewProducts && (
              <Link href="/admin/products" className="flex items-center gap-3 rounded-none px-4 py-3 font-semibold transition hover:bg-[#E8ECEF] hover:text-[#1B4965]">
                <Package size={20}/>
                <span>{t.products}</span>
              </Link>
            )}

            {permissions.viewDriverStock && (
              <Link href="/admin/driver-stock" className="flex items-center gap-3 rounded-none px-4 py-3 font-semibold transition hover:bg-[#E8ECEF] hover:text-[#1B4965]">
                <Truck size={20}/>
                <span>{t.driverStocks}</span>
              </Link>
            )}

            {permissions.viewDealers && (
              <Link href="/admin/dealers" className="flex items-center gap-3 rounded-none px-4 py-3 font-semibold transition hover:bg-[#E8ECEF] hover:text-[#1B4965]">
                <UserRound size={20}/>
                <span>{t.dealers}</span>
              </Link>
            )}
          </>
        )}

        <Link href="/" className="flex items-center gap-3 rounded-none px-4 py-3 font-semibold transition hover:bg-[#E8ECEF] hover:text-[#1B4965]">
      <House size={20}/>
      <span>{t.home}</span>
    </Link>

    <Link href="/products" className="flex items-center gap-3 rounded-none px-4 py-3 font-semibold transition hover:bg-[#E8ECEF] hover:text-[#1B4965]">
      <Package size={20}/>
      <span>{t.products}</span>
    </Link>

    <Link href="/pfand" className="flex items-center gap-3 rounded-none px-4 py-3 font-semibold transition hover:bg-[#E8ECEF] hover:text-[#1B4965]">
      <Recycle size={20}/>
      <span>{t.pfand}</span>
    </Link>

    <Link href={currentUser ? "/orders" : "/login"} className="flex items-center gap-3 rounded-none px-4 py-3 font-semibold transition hover:bg-[#E8ECEF] hover:text-[#1B4965]">
      <UserRound size={20}/>
      <span>{t.account}</span>
    </Link>

    <Link href="/cart" className="flex items-center justify-between rounded-none bg-[#F2F2F2] px-4 py-3 font-semibold transition hover:bg-[#E8ECEF]">
      <div className="flex items-center gap-3">
        <ShoppingCart size={20}/>
        <span>{t.cartText}</span>
      </div>

      <span className="rounded-full bg-[#1B4965] px-2 py-1 text-xs font-bold text-white">
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
          ? "bg-[#1B4965] text-white"
          : "border border-[#05090a26]"
        }`}
      >
        DE
      </button>

      <button
        onClick={() => setLanguage("tr")}
        className={`rounded-none py-2 font-bold ${
          language==="tr"
          ? "bg-[#1B4965] text-white"
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
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-full border border-[#05090a26] p-1">
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
              className={`rounded-full border p-2.5 transition hover:border-[#1B4965] hover:text-[#1B4965] ${
                searchOpen
                  ? "border-[#1B4965] text-[#1B4965]"
                  : "border-[#05090a26]"
              }`}
            >
              <Search size={20} />
            </button>

            <Link
              href={currentUser ? "/orders" : "/login"}
              aria-label={t.account}
              className="rounded-full border border-[#05090a26] p-2.5 transition hover:border-[#1B4965] hover:text-[#1B4965]"
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
              className="relative rounded-full bg-[#05090A] p-2.5 text-white transition hover:bg-[#1B4965]"
            >
              <ShoppingCart size={20} />

              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#1B4965] px-1 text-xs font-bold text-white">
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
                className="w-full rounded-[12px] border border-[#05090a26] py-3 pl-12 pr-12 outline-none transition focus:border-[#1B4965]"
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
