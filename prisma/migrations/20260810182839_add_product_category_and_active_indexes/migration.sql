-- CreateIndex
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");

-- CreateIndex
CREATE INDEX "Product_tenantId_active_stock_idx" ON "Product"("tenantId", "active", "stock");
