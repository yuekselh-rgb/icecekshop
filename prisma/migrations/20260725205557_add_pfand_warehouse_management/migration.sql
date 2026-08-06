-- CreateEnum
CREATE TYPE "PfandMovementType" AS ENUM ('IN', 'OUT', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "PfandPartyType" AS ENUM ('CUSTOMER', 'SUPPLIER', 'WHOLESALER', 'METRO', 'TRINKGUT', 'OTHER_COMPANY', 'OWN_BRANCH', 'OTHER');

-- CreateTable
CREATE TABLE "PfandWarehouseMovement" (
    "id" TEXT NOT NULL,
    "type" "PfandMovementType" NOT NULL,
    "partyType" "PfandPartyType" NOT NULL,
    "partyName" TEXT,
    "pfandReturnId" TEXT,
    "createdById" TEXT NOT NULL,
    "note" TEXT,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PfandWarehouseMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PfandWarehouseMovementItem" (
    "id" TEXT NOT NULL,
    "movementId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitAmount" DECIMAL(10,2) NOT NULL,
    "totalAmount" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "PfandWarehouseMovementItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PfandWarehouseMovement_pfandReturnId_key" ON "PfandWarehouseMovement"("pfandReturnId");

-- CreateIndex
CREATE INDEX "PfandWarehouseMovement_type_idx" ON "PfandWarehouseMovement"("type");

-- CreateIndex
CREATE INDEX "PfandWarehouseMovement_partyType_idx" ON "PfandWarehouseMovement"("partyType");

-- CreateIndex
CREATE INDEX "PfandWarehouseMovement_createdById_idx" ON "PfandWarehouseMovement"("createdById");

-- CreateIndex
CREATE INDEX "PfandWarehouseMovement_createdAt_idx" ON "PfandWarehouseMovement"("createdAt");

-- CreateIndex
CREATE INDEX "PfandWarehouseMovementItem_movementId_idx" ON "PfandWarehouseMovementItem"("movementId");

-- CreateIndex
CREATE INDEX "PfandWarehouseMovementItem_name_idx" ON "PfandWarehouseMovementItem"("name");

-- CreateIndex
CREATE INDEX "PfandReturn_approvedById_idx" ON "PfandReturn"("approvedById");

-- CreateIndex
CREATE INDEX "PfandReturn_status_idx" ON "PfandReturn"("status");

-- AddForeignKey
ALTER TABLE "PfandReturn" ADD CONSTRAINT "PfandReturn_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PfandWarehouseMovement" ADD CONSTRAINT "PfandWarehouseMovement_pfandReturnId_fkey" FOREIGN KEY ("pfandReturnId") REFERENCES "PfandReturn"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PfandWarehouseMovement" ADD CONSTRAINT "PfandWarehouseMovement_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PfandWarehouseMovementItem" ADD CONSTRAINT "PfandWarehouseMovementItem_movementId_fkey" FOREIGN KEY ("movementId") REFERENCES "PfandWarehouseMovement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
