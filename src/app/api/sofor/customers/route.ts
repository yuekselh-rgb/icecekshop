import { verifySessionToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withTenant } from "@/lib/tenant";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

/*
 * Aynı numaranın "0151...", "+49151..." ve "0049151..." gibi farklı
 * biçimlerde tekrar kaydedilmesini engellemek için birkaç olası
 * yazım biçimini üretir. Veritabanındaki bütün numaraları normalize
 * eden bir migration yapılmadığı için tam kapsamlı değildir, ama en
 * yaygın biçim farklarını yakalar.
 */
function phoneVariants(rawPhone: string): string[] {
  const digitsOnly = rawPhone.replace(/\D/g, "");

  if (!digitsOnly) {
    return [rawPhone];
  }

  let national = digitsOnly;

  if (national.startsWith("49")) {
    national = national.slice(2);
  } else if (national.startsWith("0")) {
    national = national.slice(1);
  }

  return Array.from(
    new Set([
      rawPhone,
      digitsOnly,
      `0${national}`,
      `+49${national}`,
      `0049${national}`,
    ]),
  );
}

async function requireDriver() {
  const cookieStore = await cookies();

  const token = cookieStore.get("paketmarket_session")?.value;

  if (!token) {
    return null;
  }

  const session = await verifySessionToken(token);

  if (!session || session.role !== "DRIVER") {
    return null;
  }

  return session;
}

function serializeCustomer(customer: {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  companyName: string | null;
  phone: string | null;
  customerType: string | null;
  addresses: Array<{
    street: string;
    houseNumber: string;
    postalCode: string;
    city: string;
  }>;
}) {
  const defaultAddress = customer.addresses[0];

  return {
    id: customer.id,
    email: customer.email,
    firstName: customer.firstName,
    lastName: customer.lastName,
    companyName: customer.companyName,
    phone: customer.phone,
    customerType: customer.customerType,

    name:
      customer.companyName ||
      [customer.firstName, customer.lastName]
        .filter(Boolean)
        .join(" ")
        .trim() ||
      customer.email,

    address: defaultAddress
      ? [
          defaultAddress.street,
          defaultAddress.houseNumber,
          `${defaultAddress.postalCode} ${defaultAddress.city}`.trim(),
        ]
          .filter(Boolean)
          .join(", ")
      : null,
  };
}

export const GET = withTenant(async () => {
  const session = await requireDriver();

  if (!session) {
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
    const customers = await prisma.user.findMany({
      where: {
        role: "CUSTOMER",
        isActive: true,

        email: {
          not: "bar-satis@paketmarket.local",
        },
      },

      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        companyName: true,
        phone: true,
        customerType: true,

        addresses: {
          where: {
            isDefault: true,
          },

          take: 1,

          select: {
            street: true,
            houseNumber: true,
            postalCode: true,
            city: true,
          },
        },
      },

      orderBy: [
        {
          companyName: "asc",
        },
        {
          firstName: "asc",
        },
        {
          lastName: "asc",
        },
      ],
    });

    return NextResponse.json({
      customers: customers.map(serializeCustomer),
    });
  } catch (error) {
    console.error("DRIVER_CUSTOMERS_GET_ERROR", error);

    return NextResponse.json(
      {
        error: "Müşteriler yüklenemedi.",
      },
      {
        status: 500,
      },
    );
  }
});

