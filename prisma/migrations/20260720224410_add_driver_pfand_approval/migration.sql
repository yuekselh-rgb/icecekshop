-- AlterTable
ALTER TABLE "PfandReturn" ADD COLUMN     "approvedAmount" DECIMAL(10,2),
ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedById" TEXT,
ADD COLUMN     "driverNote" TEXT;

-- AlterTable
ALTER TABLE "PfandReturnItem" ADD COLUMN     "approvedQuantity" INTEGER,
ADD COLUMN     "approvedTotal" DECIMAL(10,2);
