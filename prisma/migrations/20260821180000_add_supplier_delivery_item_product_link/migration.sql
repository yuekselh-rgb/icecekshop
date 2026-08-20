-- AlterTable
ALTER TABLE "SupplierDeliveryItem" ADD COLUMN "productId" TEXT;

-- CreateIndex
CREATE INDEX "SupplierDeliveryItem_productId_idx" ON "SupplierDeliveryItem"("productId");

-- AddForeignKey
ALTER TABLE "SupplierDeliveryItem" ADD CONSTRAINT "SupplierDeliveryItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
