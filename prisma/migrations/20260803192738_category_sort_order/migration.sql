-- CreateEnum
CREATE TYPE "StockUnit" AS ENUM ('KASA', 'KARTON', 'PAKET', 'ADET');

-- CreateEnum
CREATE TYPE "DriverLoadStatus" AS ENUM ('DRAFT', 'CONFIRMED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DriverStockMovementType" AS ENUM ('LOAD', 'SALE', 'RETURN', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "OrderPaymentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "OrderPaymentReporterRole" AS ENUM ('DRIVER', 'ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CARD', 'OPEN');

-- CreateEnum
CREATE TYPE "ProductStockUnit" AS ENUM ('KASA', 'KARTON', 'PAKET', 'ADET');

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'DEALER';

-- AlterTable
ALTER TABLE "AdminPermission" ADD COLUMN     "approveCustomerPayment" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "createDealer" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "manageDealerPrices" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "manageDriverStock" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "updateDealer" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "viewDealerAccounts" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "viewDealers" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "viewDriverStock" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "CompanySetting" ADD COLUMN     "accountHolder" TEXT,
ADD COLUMN     "address" TEXT,
ADD COLUMN     "bankName" TEXT,
ADD COLUMN     "bic" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "commercialRegister" TEXT,
ADD COLUMN     "companyDescription" TEXT,
ADD COLUMN     "copyrightText" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "facebook" TEXT,
ADD COLUMN     "footerText" TEXT,
ADD COLUMN     "houseNumber" TEXT,
ADD COLUMN     "iban" TEXT,
ADD COLUMN     "instagram" TEXT,
ADD COLUMN     "legalForm" TEXT,
ADD COLUMN     "linkedin" TEXT,
ADD COLUMN     "logoHeight" INTEGER NOT NULL DEFAULT 120,
ADD COLUMN     "logoWidth" INTEGER NOT NULL DEFAULT 260,
ADD COLUMN     "managingDirector" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "postalCode" TEXT,
ADD COLUMN     "registerCourt" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "street" TEXT,
ADD COLUMN     "taxNumber" TEXT,
ADD COLUMN     "tiktok" TEXT,
ADD COLUMN     "twitter" TEXT,
ADD COLUMN     "vatId" TEXT,
ADD COLUMN     "website" TEXT,
ADD COLUMN     "whatsapp" TEXT;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "driverPaymentReportedAmount" DECIMAL(10,2),
ADD COLUMN     "driverPaymentReportedAt" TIMESTAMP(3),
ADD COLUMN     "paymentApprovedAt" TIMESTAMP(3),
ADD COLUMN     "paymentApprovedById" TEXT;

-- CreateTable
CREATE TABLE "DriverLoad" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "status" "DriverLoadStatus" NOT NULL DEFAULT 'CONFIRMED',
    "note" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriverLoad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverLoadItem" (
    "id" TEXT NOT NULL,
    "loadId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DriverLoadItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverStock" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriverStock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverStockMovement" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "loadId" TEXT,
    "orderId" TEXT,
    "type" "DriverStockMovementType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "createdById" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DriverStockMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderPayment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "driverId" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "paymentMethod" "PaymentMethod",
    "status" "OrderPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "reportedById" TEXT NOT NULL,
    "reporterRole" "OrderPaymentReporterRole" NOT NULL,
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectedById" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dealerNumber" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "contactName" TEXT,
    "phone" TEXT,
    "taxNumber" TEXT,
    "street" TEXT,
    "houseNumber" TEXT,
    "postalCode" TEXT,
    "city" TEXT,
    "country" TEXT NOT NULL DEFAULT 'Deutschland',
    "creditLimit" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "currentBalance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "note" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DealerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealerPrice" (
    "id" TEXT NOT NULL,
    "dealerId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DealerPrice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DriverLoad_driverId_idx" ON "DriverLoad"("driverId");

-- CreateIndex
CREATE INDEX "DriverLoad_createdById_idx" ON "DriverLoad"("createdById");

-- CreateIndex
CREATE INDEX "DriverLoad_status_idx" ON "DriverLoad"("status");

-- CreateIndex
CREATE INDEX "DriverLoad_createdAt_idx" ON "DriverLoad"("createdAt");

-- CreateIndex
CREATE INDEX "DriverLoadItem_loadId_idx" ON "DriverLoadItem"("loadId");

-- CreateIndex
CREATE INDEX "DriverLoadItem_productId_idx" ON "DriverLoadItem"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "DriverLoadItem_loadId_productId_key" ON "DriverLoadItem"("loadId", "productId");

-- CreateIndex
CREATE INDEX "DriverStock_driverId_idx" ON "DriverStock"("driverId");

-- CreateIndex
CREATE INDEX "DriverStock_productId_idx" ON "DriverStock"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "DriverStock_driverId_productId_key" ON "DriverStock"("driverId", "productId");

-- CreateIndex
CREATE INDEX "DriverStockMovement_driverId_idx" ON "DriverStockMovement"("driverId");

-- CreateIndex
CREATE INDEX "DriverStockMovement_productId_idx" ON "DriverStockMovement"("productId");

-- CreateIndex
CREATE INDEX "DriverStockMovement_loadId_idx" ON "DriverStockMovement"("loadId");

-- CreateIndex
CREATE INDEX "DriverStockMovement_orderId_idx" ON "DriverStockMovement"("orderId");

-- CreateIndex
CREATE INDEX "DriverStockMovement_type_idx" ON "DriverStockMovement"("type");

-- CreateIndex
CREATE INDEX "DriverStockMovement_createdById_idx" ON "DriverStockMovement"("createdById");

-- CreateIndex
CREATE INDEX "DriverStockMovement_createdAt_idx" ON "DriverStockMovement"("createdAt");

-- CreateIndex
CREATE INDEX "OrderPayment_orderId_idx" ON "OrderPayment"("orderId");

-- CreateIndex
CREATE INDEX "OrderPayment_customerId_idx" ON "OrderPayment"("customerId");

-- CreateIndex
CREATE INDEX "OrderPayment_driverId_idx" ON "OrderPayment"("driverId");

-- CreateIndex
CREATE INDEX "OrderPayment_status_idx" ON "OrderPayment"("status");

-- CreateIndex
CREATE INDEX "OrderPayment_reportedById_idx" ON "OrderPayment"("reportedById");

-- CreateIndex
CREATE INDEX "OrderPayment_approvedById_idx" ON "OrderPayment"("approvedById");

-- CreateIndex
CREATE INDEX "OrderPayment_reportedAt_idx" ON "OrderPayment"("reportedAt");

-- CreateIndex
CREATE INDEX "OrderPayment_createdAt_idx" ON "OrderPayment"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "DealerProfile_userId_key" ON "DealerProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DealerProfile_dealerNumber_key" ON "DealerProfile"("dealerNumber");

-- CreateIndex
CREATE INDEX "DealerProfile_companyName_idx" ON "DealerProfile"("companyName");

-- CreateIndex
CREATE INDEX "DealerProfile_active_idx" ON "DealerProfile"("active");

-- CreateIndex
CREATE INDEX "DealerPrice_dealerId_idx" ON "DealerPrice"("dealerId");

-- CreateIndex
CREATE INDEX "DealerPrice_productId_idx" ON "DealerPrice"("productId");

-- CreateIndex
CREATE INDEX "DealerPrice_active_idx" ON "DealerPrice"("active");

-- CreateIndex
CREATE UNIQUE INDEX "DealerPrice_dealerId_productId_key" ON "DealerPrice"("dealerId", "productId");

-- AddForeignKey
ALTER TABLE "DriverLoad" ADD CONSTRAINT "DriverLoad_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverLoad" ADD CONSTRAINT "DriverLoad_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverLoadItem" ADD CONSTRAINT "DriverLoadItem_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "DriverLoad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverLoadItem" ADD CONSTRAINT "DriverLoadItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverStock" ADD CONSTRAINT "DriverStock_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverStock" ADD CONSTRAINT "DriverStock_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverStockMovement" ADD CONSTRAINT "DriverStockMovement_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverStockMovement" ADD CONSTRAINT "DriverStockMovement_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverStockMovement" ADD CONSTRAINT "DriverStockMovement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverStockMovement" ADD CONSTRAINT "DriverStockMovement_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "DriverLoad"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverStockMovement" ADD CONSTRAINT "DriverStockMovement_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderPayment" ADD CONSTRAINT "OrderPayment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealerProfile" ADD CONSTRAINT "DealerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealerPrice" ADD CONSTRAINT "DealerPrice_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealerPrice" ADD CONSTRAINT "DealerPrice_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
