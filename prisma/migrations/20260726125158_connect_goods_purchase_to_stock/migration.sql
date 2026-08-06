-- CreateTable
CREATE TABLE "CashPurchaseItem" (
    "id" TEXT NOT NULL,
    "movementId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CashPurchaseItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CashPurchaseItem_movementId_idx" ON "CashPurchaseItem"("movementId");

-- CreateIndex
CREATE INDEX "CashPurchaseItem_productId_idx" ON "CashPurchaseItem"("productId");

-- CreateIndex
CREATE INDEX "CashPurchaseItem_createdAt_idx" ON "CashPurchaseItem"("createdAt");

-- AddForeignKey
ALTER TABLE "CashPurchaseItem" ADD CONSTRAINT "CashPurchaseItem_movementId_fkey" FOREIGN KEY ("movementId") REFERENCES "CashMovement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashPurchaseItem" ADD CONSTRAINT "CashPurchaseItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
