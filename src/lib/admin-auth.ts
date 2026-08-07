import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export const adminPermissionNames = [
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
] as const;

export type AdminPermissionName = (typeof adminPermissionNames)[number];

export async function getAdminSession() {
  return getSession();
}

export async function getAdminWithPermissions() {
  const session = await getAdminSession();

  if (!session) {
    return null;
  }

  if (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN") {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.userId,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      companyName: true,
      role: true,
      isActive: true,
      adminPermission: true,
    },
  });

  if (!user || !user.isActive) {
    return null;
  }

  if (session.role === "SUPER_ADMIN") {
    return {
      session,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        companyName: user.companyName,
        role: user.role,
      },
      isSuperAdmin: true,
      permissions: Object.fromEntries(
        adminPermissionNames.map((name) => [name, true]),
      ) as Record<AdminPermissionName, boolean>,
    };
  }

  const storedPermissions = (user.adminPermission || {}) as Partial<
    Record<AdminPermissionName, boolean>
  >;

  const permissions = Object.fromEntries(
    adminPermissionNames.map((name) => [
      name,
      storedPermissions[name] ?? false,
    ]),
  ) as Record<AdminPermissionName, boolean>;

  return {
    session,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      companyName: user.companyName,
      role: user.role,
    },
    isSuperAdmin: false,
    permissions,
  };
}

export async function requireAdminPermission(permission: AdminPermissionName) {
  const admin = await getAdminWithPermissions();

  if (!admin) {
    return null;
  }

  if (!admin.isSuperAdmin && !admin.permissions[permission]) {
    return null;
  }

  return admin;
}
