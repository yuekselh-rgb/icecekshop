import { getAdminWithPermissions } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

function cleanOptional(value: unknown) {
  const cleaned = String(value || "").trim();

  return cleaned || null;
}

export async function GET() {
  const admin = await getAdminWithPermissions();

  if (!admin || (!admin.isSuperAdmin && !admin.permissions.viewBarCash)) {
    return NextResponse.json(
      {
        error: "Firmaları görüntüleme yetkiniz yok.",
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
        error: "Firmalar yüklenemedi.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(request: Request) {
  const admin = await getAdminWithPermissions();

  if (
    !admin ||
    (!admin.isSuperAdmin && !admin.permissions.createBarCashExpense)
  ) {
    return NextResponse.json(
      {
        error: "Firma oluşturma yetkiniz yok.",
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
          error: "Firma adı zorunludur.",
        },
        {
          status: 400,
        },
      );
    }

    if (name.length > 160) {
      return NextResponse.json(
        {
          error: "Firma adı en fazla 160 karakter olabilir.",
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
          error: `${duplicate.name} isimli firma zaten kayıtlıdır.`,

          supplier: duplicate,
        },
        {
          status: 409,
        },
      );
    }

    const supplier = await prisma.supplier.create({
      data: {
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
        message: "Firma başarıyla kaydedildi.",

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
        error: "Firma kaydedilemedi.",
      },
      {
        status: 500,
      },
    );
  }
}
