import { getAdminWithPermissions } from "@/lib/admin-auth";
import { logAuditEvent } from "@/lib/audit-log";
import { normalizeBusinessHours } from "@/lib/business-hours";
import { prisma } from "@/lib/prisma";
import { getRequestLanguage } from "@/lib/request-language";
import { withTenant } from "@/lib/tenant";
import { NextResponse } from "next/server";

async function requireSuperAdmin() {
  const admin = await getAdminWithPermissions();

  if (!admin || !admin.isSuperAdmin) {
    return null;
  }

  return admin;
}

export const GET = withTenant(async (_request, _context, tenant) => {
  const language = await getRequestLanguage();

  const admin = await requireSuperAdmin();

  if (!admin) {
    return NextResponse.json(
      {
        error: language === "de" ? "Unbefugter Zugriff." : "Yetkisiz erişim.",
      },
      {
        status: 403,
      },
    );
  }

  try {
    const settings = await prisma.companySetting.upsert({
      where: {
        tenantId: tenant.id,
      },
      update: {},
      create: {
        tenantId: tenant.id,
        companyName: "Firma Adı",
        companySubtitle: null,
        showOffers: true,
      },
    });

    return NextResponse.json({
      settings,
    });
  } catch (error) {
    console.error("GET_COMPANY_SETTINGS_ERROR", error);

    return NextResponse.json(
      {
        error:
          language === "de"
            ? "Firmeneinstellungen konnten nicht geladen werden."
            : "Firma ayarları yüklenemedi.",
      },
      {
        status: 500,
      },
    );
  }
});

