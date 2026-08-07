import "dotenv/config";

import { AsyncLocalStorage } from "node:async_hooks";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

export type TenantContext = {
  tenantId: string;
};

export const tenantContext = new AsyncLocalStorage<TenantContext>();

/**
 * Models that carry a `tenantId` column and must always be scoped to the
 * tenant resolved for the current request. `Tenant`/`TenantDomain` are
 * excluded on purpose: they're what we use to resolve the tenant in the
 * first place.
 */
const TENANT_SCOPED_MODELS = new Set([
  "User",
  "Address",
  "VerificationCode",
  "Category",
  "Product",
  "Order",
  "StockMovement",
  "PfandReturn",
  "PfandWarehouseMovement",
  "CompanySetting",
  "IdempotencyKey",
  "DriverCashAdjustment",
  "DriverLoad",
  "DriverStock",
  "DriverStockMovement",
  "OrderPayment",
  "CashMovement",
  "Supplier",
  "DealerProfile",
  "DealerPrice",
  "StockUnitOption",
  "WarehouseLog",
]);

const WHERE_SCOPED_OPERATIONS = new Set([
  "findFirst",
  "findFirstOrThrow",
  "findUnique",
  "findUniqueOrThrow",
  "findMany",
  "update",
  "updateMany",
  "delete",
  "deleteMany",
  "count",
  "aggregate",
  "groupBy",
]);

function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  });

  return new PrismaClient({ adapter }).$extends({
    name: "tenant-scope",
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const ctx = tenantContext.getStore();

          if (!ctx || !model || !TENANT_SCOPED_MODELS.has(model)) {
            return query(args);
          }

          const scopedArgs = args as Record<string, unknown>;

          if (WHERE_SCOPED_OPERATIONS.has(operation)) {
            scopedArgs.where = {
              ...(scopedArgs.where as object | undefined),
              tenantId: ctx.tenantId,
            };
          } else if (operation === "create") {
            scopedArgs.data = {
              ...(scopedArgs.data as object | undefined),
              tenantId: ctx.tenantId,
            };
          } else if (operation === "createMany") {
            const data = scopedArgs.data;

            scopedArgs.data = Array.isArray(data)
              ? data.map((item) => ({ ...item, tenantId: ctx.tenantId }))
              : data;
          } else if (operation === "upsert") {
            scopedArgs.where = {
              ...(scopedArgs.where as object | undefined),
              tenantId: ctx.tenantId,
            };
            scopedArgs.create = {
              ...(scopedArgs.create as object | undefined),
              tenantId: ctx.tenantId,
            };
          }

          return query(scopedArgs);
        },
      },
    },
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma?: ReturnType<typeof createPrismaClient>;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
