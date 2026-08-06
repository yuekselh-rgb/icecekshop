-- CreateEnum
CREATE TYPE "WarehouseLogType" AS ENUM ('IN', 'OUT');

-- CreateTable
CREATE TABLE "WarehouseLog" (
    "id" TEXT NOT NULL,
    "type" "WarehouseLogType" NOT NULL,
    "companyName" TEXT,
    "driverName" TEXT,
    "vehiclePlate" TEXT,
    "deliveryNoteNo" TEXT,
    "destination" TEXT,
    "contactPerson" TEXT,
    "note" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WarehouseLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WarehouseLogItem" (
    "id" TEXT NOT NULL,
    "warehouseLogId" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    "unit" TEXT NOT NULL,
    "note" TEXT,

    CONSTRAINT "WarehouseLogItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WarehouseLog_type_idx" ON "WarehouseLog"("type");

-- CreateIndex
CREATE INDEX "WarehouseLog_companyName_idx" ON "WarehouseLog"("companyName");

-- CreateIndex
CREATE INDEX "WarehouseLog_driverName_idx" ON "WarehouseLog"("driverName");

-- CreateIndex
CREATE INDEX "WarehouseLog_vehiclePlate_idx" ON "WarehouseLog"("vehiclePlate");

-- CreateIndex
CREATE INDEX "WarehouseLog_deliveryNoteNo_idx" ON "WarehouseLog"("deliveryNoteNo");

-- CreateIndex
CREATE INDEX "WarehouseLog_createdById_idx" ON "WarehouseLog"("createdById");

-- CreateIndex
CREATE INDEX "WarehouseLog_createdAt_idx" ON "WarehouseLog"("createdAt");

-- CreateIndex
CREATE INDEX "WarehouseLogItem_warehouseLogId_idx" ON "WarehouseLogItem"("warehouseLogId");

-- CreateIndex
CREATE INDEX "WarehouseLogItem_itemName_idx" ON "WarehouseLogItem"("itemName");

-- AddForeignKey
ALTER TABLE "WarehouseLogItem" ADD CONSTRAINT "WarehouseLogItem_warehouseLogId_fkey" FOREIGN KEY ("warehouseLogId") REFERENCES "WarehouseLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;
