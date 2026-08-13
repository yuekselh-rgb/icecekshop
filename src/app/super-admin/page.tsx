import { prisma } from "@/lib/prisma";
import { getCurrentTenant } from "@/lib/tenant";

import DashboardOverview, {
  type DashboardStats,
} from "./_components/DashboardOverview";

export const dynamic = "force-dynamic";

function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

async function loadDashboardStats(tenantId: string): Promise<DashboardStats> {
  const today = startOfDay(new Date());

  const fourteenDaysAgo = new Date(today);
  fourteenDaysAgo.setDate(today.getDate() - 13);

  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 29);

  const [
    totalCustomers,
    revenueAgg,
    totalOrders,
    pfandAgg,
    recentOrdersForChart,
    recentItemsForCategory,
    recentOrdersForCityAndType,
  ] = await Promise.all([
    prisma.user.count({
      where: { tenantId, role: "CUSTOMER" },
    }),

    prisma.order.aggregate({
      where: { tenantId, status: { not: "CANCELLED" } },
      _sum: { totalAmount: true },
    }),

    prisma.order.count({
      where: { tenantId, status: { not: "CANCELLED" } },
    }),

    prisma.pfandReturn.aggregate({
      where: { tenantId, status: { notIn: ["PENDING", "CANCELLED"] } },
      _count: { _all: true },
      _sum: { approvedAmount: true },
    }),

    prisma.order.findMany({
      where: {
        tenantId,
        status: { not: "CANCELLED" },
        createdAt: { gte: fourteenDaysAgo },
      },
      select: { createdAt: true, totalAmount: true },
    }),

    prisma.orderItem.findMany({
      where: {
        order: {
          tenantId,
          status: { not: "CANCELLED" },
          createdAt: { gte: thirtyDaysAgo },
        },
      },
      select: {
        price: true,
        quantity: true,
        product: {
          select: {
            category: {
              select: { name: true, nameDe: true, nameTr: true },
            },
          },
        },
      },
    }),

    prisma.order.findMany({
      where: {
        tenantId,
        status: { not: "CANCELLED" },
        createdAt: { gte: thirtyDaysAgo },
      },
      select: {
        totalAmount: true,
        user: {
          select: {
            customerType: true,
            addresses: {
              where: { isDefault: true },
              select: { city: true },
              take: 1,
            },
          },
        },
      },
    }),
  ]);

  // Umsatz-Verlauf: letzte 14 Tage, tageweise aufsummiert (kein
  // datenbankübergreifend sicheres groupBy-nach-Tag in Prisma, daher
  // Bucketing hier im Code).
  const dailyBuckets = new Map<string, number>();

  for (let i = 0; i < 14; i += 1) {
    const day = new Date(fourteenDaysAgo);
    day.setDate(fourteenDaysAgo.getDate() + i);
    dailyBuckets.set(dateKey(day), 0);
  }

  for (const order of recentOrdersForChart) {
    const key = dateKey(order.createdAt);
    dailyBuckets.set(key, (dailyBuckets.get(key) ?? 0) + Number(order.totalAmount));
  }

  const dailyRevenue = Array.from(dailyBuckets.entries()).map(([date, amount]) => ({
    date,
    amount,
  }));

  // Umsatz nach Kategorie (letzte 30 Tage).
  const categoryTotals = new Map<
    string,
    { name: string; nameDe: string; nameTr: string; amount: number }
  >();

  for (const item of recentItemsForCategory) {
    const category = item.product.category;
    const key = category.name;

    const existing = categoryTotals.get(key);
    const amount = Number(item.price) * item.quantity;

    if (existing) {
      existing.amount += amount;
    } else {
      categoryTotals.set(key, {
        name: category.name,
        nameDe: category.nameDe || category.name,
        nameTr: category.nameTr || category.name,
        amount,
      });
    }
  }

  const categoryBreakdown = Array.from(categoryTotals.values())
    .map((entry) => ({
      label: { de: entry.nameDe, tr: entry.nameTr },
      amount: entry.amount,
    }))
    .sort((first, second) => second.amount - first.amount);

  // Umsatz nach Stadt (letzte 30 Tage). Nähert sich über die als
  // Standard markierte Kundenadresse an, da die im Order gespeicherte
  // deliveryAddress ein reiner Text-Snapshot ohne Stadt-Feld ist.
  const cityTotals = new Map<string, number>();
  const customerTypeTotals = { private: 0, business: 0 };

  for (const order of recentOrdersForCityAndType) {
    const amount = Number(order.totalAmount);
    const city = order.user.addresses[0]?.city?.trim();
    const cityKey = city && city.length > 0 ? city : "__unknown__";

    cityTotals.set(cityKey, (cityTotals.get(cityKey) ?? 0) + amount);

    if (order.user.customerType === "BUSINESS") {
      customerTypeTotals.business += amount;
    } else {
      customerTypeTotals.private += amount;
    }
  }

  const cityBreakdown = Array.from(cityTotals.entries())
    .map(([city, amount]) => ({ city, amount }))
    .sort((first, second) => second.amount - first.amount);

  return {
    totalCustomers,
    totalRevenue: Number(revenueAgg._sum.totalAmount ?? 0),
    totalOrders,
    pfandReturnsCount: pfandAgg._count._all,
    pfandReturnsAmount: Number(pfandAgg._sum.approvedAmount ?? 0),
    dailyRevenue,
    categoryBreakdown,
    cityBreakdown,
    customerTypeBreakdown: customerTypeTotals,
  };
}

export default async function SuperAdminPage() {
  const tenant = await getCurrentTenant();

  const stats = tenant
    ? await loadDashboardStats(tenant.id)
    : {
        totalCustomers: 0,
        totalRevenue: 0,
        totalOrders: 0,
        pfandReturnsCount: 0,
        pfandReturnsAmount: 0,
        dailyRevenue: [],
        categoryBreakdown: [],
        cityBreakdown: [],
        customerTypeBreakdown: { private: 0, business: 0 },
      };

  return <DashboardOverview stats={stats} />;
}
