import { getAdminWithPermissions } from "@/lib/admin-auth";
import { logAuditEvent } from "@/lib/audit-log";
import { performTenantSalesReset } from "@/lib/reset-sales";
import { getRequestLanguage } from "@/lib/request-language";
import { withTenant } from "@/lib/tenant";
import { createEndOfPeriodPdf } from "@/lib/pdf/end-of-period-report";
import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

const CONFIRM_TEXT = "NEHIR CAN";

export const DELETE = withTenant(async (request: NextRequest, _context, tenant) => {
  const language = await getRequestLanguage();

  const admin = await getAdminWithPermissions();

  if (!admin || !admin.isSuperAdmin) {
    return NextResponse.json(
      {
        error:
          language === "de"
            ? "Dieser Vorgang darf nur von einem Super-Admin durchgeführt werden."
            : "Bu işlem yalnızca Super Admin tarafından yapılabilir.",
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
          error:
            language === "de"
              ? "Der Bestätigungstext ist falsch. Geben Sie NEHIR CAN ein, um fortzufahren."
              : "Onay metni hatalı. Devam etmek için NEHIR CAN yazın.",
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


    const result = await performTenantSalesReset();

    console.warn("SUPER_ADMIN_FULL_RESET_COMPLETED", {
      superAdminId: admin.user.id,
      superAdminEmail: admin.user.email,
      executedAt: new Date().toISOString(),
      result,
    });

    await logAuditEvent({
      tenantId: tenant.id,
      actorUserId: admin.session.userId,
      actorEmail: admin.session.email,
      actorRole: admin.session.role,
      action: "sales.reset",
      summary: `Periodenrücksetzung durchgeführt: ${result.deletedOrders} Bestellungen und alle Kassen-/Pfand-/Fahrerbestandsdaten endgültig gelöscht.`,
      metadata: result,
    });

    return NextResponse.json({
      message:
        language === "de"
          ? "Alle Verkäufe, Kassenbewegungen, Pfand-Datensätze und der Fahrer-Bestandsverlauf wurden endgültig gelöscht. Das System wurde für die neue Periode zurückgesetzt."
          : "Bütün satışlar, kasa hareketleri, Pfand kayıtları ve şoför stok geçmişi kalıcı olarak silindi. Sistem yeni dönem için sıfırlandı.",
      result,
      reportUrl: reportBlob.url,
    });
  } catch (error) {
    console.error("SUPER_ADMIN_FULL_RESET_ERROR", error);

    return NextResponse.json(
      {
        error:
          language === "de"
            ? "Das System konnte nicht zurückgesetzt werden. Die Transaktion wurde abgebrochen und keine Datensätze wurden teilweise gelöscht."
            : "Sistem sıfırlanamadı. Transaction iptal edildi ve hiçbir kayıt yarım silinmedi.",
      },
      {
        status: 500,
      },
    );
  }
});
