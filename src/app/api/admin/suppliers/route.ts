import { getAdminWithPermissions } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { getRequestLanguage } from "@/lib/request-language";
import { withTenant } from "@/lib/tenant";
import { NextRequest, NextResponse } from "next/server";

function cleanOptional(value: unknown) {
  const cleaned = String(value || "").trim();

  return cleaned || null;
}

export const GET = withTenant(async () => {
  const language = await getRequestLanguage();

  const admin = await getAdminWithPermissions();

  if (!admin || (!admin.isSuperAdmin && !admin.permissions.viewBarCash)) {
    return NextResponse.json(
      {
        error:
          language === "de"
            ? "Sie sind nicht berechtigt, Lieferanten einzusehen."
            : "Firmaları görüntüleme yetkiniz yok.",
      },
      {
        status: 403,
      },
    );
  }

  try {
    const suppliers = await prisma.supplier.findMany({
      where: {
        active: true,
      },

      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({
      suppliers,
    });
  } catch (error) {
    console.error("LOAD_SUPPLIERS_ERROR", error);

    return NextResponse.json(
      {
        error:
          language === "de"
            ? "Lieferanten konnten nicht geladen werden."
            : "Firmalar yüklenemedi.",
      },
      {
        status: 500,
      },
    );
  }
});

export const POST = withTenant(async (request: NextRequest, _context, tenant) => {
  const language = await getRequestLanguage();

  const admin = await getAdminWithPermissions();

  if (
    !admin ||
    (!admin.isSuperAdmin && !admin.permissions.createBarCashExpense)
  ) {
    return NextResponse.json(
      {
        error:
          language === "de"
            ? "Sie sind nicht berechtigt, Lieferanten anzulegen."
            : "Firma oluşturma yetkiniz yok.",
      },
      {
        status: 403,
      },
    );
  }

  try {
    const body = await request.json();

    const name = String(body.name || "").trim();

    if (!name) {
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

    if (name.length > 160) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Der Firmenname darf höchstens 160 Zeichen lang sein."
              : "Firma adı en fazla 160 karakter olabilir.",
        },
        {
          status: 400,
        },
      );
    }

    const duplicate = await prisma.supplier.findFirst({
      where: {
        name: {
          equals: name,
          mode: "insensitive",
        },
      },

      select: {
        id: true,
        name: true,
      },
    });

    if (duplicate) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? `Eine Firma namens ${duplicate.name} ist bereits registriert.`
              : `${duplicate.name} isimli firma zaten kayıtlıdır.`,

          supplier: duplicate,
        },
        {
          status: 409,
        },
      );
    }

    const supplier = await prisma.supplier.create({
      data: {
        tenantId: tenant.id,
        name,

        contactName: cleanOptional(body.contactName),

        phone: cleanOptional(body.phone),

        email: cleanOptional(body.email),

        street: cleanOptional(body.street),

        houseNumber: cleanOptional(body.houseNumber),

        postalCode: cleanOptional(body.postalCode),

        city: cleanOptional(body.city),

        country: String(body.country || "Deutschland").trim() || "Deutschland",

        taxNumber: cleanOptional(body.taxNumber),

        customerNumber: cleanOptional(body.customerNumber),

        note: cleanOptional(body.note),
      },
    });

    return NextResponse.json(
      {
        message:
          language === "de"
            ? "Firma wurde erfolgreich gespeichert."
            : "Firma başarıyla kaydedildi.",

        supplier,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("CREATE_SUPPLIER_ERROR", error);

    return NextResponse.json(
      {
        error:
          language === "de"
            ? "Firma konnte nicht gespeichert werden."
            : "Firma kaydedilemedi.",
      },
      {
        status: 500,
      },
    );
  }
});
