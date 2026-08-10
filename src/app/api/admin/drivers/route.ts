import {
  requireAdminPermission,
} from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { getRequestLanguage } from "@/lib/request-language";
import { withTenant } from "@/lib/tenant";
import { NextResponse } from "next/server";

export const GET = withTenant(async () => {
  const language = await getRequestLanguage();

  const admin =
    await requireAdminPermission(
      "viewOrders"
    );

  if (!admin) {
    return NextResponse.json(
      {
        error:
          language === "de"
            ? "Sie sind nicht berechtigt, die Fahrer einzusehen."
            : "Şoförleri görüntüleme yetkiniz yok.",
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
          language === "de"
            ? "Beim Laden der Fahrer ist ein Fehler aufgetreten."
            : "Şoförler yüklenirken hata oluştu.",
      },
      {
        status: 500,
      }
    );
  }
});
