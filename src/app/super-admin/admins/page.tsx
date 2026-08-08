"use client";

import {
  ArrowLeft,
  Loader2,
  Plus,
  Power,
  PowerOff,
  ShieldCheck,
  Trash2,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import { useLanguage } from "@/context/LanguageContext";

type Admin = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  createdAt: string;
};

export default function AdminManagementPage() {
  const { language } = useLanguage();

  const t =
    language === "de"
      ? {
          back: "Super Admin",
          title: "Admin-Verwaltung",
          subtitle: "Admin-Konten erstellen und verwalten.",
          newAdmin: "Neuer Admin",
          firstName: "Vorname",
          lastName: "Nachname",
          email: "E-Mail",
          password: "Temporäres Passwort",
          creating: "Wird erstellt...",
          createAccount: "Admin-Konto erstellen",
          admins: "Admins",
          loading: "Wird geladen...",
          noAdmins: "Noch kein Admin-Konto vorhanden.",
          managePermissions: "Berechtigungen verwalten",
          deactivate: "Konto sperren",
          activate: "Konto aktivieren",
          deletePermanently: "Endgültig löschen",
          active: "AKTIV",
          disabled: "GESPERRT",
          confirmReactivate: (name: string) =>
            `Soll das Konto von ${name} wieder aktiviert werden?`,
          confirmDeactivate: (name: string) =>
            `Soll das Konto von ${name} gesperrt werden?\n\nDieser Admin kann sich dann nicht mehr anmelden.`,
          confirmDelete: (name: string) =>
            `Soll das Admin-Konto von ${name} endgültig gelöscht werden?\n\nDiese Aktion kann nicht rückgängig gemacht werden.`,
          loadFailed: "Admins konnten nicht geladen werden.",
          statusChangeFailed: "Admin-Kontostatus konnte nicht geändert werden.",
          deleteFailed: "Admin-Konto konnte nicht gelöscht werden.",
          createFailed: "Admin konnte nicht erstellt werden.",
          createSuccess: "Admin-Konto wurde erfolgreich erstellt.",
        }
      : {
          back: "Super Admin",
          title: "Admin Yönetimi",
          subtitle: "Admin hesaplarını oluşturun ve yönetin.",
          newAdmin: "Yeni Admin",
          firstName: "Ad",
          lastName: "Soyad",
          email: "E-posta",
          password: "Geçici şifre",
          creating: "Oluşturuluyor...",
          createAccount: "Admin Hesabı Oluştur",
          admins: "Adminler",
          loading: "Yükleniyor...",
          noAdmins: "Henüz admin hesabı bulunmuyor.",
          managePermissions: "Yetkileri Yönet",
          deactivate: "Hesabı Kapat",
          activate: "Hesabı Aç",
          deletePermanently: "Kalıcı Sil",
          active: "AKTİF",
          disabled: "HESAP KAPALI",
          confirmReactivate: (name: string) =>
            `${name} hesabı tekrar açılsın mı?`,
          confirmDeactivate: (name: string) =>
            `${name} hesabı kapatılsın mı?\n\nBu admin artık giriş yapamayacak.`,
          confirmDelete: (name: string) =>
            `${name} admin hesabı kalıcı olarak silinsin mi?\n\nBu işlem geri alınamaz.`,
          loadFailed: "Adminler yüklenemedi.",
          statusChangeFailed: "Admin hesap durumu değiştirilemedi.",
          deleteFailed: "Admin hesabı silinemedi.",
          createFailed: "Admin oluşturulamadı.",
          createSuccess: "Admin hesabı başarıyla oluşturuldu.",
        };

  const [admins, setAdmins] =
    useState<Admin[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [
    actionAdminId,
    setActionAdminId,
  ] =
    useState<string | null>(
      null
    );

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  async function loadAdmins() {
    try {
      const response =
        await fetch(
          "/api/super-admin/admins"
        );

      const data =
        await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            t.loadFailed
        );
        return;
      }

      setAdmins(data.admins);
    } catch {
      setError(
        t.loadFailed
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAdmins();
  }, []);

  async function toggleAdminStatus(
    admin: Admin
  ) {
    const nextStatus =
      !admin.isActive;

    const fullName = `${admin.firstName} ${admin.lastName}`;

    const confirmed =
      window.confirm(
        nextStatus
          ? t.confirmReactivate(fullName)
          : t.confirmDeactivate(fullName)
      );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");
    setActionAdminId(
      admin.id
    );

    try {
      const response =
        await fetch(
          `/api/super-admin/admins/${admin.id}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type":
                "application/json",
            },
            body:
              JSON.stringify({
                isActive:
                  nextStatus,
              }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            t.statusChangeFailed
        );
        return;
      }

      setAdmins(
        (current) =>
          current.map(
            (item) =>
              item.id ===
              admin.id
                ? data.admin
                : item
          )
      );

      setSuccess(
        data.message
      );
    } catch {
      setError(
        t.statusChangeFailed
      );
    } finally {
      setActionAdminId(
        null
      );
    }
  }

  async function deleteAdmin(
    admin: Admin
  ) {
    const confirmed =
      window.confirm(
        t.confirmDelete(`${admin.firstName} ${admin.lastName}`)
      );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");
    setActionAdminId(
      admin.id
    );

    try {
      const response =
        await fetch(
          `/api/super-admin/admins/${admin.id}`,
          {
            method: "DELETE",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            t.deleteFailed
        );
        return;
      }

      setAdmins(
        (current) =>
          current.filter(
            (item) =>
              item.id !==
              admin.id
          )
      );

      setSuccess(
        data.message
      );
    } catch {
      setError(
        t.deleteFailed
      );
    } finally {
      setActionAdminId(
        null
      );
    }
  }

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
          "/api/super-admin/admins",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
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
            t.createFailed
        );
        return;
      }

      setSuccess(
        t.createSuccess
      );

      form.reset();

      await loadAdmins();
    } catch {
      setError(
        t.createFailed
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
          {t.back}
        </Link>

        <div className="mt-6 rounded-[32px] bg-slate-950 p-7 text-white sm:p-10">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500">
            <ShieldCheck size={28} />
          </div>

          <h1 className="mt-5 text-4xl font-black">
            {t.title}
          </h1>

          <p className="mt-3 text-slate-400">
            {t.subtitle}
          </p>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[420px_1fr]">
          <section className="h-fit rounded-[28px] bg-white p-6">
            <div className="flex items-center gap-3">
              <Plus className="text-orange-500" />

              <h2 className="text-2xl font-black text-slate-950">
                {t.newAdmin}
              </h2>
            </div>

            <form
              onSubmit={handleSubmit}
              className="mt-6 space-y-4"
            >
              <input
                required
                name="firstName"
                placeholder={t.firstName}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-orange-500"
              />

              <input
                required
                name="lastName"
                placeholder={t.lastName}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-orange-500"
              />

              <input
                required
                name="email"
                type="email"
                placeholder={t.email}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-orange-500"
              />

              <input
                required
                name="password"
                type="password"
                minLength={8}
                placeholder={t.password}
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
                    {t.creating}
                  </>
                ) : (
                  <>
                    <Plus size={19} />
                    {t.createAccount}
                  </>
                )}
              </button>
            </form>
          </section>

          <section className="rounded-[28px] bg-white p-6">
            <h2 className="text-2xl font-black text-slate-950">
              {t.admins}
            </h2>

            {loading ? (
              <div className="mt-8 flex items-center gap-2 text-slate-500">
                <Loader2
                  className="animate-spin"
                  size={20}
                />
                {t.loading}
              </div>
            ) : admins.length === 0 ? (
              <p className="mt-6 text-slate-500">
                {t.noAdmins}
              </p>
            ) : (
              <div className="mt-6 space-y-3">
                {admins.map(
                  (admin) => (
                    <div
                      key={admin.id}
                      className={`rounded-2xl border p-4 ${
                        admin.isActive
                          ? "border-slate-200 bg-white"
                          : "border-red-200 bg-red-50/50"
                      }`}
                    >
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
                        <div
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                            admin.isActive
                              ? "bg-orange-50 text-orange-500"
                              : "bg-red-100 text-red-600"
                          }`}
                        >
                          <UserRound
                            size={22}
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-black text-slate-950">
                              {
                                admin.firstName
                              }{" "}
                              {
                                admin.lastName
                              }
                            </p>

                            <span
                              className={`rounded-full px-3 py-1 text-xs font-bold ${
                                admin.isActive
                                  ? "bg-green-50 text-green-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {admin.isActive
                                ? t.active
                                : t.disabled}
                            </span>
                          </div>

                          <p className="mt-1 truncate text-sm text-slate-500">
                            {admin.email}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/super-admin/admins/${admin.id}/permissions`}
                            className="rounded-xl bg-slate-950 px-3 py-2 text-sm font-bold text-white transition hover:bg-orange-500"
                          >
                            {t.managePermissions}
                          </Link>

                          <button
                            type="button"
                            disabled={
                              actionAdminId ===
                              admin.id
                            }
                            onClick={() =>
                              toggleAdminStatus(
                                admin
                              )
                            }
                            className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-white transition disabled:opacity-50 ${
                              admin.isActive
                                ? "bg-amber-500 hover:bg-amber-600"
                                : "bg-green-600 hover:bg-green-700"
                            }`}
                          >
                            {actionAdminId ===
                            admin.id ? (
                              <Loader2
                                size={16}
                                className="animate-spin"
                              />
                            ) : admin.isActive ? (
                              <PowerOff
                                size={16}
                              />
                            ) : (
                              <Power
                                size={16}
                              />
                            )}

                            {admin.isActive
                              ? t.deactivate
                              : t.activate}
                          </button>

                          <button
                            type="button"
                            disabled={
                              actionAdminId ===
                              admin.id
                            }
                            onClick={() =>
                              deleteAdmin(
                                admin
                              )
                            }
                            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-3 py-2 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
                          >
                            <Trash2
                              size={16}
                            />
                            {t.deletePermanently}
                          </button>
                        </div>
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
