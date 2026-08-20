import { prisma, tenantContext } from "@/lib/prisma";

/*
 * Setzt eine Verkaufsperiode für genau einen Tenant zurück: löscht
 * unwiderruflich die gesamte Bestell-/Kassen-/Pfand-/Fahrer-Historie
 * dieses Tenants, lässt Produktstammdaten und den aktuellen physischen
 * Lagerbestand (Product.stock) unangetastet.
 *
 * Sicherheitsprinzip: `tenantId` wird NIEMALS von außen entgegengenommen
 * — die Funktion nimmt ausschließlich eine bereits serverseitig
 * verifizierte tenantId entgegen (siehe Aufrufer in
 * src/app/api/super-admin/reset-sales/route.ts, der sie aus der
 * withTenant()-aufgelösten Session zieht, nicht aus dem Request-Body).
 *
 * Löschreihenfolge/Scoping:
 * Für Modelle mit eigener tenantId-Spalte (Order, CashMovement,
 * PfandReturn, PfandWarehouseMovement, DriverLoad,
 * DriverCashAdjustment, DriverStockMovement, StockMovement, OrderPayment)
 * schränkt die Tenant-Scoping-Extension in src/lib/prisma.ts jede Query
 * automatisch auf den aktuellen Tenant ein (siehe TENANT_SCOPED_MODELS),
 * solange sie innerhalb von tenantContext.run() läuft.
 *
 * Fünf Positions-/Zeilen-Modelle (OrderItem, CashPurchaseItem,
 * PfandReturnItem, PfandWarehouseMovementItem, DriverLoadItem) besitzen
 * dagegen KEINE eigene tenantId-Spalte und werden von der Extension
 * deshalb nicht automatisch eingeschränkt — ein ungefiltertes
 * deleteMany({}) auf diesen Modellen würde tenant-übergreifend löschen.
 * Sie werden hier deshalb ausschließlich über die vorab tenant-gescopt
 * ermittelten IDs ihrer Parent-Datensätze gefiltert.
 */
