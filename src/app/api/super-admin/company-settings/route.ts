import { getAdminWithPermissions } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
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
  const admin = await requireSuperAdmin();

  if (!admin) {
    return NextResponse.json(
      {
        error: "Yetkisiz erişim.",
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
        error: "Firma ayarları yüklenemedi.",
      },
      {
        status: 500,
      },
    );
  }
});

export const PATCH = withTenant(async (request: Request, _context, tenant) => {
  const admin = await requireSuperAdmin();

  if (!admin) {
    return NextResponse.json(
      {
        error: "Yetkisiz erişim.",
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

    if (!companyName) {
      return NextResponse.json(
        {
          error: "Firma adı zorunludur.",
        },
        {
          status: 400,
        },
      );
    }

    if (companyName.length > 100) {
      return NextResponse.json(
        {
          error: "Firma adı en fazla 100 karakter olabilir.",
        },
        {
          status: 400,
        },
      );
    }

    if (companySubtitle.length > 160) {
      return NextResponse.json(
        {
          error: "Alt başlık en fazla 160 karakter olabilir.",
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

        showOffers,
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

        showOffers,
      },
    });

    return NextResponse.json({
      message: "Firma ayarları kaydedildi.",
      settings,
    });
  } catch (error) {
    console.error("UPDATE_COMPANY_SETTINGS_ERROR", error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Bilinmeyen hata",
      },
      {
        status: 500,
      },
    );
  }
});
