import { getAdminWithPermissions } from "@/lib/admin-auth";
import { getRequestLanguage } from "@/lib/request-language";
import { withTenant } from "@/lib/tenant";
import { put } from "@vercel/blob";
import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const allowedTypes: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export const POST = withTenant(async (request: NextRequest) => {
  const language = await getRequestLanguage();

  const admin = await getAdminWithPermissions();

  if (!admin || !admin.isSuperAdmin) {
    return NextResponse.json(
      {
        error:
          language === "de"
            ? "Sie sind nicht berechtigt, ein Logo hochzuladen."
            : "Logo yükleme yetkiniz yok.",
      },
      {
        status: 403,
      },
    );
  }

  try {
    const formData = await request.formData();

    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Bitte wählen Sie eine Logo-Datei aus."
              : "Bir logo dosyası seçin.",
        },
        {
          status: 400,
        },
      );
    }

    const extension = allowedTypes[file.type];

    if (!extension) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Sie können nur JPG, PNG, WEBP oder GIF hochladen."
              : "Yalnızca JPG, PNG, WEBP veya GIF yükleyebilirsiniz.",
        },
        {
          status: 400,
        },
      );
    }

    if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Das Logo darf höchstens 5 MB groß sein."
              : "Logo en fazla 5 MB olabilir.",
        },
        {
          status: 400,
        },
      );
    }

    const fileName = `${Date.now()}-${randomUUID()}.${extension}`;

    const blob = await put(`uploads/company/${fileName}`, file, {
      access: "public",
      contentType: file.type,
    });

    return NextResponse.json(
      {
        message:
          language === "de"
            ? "Logo wurde erfolgreich hochgeladen."
            : "Logo başarıyla yüklendi.",
        logoUrl: blob.url,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("COMPANY_LOGO_UPLOAD_ERROR", error);

    return NextResponse.json(
      {
        error:
          language === "de"
            ? "Beim Hochladen des Logos ist ein Fehler aufgetreten."
            : "Logo yüklenirken hata oluştu.",
      },
      {
        status: 500,
      },
    );
  }
});
