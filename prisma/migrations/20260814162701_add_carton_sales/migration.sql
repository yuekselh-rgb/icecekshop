-- AlterTable
ALTER TABLE "Product" ADD COLUMN "sellByCarton" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "unitsPerCarton" INTEGER,
ADD COLUMN "cartonPrice" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN "unitLabel" TEXT;
