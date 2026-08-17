-- AlterTable
ALTER TABLE "AdminPermission" ADD COLUMN "viewCashReport" BOOLEAN NOT NULL DEFAULT false;

-- Backfill: preserve current access for admins who already had bar-cash access,
-- since Kassenbericht was previously gated by viewBarCash before this split.
UPDATE "AdminPermission" SET "viewCashReport" = "viewBarCash" WHERE "viewBarCash" = true;
