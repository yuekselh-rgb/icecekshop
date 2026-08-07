-- Multi-tenant foundation.
-- Adds Tenant/TenantDomain, stamps every existing row with the "Fluss Getränke" tenant,
-- then enforces NOT NULL / uniqueness. Columns are added nullable first so this is safe
-- to run against a populated database.

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'PLATFORM_OWNER';

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantDomain" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TenantDomain_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TenantDomain_domain_key" ON "TenantDomain"("domain");

-- CreateIndex
CREATE INDEX "TenantDomain_tenantId_idx" ON "TenantDomain"("tenantId");

-- AddForeignKey
ALTER TABLE "TenantDomain" ADD CONSTRAINT "TenantDomain_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed the existing tenant so nothing that Fluss Getränke already entered is lost.
INSERT INTO "Tenant" ("id", "name", "active", "createdAt", "updatedAt")
VALUES ('tenant_fluss_getraenke', 'Fluss Getränke', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO "TenantDomain" ("id", "tenantId", "domain", "isPrimary", "createdAt")
VALUES
    ('tenantdomain_flussgetraenke_de', 'tenant_fluss_getraenke', 'flussgetraenke.de', true, CURRENT_TIMESTAMP),
    ('tenantdomain_www_flussgetraenke_de', 'tenant_fluss_getraenke', 'www.flussgetraenke.de', false, CURRENT_TIMESTAMP);

-- AlterTable: add tenantId as NULLABLE first so existing rows are not rejected.
ALTER TABLE "Address" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "CashMovement" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "Category" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "CompanySetting" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "DealerPrice" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "DealerProfile" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "DriverCashAdjustment" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "DriverLoad" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "DriverStock" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "DriverStockMovement" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "IdempotencyKey" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "Order" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "OrderPayment" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "PfandReturn" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "PfandWarehouseMovement" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "Product" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "StockMovement" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "StockUnitOption" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "Supplier" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "User" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "VerificationCode" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "WarehouseLog" ADD COLUMN "tenantId" TEXT;

-- Backfill: every existing row belongs to Fluss Getränke.
UPDATE "User" SET "tenantId" = 'tenant_fluss_getraenke';
UPDATE "Address" SET "tenantId" = 'tenant_fluss_getraenke';
UPDATE "VerificationCode" SET "tenantId" = 'tenant_fluss_getraenke';
UPDATE "Category" SET "tenantId" = 'tenant_fluss_getraenke';
UPDATE "Product" SET "tenantId" = 'tenant_fluss_getraenke';
UPDATE "Order" SET "tenantId" = 'tenant_fluss_getraenke';
UPDATE "StockMovement" SET "tenantId" = 'tenant_fluss_getraenke';
UPDATE "PfandReturn" SET "tenantId" = 'tenant_fluss_getraenke';
UPDATE "PfandWarehouseMovement" SET "tenantId" = 'tenant_fluss_getraenke';
UPDATE "CompanySetting" SET "tenantId" = 'tenant_fluss_getraenke';
UPDATE "IdempotencyKey" SET "tenantId" = 'tenant_fluss_getraenke';
UPDATE "DriverCashAdjustment" SET "tenantId" = 'tenant_fluss_getraenke';
UPDATE "DriverLoad" SET "tenantId" = 'tenant_fluss_getraenke';
UPDATE "DriverStock" SET "tenantId" = 'tenant_fluss_getraenke';
UPDATE "DriverStockMovement" SET "tenantId" = 'tenant_fluss_getraenke';
UPDATE "OrderPayment" SET "tenantId" = 'tenant_fluss_getraenke';
UPDATE "CashMovement" SET "tenantId" = 'tenant_fluss_getraenke';
UPDATE "Supplier" SET "tenantId" = 'tenant_fluss_getraenke';
UPDATE "DealerProfile" SET "tenantId" = 'tenant_fluss_getraenke';
UPDATE "DealerPrice" SET "tenantId" = 'tenant_fluss_getraenke';
UPDATE "StockUnitOption" SET "tenantId" = 'tenant_fluss_getraenke';
UPDATE "WarehouseLog" SET "tenantId" = 'tenant_fluss_getraenke';

-- Enforce NOT NULL now that every row is backfilled.
-- User.tenantId stays nullable: it is the only role-carrying table where PLATFORM_OWNER
-- accounts (no tenant) live.
ALTER TABLE "Address" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "CashMovement" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Category" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "CompanySetting" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "DealerPrice" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "DealerProfile" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "DriverCashAdjustment" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "DriverLoad" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "DriverStock" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "DriverStockMovement" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "IdempotencyKey" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "OrderPayment" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "PfandReturn" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "PfandWarehouseMovement" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Product" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "StockMovement" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "StockUnitOption" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Supplier" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "VerificationCode" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "WarehouseLog" ALTER COLUMN "tenantId" SET NOT NULL;

-- CompanySetting is no longer a hardcoded "main" singleton, it's one row per tenant.
ALTER TABLE "CompanySetting" ALTER COLUMN "id" DROP DEFAULT;

-- DropIndex: old global-uniqueness constraints, replaced by tenant-scoped ones below.
DROP INDEX "Category_slug_key";
DROP INDEX "DealerProfile_dealerNumber_key";
DROP INDEX "IdempotencyKey_key_key";
DROP INDEX "Order_orderNumber_key";
DROP INDEX "Product_slug_key";
DROP INDEX "StockUnitOption_code_key";
DROP INDEX "Supplier_name_idx";
DROP INDEX "Supplier_name_key";
DROP INDEX "User_email_key";

-- CreateIndex
CREATE INDEX "Address_tenantId_idx" ON "Address"("tenantId");
CREATE INDEX "CashMovement_tenantId_idx" ON "CashMovement"("tenantId");
CREATE UNIQUE INDEX "Category_tenantId_slug_key" ON "Category"("tenantId", "slug");
CREATE UNIQUE INDEX "CompanySetting_tenantId_key" ON "CompanySetting"("tenantId");
CREATE INDEX "DealerPrice_tenantId_idx" ON "DealerPrice"("tenantId");
CREATE UNIQUE INDEX "DealerProfile_tenantId_dealerNumber_key" ON "DealerProfile"("tenantId", "dealerNumber");
CREATE INDEX "DriverCashAdjustment_tenantId_idx" ON "DriverCashAdjustment"("tenantId");
CREATE INDEX "DriverLoad_tenantId_idx" ON "DriverLoad"("tenantId");
CREATE INDEX "DriverStock_tenantId_idx" ON "DriverStock"("tenantId");
CREATE INDEX "DriverStockMovement_tenantId_idx" ON "DriverStockMovement"("tenantId");
CREATE UNIQUE INDEX "IdempotencyKey_tenantId_key_key" ON "IdempotencyKey"("tenantId", "key");
CREATE UNIQUE INDEX "Order_tenantId_orderNumber_key" ON "Order"("tenantId", "orderNumber");
CREATE INDEX "OrderPayment_tenantId_idx" ON "OrderPayment"("tenantId");
CREATE INDEX "PfandReturn_tenantId_idx" ON "PfandReturn"("tenantId");
CREATE INDEX "PfandWarehouseMovement_tenantId_idx" ON "PfandWarehouseMovement"("tenantId");
CREATE UNIQUE INDEX "Product_tenantId_slug_key" ON "Product"("tenantId", "slug");
CREATE INDEX "StockMovement_tenantId_idx" ON "StockMovement"("tenantId");
CREATE UNIQUE INDEX "StockUnitOption_tenantId_code_key" ON "StockUnitOption"("tenantId", "code");
CREATE UNIQUE INDEX "Supplier_tenantId_name_key" ON "Supplier"("tenantId", "name");
CREATE UNIQUE INDEX "User_tenantId_email_key" ON "User"("tenantId", "email");
CREATE INDEX "VerificationCode_tenantId_idx" ON "VerificationCode"("tenantId");
CREATE INDEX "WarehouseLog_tenantId_idx" ON "WarehouseLog"("tenantId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Address" ADD CONSTRAINT "Address_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VerificationCode" ADD CONSTRAINT "VerificationCode_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Category" ADD CONSTRAINT "Category_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Product" ADD CONSTRAINT "Product_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PfandReturn" ADD CONSTRAINT "PfandReturn_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PfandWarehouseMovement" ADD CONSTRAINT "PfandWarehouseMovement_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CompanySetting" ADD CONSTRAINT "CompanySetting_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IdempotencyKey" ADD CONSTRAINT "IdempotencyKey_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DriverCashAdjustment" ADD CONSTRAINT "DriverCashAdjustment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DriverLoad" ADD CONSTRAINT "DriverLoad_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DriverStock" ADD CONSTRAINT "DriverStock_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DriverStockMovement" ADD CONSTRAINT "DriverStockMovement_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrderPayment" ADD CONSTRAINT "OrderPayment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CashMovement" ADD CONSTRAINT "CashMovement_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DealerProfile" ADD CONSTRAINT "DealerProfile_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DealerPrice" ADD CONSTRAINT "DealerPrice_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StockUnitOption" ADD CONSTRAINT "StockUnitOption_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WarehouseLog" ADD CONSTRAINT "WarehouseLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
