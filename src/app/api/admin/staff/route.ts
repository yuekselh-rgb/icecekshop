import { requireAdminPermission } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { withTenant } from "@/lib/tenant";
import { NextResponse } from "next/server";

export const GET = withTenant(async () => {
  const admin =
    await requireAdminPermission(
      "viewOrders"
    );

  if (!admin) {
    return NextResponse.json(
      {
        error:
          "Personel listesini görüntüleme yetkiniz yok.",
      },
      {
        status: 403,
      }
    );
  }

  try {
    const staff =
      await prisma.user.findMany({
        where: {
          role: {
            in: [
              "ADMIN",
              "SUPER_ADMIN",
            ],
          },
        },

        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
        },

        orderBy: [
          {
            firstName: "asc",
          },
          {
            lastName: "asc",
          },
          {
            email: "asc",
          },
        ],
      });

    return NextResponse.json({
      staff: staff.map(
        (person) => ({
          id: person.id,
          firstName:
            person.firstName,
          lastName:
            person.lastName,
          email: person.email,
          role: person.role,

          name:
            `${person.firstName || ""} ${person.lastName || ""}`.trim() ||
            person.email,
        })
      ),
    });
  } catch (error) {
    console.error(
      "ADMIN_STAFF_ERROR",
      error
    );

    return NextResponse.json(
      {
        error:
          "Personel listesi yüklenirken hata oluştu.",
      },
      {
        status: 500,
      }
    );
  }
});
