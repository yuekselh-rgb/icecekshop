/*
 * Isolationstest für performTenantSalesReset() (src/lib/reset-sales.ts).
 *
 * Legt zwei Tenants an, füllt bei beiden alle vom Reset betroffenen
 * Modelle (inkl. der fünf Positions-Modelle ohne eigene tenantId-Spalte:
 * OrderItem, CashPurchaseItem, PfandReturnItem, PfandWarehouseMovementItem,
 * DriverLoadItem), führt den Reset NUR für Tenant A aus, und prüft danach
 * Zeile für Zeile, dass Tenant B vollständig unangetastet blieb.
 *
 * SICHERHEIT: läuft ausschließlich gegen eine isolierte, lokale
 * Test-Datenbank. Bricht hart ab, wenn DATABASE_URL nicht eindeutig auf
 * die lokale Test-DB zeigt — es wird niemals gegen die
 * Fluss-Getränke-Produktionsdatenbank ausgeführt.
 */
import "dotenv/config";

const databaseUrl = process.env.DATABASE_URL || "";

const isLocalTestDb =
  databaseUrl.includes("localhost") &&
  databaseUrl.includes("reset_sales_test");

if (!isLocalTestDb) {
  console.error(
    "ABBRUCH: DATABASE_URL zeigt nicht eindeutig auf die lokale Test-Datenbank " +
      "(erwartet: localhost + Datenbankname 'reset_sales_test'). " +
      "Dieses Skript darf niemals gegen die Produktionsdatenbank laufen.",
  );
  process.exit(1);
}

import { prisma } from "../src/lib/prisma";
import { performTenantSalesResetForTenant } from "../src/lib/reset-sales";