export async function performTenantSalesReset() {
  return prisma.$transaction(
    async (tx) => {
      const [
        orderIds,
        pfandReturnIds,
        pfandWarehouseMovementIds,
        cashMovementIds,
        driverLoadIds,
      ] = await Promise.all([
        tx.order.findMany({ select: { id: true } }).then((rows) => rows.map((row) => row.id)),
        tx.pfandReturn
          .findMany({ select: { id: true } })
          .then((rows) => rows.map((row) => row.id)),
        tx.pfandWarehouseMovement
          .findMany({ select: { id: true } })
          .then((rows) => rows.map((row) => row.id)),
        tx.cashMovement
          .findMany({ select: { id: true } })
          .then((rows) => rows.map((row) => row.id)),
        tx.driverLoad
          .findMany({ select: { id: true } })
          .then((rows) => rows.map((row) => row.id)),
      ]);

      /*
       * 1. ŞOFÖR TAHSİLAT / PFAND DÜZELTMELERİ
       *
       * Sipariş ve Pfand kayıtlarından önce silinmelidir.
       * (DriverCashAdjustment hat eine eigene tenantId-Spalte, wird von
       * der Extension automatisch eingeschränkt.)
       */
      const deletedDriverCashAdjustments = await tx.driverCashAdjustment.deleteMany({});

      /*
       * 2. ŞOFÖR ARAÇ STOK HAREKETLERİ
       *
       * LOAD, SALE, RETURN ve ADJUSTMENT dahil bütün geçmiş silinir.
       * Böylece Şoför Stokları ekranındaki geçmiş toplamlar sıfırlanır.
       * (DriverStockMovement hat eine eigene tenantId-Spalte.)
       */
      const deletedDriverStockMovements = await tx.driverStockMovement.deleteMany({});

      /*
       * 3. ŞOFÖR YÜKLEME GEÇMİŞİ
       *
       * DriverLoadItem hat KEINE eigene tenantId-Spalte — ausschließlich
       * über die zuvor tenant-gescopt ermittelten DriverLoad-IDs filtern.
       */
      const deletedDriverLoadItems = await tx.driverLoadItem.deleteMany({
        where: { loadId: { in: driverLoadIds } },
      });

      const deletedDriverLoads = await tx.driverLoad.deleteMany({});

      /*
       * 4. ŞOFÖRÜN GÜNCEL ARAÇ STOKLARI
       *
       * Satırlar korunur, yalnızca miktarlar 0 yapılır.
       * (DriverStock hat eine eigene tenantId-Spalte.)
       */
      const resetDriverStocks = await tx.driverStock.updateMany({
        data: {
          quantity: 0,
        },
      });

      /*
       * 5. GERÇEK KASA
       *
       * Bar satışı, mal alımı, yakıt, kira, personel,
       * manuel giriş/çıkış ve bütün diğer kasa hareketleri silinir.
       *
       * CashPurchaseItem hat KEINE eigene tenantId-Spalte — ausschließlich
       * über die zuvor tenant-gescopt ermittelten CashMovement-IDs filtern.
       */
      const deletedCashPurchaseItems = await tx.cashPurchaseItem.deleteMany({
        where: { movementId: { in: cashMovementIds } },
      });

      const deletedCashMovements = await tx.cashMovement.deleteMany({});

      /*
       * 6. PFAND DEPO HAREKETLERİ
       *
       * PfandWarehouseMovementItem hat KEINE eigene tenantId-Spalte —
       * ausschließlich über die zuvor tenant-gescopt ermittelten
       * PfandWarehouseMovement-IDs filtern.
       */
      const deletedPfandWarehouseMovementItems = await tx.pfandWarehouseMovementItem.deleteMany({
        where: { movementId: { in: pfandWarehouseMovementIds } },
      });

      const deletedPfandWarehouseMovements = await tx.pfandWarehouseMovement.deleteMany({});

      /*
       * 7. PFAND İADELERİ
       *
       * PfandReturnItem hat KEINE eigene tenantId-Spalte — ausschließlich
       * über die zuvor tenant-gescopt ermittelten PfandReturn-IDs filtern.
       */
      const deletedPfandReturnItems = await tx.pfandReturnItem.deleteMany({
        where: { pfandReturnId: { in: pfandReturnIds } },
      });

      const deletedPfandReturns = await tx.pfandReturn.deleteMany({});

      /*
       * 8. SİPARİŞ ÖDEMELERİ
       *
       * Bekleyen, onaylanan ve reddedilen bütün ödeme kayıtları silinir.
       * (OrderPayment hat eine eigene tenantId-Spalte.)
       */
      const deletedOrderPayments = await tx.orderPayment.deleteMany({});

      /*
       * 9. SİPARİŞ KALEMLERİ
       *
       * OrderItem hat KEINE eigene tenantId-Spalte — ausschließlich über
       * die zuvor tenant-gescopt ermittelten Order-IDs filtern.
       */
      const deletedOrderItems = await tx.orderItem.deleteMany({
        where: { orderId: { in: orderIds } },
      });

      /*
       * 10. BÜTÜN SİPARİŞLER VE SATIŞLAR
       *
       * Web siparişleri
       * Bar satışları
       * Şoför araç satışları
       * Çöp kutusundaki soft-delete siparişler
       * (Order hat eine eigene tenantId-Spalte.)
       */
      const deletedOrders = await tx.order.deleteMany({});

      /*
       * 11. ANA STOK HAREKET GEÇMİŞİ
       *
       * Geçmiş stok hareket kayıtları silinir.
       * Product.stock değerlerine dokunulmaz.
       *
       * Yani ana depodaki güncel fiziksel ürün miktarları korunur.
       * (StockMovement hat eine eigene tenantId-Spalte.)
       */
      const deletedStockMovements = await tx.stockMovement.deleteMany({});

      return {
        deletedOrders: deletedOrders.count,
        deletedOrderItems: deletedOrderItems.count,
        deletedOrderPayments: deletedOrderPayments.count,

        deletedCashMovements: deletedCashMovements.count,
        deletedCashPurchaseItems: deletedCashPurchaseItems.count,

        deletedPfandReturns: deletedPfandReturns.count,
        deletedPfandReturnItems: deletedPfandReturnItems.count,

        deletedPfandWarehouseMovements: deletedPfandWarehouseMovements.count,

        deletedPfandWarehouseMovementItems: deletedPfandWarehouseMovementItems.count,

        deletedDriverCashAdjustments: deletedDriverCashAdjustments.count,

        deletedDriverStockMovements: deletedDriverStockMovements.count,

        deletedDriverLoads: deletedDriverLoads.count,
        deletedDriverLoadItems: deletedDriverLoadItems.count,

        resetDriverStocks: resetDriverStocks.count,

        deletedStockMovements: deletedStockMovements.count,
      };
    },
    {
      maxWait: 10_000,
      timeout: 120_000,
    },
  );
}

/*
 * Test-/Skript-Helfer: führt performTenantSalesReset() innerhalb eines
 * expliziten Tenant-Kontexts aus, ohne über eine HTTP-Route zu gehen.
 * Wird ausschließlich von isolierten Test-Skripten genutzt (siehe
 * scripts/test-reset-sales-tenant-isolation.ts) — niemals in einem
 * echten Request-Pfad, dort läuft der Kontext bereits über withTenant().
 */
export async function performTenantSalesResetForTenant(tenantId: string) {
  return tenantContext.run({ tenantId }, () => performTenantSalesReset());
}
