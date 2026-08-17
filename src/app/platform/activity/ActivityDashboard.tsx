"use client";

import {
  Activity,
  ArrowLeft,
  LogIn,
  Loader2,
  Package,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type LoginEventRow = {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  tenant: { name: string } | null;
};

type AuditLogRow = {
  id: string;
  actorEmail: string;
  actorRole: string;
  summary: string;
  createdAt: string;
  tenant: { name: string };
};

type ActivityOrderRow = {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  tenant: { name: string };
  user: {
    firstName: string | null;
    lastName: string | null;
    companyName: string | null;
    email: string;
  };
};

const roleLabels: Record<string, string> = {
  CUSTOMER: "Kunde",
  DEALER: "Händler",
  ADMIN: "Admin",
  SUPER_ADMIN: "Super-Admin",
  DRIVER: "Fahrer",
  PLATFORM_OWNER: "Platform Owner",
};

const statusLabels: Record<string, string> = {
  NEW: "Neu",
  CONFIRMED: "Bestätigt",
  PREPARING: "Wird vorbereitet",
  READY: "Bereit",
  OUT_FOR_DELIVERY: "Unterwegs",
  DELIVERED: "Geliefert",
  CANCELLED: "Storniert",
};

function formatDate(value: string) {
  return new Date(value).toLocaleString("de-DE");
}

export default function ActivityDashboard() {
  const [logins, setLogins] = useState<LoginEventRow[]>([]);
  const [auditLog, setAuditLog] = useState<AuditLogRow[]>([]);
  const [orders, setOrders] = useState<ActivityOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch("/api/platform/activity");
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Aktivitäten konnten nicht geladen werden.");
          return;
        }

        setLogins(data.logins || []);
        setAuditLog(data.auditLog || []);
        setOrders(data.orders || []);
      } catch {
        setError("Aktivitäten konnten nicht geladen werden.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <main className="min-h-screen bg-slate-100 p-4 sm:p-6 lg:p-10">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-[32px] bg-slate-950 p-7 text-white sm:p-10">
          <Link
            href="/platform"
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 transition hover:text-white"
          >
            <ArrowLeft size={16} />
            Zurück zur Platform-Verwaltung
          </Link>

          <div className="mt-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500">
            <Activity size={28} />
          </div>

          <h1 className="mt-5 text-4xl font-black">Aktivitäten</h1>

          <p className="mt-3 text-slate-400">
            Logins, Änderungsprotokoll und Bestellungen über alle Tenants
            hinweg.
          </p>
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl bg-red-50 p-4 font-bold text-red-600">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="mt-8 flex items-center gap-2 text-slate-500">
            <Loader2 className="animate-spin" size={20} />
            Wird geladen...
          </div>
        ) : (
          <div className="mt-8 space-y-8">
            <section className="rounded-[28px] bg-white p-6">
              <div className="flex items-center gap-3">
                <LogIn className="text-orange-500" />

                <h2 className="text-2xl font-black text-slate-950">
                  Login-Aktivität
                </h2>

                <span className="ml-auto rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
                  {logins.length}
                </span>
              </div>

              {logins.length === 0 ? (
                <p className="mt-6 text-slate-500">
                  Noch keine Logins protokolliert.
                </p>
              ) : (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[600px] text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-left text-xs font-bold uppercase text-slate-400">
                        <th className="pb-2 pr-4">Zeitpunkt</th>
                        <th className="pb-2 pr-4">Tenant</th>
                        <th className="pb-2 pr-4">E-Mail</th>
                        <th className="pb-2">Rolle</th>
                      </tr>
                    </thead>

                    <tbody>
                      {logins.map((login) => (
                        <tr key={login.id} className="border-b border-slate-100">
                          <td className="py-2 pr-4 whitespace-nowrap text-slate-500">
                            {formatDate(login.createdAt)}
                          </td>

                          <td className="py-2 pr-4 font-bold text-slate-950">
                            {login.tenant?.name || "—"}
                          </td>

                          <td className="py-2 pr-4">{login.email}</td>

                          <td className="py-2">
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
                              {roleLabels[login.role] || login.role}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="rounded-[28px] bg-white p-6">
              <div className="flex items-center gap-3">
                <ShieldAlert className="text-orange-500" />

                <h2 className="text-2xl font-black text-slate-950">
                  Änderungsprotokoll
                </h2>

                <span className="ml-auto rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
                  {auditLog.length}
                </span>
              </div>

              {auditLog.length === 0 ? (
                <p className="mt-6 text-slate-500">
                  Noch keine protokollierten Änderungen.
                </p>
              ) : (
                <div className="mt-4 space-y-2">
                  {auditLog.map((entry) => (
                    <div
                      key={entry.id}
                      className="rounded-2xl border border-slate-200 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-black text-orange-600">
                          {entry.tenant.name}
                        </span>

                        <span className="text-xs text-slate-400">
                          {formatDate(entry.createdAt)}
                        </span>
                      </div>

                      <p className="mt-2 font-bold text-slate-950">
                        {entry.summary}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {entry.actorEmail} ·{" "}
                        {roleLabels[entry.actorRole] || entry.actorRole}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-[28px] bg-white p-6">
              <div className="flex items-center gap-3">
                <Package className="text-orange-500" />

                <h2 className="text-2xl font-black text-slate-950">
                  Bestellungen
                </h2>

                <span className="ml-auto rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
                  {orders.length}
                </span>
              </div>

              {orders.length === 0 ? (
                <p className="mt-6 text-slate-500">Noch keine Bestellungen.</p>
              ) : (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[700px] text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-left text-xs font-bold uppercase text-slate-400">
                        <th className="pb-2 pr-4">Zeitpunkt</th>
                        <th className="pb-2 pr-4">Tenant</th>
                        <th className="pb-2 pr-4">Bestellnr.</th>
                        <th className="pb-2 pr-4">Kunde</th>
                        <th className="pb-2 pr-4">Status</th>
                        <th className="pb-2 text-right">Betrag</th>
                      </tr>
                    </thead>

                    <tbody>
                      {orders.map((order) => (
                        <tr key={order.id} className="border-b border-slate-100">
                          <td className="py-2 pr-4 whitespace-nowrap text-slate-500">
                            {formatDate(order.createdAt)}
                          </td>

                          <td className="py-2 pr-4 font-bold text-slate-950">
                            {order.tenant.name}
                          </td>

                          <td className="py-2 pr-4">{order.orderNumber}</td>

                          <td className="py-2 pr-4">
                            {order.user.companyName ||
                              `${order.user.firstName || ""} ${order.user.lastName || ""}`.trim() ||
                              order.user.email}
                          </td>

                          <td className="py-2 pr-4">
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
                              {statusLabels[order.status] || order.status}
                            </span>
                          </td>

                          <td className="py-2 text-right font-bold">
                            {order.totalAmount.toFixed(2)} €
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
