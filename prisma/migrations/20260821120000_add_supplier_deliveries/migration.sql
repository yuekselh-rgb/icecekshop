-- CreateTable
CREATE TABLE "SupplierDelivery" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "deliveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "paidAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "note" TEXT,
    "documentUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplierDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierDeliveryItem" (
    "id" TEXT NOT NULL,
    "deliveryId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "quantity" DECIMAL(12,2) NOT NULL,
    "unit" TEXT,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "totalPrice" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "SupplierDeliveryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierDeliveryPayment" (
    "id" TEXT NOT NULL,
    "deliveryId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "note" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupplierDeliveryPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SupplierDelivery_tenantId_idx" ON "SupplierDelivery"("tenantId");

-- CreateIndex
CREATE INDEX "SupplierDelivery_supplierId_idx" ON "SupplierDelivery"("supplierId");

-- CreateIndex
CREATE INDEX "SupplierDelivery_deliveredAt_idx" ON "SupplierDelivery"("deliveredAt");

-- CreateIndex
CREATE INDEX "SupplierDeliveryItem_deliveryId_idx" ON "SupplierDeliveryItem"("deliveryId");

-- CreateIndex
CREATE INDEX "SupplierDeliveryPayment_deliveryId_idx" ON "SupplierDeliveryPayment"("deliveryId");

-- CreateIndex
CREATE INDEX "SupplierDeliveryPayment_createdAt_idx" ON "SupplierDeliveryPayment"("createdAt");

-- AddForeignKey
ALTER TABLE "SupplierDelivery" ADD CONSTRAINT "SupplierDelivery_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierDelivery" ADD CONSTRAINT "SupplierDelivery_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierDeliveryItem" ADD CONSTRAINT "SupplierDeliveryItem_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "SupplierDelivery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierDeliveryPayment" ADD CONSTRAINT "SupplierDeliveryPayment_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "SupplierDelivery"("id") ON DELETE CASCADE ON UPDATE CASCADE;
