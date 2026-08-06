-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('OPEN', 'PAID');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'OPEN';
