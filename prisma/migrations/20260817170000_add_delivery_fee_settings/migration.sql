-- AlterTable
ALTER TABLE "CompanySetting" ADD COLUMN "deliveryFeeEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "deliveryFee" DECIMAL(10,2) NOT NULL DEFAULT 7.9;
