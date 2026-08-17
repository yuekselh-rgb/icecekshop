-- AlterTable
ALTER TABLE "CompanySetting" ADD COLUMN "businessHoursEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "businessHours" JSONB;
