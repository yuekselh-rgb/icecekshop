import { getAdminWithPermissions } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { withTenant } from "@/lib/tenant";
import { NextRequest, NextResponse } from "next/server";

function nullableText(value: unknown) {
  const text = String(value ?? "").trim();

  return text || null;
}

export const PATCH = withTenant(async (
  request: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  },
) => {
  const admin = await getAdminWithPermissions();

  if (!admin || (!admin.isSuperAdmin && !admin.permissions.updateDealer)) {
    return NextResponse.json(
      {
        error: "Bayi bilgilerini düzenleme yetkiniz yok.",
      },
      {
        status: 403,
      },
    );
  }

  try {
    const { id } = await context.params;
    const body = await request.json();

    const existingDealer = await prisma.user.findFirst({
      where: {
        id,
        role: "DEALER",
      },

      select: {
        id: true,
        email: true,

        dealerProfile: {
          select: {
            id: true,
            dealerNumber: true,
            currentBalance: true,
          },
        },
      },
    });

    if (!existingDealer || !existingDealer.dealerProfile) {
      return NextResponse.json(
        {
          error: "Bayi bulunamadı.",
        },
        {
          status: 404,
        },
      );
    }

    const dealerNumber = String(body.dealerNumber ?? "")
      .trim()
      .toLocaleUpperCase("tr-TR");

    const companyName = String(body.companyName ?? "").trim();

    const firstName = nullableText(body.firstName);
    const lastName = nullableText(body.lastName);

    const contactName = nullableText(body.contactName);

    const email = String(body.email ?? "")
      .trim()
      .toLowerCase();

    const phone = nullableText(body.phone);

    const creditLimit = Number(body.creditLimit ?? 0);

    const isActive = typeof body.isActive === "boolean" ? body.isActive : true;

    if (!dealerNumber) {
      return NextResponse.json(
        {
          error: "Bayi numarası zorunludur.",
        },
        {
          status: 400,
        },
      );
    }

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

    if (!email) {
      return NextResponse.json(
        {
          error: "E-posta adresi zorunludur.",
        },
        {
          status: 400,
        },
      );
    }

    if (!Number.isFinite(creditLimit) || creditLimit < 0) {
      return NextResponse.json(
        {
          error: "Geçerli bir kredi limiti girin.",
        },
        {
          status: 400,
        },
      );
    }

    const [emailOwner, dealerNumberOwner] = await Promise.all([
      prisma.user.findFirst({
        where: {
          email,

          id: {
            not: id,
          },
        },

        select: {
          id: true,
        },
      }),

      prisma.dealerProfile.findFirst({
        where: {
          dealerNumber,

          userId: {
            not: id,
          },
        },

        select: {
          id: true,
        },
      }),
    ]);

    if (emailOwner) {
      return NextResponse.json(
        {
          error: "Bu e-posta adresi başka bir hesap tarafından kullanılıyor.",
        },
        {
          status: 409,
        },
      );
    }

    if (dealerNumberOwner) {
      return NextResponse.json(
        {
          error: "Bu bayi numarası başka bir bayi tarafından kullanılıyor.",
        },
        {
          status: 409,
        },
      );
    }

    const dealer = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: {
          id,
        },

        data: {
          email,
          firstName,
          lastName,
          companyName,
          phone,
          isActive,
        },
      });

      await tx.dealerProfile.update({
        where: {
          userId: id,
        },

        data: {
          dealerNumber,
          companyName,
          contactName,
          phone,

          taxNumber: nullableText(body.taxNumber),

          street: nullableText(body.street),
          houseNumber: nullableText(body.houseNumber),
          postalCode: nullableText(body.postalCode),
          city: nullableText(body.city),

          country: String(body.country ?? "").trim() || "Deutschland",

          creditLimit,

          note: nullableText(body.note),
          active: isActive,
        },
      });

      return tx.user.findUnique({
        where: {
          id,
        },

        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          companyName: true,
          phone: true,
          isActive: true,
          createdAt: true,

          dealerProfile: true,

          _count: {
            select: {
              dealerPrices: true,
            },
          },
        },
      });
    });

    if (!dealer) {
      return NextResponse.json(
        {
          error: "Bayi güncellendikten sonra yüklenemedi.",
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json({
      message: "Bayi bilgileri başarıyla güncellendi.",

      dealer: {
        ...dealer,

        dealerProfile: dealer.dealerProfile
          ? {
              ...dealer.dealerProfile,

              creditLimit: Number(dealer.dealerProfile.creditLimit),

              currentBalance: Number(dealer.dealerProfile.currentBalance),
            }
          : null,
      },
    });
  } catch (error) {
    console.error("UPDATE_DEALER_ERROR", error);

    return NextResponse.json(
      {
        error: "Bayi bilgileri güncellenemedi.",
      },
      {
        status: 500,
      },
    );
  }
});
