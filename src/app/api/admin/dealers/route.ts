import {
  getAdminWithPermissions,
  requireAdminPermission,
} from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

function nullableText(value: unknown) {
  const text = String(value ?? "").trim();

  return text || null;
}

export async function GET() {
  const admin = await requireAdminPermission("viewDealers");

  if (!admin) {
    return NextResponse.json(
      {
        error: "Bayileri görüntüleme yetkiniz yok.",
      },
      {
        status: 403,
      },
    );
  }

  try {
    const dealers = await prisma.user.findMany({
      where: {
        role: "DEALER",
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

        dealerProfile: {
          select: {
            id: true,
            dealerNumber: true,
            companyName: true,
            contactName: true,
            phone: true,
            taxNumber: true,
            street: true,
            houseNumber: true,
            postalCode: true,
            city: true,
            country: true,
            creditLimit: true,
            currentBalance: true,
            note: true,
            active: true,
          },
        },

        _count: {
          select: {
            dealerPrices: true,
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      dealers: dealers.map((dealer) => ({
        ...dealer,

        dealerProfile: dealer.dealerProfile
          ? {
              ...dealer.dealerProfile,
              creditLimit: Number(dealer.dealerProfile.creditLimit),
              currentBalance: Number(dealer.dealerProfile.currentBalance),
            }
          : null,
      })),
    });
  } catch (error) {
    console.error("LOAD_DEALERS_ERROR", error);

    return NextResponse.json(
      {
        error: "Bayiler yüklenemedi.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(request: Request) {
  const admin = await getAdminWithPermissions();

  if (!admin || (!admin.isSuperAdmin && !admin.permissions.createDealer)) {
    return NextResponse.json(
      {
        error: "Yeni bayi oluşturma yetkiniz yok.",
      },
      {
        status: 403,
      },
    );
  }

  try {
    const body = await request.json();

    const dealerNumber = String(body.dealerNumber ?? "")
      .trim()
      .toLocaleUpperCase("tr-TR");

    const companyName = String(body.companyName ?? "").trim();
    const contactName = String(body.contactName ?? "").trim();

    const firstName =
      String(body.firstName ?? "").trim() ||
      contactName.split(/\s+/)[0] ||
      companyName;

    const lastName =
      String(body.lastName ?? "").trim() ||
      contactName.split(/\s+/).slice(1).join(" ") ||
      "Bayi";

    const email = String(body.email ?? "")
      .trim()
      .toLowerCase();

    const phone = String(body.phone ?? "").trim();
    const password = String(body.password ?? "");

    const creditLimit = Number(body.creditLimit ?? 0);

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

    if (password.length < 8) {
      return NextResponse.json(
        {
          error: "Geçici şifre en az 8 karakter olmalıdır.",
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

    const [existingEmail, existingDealerNumber] = await Promise.all([
      prisma.user.findUnique({
        where: {
          email,
        },

        select: {
          id: true,
        },
      }),

      prisma.dealerProfile.findUnique({
        where: {
          dealerNumber,
        },

        select: {
          id: true,
        },
      }),
    ]);

    if (existingEmail) {
      return NextResponse.json(
        {
          error: "Bu e-posta adresi zaten kullanılıyor.",
        },
        {
          status: 409,
        },
      );
    }

    if (existingDealerNumber) {
      return NextResponse.json(
        {
          error: "Bu bayi numarası zaten kullanılıyor.",
        },
        {
          status: 409,
        },
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const dealer = await prisma.$transaction(async (tx) => {
      return tx.user.create({
        data: {
          email,
          passwordHash,
          role: "DEALER",

          firstName,
          lastName,
          companyName,
          phone: phone || null,

          profileCompleted: true,
          isActive: true,
          emailVerified: true,

          dealerProfile: {
            create: {
              dealerNumber,
              companyName,
              contactName: contactName || null,
              phone: phone || null,

              taxNumber: nullableText(body.taxNumber),

              street: nullableText(body.street),
              houseNumber: nullableText(body.houseNumber),
              postalCode: nullableText(body.postalCode),
              city: nullableText(body.city),

              country: String(body.country ?? "").trim() || "Deutschland",

              creditLimit,
              currentBalance: 0,

              note: nullableText(body.note),
              active: true,
            },
          },
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

    return NextResponse.json(
      {
        message: "Bayi hesabı başarıyla oluşturuldu.",

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
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("CREATE_DEALER_ERROR", error);

    return NextResponse.json(
      {
        error: "Bayi oluşturulurken hata oluştu.",
      },
      {
        status: 500,
      },
    );
  }
}
