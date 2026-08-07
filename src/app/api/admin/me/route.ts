import { getAdminWithPermissions } from "@/lib/admin-auth";
import { withTenant } from "@/lib/tenant";
import { NextResponse } from "next/server";

export const GET = withTenant(async () => {
  const admin =
    await getAdminWithPermissions();

  if (!admin) {
    return NextResponse.json(
      {
        error: "Yetkisiz erişim.",
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
