"use client";

import {
  ArrowLeft,
  Loader2,
  Plus,
  Truck,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import { useLanguage } from "@/context/LanguageContext";

type Driver = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phone: string | null;
  createdAt: string;

  _count: {
    driverOrders: number;
  };
};

export default function DriverManagementPage() {
  const { language } = useLanguage();

  const [
    drivers,
    setDrivers,
  ] = useState<Driver[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");

  async function loadDrivers() {
    setError("");

    try {
      const response =
        await fetch(
          "/api/super-admin/soforler"
        );

      const data =
        await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            "Şoförler yüklenemedi."
        );
        return;
      }

      setDrivers(
        data.drivers
      );
    } catch {
      setError(
        "Şoförler yüklenemedi."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDrivers();
  }, []);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");
    setSaving(true);

    const form =
      event.currentTarget;

    const formData =
      new FormData(form);

    try {
      const response =
        await fetch(
          "/api/super-admin/soforler",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                firstName:
                  formData.get(
                    "firstName"
                  ),

                lastName:
                  formData.get(
                    "lastName"
                  ),

                email:
                  formData.get(
                    "email"
                  ),

                phone:
                  formData.get(
                    "phone"
                  ),

                password:
                  formData.get(
                    "password"
                  ),
              }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            "Şoför oluşturulamadı."
        );
        return;
      }

      setSuccess(
        "Şoför hesabı başarıyla oluşturuldu."
      );

      form.reset();

      await loadDrivers();
    } catch {
      setError(
        "Şoför oluşturulamadı."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 sm:p-6 lg:p-10">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/super-admin"
          className="inline-flex items-center gap-2 font-bold text-slate-600 hover:text-orange-500"
        >
          <ArrowLeft size={18} />
          Super Admin
        </Link>

        <div className="mt-6 rounded-[32px] bg-slate-950 p-7 text-white sm:p-10">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500">
            <Truck size={28} />
          </div>

          <h1 className="mt-5 text-4xl font-black">
            Şoför Yönetimi
          </h1>

          <p className="mt-3 text-slate-400">
            Teslimat yapacak şoför hesaplarını oluşturun ve görüntüleyin.
          </p>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[420px_1fr]">
          <section className="h-fit rounded-[28px] bg-white p-6">
            <div className="flex items-center gap-3">
              <Plus className="text-orange-500" />

              <h2 className="text-2xl font-black text-slate-950">
                Yeni Şoför
              </h2>
            </div>

            <form
              onSubmit={handleSubmit}
              className="mt-6 space-y-4"
            >
              <input
                required
                name="firstName"
                placeholder={language==="de"?"Vorname":"Ad"}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-orange-500"
              />

              <input
                required
                name="lastName"
                placeholder={language==="de"?"Nachname":"Soyad"}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-orange-500"
              />

              <input
                required
                name="email"
                type="email"
                placeholder={language==="de"?"E-Mail":"E-posta"}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-orange-500"
              />

              <input
                name="phone"
                type="tel"
                placeholder={language==="de"?"Telefon":"Telefon"}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-orange-500"
              />

              <input
                required
                name="password"
                type="password"
                minLength={8}
                placeholder={language==="de"?"Temporäres Passwort":"Geçici şifre"}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-orange-500"
              />

              {error ? (
                <div className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-600">
                  {error}
                </div>
              ) : null}

              {success ? (
                <div className="rounded-xl bg-green-50 p-3 text-sm font-bold text-green-700">
                  {success}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={saving}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-4 font-black text-white transition hover:bg-orange-600 disabled:bg-orange-300"
              >
                {saving ? (
                  <>
                    <Loader2
                      size={19}
                      className="animate-spin"
                    />
                    Oluşturuluyor...
                  </>
                ) : (
                  <>
                    <Plus size={19} />
                    Şoför Hesabı Oluştur
                  </>
                )}
              </button>
            </form>
          </section>

          <section className="rounded-[28px] bg-white p-6">
            <h2 className="text-2xl font-black text-slate-950">
              Şoförler
            </h2>

            {loading ? (
              <div className="mt-8 flex items-center gap-2 text-slate-500">
                <Loader2
                  className="animate-spin"
                  size={20}
                />
                Yükleniyor...
              </div>
            ) : drivers.length === 0 ? (
              <p className="mt-6 text-slate-500">
                Henüz şoför hesabı bulunmuyor.
              </p>
            ) : (
              <div className="mt-6 space-y-3">
                {drivers.map(
                  (driver) => (
                    <div
                      key={driver.id}
                      className="flex flex-col gap-4 rounded-2xl border border-slate-200 p-4 sm:flex-row sm:items-center"
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                        <UserRound size={22} />
                      </div>

                      <div className="min-w-0">
                        <p className="font-black text-slate-950">
                          {driver.firstName}{" "}
                          {driver.lastName}
                        </p>

                        <p className="truncate text-sm text-slate-500">
                          {driver.email}
                        </p>

                        {driver.phone ? (
                          <p className="text-sm text-slate-500">
                            {driver.phone}
                          </p>
                        ) : null}
                      </div>

                      <div className="sm:ml-auto sm:text-right">
                        <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                          DRIVER
                        </span>

                        <p className="mt-2 text-sm font-semibold text-slate-500">
                          Atanan sipariş:{" "}
                          {
                            driver._count
                              .driverOrders
                          }
                        </p>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