async function main() {
  console.log(`Verwende Test-Datenbank: ${databaseUrl.replace(/:[^:@]*@/, ":***@")}`);

  // Sauberer Ausgangszustand
  await prisma.driverCashAdjustment.deleteMany({});
  await prisma.driverStockMovement.deleteMany({});
  await prisma.driverLoadItem.deleteMany({});
  await prisma.driverLoad.deleteMany({});
  await prisma.driverStock.deleteMany({});
  await prisma.cashPurchaseItem.deleteMany({});
  await prisma.cashMovement.deleteMany({});
  await prisma.pfandWarehouseMovementItem.deleteMany({});
  await prisma.pfandWarehouseMovement.deleteMany({});
  await prisma.pfandReturnItem.deleteMany({});
  await prisma.pfandReturn.deleteMany({});
  await prisma.orderPayment.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.stockMovement.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.tenantDomain.deleteMany({});
  await prisma.tenant.deleteMany({});

  async function seedTenant(label: "A" | "B") {
    const tenant = await prisma.tenant.create({
      data: { name: `Test Tenant ${label}` },
    });

    await prisma.tenantDomain.create({
      data: {
        tenantId: tenant.id,
        domain: `tenant-${label.toLowerCase()}.test.local`,
        isPrimary: true,
      },
    });

    const user = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: `customer-${label.toLowerCase()}@test.local`,
        passwordHash: "test-hash",
        role: "CUSTOMER",
        emailVerified: true,
      },
    });

    const category = await prisma.category.create({
      data: {
        tenantId: tenant.id,
        name: `Kategorie ${label}`,
        slug: `kategorie-${label.toLowerCase()}`,
      },
    });

    const product = await prisma.product.create({
      data: {
        tenantId: tenant.id,
        name: `Produkt ${label}`,
        slug: `produkt-${label.toLowerCase()}`,
        price: 5,
        categoryId: category.id,
      },
    });

    const order = await prisma.order.create({
      data: {
        tenantId: tenant.id,
        orderNumber: `TEST-${label}-001`,
        userId: user.id,
        subtotal: 5,
        totalAmount: 5,
        deliveryAddress: "Teststraße 1",
      },
    });

    await prisma.orderItem.create({
      data: {
        orderId: order.id,
        productId: product.id,
        name: product.name,
        price: 5,
        quantity: 1,
      },
    });

    await prisma.orderPayment.create({
      data: {
        tenantId: tenant.id,
        orderId: order.id,
        customerId: user.id,
        amount: 5,
        reportedById: user.id,
        reporterRole: "ADMIN",
      },
    });

    const cashMovement = await prisma.cashMovement.create({
      data: {
        tenantId: tenant.id,
        accountType: "GENERAL",
        direction: "OUT",
        category: "GOODS_PURCHASE",
        amount: 10,
        createdById: user.id,
      },
    });

    await prisma.cashPurchaseItem.create({
      data: {
        movementId: cashMovement.id,
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitPrice: 10,
        totalAmount: 10,
      },
    });

    const pfandReturn = await prisma.pfandReturn.create({
      data: {
        tenantId: tenant.id,
        userId: user.id,
        totalAmount: 2,
      },
    });

    await prisma.pfandReturnItem.create({
      data: {
        pfandReturnId: pfandReturn.id,
        name: "Kasten",
        quantity: 1,
        unitAmount: 2,
        totalAmount: 2,
      },
    });

    const pfandWarehouseMovement = await prisma.pfandWarehouseMovement.create({
      data: {
        tenantId: tenant.id,
        type: "IN",
        partyType: "CUSTOMER",
        totalAmount: 2,
        createdById: user.id,
      },
    });

    await prisma.pfandWarehouseMovementItem.create({
      data: {
        movementId: pfandWarehouseMovement.id,
        name: "Kasten",
        quantity: 1,
        unitAmount: 2,
        totalAmount: 2,
      },
    });

    const driverLoad = await prisma.driverLoad.create({
      data: {
        tenantId: tenant.id,
        driverId: user.id,
        createdById: user.id,
      },
    });

    await prisma.driverLoadItem.create({
      data: {
        loadId: driverLoad.id,
        productId: product.id,
        quantity: 3,
      },
    });

    await prisma.driverStock.create({
      data: {
        tenantId: tenant.id,
        driverId: user.id,
        productId: product.id,
        quantity: 3,
      },
    });

    await prisma.driverStockMovement.create({
      data: {
        tenantId: tenant.id,
        driverId: user.id,
        productId: product.id,
        type: "LOAD",
        amount: 3,
        loadId: driverLoad.id,
      },
    });

    await prisma.driverCashAdjustment.create({
      data: {
        tenantId: tenant.id,
        driverId: user.id,
        pfandReturnId: pfandReturn.id,
        reportedAmount: 2,
        approvedAmount: 2,
        adjustmentAmount: 0,
        createdById: user.id,
      },
    });

    await prisma.stockMovement.create({
      data: {
        tenantId: tenant.id,
        productId: product.id,
        amount: -1,
        reason: "Testbestellung",
      },
    });

    return { tenant, order, cashMovement, pfandReturn, pfandWarehouseMovement, driverLoad };
  }

  const tenantA = await seedTenant("A");
  const tenantB = await seedTenant("B");

  async function countAll(tenantId: string) {
    return {
      orders: await prisma.order.count({ where: { tenantId } }),
      orderItems: await prisma.orderItem.count({ where: { order: { tenantId } } }),
      orderPayments: await prisma.orderPayment.count({ where: { tenantId } }),
      cashMovements: await prisma.cashMovement.count({ where: { tenantId } }),
      cashPurchaseItems: await prisma.cashPurchaseItem.count({
        where: { movement: { tenantId } },
      }),
      pfandReturns: await prisma.pfandReturn.count({ where: { tenantId } }),
      pfandReturnItems: await prisma.pfandReturnItem.count({
        where: { pfandReturn: { tenantId } },
      }),
      pfandWarehouseMovements: await prisma.pfandWarehouseMovement.count({
        where: { tenantId },
      }),
      pfandWarehouseMovementItems: await prisma.pfandWarehouseMovementItem.count({
        where: { movement: { tenantId } },
      }),
      driverLoads: await prisma.driverLoad.count({ where: { tenantId } }),
      driverLoadItems: await prisma.driverLoadItem.count({
        where: { load: { tenantId } },
      }),
      driverStockMovements: await prisma.driverStockMovement.count({
        where: { tenantId },
      }),
      driverCashAdjustments: await prisma.driverCashAdjustment.count({
        where: { tenantId },
      }),
      stockMovements: await prisma.stockMovement.count({ where: { tenantId } }),
      driverStockQuantity: (
        await prisma.driverStock.findMany({ where: { tenantId } })
      ).reduce((sum, row) => sum + row.quantity, 0),
    };
  }

  const beforeA = await countAll(tenantA.tenant.id);
  const beforeB = await countAll(tenantB.tenant.id);

  console.log("\nVor dem Reset:");
  console.log("Tenant A:", beforeA);
  console.log("Tenant B:", beforeB);

  const allNonZero = Object.entries(beforeA).every(([, v]) => v > 0);
  if (!allNonZero) {
    throw new Error(
      "Seed-Daten unvollständig — nicht jedes betroffene Modell hat einen Datensatz für Tenant A. Test ungültig.",
    );
  }

  console.log("\nFühre performTenantSalesResetForTenant() NUR für Tenant A aus...");
  const result = await performTenantSalesResetForTenant(tenantA.tenant.id);
  console.log("Ergebnis:", result);

  const afterA = await countAll(tenantA.tenant.id);
  const afterB = await countAll(tenantB.tenant.id);

  console.log("\nNach dem Reset:");
  console.log("Tenant A:", afterA);
  console.log("Tenant B:", afterB);

  const failures: string[] = [];

  for (const [key, value] of Object.entries(afterA)) {
    if (value !== 0) {
      failures.push(`Tenant A: ${key} wurde NICHT vollständig gelöscht (verbleibend: ${value})`);
    }
  }

  for (const key of Object.keys(beforeB) as (keyof typeof beforeB)[]) {
    if (afterB[key] !== beforeB[key]) {
      failures.push(
        `Tenant B: ${key} veränderte sich (vorher: ${beforeB[key]}, nachher: ${afterB[key]}) — TENANT-ISOLATION VERLETZT`,
      );
    }
  }

  // Aufräumen (gleiche Reihenfolge wie der Ausgangszustand oben, damit
  // auch die für Tenant B unangetastet gebliebenen Datensätze sauber
  // entfernt werden, bevor Products/Categories/Users/Tenants fallen)
  await prisma.driverCashAdjustment.deleteMany({});
  await prisma.driverStockMovement.deleteMany({});
  await prisma.driverLoadItem.deleteMany({});
  await prisma.driverLoad.deleteMany({});
  await prisma.driverStock.deleteMany({});
  await prisma.cashPurchaseItem.deleteMany({});
  await prisma.cashMovement.deleteMany({});
  await prisma.pfandWarehouseMovementItem.deleteMany({});
  await prisma.pfandWarehouseMovement.deleteMany({});
  await prisma.pfandReturnItem.deleteMany({});
  await prisma.pfandReturn.deleteMany({});
  await prisma.orderPayment.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.stockMovement.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.tenantDomain.deleteMany({});
  await prisma.tenant.deleteMany({});

  if (failures.length > 0) {
    console.error("\nFEHLGESCHLAGEN:");
    for (const failure of failures) {
      console.error(" - " + failure);
    }
    process.exitCode = 1;
    return;
  }

  console.log(
    "\nERFOLGREICH: Tenant A wurde vollständig zurückgesetzt, Tenant B blieb in jedem geprüften Modell unverändert.",
  );
}

main()
  .catch((error) => {
    console.error("Testskript fehlgeschlagen:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
