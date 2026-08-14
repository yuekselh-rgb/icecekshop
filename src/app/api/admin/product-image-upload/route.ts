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
  "image/gif": "gif",
};

export const POST = withTenant(async (request: NextRequest) => {
  const admin = await getAdminWithPermissions();

  const language = await getRequestLanguage();

  if (
    !admin ||
    (!admin.isSuperAdmin &&
      !admin.permissions.createProduct &&
      !admin.permissions.updateProduct)
  ) {
    return NextResponse.json(
      {
        error:
          language === "de"
            ? "Sie sind nicht berechtigt, Produktbilder hochzuladen."
            : "Ürün resmi yükleme yetkiniz yok.",
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
              ? "Wählen Sie eine Bilddatei aus."
              : "Bir resim dosyası seçin.",
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
              ? "Das Bild darf höchstens 4 MB groß sein."
              : "Resim en fazla 4 MB olabilir.",
        },
        {
          status: 400,
        },
      );
    }

    const fileName = `${Date.now()}-${randomUUID()}.${extension}`;

    const blob = await put(`uploads/products/${fileName}`, file, {
      access: "public",
      contentType: file.type,
    });

    return NextResponse.json(
      {
        message:
          language === "de"
            ? "Produktbild erfolgreich hochgeladen."
            : "Ürün resmi başarıyla yüklendi.",

        imageUrl: blob.url,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("PRODUCT_IMAGE_UPLOAD_ERROR", error);

    return NextResponse.json(
      {
        error:
          language === "de"
            ? "Beim Hochladen des Produktbilds ist ein Fehler aufgetreten."
            : "Ürün resmi yüklenirken hata oluştu.",
      },
      {
        status: 500,
      },
    );
  }
});
