import { getAdminWithPermissions } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { withTenant } from "@/lib/tenant";
import { createEndOfPeriodPdf } from "@/lib/pdf/end-of-period-report";
import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

const CONFIRM_TEXT = "NEHIR CAN";

export const DELETE = withTenant(async (request: NextRequest) => {
  const admin = await getAdminWithPermissions();

  if (!admin || !admin.isSuperAdmin) {
    return NextResponse.json(
      {
        error: "Bu işlem yalnızca Super Admin tarafından yapılabilir.",
      },
      {
        status: 403,
      },
    );
  }

  try {
    const body = await request.json().catch(() => null);

    const confirmation = String(body?.confirmation || "").trim();

    if (confirmation !== CONFIRM_TEXT) {
      return NextResponse.json(
        {
          error: "Onay metni hatalı. Devam etmek için NEHIR CAN yazın.",
        },
        {
          status: 400,
        },
      );
    }

    // Silmeden önce dönem sonu raporunu oluştur
    const pdf = await createEndOfPeriodPdf();

    const reportBlob = await put(
      `uploads/reports/donem-sonu-${Date.now()}.pdf`,
      pdf,
      {
        access: "public",
        contentType: "application/pdf",
      },
    );


    const result = await prisma.$transaction(
      async (tx) => {
        /*
         * 1. ŞOFÖR TAHSİLAT / PFAND DÜZELTMELERİ
         *
         * Sipariş ve Pfand kayıtlarından önce silinmelidir.
         */
        const deletedDriverCashAdjustments =
          await tx.driverCashAdjustment.deleteMany({});

        /*
         * 2. ŞOFÖR ARAÇ STOK HAREKETLERİ
         *
         * LOAD, SALE, RETURN ve ADJUSTMENT dahil bütün geçmiş silinir.
         * Böylece Şoför Stokları ekranındaki geçmiş toplamlar sıfırlanır.
         */
        const deletedDriverStockMovements =
          await tx.driverStockMovement.deleteMany({});

        /*
         * 3. ŞOFÖR YÜKLEME GEÇMİŞİ
         *
         * Önce yükleme kalemleri, ardından yüklemeler silinir.
         * Böylece "Şoförden Mal İade Al" listesi de temizlenir.
         */
        const deletedDriverLoadItems = await tx.driverLoadItem.deleteMany({});

        const deletedDriverLoads = await tx.driverLoad.deleteMany({});

        /*
         * 4. ŞOFÖRÜN GÜNCEL ARAÇ STOKLARI
         *
         * Satırlar korunur, yalnızca miktarlar 0 yapılır.
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
         * Önce CashPurchaseItem silinir.
         */
        const deletedCashPurchaseItems = await tx.cashPurchaseItem.deleteMany(
          {},
        );

        const deletedCashMovements = await tx.cashMovement.deleteMany({});

        /*
         * 6. PFAND DEPO HAREKETLERİ
         */
        const deletedPfandWarehouseMovementItems =
          await tx.pfandWarehouseMovementItem.deleteMany({});

        const deletedPfandWarehouseMovements =
          await tx.pfandWarehouseMovement.deleteMany({});

        /*
         * 7. PFAND İADELERİ
         */
        const deletedPfandReturnItems = await tx.pfandReturnItem.deleteMany({});

        const deletedPfandReturns = await tx.pfandReturn.deleteMany({});

        /*
         * 8. SİPARİŞ ÖDEMELERİ
         *
         * Bekleyen, onaylanan ve reddedilen bütün ödeme kayıtları silinir.
         */
        const deletedOrderPayments = await tx.orderPayment.deleteMany({});

        /*
         * 9. SİPARİŞ KALEMLERİ
         */
        const deletedOrderItems = await tx.orderItem.deleteMany({});

        /*
         * 10. BÜTÜN SİPARİŞLER VE SATIŞLAR
         *
         * Web siparişleri
         * Bar satışları
         * Şoför araç satışları
         * Çöp kutusundaki soft-delete siparişler
         */
        const deletedOrders = await tx.order.deleteMany({});

        /*
         * 11. ANA STOK HAREKET GEÇMİŞİ
         *
         * Geçmiş stok hareket kayıtları silinir.
         * Product.stock değerlerine dokunulmaz.
         *
         * Yani ana depodaki güncel fiziksel ürün miktarları korunur.
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

          deletedPfandWarehouseMovementItems:
            deletedPfandWarehouseMovementItems.count,

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

    console.warn("SUPER_ADMIN_FULL_RESET_COMPLETED", {
      superAdminId: admin.user.id,
      superAdminEmail: admin.user.email,
      executedAt: new Date().toISOString(),
      result,
    });

    return NextResponse.json({
      message:
        "Bütün satışlar, kasa hareketleri, Pfand kayıtları ve şoför stok geçmişi kalıcı olarak silindi. Sistem yeni dönem için sıfırlandı.",
      result,
      reportUrl: reportBlob.url,
    });
  } catch (error) {
    console.error("SUPER_ADMIN_FULL_RESET_ERROR", error);

    return NextResponse.json(
      {
        error:
          "Sistem sıfırlanamadı. Transaction iptal edildi ve hiçbir kayıt yarım silinmedi.",
      },
      {
        status: 500,
      },
    );
  }
});
