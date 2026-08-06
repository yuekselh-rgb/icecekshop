-- CreateTable
CREATE TABLE "DriverCashAdjustment" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "orderId" TEXT,
    "pfandReturnId" TEXT NOT NULL,
    "reportedAmount" DECIMAL(10,2) NOT NULL,
    "approvedAmount" DECIMAL(10,2) NOT NULL,
    "adjustmentAmount" DECIMAL(10,2) NOT NULL,
    "createdById" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DriverCashAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DriverCashAdjustment_pfandReturnId_key" ON "DriverCashAdjustment"("pfandReturnId");

-- CreateIndex
CREATE INDEX "DriverCashAdjustment_driverId_idx" ON "DriverCashAdjustment"("driverId");

-- CreateIndex
CREATE INDEX "DriverCashAdjustment_orderId_idx" ON "DriverCashAdjustment"("orderId");

-- CreateIndex
CREATE INDEX "DriverCashAdjustment_createdAt_idx" ON "DriverCashAdjustment"("createdAt");
