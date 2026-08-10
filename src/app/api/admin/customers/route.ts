import { getAdminWithPermissions, requireAdminPermission } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { getRequestLanguage } from "@/lib/request-language";
import { withTenant } from "@/lib/tenant";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";

export const GET = withTenant(async () => {
  const language = await getRequestLanguage();

  const admin = await getAdminWithPermissions();

  const authorized =
    admin &&
    (admin.isSuperAdmin ||
      admin.permissions.viewCustomers ||
      admin.permissions.makeBarSale);

  if (!authorized) {
    return NextResponse.json(
      {
        error:
          language === "de"
            ? "Sie sind für diese Aktion nicht berechtigt."
            : "Bu işlem için yetkiniz yok.",
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

        orders: {
          select: {
            totalAmount: true,
            paymentStatus: true,
            status: true,
            createdAt: true,
          },
        },

        pfandReturns: {
          select: {
            approvedAmount: true,
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
        {
          email: "asc",
        },
      ],
    });

    return NextResponse.json({
      customers: customers.map((customer) => {
        const totalPurchase = customer.orders.reduce(
          (sum, order) => sum + Number(order.totalAmount),
          0,
        );

        const openBalance = customer.orders
          .filter((o) => o.paymentStatus === "OPEN")
          .reduce((sum, o) => sum + Number(o.totalAmount), 0);

        const paidTotal = customer.orders
          .filter((o) => o.paymentStatus === "PAID")
          .reduce((sum, o) => sum + Number(o.totalAmount), 0);

        const pendingOrders = customer.orders.filter(
          (o) =>
            o.status !== "DELIVERED" &&
            o.status !== "CANCELLED",
        ).length;

        const pfandTotal = customer.pfandReturns.reduce(
          (sum, p) => sum + Number(p.approvedAmount ?? 0),
          0,
        );

        const lastOrder =
          customer.orders.length > 0
            ? [...customer.orders]
                .sort(
                  (a, b) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime(),
                )[0].createdAt
            : null;

        return {
          ...customer,

          address: customer.addresses[0]
            ? [
                customer.addresses[0].street,
                customer.addresses[0].houseNumber,
                [customer.addresses[0].postalCode, customer.addresses[0].city]
                  .filter(Boolean)
                  .join(" "),
              ]
                .filter(Boolean)
                .join(", ")
            : null,

          totalPurchase,
          openBalance,
          paidTotal,
          orderCount: customer.orders.length,
          pendingOrders,
          pfandTotal,
          lastOrder,

          addresses: undefined,
          orders: undefined,
          pfandReturns: undefined,
        };
      }),
    });
  } catch (error) {
    console.error("ADMIN_CUSTOMERS_ERROR", error);

    return NextResponse.json(
      {
        error:
          language === "de"
            ? "Kunden konnten nicht geladen werden."
            : "Müşteriler yüklenemedi.",
      },
      {
        status: 500,
      },
    );
  }
});

export const POST = withTenant(async (request: NextRequest, _context, tenant) => {
  const language = await getRequestLanguage();

  const admin = await requireAdminPermission("makeBarSale");

  if (!admin) {
    return NextResponse.json(
      {
        error:
          language === "de"
            ? "Sie sind nicht berechtigt, neue Kunden anzulegen."
            : "Yeni müşteri kaydetme yetkiniz yok.",
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

    if (customerType !== "PRIVATE" && customerType !== "BUSINESS") {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Ungültiger Kundentyp."
              : "Geçersiz müşteri türü.",
        },
        {
          status: 400,
        },
      );
    }

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

    const floor = String(body.floor || "").trim();

    const doorbellName = String(body.doorbellName || "").trim();

    if (customerType === "BUSINESS" && !companyName) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Für Firmenkunden ist ein Firmenname erforderlich."
              : "Firma müşterisi için firma adı zorunludur.",
        },
        {
          status: 400,
        },
      );
    }

    if (customerType === "PRIVATE" && !firstName && !lastName) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Bitte geben Sie Vor- oder Nachname ein."
              : "Özel müşteri için ad veya soyad girin.",
        },
        {
          status: 400,
        },
      );
    }

    if (!phone) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Telefonnummer ist erforderlich."
              : "Telefon numarası zorunludur.",
        },
        {
          status: 400,
        },
      );
    }

    if (postalCode && !/^\d{5}$/.test(postalCode)) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Die Postleitzahl muss aus 5 Ziffern bestehen."
              : "Posta kodu 5 rakam olmalıdır.",
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
            language === "de"
              ? "Wenn eine Adresse angegeben wird, müssen Straße, Hausnummer, Postleitzahl und Stadt zusammen ausgefüllt werden."
              : "Adres girilecekse sokak, kapı numarası, posta kodu ve şehir birlikte doldurulmalıdır.",
        },
        {
          status: 400,
        },
      );
    }

    if (requestedEmail) {
      const emailExists = await prisma.user.findFirst({
        where: {
          email: requestedEmail,
        },

        select: {
          id: true,
        },
      });

      if (emailExists) {
        return NextResponse.json(
          {
            error:
              language === "de"
                ? "Es existiert bereits ein Benutzer mit dieser E-Mail-Adresse."
                : "Bu e-posta adresiyle kayıtlı bir kullanıcı zaten var.",
          },
          {
            status: 409,
          },
        );
      }
    }

    const phoneExists = await prisma.user.findFirst({
      where: {
        role: "CUSTOMER",

        phone: {
          equals: phone,
        },
      },

      select: {
        id: true,
        firstName: true,
        lastName: true,
        companyName: true,
      },
    });

    if (phoneExists) {
      const existingName =
        phoneExists.companyName ||
        [phoneExists.firstName, phoneExists.lastName]
          .filter(Boolean)
          .join(" ")
          .trim() ||
        (language === "de" ? "Registrierter Kunde" : "Kayıtlı müşteri");

      return NextResponse.json(
        {
          error:
            language === "de"
              ? `Diese Telefonnummer ist bereits für ${existingName} registriert.`
              : `Bu telefon numarası ${existingName} adına zaten kayıtlı.`,
        },
        {
          status: 409,
        },
      );
    }

    const generatedEmail = `bar-musteri-${randomUUID()}@paketmarket.local`;

    const email = requestedEmail || generatedEmail;

    const randomPassword = await bcrypt.hash(randomUUID(), 10);

    const customer = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email,
        passwordHash: randomPassword,
        role: "CUSTOMER",
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
                floor: floor || null,
                doorbellName: doorbellName || null,
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

        orders: {
          select: {
            totalAmount: true,
            paymentStatus: true,
            status: true,
            createdAt: true,
          },
        },

        pfandReturns: {
          select: {
            approvedAmount: true,
          },
        },
      },
    });

    const address = customer.addresses[0]
      ? [
          customer.addresses[0].street,

          customer.addresses[0].houseNumber,

          [customer.addresses[0].postalCode, customer.addresses[0].city]
            .filter(Boolean)
            .join(" "),
        ]
          .filter(Boolean)
          .join(", ")
      : null;

    return NextResponse.json(
      {
        message:
          language === "de"
            ? "Kunde wurde erfolgreich angelegt."
            : "Müşteri başarıyla kaydedildi.",

        customer: {
          id: customer.id,
          email: customer.email,
          firstName: customer.firstName,
          lastName: customer.lastName,
          companyName: customer.companyName,
          phone: customer.phone,
          customerType: customer.customerType,
          address,
        },
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("ADMIN_CUSTOMER_CREATE_ERROR", error);

    return NextResponse.json(
      {
        error:
          language === "de"
            ? "Fehler beim Anlegen des Kunden."
            : "Müşteri kaydedilirken hata oluştu.",
      },
      {
        status: 500,
      },
    );
  }
});
