-- AlterTable
ALTER TABLE "CompanySetting" ADD COLUMN "minOrderValueEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "CompanySetting" ADD COLUMN "minOrderValue" DECIMAL(10,2);