export const PATCH = withTenant(async (request: Request, _context, tenant) => {
  const language = await getRequestLanguage();

  const admin = await requireSuperAdmin();

  if (!admin) {
    return NextResponse.json(
      {
        error: language === "de" ? "Unbefugter Zugriff." : "Yetkisiz erişim.",
      },
      {
        status: 403,
      },
    );
  }

  try {
    const body = await request.json();

    const companyName = String(body.companyName || "").trim();

    const companySubtitle = String(body.companySubtitle || "").trim();

    const rawLogoUrl =
      typeof body.logoUrl === "string" ? body.logoUrl.trim() : "";

    const showOffers =
      typeof body.showOffers === "boolean" ? body.showOffers : true;

    const logoWidth =
      typeof body.logoWidth === "number"
        ? Math.min(1800, Math.max(140, body.logoWidth))
        : 260;

    const logoHeight =
      typeof body.logoHeight === "number"
        ? Math.min(700, Math.max(40, body.logoHeight))
        : 120;

    const minOrderValueEnabled =
      typeof body.minOrderValueEnabled === "boolean"
        ? body.minOrderValueEnabled
        : false;

    const rawMinOrderValue = Number(body.minOrderValue);

    const minOrderValue =
      Number.isFinite(rawMinOrderValue) && rawMinOrderValue > 0
        ? Math.round(rawMinOrderValue * 100) / 100
        : null;

    const deliveryFeeEnabled =
      typeof body.deliveryFeeEnabled === "boolean"
        ? body.deliveryFeeEnabled
        : true;

    const rawDeliveryFee = Number(body.deliveryFee);

    const deliveryFee =
      Number.isFinite(rawDeliveryFee) && rawDeliveryFee >= 0
        ? Math.round(rawDeliveryFee * 100) / 100
        : 7.9;

    const autoPrintOrders =
      typeof body.autoPrintOrders === "boolean" ? body.autoPrintOrders : false;

    const businessHoursEnabled =
      typeof body.businessHoursEnabled === "boolean"
        ? body.businessHoursEnabled
        : false;

    const businessHours = normalizeBusinessHours(body.businessHours);

    for (const entry of businessHours) {
      if (!entry.closed && entry.open >= entry.close) {
        return NextResponse.json(
          {
            error:
              language === "de"
                ? "Die Öffnungszeit muss vor der Schließzeit liegen."
                : "Açılış saati kapanış saatinden önce olmalıdır.",
          },
          {
            status: 400,
          },
        );
      }
    }

    if (minOrderValueEnabled && minOrderValue === null) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Bitte geben Sie einen gültigen Mindestbestellwert an."
              : "Lütfen geçerli bir minimum sipariş tutarı girin.",
        },
        {
          status: 400,
        },
      );
    }

    const phone = String(body.phone || "").trim();

    const whatsapp = String(body.whatsapp || "").trim();

    const email = String(body.email || "").trim();

    const website = String(body.website || "").trim();

    const address = String(body.address || "").trim();

    const country = String(body.country || "").trim();

    const footerText = String(body.footerText || "").trim();

    const copyrightText = String(body.copyrightText || "").trim();

    const legalForm = String(body.legalForm || "").trim();
    const managingDirector = String(body.managingDirector || "").trim();
    const companyDescription = String(body.companyDescription || "").trim();

    const taxNumber = String(body.taxNumber || "").trim();
    const vatId = String(body.vatId || "").trim();
    const commercialRegister = String(body.commercialRegister || "").trim();
    const registerCourt = String(body.registerCourt || "").trim();

    const street = String(body.street || "").trim();
    const houseNumber = String(body.houseNumber || "").trim();
    const postalCode = String(body.postalCode || "").trim();
    const city = String(body.city || "").trim();
    const state = String(body.state || "").trim();

    const bankName = String(body.bankName || "").trim();
    const accountHolder = String(body.accountHolder || "").trim();
    const iban = String(body.iban || "").trim();
    const bic = String(body.bic || "").trim();

    const instagram = String(body.instagram || "").trim();
    const facebook = String(body.facebook || "").trim();
    const linkedin = String(body.linkedin || "").trim();
    const tiktok = String(body.tiktok || "").trim();
    const twitter = String(body.twitter || "").trim();

    const metaPixelId = String(body.metaPixelId || "").trim();

    if (metaPixelId && !/^\d{5,20}$/.test(metaPixelId)) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Die Meta Pixel-ID darf nur Ziffern enthalten."
              : "Meta Pixel Kimliği yalnızca rakam içerebilir.",
        },
        {
          status: 400,
        },
      );
    }

    const tiktokPixelId = String(body.tiktokPixelId || "").trim();

    if (tiktokPixelId && !/^[A-Za-z0-9]{10,30}$/.test(tiktokPixelId)) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Die TikTok Pixel-ID ist ungültig."
              : "TikTok Pixel Kimliği geçersiz.",
        },
        {
          status: 400,
        },
      );
    }

    if (!companyName) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Firmenname ist erforderlich."
              : "Firma adı zorunludur.",
        },
        {
          status: 400,
        },
      );
    }

    if (companyName.length > 100) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Der Firmenname darf höchstens 100 Zeichen lang sein."
              : "Firma adı en fazla 100 karakter olabilir.",
        },
        {
          status: 400,
        },
      );
    }

    if (companySubtitle.length > 160) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Der Untertitel darf höchstens 160 Zeichen lang sein."
              : "Alt başlık en fazla 160 karakter olabilir.",
        },
        {
          status: 400,
        },
      );
    }

    const settings = await prisma.companySetting.upsert({
      where: {
        tenantId: tenant.id,
      },
      create: {
        tenantId: tenant.id,
        companyName,
        companySubtitle: companySubtitle || null,
        logoUrl: rawLogoUrl || null,
        logoWidth,
        logoHeight,
        phone: phone || null,
        whatsapp: whatsapp || null,
        email: email || null,
        website: website || null,
        address: address || null,
        country: country || null,
        footerText: footerText || null,
        copyrightText: copyrightText || null,

        legalForm: legalForm || null,
        managingDirector: managingDirector || null,
        companyDescription: companyDescription || null,

        taxNumber: taxNumber || null,
        vatId: vatId || null,
        commercialRegister: commercialRegister || null,
        registerCourt: registerCourt || null,

        street: street || null,
        houseNumber: houseNumber || null,
        postalCode: postalCode || null,
        city: city || null,
        state: state || null,

        bankName: bankName || null,
        accountHolder: accountHolder || null,
        iban: iban || null,
        bic: bic || null,

        instagram: instagram || null,
        facebook: facebook || null,
        linkedin: linkedin || null,
        tiktok: tiktok || null,
        twitter: twitter || null,

        metaPixelId: metaPixelId || null,
        tiktokPixelId: tiktokPixelId || null,

        showOffers,
        minOrderValueEnabled,
        minOrderValue,
        deliveryFeeEnabled,
        deliveryFee,
        autoPrintOrders,
        businessHoursEnabled,
        businessHours,
      },
      update: {
        companyName,
        companySubtitle: companySubtitle || null,
        logoUrl: rawLogoUrl || null,
        logoWidth,
        logoHeight,
        phone: phone || null,
        whatsapp: whatsapp || null,
        email: email || null,
        website: website || null,
        address: address || null,
        country: country || null,
        footerText: footerText || null,
        copyrightText: copyrightText || null,

        legalForm: legalForm || null,
        managingDirector: managingDirector || null,
        companyDescription: companyDescription || null,

        taxNumber: taxNumber || null,
        vatId: vatId || null,
        commercialRegister: commercialRegister || null,
        registerCourt: registerCourt || null,

        street: street || null,
        houseNumber: houseNumber || null,
        postalCode: postalCode || null,
        city: city || null,
        state: state || null,

        bankName: bankName || null,
        accountHolder: accountHolder || null,
        iban: iban || null,
        bic: bic || null,

        instagram: instagram || null,
        facebook: facebook || null,
        linkedin: linkedin || null,
        tiktok: tiktok || null,
        twitter: twitter || null,

        metaPixelId: metaPixelId || null,
        tiktokPixelId: tiktokPixelId || null,

        showOffers,
        minOrderValueEnabled,
        minOrderValue,
        deliveryFeeEnabled,
        deliveryFee,
        autoPrintOrders,
        businessHoursEnabled,
        businessHours,
      },
    });

    await logAuditEvent({
      tenantId: tenant.id,
      actorUserId: admin.session.userId,
      actorEmail: admin.session.email,
      actorRole: admin.session.role,
      action: "company_settings.updated",
      summary: "Firmeneinstellungen geändert.",
      entityType: "CompanySetting",
    });

    return NextResponse.json({
      message:
        language === "de"
          ? "Firmeneinstellungen wurden gespeichert."
          : "Firma ayarları kaydedildi.",
      settings,
    });
  } catch (error) {
    console.error("UPDATE_COMPANY_SETTINGS_ERROR", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : language === "de"
              ? "Unbekannter Fehler"
              : "Bilinmeyen hata",
      },
      {
        status: 500,
      },
    );
  }
});
