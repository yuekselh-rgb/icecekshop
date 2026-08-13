-- AlterTable
ALTER TABLE "Order" ADD COLUMN "confirmationToken" TEXT,
ADD COLUMN "confirmedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Order_confirmationToken_key" ON "Order"("confirmationToken");
