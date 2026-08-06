import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const fallbackSettings = {
  id: "main",
  companyName: "Firma Adı",
  companySubtitle: null,
  logoUrl: null,
  logoWidth: 260,
  logoHeight: 120,

  phone: null,
  whatsapp: null,
  email: null,
  website: null,

  address: null,
  country: null,

  footerText: null,
  copyrightText: null,

  legalForm: null,
  managingDirector: null,
  companyDescription: null,

  taxNumber: null,
  vatId: null,
  commercialRegister: null,
  registerCourt: null,

  street: null,
  houseNumber: null,
  postalCode: null,
  city: null,
  state: null,

  bankName: null,
  accountHolder: null,
  iban: null,
  bic: null,

  instagram: null,
  facebook: null,
  linkedin: null,
  tiktok: null,
  twitter: null,

  showOffers: true,
};

export async function GET() {
  try {
    const settings = await prisma.companySetting.findUnique({
      where: {
        id: "main",
      },
    });

    return NextResponse.json({
      settings: settings || fallbackSettings,
    });
  } catch (error) {
    console.error("PUBLIC_COMPANY_SETTINGS_ERROR", error);

    return NextResponse.json({
      settings: fallbackSettings,
    });
  }
}
