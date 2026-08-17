-- CreateTable
CREATE TABLE "ImpersonationTicket" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "platformOwnerId" TEXT NOT NULL,
    "platformOwnerEmail" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImpersonationTicket_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ImpersonationTicket_token_key" ON "ImpersonationTicket"("token");

-- CreateIndex
CREATE INDEX "ImpersonationTicket_tenantId_idx" ON "ImpersonationTicket"("tenantId");

-- AddForeignKey
ALTER TABLE "ImpersonationTicket" ADD CONSTRAINT "ImpersonationTicket_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
