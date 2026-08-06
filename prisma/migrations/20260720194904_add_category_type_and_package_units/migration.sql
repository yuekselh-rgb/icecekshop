-- CreateEnum
CREATE TYPE "CategoryType" AS ENUM ('DRINK', 'PACKAGING', 'TAKEAWAY', 'CLEANING', 'OTHER');

-- CreateEnum
CREATE TYPE "PackageUnit" AS ENUM ('STUECK', 'G', 'KG', 'ML', 'L');

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "type" "CategoryType" NOT NULL DEFAULT 'OTHER';

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "packageCount" INTEGER,
ADD COLUMN     "unitAmount" DECIMAL(10,3),
ADD COLUMN     "unitType" "PackageUnit";
