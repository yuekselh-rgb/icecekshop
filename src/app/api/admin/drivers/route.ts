import {
  requireAdminPermission,
} from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const admin =
    await requireAdminPermission(
      "viewOrders"
    );

  if (!admin) {
    return NextResponse.json(
      {
        error:
          "Şoförleri görüntüleme yetkiniz yok.",
      },
      {
        status: 403,
      }
    );
  }

  try {
    const drivers =
      await prisma.user.findMany({
        where: {
          role: "DRIVER",
        },

        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },

        orderBy: [
          {
            firstName: "asc",
          },
          {
            lastName: "asc",
          },
        ],
      });

    return NextResponse.json({
      drivers,
    });
  } catch (error) {
    console.error(
      "ADMIN_DRIVERS_ERROR",
      error
    );

    return NextResponse.json(
      {
        error:
          "Şoförler yüklenirken hata oluştu.",
      },
      {
        status: 500,
      }
    );
  }
}
