-- CreateEnum
CREATE TYPE "ProductStockUnit" AS ENUM ('KASA', 'KARTON', 'PAKET', 'ADET');

-- AlterTable
ALTER TABLE "CashPurchaseItem" ADD COLUMN     "stockUnit" "ProductStockUnit" NOT NULL DEFAULT 'ADET';

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "stockUnit" "ProductStockUnit" NOT NULL DEFAULT 'ADET';
