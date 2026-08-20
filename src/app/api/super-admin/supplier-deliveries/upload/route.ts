import { getAdminWithPermissions } from "@/lib/admin-auth";
import { withTenant } from "@/lib/tenant";
import { getRequestLanguage } from "@/lib/request-language";
import { put } from "@vercel/blob";
import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/*
 * Vercel Serverless Functions reject request bodies over ~4.5 MB at the
 * platform level (413) before this handler even runs, so the app's own
 * limit must stay safely under that, not just under a round "5 MB".
 */
const MAX_FILE_SIZE = 4 * 1024 * 1024;

const allowedTypes: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

async function requireSuperAdmin() {
  const admin = await getAdminWithPermissions();

  if (!admin || !admin.isSuperAdmin) {
    return null;
  }

  return admin;
}

export const POST = withTenant(async (request: NextRequest) => {
  const language = await getRequestLanguage();

  const admin = await requireSuperAdmin();

  if (!admin) {
    return NextResponse.json(
      {
        error: language === "de" ? "Unbefugter Zugriff." : "Yetkisiz erişim.",
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
              ? "Wählen Sie eine Datei aus."
              : "Bir dosya seçin.",
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
              ? "Sie können nur JPG, PNG, WEBP oder PDF hochladen."
              : "Yalnızca JPG, PNG, WEBP veya PDF yükleyebilirsiniz.",
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
              ? "Die Datei darf höchstens 4 MB groß sein."
              : "Dosya en fazla 4 MB olabilir.",
        },
        {
          status: 400,
        },
      );
    }

    const fileName = `${Date.now()}-${randomUUID()}.${extension}`;

    const blob = await put(`uploads/supplier-deliveries/${fileName}`, file, {
      access: "public",
      contentType: file.type,
    });

    return NextResponse.json(
      {
        message:
          language === "de"
            ? "Beleg erfolgreich hochgeladen."
            : "Belge başarıyla yüklendi.",

        documentUrl: blob.url,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("SUPPLIER_DELIVERY_DOCUMENT_UPLOAD_ERROR", error);

    return NextResponse.json(
      {
        error:
          language === "de"
            ? "Beim Hochladen des Belegs ist ein Fehler aufgetreten."
            : "Belge yüklenirken hata oluştu.",
      },
      {
        status: 500,
      },
    );
  }
});
