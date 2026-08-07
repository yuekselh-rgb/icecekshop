"use client";

import { Loader2, LockKeyhole, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function PlatformLoginPage() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/platform/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.get("email"),
          password: formData.get("password"),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Anmeldung fehlgeschlagen.");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Anmeldung fehlgeschlagen.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-md rounded-[28px] bg-white p-8 shadow-xl">
        <p className="text-xs font-black uppercase tracking-widest text-orange-500">
          Platform
        </p>

        <h1 className="mt-2 text-3xl font-black text-slate-950">
          Owner-Anmeldung
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Verwaltung aller Tenants/Shops dieser Plattform.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="relative">
            <Mail
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              required
              type="email"
              name="email"
              placeholder="E-Mail"
              className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 outline-none focus:border-orange-500"
            />
          </div>

          <div className="relative">
            <LockKeyhole
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              required
              type="password"
              name="password"
              placeholder="Passwort"
              className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 outline-none focus:border-orange-500"
            />
          </div>

          {error ? (
            <div className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-600">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-4 font-black text-white transition hover:bg-slate-800 disabled:bg-slate-400"
          >
            {isLoading ? (
              <>
                <Loader2 size={19} className="animate-spin" />
                Anmeldung läuft...
              </>
            ) : (
              "Anmelden"
            )}
          </button>
        </form>
      </div>
    </main>
  );
}
