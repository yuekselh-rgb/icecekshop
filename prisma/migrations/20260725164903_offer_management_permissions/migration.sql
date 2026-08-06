-- AlterTable
ALTER TABLE "AdminPermission" ADD COLUMN     "manageOffers" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "CompanySetting" ADD COLUMN     "showOffers" BOOLEAN NOT NULL DEFAULT true;
