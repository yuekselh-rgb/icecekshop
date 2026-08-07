import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/admin-auth";
import { withTenant } from "@/lib/tenant";
import { NextRequest, NextResponse } from "next/server";

export const DELETE = withTenant(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const session = await getAdminSession();

  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json(
      { error: "Bu işlem için yetkiniz yok." },
      { status: 403 },
    );
  }

  const { id } = await params;

  try {
    await prisma.user.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("DELETE_CUSTOMER_ERROR", error);

    return NextResponse.json(
      {
        error: "Müşteri silinemedi.",
      },
      {
        status: 500,
      },
    );
  }
});
