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
        ? `/urunler?search=${encodeURIComponent(trimmed)}`
        : "/urunler",
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
      router.push("/giris");
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
      <div className="bg-slate-950 px-4 py-2 text-center text-sm text-white">
        {t.freeDelivery}
      </div>

      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-4 py-4 lg:px-8">
          <Sheet>
            <SheetTrigger
              render={
                <button
                  type="button"
                  aria-label={t.menu}
                  className="rounded-full border border-slate-200 p-2.5 transition hover:border-sky-500 hover:text-sky-500"
                />
              }
            >
              <Menu size={22} />
            </SheetTrigger>

            <SheetContent side="left" className="top-0 h-screen w-[340px] border-r bg-white p-0">
              <div className="flex h-full flex-col">

                <div className="border-b p-6">
                  <h2 className="text-xl font-bold text-slate-900">
                    {t.menu}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {t.subtitle}
                  </p>

                  {currentUser && (
                    <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="mb-2 flex items-center gap-3">

                        {currentUser.role === "SUPER_ADMIN" ? (
                          <Crown className="text-amber-500" size={28} />
                        ) : currentUser.role === "ADMIN" ? (
                          <Shield className="text-sky-500" size={28} />
                        ) : currentUser.role === "DRIVER" ? (
                          <Truck className="text-emerald-500" size={28} />
                        ) : (
                          <UserRound className="text-slate-500" size={28} />
                        )}

                        <div>
                          <div className="font-bold text-slate-900">
                            {fullName || currentUser.companyName}
                          </div>

                          <div className="text-sm text-slate-500">
                            {roleLabel}
                          </div>
                        </div>

                      </div>

                      <div className="text-xs text-slate-400">
                        {currentUser.email}
                      </div>

                      <button
                        type="button"
                        onClick={handleLogout}
                        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-red-100 py-2.5 text-sm font-bold text-red-500 transition hover:bg-red-50"
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
          href="/sofor"
          className="flex items-center gap-3 rounded-xl px-4 py-3 font-semibold transition hover:bg-sky-50 hover:text-sky-600"
        >
          <Truck size={20} />
          <span>{t.driverPanel}</span>
        </Link>

        <Link
          href="/sofor?tab=orders"
          className="flex items-center gap-3 rounded-xl px-4 py-3 font-semibold transition hover:bg-sky-50 hover:text-sky-600"
        >
          <Package size={20} />
          <span>{t.incomingOrders}</span>
        </Link>

        <Link
          href="/sofor?tab=stock"
          className="flex items-center gap-3 rounded-xl px-4 py-3 font-semibold transition hover:bg-sky-50 hover:text-sky-600"
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
                className="flex items-center gap-3 rounded-xl px-4 py-3 font-semibold transition hover:bg-sky-50 hover:text-sky-600"
              >
                <Crown size={20}/>
                <span>{t.superAdmin}</span>
              </Link>
            )}

            <Link href="/admin" className="flex items-center gap-3 rounded-xl px-4 py-3 font-semibold transition hover:bg-sky-50 hover:text-sky-600">
              <Shield size={20}/>
              <span>{t.admin}</span>
            </Link>

            {permissions.viewOrders && (
              <Link href="/admin/siparisler" className="flex items-center gap-3 rounded-xl px-4 py-3 font-semibold transition hover:bg-sky-50 hover:text-sky-600">
                <Package size={20}/>
                <span>{t.orders}</span>
              </Link>
            )}

            {permissions.viewProducts && (
              <Link href="/admin/urunler" className="flex items-center gap-3 rounded-xl px-4 py-3 font-semibold transition hover:bg-sky-50 hover:text-sky-600">
                <Package size={20}/>
                <span>{t.products}</span>
              </Link>
            )}

            {permissions.viewDriverStock && (
              <Link href="/admin/sofor-stok" className="flex items-center gap-3 rounded-xl px-4 py-3 font-semibold transition hover:bg-sky-50 hover:text-sky-600">
                <Truck size={20}/>
                <span>{t.driverStocks}</span>
              </Link>
            )}

            {permissions.viewDealers && (
              <Link href="/admin/bayiler" className="flex items-center gap-3 rounded-xl px-4 py-3 font-semibold transition hover:bg-sky-50 hover:text-sky-600">
                <UserRound size={20}/>
                <span>{t.dealers}</span>
              </Link>
            )}
          </>
        )}

        <Link href="/" className="flex items-center gap-3 rounded-xl px-4 py-3 font-semibold transition hover:bg-sky-50 hover:text-sky-600">
      <House size={20}/>
      <span>{t.home}</span>
    </Link>

    <Link href="/urunler" className="flex items-center gap-3 rounded-xl px-4 py-3 font-semibold transition hover:bg-sky-50 hover:text-sky-600">
      <Package size={20}/>
      <span>{t.products}</span>
    </Link>

    <Link href="/pfand" className="flex items-center gap-3 rounded-xl px-4 py-3 font-semibold transition hover:bg-sky-50 hover:text-sky-600">
      <Recycle size={20}/>
      <span>{t.pfand}</span>
    </Link>

    <Link href="/giris" className="flex items-center gap-3 rounded-xl px-4 py-3 font-semibold transition hover:bg-sky-50 hover:text-sky-600">
      <UserRound size={20}/>
      <span>{t.account}</span>
    </Link>

    <Link href="/sepet" className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 font-semibold transition hover:bg-sky-50">
      <div className="flex items-center gap-3">
        <ShoppingCart size={20}/>
        <span>{t.cartText}</span>
      </div>

      <span className="rounded-full bg-sky-500 px-2 py-1 text-xs font-bold text-white">
        {totalItems}
      </span>
    </Link>

      </>
    )}

  </div>

  <div className="mt-auto border-t pt-5">

    <div className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
      Dil / Sprache
    </div>

    <div className="grid grid-cols-2 gap-2">

      <button
        onClick={() => setLanguage("de")}
        className={`rounded-lg py-2 font-bold ${
          language==="de"
          ? "bg-sky-500 text-white"
          : "border border-slate-300"
        }`}
      >
        DE
      </button>

      <button
        onClick={() => setLanguage("tr")}
        className={`rounded-lg py-2 font-bold ${
          language==="tr"
          ? "bg-sky-500 text-white"
          : "border border-slate-300"
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
            <div className="flex items-center rounded-full border border-slate-200 p-1">
              <button
                type="button"
                onClick={() => setLanguage("de")}
                className={`rounded-full px-3 py-1.5 text-xs font-black transition ${
                  language === "de"
                    ? "bg-slate-950 text-white"
                    : "text-slate-500 hover:text-slate-950"
                }`}
              >
                DE
              </button>

              <button
                type="button"
                onClick={() => setLanguage("tr")}
                className={`rounded-full px-3 py-1.5 text-xs font-black transition ${
                  language === "tr"
                    ? "bg-slate-950 text-white"
                    : "text-slate-500 hover:text-slate-950"
                }`}
              >
                TR
              </button>
            </div>

            <button
              type="button"
              aria-label={t.search}
              onClick={() => setSearchOpen((open) => !open)}
              className={`rounded-full border p-2.5 transition hover:border-sky-500 hover:text-sky-500 ${
                searchOpen
                  ? "border-sky-500 text-sky-500"
                  : "border-slate-200"
              }`}
            >
              <Search size={20} />
            </button>

            <Link
              href="/giris"
              aria-label={t.account}
              className="rounded-full border border-slate-200 p-2.5 transition hover:border-sky-500 hover:text-sky-500"
            >
              <UserRound size={20} />
            </Link>

            {currentUser ? (
              <button
                type="button"
                aria-label={t.logout}
                onClick={handleLogout}
                className="hidden rounded-full border border-slate-200 p-2.5 text-slate-500 transition hover:border-red-400 hover:text-red-500 sm:block"
              >
                <LogOut size={20} />
              </button>
            ) : null}

            <Link
              href="/sepet"
              aria-label={t.cart}
              className="relative rounded-full bg-slate-950 p-2.5 text-white transition hover:bg-sky-500"
            >
              <ShoppingCart size={20} />

              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-sky-500 px-1 text-xs font-bold text-white">
                {totalItems}
              </span>
            </Link>
          </div>
        </div>

        {searchOpen ? (
          <div className="border-t border-slate-200 bg-white px-4 py-4 lg:px-8">
            <form
              onSubmit={submitSearch}
              className="relative mx-auto max-w-7xl"
            >
              <Search
                size={20}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={t.search}
                className="w-full rounded-xl border border-slate-200 py-3 pl-12 pr-12 outline-none transition focus:border-sky-500"
              />

              <button
                type="button"
                aria-label={t.close}
                onClick={() => setSearchOpen(false)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-slate-400 hover:text-slate-700"
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
