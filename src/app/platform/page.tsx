"use client";

import {
  Building2,
  Globe,
  Loader2,
  Plus,
  Power,
} from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

type Tenant = {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
  domains: {
    id: string;
    domain: string;
    isPrimary: boolean;
  }[];
  _count: {
    users: number;
  };
};

export default function PlatformDashboardPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadTenants() {
    setError("");

    try {
      const response = await fetch("/api/platform/tenants");
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Tenants konnten nicht geladen werden.");
        return;
      }

      setTenants(data.tenants);
    } catch {
      setError("Tenants konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTenants();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");
    setSaving(true);

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch("/api/platform/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          domain: formData.get("domain"),
          adminEmail: formData.get("adminEmail"),
          adminPassword: formData.get("adminPassword"),
          adminFirstName: formData.get("adminFirstName"),
          adminLastName: formData.get("adminLastName"),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Tenant konnte nicht angelegt werden.");
        return;
      }

      setSuccess("Tenant wurde erfolgreich angelegt.");
      form.reset();

      await loadTenants();
    } catch {
      setError("Tenant konnte nicht angelegt werden.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(tenant: Tenant) {
    setError("");

    try {
      const response = await fetch(`/api/platform/tenants/${tenant.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !tenant.active }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Tenant konnte nicht aktualisiert werden.");
        return;
      }

      await loadTenants();
    } catch {
      setError("Tenant konnte nicht aktualisiert werden.");
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 sm:p-6 lg:p-10">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-[32px] bg-slate-950 p-7 text-white sm:p-10">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500">
            <Building2 size={28} />
          </div>

          <h1 className="mt-5 text-4xl font-black">Platform-Verwaltung</h1>

          <p className="mt-3 text-slate-400">
            Tenants (Shops) und ihre Domains anlegen und verwalten.
          </p>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[420px_1fr]">
          <section className="h-fit rounded-[28px] bg-white p-6">
            <div className="flex items-center gap-3">
              <Plus className="text-orange-500" />
              <h2 className="text-2xl font-black text-slate-950">
                Neuer Tenant
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <input
                required
                name="name"
                placeholder="Firmenname"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-orange-500"
              />

              <input
                required
                name="domain"
                placeholder="Domain (z.B. shop-name.de)"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-orange-500"
              />

              <div className="grid grid-cols-2 gap-3">
                <input
                  name="adminFirstName"
                  placeholder="Admin Vorname"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-orange-500"
                />

                <input
                  name="adminLastName"
                  placeholder="Admin Nachname"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-orange-500"
                />
              </div>

              <input
                required
                type="email"
                name="adminEmail"
                placeholder="Admin E-Mail"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-orange-500"
              />

              <input
                required
                type="password"
                name="adminPassword"
                minLength={8}
                placeholder="Admin-Passwort (mind. 8 Zeichen)"
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
                    <Loader2 size={19} className="animate-spin" />
                    Wird angelegt...
                  </>
                ) : (
                  <>
                    <Plus size={19} />
                    Tenant anlegen
                  </>
                )}
              </button>
            </form>
          </section>

          <section className="rounded-[28px] bg-white p-6">
            <h2 className="text-2xl font-black text-slate-950">Tenants</h2>

            {loading ? (
              <div className="mt-8 flex items-center gap-2 text-slate-500">
                <Loader2 className="animate-spin" size={20} />
                Wird geladen...
              </div>
            ) : tenants.length === 0 ? (
              <p className="mt-6 text-slate-500">Noch keine Tenants angelegt.</p>
            ) : (
              <div className="mt-6 space-y-3">
                {tenants.map((tenant) => (
                  <div
                    key={tenant.id}
                    className="rounded-2xl border border-slate-200 p-4"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                        <Building2 size={22} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="font-black text-slate-950">
                          {tenant.name}
                        </p>

                        <div className="mt-1 flex flex-wrap gap-2">
                          {tenant.domains.map((domain) => (
                            <span
                              key={domain.id}
                              className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600"
                            >
                              <Globe size={12} />
                              {domain.domain}
                              {domain.isPrimary ? " (primär)" : ""}
                            </span>
                          ))}
                        </div>

                        <p className="mt-2 text-sm text-slate-500">
                          {tenant._count.users} Nutzer
                        </p>
                      </div>

                      <div className="flex items-center gap-3 sm:ml-auto">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            tenant.active
                              ? "bg-green-50 text-green-700"
                              : "bg-red-50 text-red-600"
                          }`}
                        >
                          {tenant.active ? "Aktiv" : "Deaktiviert"}
                        </span>

                        <button
                          onClick={() => toggleActive(tenant)}
                          className="flex items-center gap-1.5 rounded-xl bg-slate-950 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800"
                        >
                          <Power size={14} />
                          {tenant.active ? "Deaktivieren" : "Aktivieren"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
