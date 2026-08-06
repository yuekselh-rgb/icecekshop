import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/lib/admin-auth";
import { NextResponse } from "next/server";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdminPermission("viewCustomers");

  if (!admin) {
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
}
