"use client";

import { useLanguage } from "@/context/LanguageContext";
import { Loader2, Plus, Tags } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

type CashDirection = "IN" | "OUT";

type CashCategory = {
  id: string;
  nameDe: string;
  nameTr: string;
  direction: CashDirection;
  active: boolean;
};

export default function CashCategoriesPage() {
  const { language } = useLanguage();

  const [categories, setCategories] = useState<CashCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  const [newNameDe, setNewNameDe] = useState("");
  const [newNameTr, setNewNameTr] = useState("");
  const [newDirection, setNewDirection] = useState<CashDirection>("OUT");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const t =
    language === "de"
      ? {
          title: "Kassenkategorien",
          subtitle:
            "Eigene Kategorien für Ein- und Auszahlungen in der Kasse anlegen — stehen danach im Dropdown auf der Kasse-Seite zur Auswahl.",
          nameDe: "Name (Deutsch)",
          nameTr: "Name (Türkisch)",
          direction: "Richtung",
          directionIn: "Einzahlung",
          directionOut: "Auszahlung",
          add: "Hinzufügen",
          adding: "Wird hinzugefügt...",
          active: "Aktiv",
          inactive: "Inaktiv",
          empty: "Noch keine eigenen Kategorien angelegt.",
          loading: "Kategorien werden geladen...",
          loadError: "Kategorien konnten nicht geladen werden.",
          save: "Speichern",
          inactiveHint:
            "Inaktive Kategorien erscheinen nicht mehr im Dropdown, bleiben aber in bestehenden Buchungen sichtbar.",
        }
      : {
          title: "Kasa Kategorileri",
          subtitle:
            "Kasadaki giriş ve çıkışlar için kendi kategorilerinizi oluşturun — oluşturulduktan sonra Kasa sayfasındaki açılır menüde görünür.",
          nameDe: "İsim (Almanca)",
          nameTr: "İsim (Türkçe)",
          direction: "Yön",
          directionIn: "Giriş",
          directionOut: "Çıkış",
          add: "Ekle",
          adding: "Ekleniyor...",
          active: "Aktif",
          inactive: "Pasif",
          empty: "Henüz özel bir kategori oluşturulmadı.",
          loading: "Kategoriler yükleniyor...",
          loadError: "Kategoriler yüklenemedi.",
          save: "Kaydet",
          inactiveHint:
            "Pasif kategoriler açılır menüde artık görünmez, ancak mevcut kayıtlarda görünmeye devam eder.",
        };

  useEffect(() => {
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadCategories() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/super-admin/cash-categories", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t.loadError);
        return;
      }

      setCategories(data.categories || []);
    } catch {
      setError(t.loadError);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(event: FormEvent) {
    event.preventDefault();

    setCreating(true);
    setCreateError("");

    try {
      const response = await fetch("/api/super-admin/cash-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nameDe: newNameDe,
          nameTr: newNameTr,
          direction: newDirection,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setCreateError(data.error || t.loadError);
        return;
      }

      setCategories((prev) => [...prev, data.category]);
      setNewNameDe("");
      setNewNameTr("");
      setNewDirection("OUT");
    } catch {
      setCreateError(t.loadError);
    } finally {
      setCreating(false);
    }
  }

  function updateLocalCategory(id: string, patch: Partial<CashCategory>) {
    setCategories((prev) =>
      prev.map((category) =>
        category.id === id ? { ...category, ...patch } : category,
      ),
    );
  }

  async function saveCategory(category: CashCategory) {
    setSavingId(category.id);

    try {
      await fetch(`/api/super-admin/cash-categories/${category.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nameDe: category.nameDe,
          nameTr: category.nameTr,
          direction: category.direction,
        }),
      });
    } finally {
      setSavingId(null);
    }
  }

  async function toggleActive(category: CashCategory) {
    const nextActive = !category.active;

    updateLocalCategory(category.id, { active: nextActive });

    await fetch(`/api/super-admin/cash-categories/${category.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: nextActive }),
    });
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
          <Tags size={22} />
        </div>

        <div>
          <h1 className="text-3xl font-black text-slate-950">{t.title}</h1>
          <p className="text-sm text-slate-500">{t.subtitle}</p>
        </div>
      </div>

      <form
        onSubmit={handleCreate}
        className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-black uppercase text-slate-500">
              {t.nameDe}
            </span>
            <input
              required
              value={newNameDe}
              onChange={(event) => setNewNameDe(event.target.value)}
              className="rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-orange-500"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-black uppercase text-slate-500">
              {t.nameTr}
            </span>
            <input
              required
              value={newNameTr}
              onChange={(event) => setNewNameTr(event.target.value)}
              className="rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-orange-500"
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-end gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-black uppercase text-slate-500">
              {t.direction}
            </span>
            <select
              value={newDirection}
              onChange={(event) =>
                setNewDirection(event.target.value as CashDirection)
              }
              className="rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-orange-500"
            >
              <option value="IN">{t.directionIn}</option>
              <option value="OUT">{t.directionOut}</option>
            </select>
          </label>

          <button
            type="submit"
            disabled={creating}
            className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 font-black text-white transition hover:bg-orange-600 disabled:opacity-60"
          >
            {creating ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Plus size={16} />
            )}
            {creating ? t.adding : t.add}
          </button>
        </div>

        {createError ? (
          <p className="mt-3 text-sm font-bold text-red-600">{createError}</p>
        ) : null}
      </form>

      {loading ? (
        <div className="flex items-center gap-3 rounded-2xl bg-white p-7 font-bold text-slate-500 shadow-sm">
          <Loader2 className="animate-spin" />
          {t.loading}
        </div>
      ) : error ? (
        <div className="rounded-2xl bg-red-50 p-5 font-bold text-red-600">
          {error}
        </div>
      ) : categories.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-white p-10 text-center shadow-sm">
          <Tags size={28} className="text-slate-300" />
          <p className="font-bold text-slate-500">{t.empty}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {categories.map((category) => (
            <div
              key={category.id}
              className={`rounded-2xl border p-4 shadow-sm transition ${
                category.active
                  ? "border-slate-200 bg-white"
                  : "border-slate-200 bg-slate-50"
              }`}
            >
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${
                    category.direction === "IN"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {category.direction === "IN"
                    ? t.directionIn
                    : t.directionOut}
                </span>

                <div className="ml-auto flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">
                    {category.active ? t.active : t.inactive}
                  </span>

                  <button
                    type="button"
                    onClick={() => toggleActive(category)}
                    className={`relative h-6 w-11 rounded-full transition ${
                      category.active ? "bg-green-500" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
                        category.active ? "left-5" : "left-0.5"
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-black uppercase text-slate-500">
                    {t.nameDe}
                  </span>
                  <input
                    value={category.nameDe}
                    onChange={(event) =>
                      updateLocalCategory(category.id, {
                        nameDe: event.target.value,
                      })
                    }
                    className="rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-orange-500"
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-xs font-black uppercase text-slate-500">
                    {t.nameTr}
                  </span>
                  <input
                    value={category.nameTr}
                    onChange={(event) =>
                      updateLocalCategory(category.id, {
                        nameTr: event.target.value,
                      })
                    }
                    className="rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-orange-500"
                  />
                </label>
              </div>

              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => saveCategory(category)}
                  disabled={savingId === category.id}
                  className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white transition hover:bg-slate-800 disabled:opacity-60"
                >
                  {savingId === category.id ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    t.save
                  )}
                </button>
              </div>
            </div>
          ))}

          <p className="text-xs text-slate-400">{t.inactiveHint}</p>
        </div>
      )}
    </div>
  );
}
