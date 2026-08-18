-- AlterEnum
ALTER TYPE "CashMovementCategory" ADD VALUE 'CASH_HANDOVER';

-- AlterTable
ALTER TABLE "AdminPermission" ADD COLUMN "createCashHandover" BOOLEAN NOT NULL DEFAULT false;
