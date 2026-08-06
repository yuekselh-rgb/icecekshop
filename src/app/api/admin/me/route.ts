import { getAdminWithPermissions } from "@/lib/admin-auth";
import { NextResponse } from "next/server";

export async function GET() {
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
}
