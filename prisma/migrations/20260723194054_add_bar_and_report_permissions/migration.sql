-- AlterTable
ALTER TABLE "AdminPermission" ADD COLUMN     "makeBarSale" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "viewBarSalesReport" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "viewOrderReport" BOOLEAN NOT NULL DEFAULT false;
