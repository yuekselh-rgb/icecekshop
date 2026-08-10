import { requireAdminPermission } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { getRequestLanguage } from "@/lib/request-language";
import { withTenant } from "@/lib/tenant";
import { NextRequest, NextResponse } from "next/server";

function createUnitCode(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLocaleUpperCase("tr-TR")
    .replace(/İ/g, "I")
    .replace(/Ş/g, "S")
    .replace(/Ğ/g, "G")
    .replace(/Ü/g, "U")
    .replace(/Ö/g, "O")
    .replace(/Ç/g, "C")
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export const GET = withTenant(async () => {
  const language = await getRequestLanguage();

  const admin = await requireAdminPermission("viewProducts");

  if (!admin) {
    return NextResponse.json(
      {
        error:
          language === "de"
            ? "Sie sind nicht berechtigt, Einheiten einzusehen."
            : "Birimleri görüntüleme yetkiniz yok.",
      },
      {
        status: 403,
      },
    );
  }

  try {
    const units = await prisma.stockUnitOption.findMany({
      where: {
        active: true,
      },
      orderBy: [
        {
          sortOrder: "asc",
        },
        {
          nameTr: "asc",
        },
      ],
    });

    return NextResponse.json({
      units,
    });
  } catch (error) {
    console.error("LOAD_STOCK_UNITS_ERROR", error);

    return NextResponse.json(
      {
        error:
          language === "de"
            ? "Einheiten konnten nicht geladen werden."
            : "Birimler yüklenemedi.",
      },
      {
        status: 500,
      },
    );
  }
});

export const POST = withTenant(async (request: NextRequest, _context, tenant) => {
  const language = await getRequestLanguage();

  const admin = await requireAdminPermission("updateProduct");

  if (!admin) {
    return NextResponse.json(
      {
        error:
          language === "de"
            ? "Sie sind nicht berechtigt, neue Einheiten hinzuzufügen."
            : "Yeni birim ekleme yetkiniz yok.",
      },
      {
        status: 403,
      },
    );
  }

  try {
    const body = await request.json();

    const nameTr = String(body.nameTr ?? "").trim();
    const nameDe = String(body.nameDe ?? "").trim();
    const code = createUnitCode(body.code || nameTr);

    if (!nameTr || !nameDe || !code) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Türkischer und deutscher Einheitenname sind erforderlich."
              : "Türkçe ve Almanca birim adı zorunludur.",
        },
        {
          status: 400,
        },
      );
    }

    const existing = await prisma.stockUnitOption.findFirst({
      where: {
        code,
      },
    });

    if (existing) {
      if (!existing.active) {
        const unit = await prisma.stockUnitOption.update({
          where: {
            id: existing.id,
          },
          data: {
            nameTr,
            nameDe,
            active: true,
          },
        });

        return NextResponse.json({
          message:
            language === "de"
              ? "Einheit wurde wieder aktiviert."
              : "Birim yeniden aktifleştirildi.",
          unit,
        });
      }

      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Diese Einheit ist bereits vorhanden."
              : "Bu birim zaten kayıtlı.",
        },
        {
          status: 409,
        },
      );
    }

    const lastUnit = await prisma.stockUnitOption.findFirst({
      orderBy: {
        sortOrder: "desc",
      },
      select: {
        sortOrder: true,
      },
    });

    const unit = await prisma.stockUnitOption.create({
      data: {
        tenantId: tenant.id,
        code,
        nameTr,
        nameDe,
        sortOrder: (lastUnit?.sortOrder ?? 0) + 10,
      },
    });

    return NextResponse.json(
      {
        message:
          language === "de"
            ? "Neue Einheit wurde erfolgreich hinzugefügt."
            : "Yeni birim başarıyla eklendi.",
        unit,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("CREATE_STOCK_UNIT_ERROR", error);

    return NextResponse.json(
      {
        error:
          language === "de"
            ? "Neue Einheit konnte nicht hinzugefügt werden."
            : "Yeni birim eklenemedi.",
      },
      {
        status: 500,
      },
    );
  }
});

export const PATCH = withTenant(async (request: NextRequest) => {
  const language = await getRequestLanguage();

  const admin = await requireAdminPermission("updateProduct");

  if (!admin) {
    return NextResponse.json(
      {
        error:
          language === "de"
            ? "Sie sind nicht berechtigt, Einheiten zu bearbeiten."
            : "Birim düzenleme yetkiniz yok.",
      },
      {
        status: 403,
      },
    );
  }

  try {
    const body = await request.json();

    const id = String(body.id ?? "").trim();
    const nameTr = String(body.nameTr ?? "").trim();
    const nameDe = String(body.nameDe ?? "").trim();

    if (!id) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Es wurde keine Einheit zum Bearbeiten ausgewählt."
              : "Düzenlenecek birim seçilmedi.",
        },
        {
          status: 400,
        },
      );
    }

    if (!nameTr || !nameDe) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Türkischer und deutscher Einheitenname sind erforderlich."
              : "Türkçe ve Almanca birim adı zorunludur.",
        },
        {
          status: 400,
        },
      );
    }

    const existing = await prisma.stockUnitOption.findUnique({
      where: {
        id,
      },
    });

    if (!existing || !existing.active) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Die zu bearbeitende Einheit wurde nicht gefunden."
              : "Düzenlenecek birim bulunamadı.",
        },
        {
          status: 404,
        },
      );
    }

    /*
     * code özellikle değiştirilmez.
     *
     * Örneğin ADET koduna bağlı eski ürün ve kasa kayıtları
     * aynı şekilde çalışmaya devam eder. Yalnızca ekranda
     * gösterilen Türkçe ve Almanca ad değiştirilir.
     */
    const unit = await prisma.stockUnitOption.update({
      where: {
        id,
      },

      data: {
        nameTr,
        nameDe,
      },
    });

    return NextResponse.json({
      message:
        language === "de"
          ? "Einheit wurde erfolgreich bearbeitet."
          : "Birim başarıyla düzenlendi.",
      unit,
    });
  } catch (error) {
    console.error("UPDATE_STOCK_UNIT_ERROR", error);

    return NextResponse.json(
      {
        error:
          language === "de"
            ? "Einheit konnte nicht bearbeitet werden."
            : "Birim düzenlenemedi.",
      },
      {
        status: 500,
      },
    );
  }
});
