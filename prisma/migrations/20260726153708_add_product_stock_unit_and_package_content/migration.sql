-- Mevcut enum değerlerini kaybetmeden metin alanlarına dönüştür.

ALTER TABLE "Product"
ALTER COLUMN "stockUnit" DROP DEFAULT;

ALTER TABLE "Product"
ALTER COLUMN "stockUnit"
TYPE TEXT
USING "stockUnit"::text;

ALTER TABLE "Product"
ALTER COLUMN "stockUnit"
SET DEFAULT 'ADET';


ALTER TABLE "CashPurchaseItem"
ALTER COLUMN "purchaseUnit" DROP DEFAULT;

ALTER TABLE "CashPurchaseItem"
ALTER COLUMN "purchaseUnit"
TYPE TEXT
USING "purchaseUnit"::text;

ALTER TABLE "CashPurchaseItem"
ALTER COLUMN "purchaseUnit"
SET DEFAULT 'ADET';


ALTER TABLE "CashPurchaseItem"
ALTER COLUMN "stockUnit" DROP DEFAULT;

ALTER TABLE "CashPurchaseItem"
ALTER COLUMN "stockUnit"
TYPE TEXT
USING "stockUnit"::text;

ALTER TABLE "CashPurchaseItem"
ALTER COLUMN "stockUnit"
SET DEFAULT 'ADET';


CREATE TABLE "StockUnitOption" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameTr" TEXT NOT NULL,
    "nameDe" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockUnitOption_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StockUnitOption_code_key"
ON "StockUnitOption"("code");

CREATE INDEX "StockUnitOption_active_sortOrder_idx"
ON "StockUnitOption"("active", "sortOrder");


INSERT INTO "StockUnitOption"
(
  "id",
  "code",
  "nameTr",
  "nameDe",
  "active",
  "sortOrder",
  "createdAt",
  "updatedAt"
)
VALUES
(
  'stock-unit-kasa',
  'KASA',
  'Kasa',
  'Kiste',
  true,
  10,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
),
(
  'stock-unit-karton',
  'KARTON',
  'Karton',
  'Karton',
  true,
  20,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
),
(
  'stock-unit-paket',
  'PAKET',
  'Paket',
  'Packung',
  true,
  30,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
),
(
  'stock-unit-adet',
  'ADET',
  'Adet',
  'Stück',
  true,
  40,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

DROP TYPE IF EXISTS "ProductStockUnit";
