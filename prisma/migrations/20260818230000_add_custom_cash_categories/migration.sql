-- AlterEnum
ALTER TYPE "CashMovementCategory" ADD VALUE 'CUSTOM';

-- CreateTable
CREATE TABLE "CashMovementCustomCategory" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "nameDe" TEXT NOT NULL,
    "nameTr" TEXT NOT NULL,
    "direction" "CashMovementDirection" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CashMovementCustomCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CashMovementCustomCategory_tenantId_idx" ON "CashMovementCustomCategory"("tenantId");

-- AlterTable
ALTER TABLE "CashMovement" ADD COLUMN "customCategoryId" TEXT;

-- CreateIndex
CREATE INDEX "CashMovement_customCategoryId_idx" ON "CashMovement"("customCategoryId");

-- AddForeignKey
ALTER TABLE "CashMovementCustomCategory" ADD CONSTRAINT "CashMovementCustomCategory_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashMovement" ADD CONSTRAINT "CashMovement_customCategoryId_fkey" FOREIGN KEY ("customCategoryId") REFERENCES "CashMovementCustomCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
