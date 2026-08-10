import { getAdminWithPermissions } from "@/lib/admin-auth";
import { getRequestLanguage } from "@/lib/request-language";
import { withTenant } from "@/lib/tenant";
import { NextResponse } from "next/server";

export const GET = withTenant(async () => {
  const language = await getRequestLanguage();

  const admin =
    await getAdminWithPermissions();

  if (!admin) {
    return NextResponse.json(
      {
        error:
          language === "de" ? "Unbefugter Zugriff." : "Yetkisiz erişim.",
      },
      {
        status: 403,
      }
    );
  }

  return NextResponse.json({
    role: admin.session.role,
    user: admin.user,
    permissions:
      admin.permissions,
  });
});
