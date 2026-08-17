import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

async function requirePlatformOwner() {
  const session = await getSession();

  if (!session || session.role !== "PLATFORM_OWNER") {
    return null;
  }

  return session;
}

/*
 * Bewusst ohne withTenant — läuft auf dem Platform-Host und liest
 * absichtlich tenantübergreifend (siehe src/app/api/platform/tenants/route.ts
 * für dasselbe Muster). LoginEvent/AuditLog/Order sind entweder nicht in
 * TENANT_SCOPED_MODELS (die ersten beiden) oder es läuft ohnehin kein
 * tenantContext, daher liefert findMany() hier alle Tenants.
 */
export async function GET() {
  const session = await requirePlatformOwner();

  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 403 });
  }

  try {
    const [logins, auditLog, orders] = await Promise.all([
      prisma.loginEvent.findMany({
        orderBy: { createdAt: "desc" },
        take: 200,
        include: {
          tenant: {
            select: { name: true },
          },
        },
      }),

      prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 200,
        include: {
          tenant: {
            select: { name: true },
          },
        },
      }),

      prisma.order.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 100,
        include: {
          tenant: {
            select: { name: true },
          },
          user: {
            select: {
              firstName: true,
              lastName: true,
              companyName: true,
              email: true,
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      logins,
      auditLog,
      orders: orders.map((order) => ({
        ...order,
        subtotal: Number(order.subtotal),
        deliveryFee: Number(order.deliveryFee),
        pfandAmount: Number(order.pfandAmount),
        totalAmount: Number(order.totalAmount),
      })),
    });
  } catch (error) {
    console.error("LOAD_PLATFORM_ACTIVITY_ERROR", error);

    return NextResponse.json(
      { error: "Aktivitäten konnten nicht geladen werden." },
      { status: 500 },
    );
  }
}