export const POST = withTenant(async (request: NextRequest, _context, tenant) => {
  const session = await requireDriver();

  if (!session) {
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

    const customerType = String(body.customerType || "BUSINESS")
      .trim()
      .toUpperCase();

    const firstName = String(body.firstName || "").trim();
    const lastName = String(body.lastName || "").trim();
    const companyName = String(body.companyName || "").trim();
    const phone = String(body.phone || "").trim();

    const requestedEmail = String(body.email || "")
      .trim()
      .toLocaleLowerCase("tr-TR");

    const street = String(body.street || "").trim();
    const houseNumber = String(body.houseNumber || "").trim();
    const postalCode = String(body.postalCode || "").trim();
    const city = String(body.city || "").trim();

    if (customerType !== "PRIVATE" && customerType !== "BUSINESS") {
      return NextResponse.json(
        {
          error: "Geçersiz müşteri türü.",
        },
        {
          status: 400,
        },
      );
    }

    if (customerType === "BUSINESS" && !companyName) {
      return NextResponse.json(
        {
          error: "Firma müşterisi için firma adı zorunludur.",
        },
        {
          status: 400,
        },
      );
    }

    if (customerType === "PRIVATE" && !firstName && !lastName) {
      return NextResponse.json(
        {
          error: "Özel müşteri için ad veya soyad girin.",
        },
        {
          status: 400,
        },
      );
    }

    if (!phone) {
      return NextResponse.json(
        {
          error: "Telefon numarası zorunludur.",
        },
        {
          status: 400,
        },
      );
    }

    if (postalCode && !/^\d{5}$/.test(postalCode)) {
      return NextResponse.json(
        {
          error: "Posta kodu 5 rakam olmalıdır.",
        },
        {
          status: 400,
        },
      );
    }

    const hasAnyAddressField = Boolean(
      street || houseNumber || postalCode || city,
    );

    if (
      hasAnyAddressField &&
      (!street || !houseNumber || !postalCode || !city)
    ) {
      return NextResponse.json(
        {
          error:
            "Adres girilecekse sokak, kapı numarası, posta kodu ve şehir birlikte doldurulmalıdır.",
        },
        {
          status: 400,
        },
      );
    }

    const existingPhone = await prisma.user.findFirst({
      where: {
        role: "CUSTOMER",
        phone: {
          in: phoneVariants(phone),
        },
      },

      select: {
        id: true,
        companyName: true,
        firstName: true,
        lastName: true,
      },
    });

    if (existingPhone) {
      const existingName =
        existingPhone.companyName ||
        [existingPhone.firstName, existingPhone.lastName]
          .filter(Boolean)
          .join(" ")
          .trim() ||
        "Kayıtlı müşteri";

      return NextResponse.json(
        {
          error: `Bu telefon numarası ${existingName} adına zaten kayıtlı.`,
        },
        {
          status: 409,
        },
      );
    }

    if (requestedEmail) {
      const existingEmail = await prisma.user.findFirst({
        where: {
          email: requestedEmail,
        },

        select: {
          id: true,
        },
      });

      if (existingEmail) {
        return NextResponse.json(
          {
            error: "Bu e-posta adresiyle kayıtlı bir kullanıcı zaten var.",
          },
          {
            status: 409,
          },
        );
      }
    }

    const generatedEmail = `sofor-musteri-${randomUUID()}@paketmarket.local`;

    const randomPassword = await bcrypt.hash(randomUUID(), 10);

    const customer = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: requestedEmail || generatedEmail,
        passwordHash: randomPassword,
        role: "CUSTOMER",
        isActive: true,

        customerType: customerType === "BUSINESS" ? "BUSINESS" : "PRIVATE",

        firstName: firstName || null,
        lastName: lastName || null,

        companyName: customerType === "BUSINESS" ? companyName : null,

        phone,
        profileCompleted: hasAnyAddressField,

        addresses: hasAnyAddressField
          ? {
              create: {
                tenantId: tenant.id,
                street,
                houseNumber,
                postalCode,
                city,
                country: "Deutschland",
                isDefault: true,
              },
            }
          : undefined,
      },

      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        companyName: true,
        phone: true,
        customerType: true,

        addresses: {
          where: {
            isDefault: true,
          },

          take: 1,

          select: {
            street: true,
            houseNumber: true,
            postalCode: true,
            city: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        message: "Müşteri başarıyla oluşturuldu.",
        customer: serializeCustomer(customer),
        createdByDriverId: session.userId,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("DRIVER_CUSTOMER_CREATE_ERROR", error);

    return NextResponse.json(
      {
        error: "Müşteri oluşturulurken hata oluştu.",
      },
      {
        status: 500,
      },
    );
  }
});
