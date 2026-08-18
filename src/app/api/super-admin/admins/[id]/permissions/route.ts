import { verifySessionToken } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit-log";
import { prisma } from "@/lib/prisma";
import { getRequestLanguage } from "@/lib/request-language";
import { withTenant } from "@/lib/tenant";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const permissionNames = [
  "viewProducts",
  "createProduct",
  "updateProduct",
  "deleteProduct",
  "changePrice",
  "manageOffers",

  "viewCategories",
  "createCategory",
  "updateCategory",
  "deleteCategory",

  "viewStock",
  "addStock",
  "reduceStock",
  "deleteWarehouseLog",

  "viewDriverStock",
  "manageDriverStock",

  "viewOrders",
  "updateOrder",
  "approveCustomerPayment",
  "deleteOrder",
  "printOrder",

  "viewCustomers",
  "managePfand",
  "viewDealerAccounts",
  "manageDealerPrices",
  "updateDealer",
  "createDealer",
  "viewDealers",

  "makeBarSale",
  "viewBarSalesReport",
  "viewOrderReport",

  "viewBarCash",
  "createBarCashIncome",
  "createBarCashExpense",
  "deleteBarCashMovement",
  "viewCashReport",
  "createCashHandover",
] as const;

type PermissionName = (typeof permissionNames)[number];

async function requireSuperAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("paketmarket_session")?.value;

  if (!token) {
    return null;
  }

  const session = await verifySessionToken(token);

  return session?.role === "SUPER_ADMIN" ? session : null;
}

export const GET = withTenant(async (
  _request: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  },
) => {
  const language = await getRequestLanguage();

  const session = await requireSuperAdmin();

  if (!session) {
    return NextResponse.json(
      { error: language === "de" ? "Unbefugter Zugriff." : "Yetkisiz erişim." },
      { status: 403 },
    );
  }

  const { id } = await context.params;

  const admin = await prisma.user.findFirst({
    where: {
      id,
      role: "ADMIN",
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      adminPermission: true,
    },
  });

  if (!admin) {
    return NextResponse.json(
      { error: language === "de" ? "Admin nicht gefunden." : "Admin bulunamadı." },
      { status: 404 },
    );
  }

  return NextResponse.json({ admin });
});

export const PATCH = withTenant(async (
  request: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  },
  tenant,
) => {
  const language = await getRequestLanguage();

  const session = await requireSuperAdmin();

  if (!session) {
    return NextResponse.json(
      { error: language === "de" ? "Unbefugter Zugriff." : "Yetkisiz erişim." },
      { status: 403 },
    );
  }

  const { id } = await context.params;
  const body = await request.json();

  const admin = await prisma.user.findFirst({
    where: {
      id,
      role: "ADMIN",
    },
    select: {
      id: true,
      email: true,
    },
  });

  if (!admin) {
    return NextResponse.json(
      { error: language === "de" ? "Admin nicht gefunden." : "Admin bulunamadı." },
      { status: 404 },
    );
  }

  const data: Partial<Record<PermissionName, boolean>> = {};

  for (const name of permissionNames) {
    if (typeof body[name] === "boolean") {
      data[name] = body[name];
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json(
      {
        error:
          language === "de"
            ? "Keine gültige Berechtigung zum Aktualisieren gefunden."
            : "Güncellenecek geçerli yetki bulunamadı.",
      },
      { status: 400 },
    );
  }

  /*
   * Yetki bağımlılıkları yalnızca arayüzde değil,
   * API tarafında da zorunlu tutulur.
   */

  if (data.makeBarSale === true) {
    data.viewProducts = true;
    data.viewCategories = true;
    data.viewStock = true;
  }

  if (data.viewProducts === false) {
    data.createProduct = false;
    data.updateProduct = false;
    data.deleteProduct = false;
    data.changePrice = false;
    data.manageOffers = false;
    data.makeBarSale = false;
  }

  if (data.viewCategories === false) {
    data.createCategory = false;
    data.updateCategory = false;
    data.deleteCategory = false;
    data.makeBarSale = false;
  }

  if (data.deleteWarehouseLog === true) {
    data.viewStock = true;
  }

  if (data.viewStock === false) {
    data.addStock = false;
    data.reduceStock = false;
    data.deleteWarehouseLog = false;
    data.makeBarSale = false;
    data.manageDriverStock = false;
  }

  /*
   * Şoföre stok yükleme ve düzeltme yetkisi için
   * şoför stok ekranı, ürünler ve ana stok görünümü gerekir.
   */
  if (data.manageDriverStock === true) {
    data.viewDriverStock = true;
    data.viewProducts = true;
    data.viewStock = true;
  }

  if (data.viewDriverStock === false) {
    data.manageDriverStock = false;
  }

  if (data.viewOrders === false) {
    data.updateOrder = false;
    data.deleteOrder = false;
    data.printOrder = false;
    data.viewOrderReport = false;
  }

  if (
    data.createBarCashIncome === true ||
    data.createBarCashExpense === true ||
    data.deleteBarCashMovement === true
  ) {
    data.viewBarCash = true;
  }

  if (data.viewBarCash === false) {
    data.createBarCashIncome = false;
    data.createBarCashExpense = false;
    data.deleteBarCashMovement = false;
  }

  if (
    data.createDealer === true ||
    data.updateDealer === true ||
    data.manageDealerPrices === true ||
    data.viewDealerAccounts === true
  ) {
    data.viewDealers = true;
  }

  if (data.viewDealers === false) {
    data.createDealer = false;
    data.updateDealer = false;
    data.manageDealerPrices = false;
    data.viewDealerAccounts = false;
  }

  const permissions = await prisma.adminPermission.upsert({
    where: {
      userId: id,
    },
    update: data,
    create: {
      userId: id,
      ...data,
    },
  });

  await logAuditEvent({
    tenantId: tenant.id,
    actorUserId: session.userId,
    actorEmail: session.email,
    actorRole: session.role,
    action: "admin.permissions_updated",
    summary: `Berechtigungen von ${admin.email} geändert.`,
    entityType: "User",
    entityId: id,
    metadata: data,
  });

  return NextResponse.json({
    message:
      language === "de"
        ? "Admin-Berechtigungen wurden aktualisiert."
        : "Admin yetkileri güncellendi.",
    permissions,
  });
});
