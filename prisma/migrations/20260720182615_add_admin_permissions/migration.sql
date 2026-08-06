-- CreateTable
CREATE TABLE "AdminPermission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "viewProducts" BOOLEAN NOT NULL DEFAULT true,
    "createProduct" BOOLEAN NOT NULL DEFAULT false,
    "updateProduct" BOOLEAN NOT NULL DEFAULT false,
    "deleteProduct" BOOLEAN NOT NULL DEFAULT false,
    "changePrice" BOOLEAN NOT NULL DEFAULT false,
    "viewCategories" BOOLEAN NOT NULL DEFAULT true,
    "createCategory" BOOLEAN NOT NULL DEFAULT false,
    "updateCategory" BOOLEAN NOT NULL DEFAULT false,
    "deleteCategory" BOOLEAN NOT NULL DEFAULT false,
    "viewStock" BOOLEAN NOT NULL DEFAULT true,
    "addStock" BOOLEAN NOT NULL DEFAULT false,
    "reduceStock" BOOLEAN NOT NULL DEFAULT false,
    "viewOrders" BOOLEAN NOT NULL DEFAULT true,
    "updateOrder" BOOLEAN NOT NULL DEFAULT false,
    "deleteOrder" BOOLEAN NOT NULL DEFAULT false,
    "printOrder" BOOLEAN NOT NULL DEFAULT false,
    "viewCustomers" BOOLEAN NOT NULL DEFAULT false,
    "managePfand" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminPermission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminPermission_userId_key" ON "AdminPermission"("userId");

-- AddForeignKey
ALTER TABLE "AdminPermission" ADD CONSTRAINT "AdminPermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
