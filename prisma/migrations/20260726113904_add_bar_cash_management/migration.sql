-- CreateEnum
CREATE TYPE "CashAccountType" AS ENUM ('BAR', 'GENERAL', 'PFAND');

-- CreateEnum
CREATE TYPE "CashMovementDirection" AS ENUM ('IN', 'OUT');

-- CreateEnum
CREATE TYPE "CashMovementCategory" AS ENUM ('BAR_SALE', 'PFAND_COLLECTION', 'SUPPLIER_PAYMENT', 'GOODS_PURCHASE', 'FUEL', 'PERSONNEL', 'RENT', 'MANUAL_INCOME', 'OTHER_EXPENSE');

-- AlterTable
ALTER TABLE "AdminPermission" ADD COLUMN     "createBarCashExpense" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "createBarCashIncome" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "deleteBarCashMovement" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "viewBarCash" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "viewBarCashReport" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "CashMovement" (
    "id" TEXT NOT NULL,
    "accountType" "CashAccountType" NOT NULL,
    "direction" "CashMovementDirection" NOT NULL,
    "category" "CashMovementCategory" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "companyName" TEXT,
    "description" TEXT,
    "orderId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CashMovement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CashMovement_accountType_idx" ON "CashMovement"("accountType");

-- CreateIndex
CREATE INDEX "CashMovement_direction_idx" ON "CashMovement"("direction");

-- CreateIndex
CREATE INDEX "CashMovement_category_idx" ON "CashMovement"("category");

-- CreateIndex
CREATE INDEX "CashMovement_orderId_idx" ON "CashMovement"("orderId");

-- CreateIndex
CREATE INDEX "CashMovement_createdById_idx" ON "CashMovement"("createdById");

-- CreateIndex
CREATE INDEX "CashMovement_createdAt_idx" ON "CashMovement"("createdAt");
