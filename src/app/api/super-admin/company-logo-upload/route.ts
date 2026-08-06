import { getAdminWithPermissions } from "@/lib/admin-auth";
import { put } from "@vercel/blob";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const allowedTypes: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function POST(request: Request) {
  const admin = await getAdminWithPermissions();

  if (!admin || !admin.isSuperAdmin) {
    return NextResponse.json(
      {
        error: "Logo yükleme yetkiniz yok.",
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
          error: "Bir logo dosyası seçin.",
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
          error: "Yalnızca JPG, PNG, WEBP veya GIF yükleyebilirsiniz.",
        },
        {
          status: 400,
        },
      );
    }

    if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: "Logo en fazla 5 MB olabilir.",
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
        message: "Logo başarıyla yüklendi.",
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
        error: "Logo yüklenirken hata oluştu.",
      },
      {
        status: 500,
      },
    );
  }
}
