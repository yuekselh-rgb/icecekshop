import {
  verifySessionToken,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withTenant } from "@/lib/tenant";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

async function getSuperAdminSession() {
  const cookieStore =
    await cookies();

  const token =
    cookieStore.get(
      "paketmarket_session"
    )?.value;

  if (!token) {
    return null;
  }

  const session =
    await verifySessionToken(
      token
    );

  if (
    !session ||
    session.role !== "SUPER_ADMIN"
  ) {
    return null;
  }

  return session;
}

export const GET = withTenant(async () => {
  const session =
    await getSuperAdminSession();

  if (!session) {
    return NextResponse.json(
      {
        error:
          "Yetkisiz erişim.",
      },
      {
        status: 403,
      }
    );
  }

  try {
    const orders =
      await prisma.order.findMany({
        where: {
          deletedAt: {
            not: null,
          },
        },

        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              companyName: true,
              email: true,
            },
          },

          driver: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },

        orderBy: {
          deletedAt: "desc",
        },
      });

    return NextResponse.json({
      orders:
        orders.map(
          (order) => ({
            ...order,

            subtotal:
              Number(
                order.subtotal
              ),

            deliveryFee:
              Number(
                order.deliveryFee
              ),

            pfandAmount:
              Number(
                order.pfandAmount
              ),

            totalAmount:
              Number(
                order.totalAmount
              ),
          })
        ),
    });
  } catch (error) {
    console.error(
      "SUPER_ADMIN_TRASH_ERROR",
      error
    );

    return NextResponse.json(
      {
        error:
          "Çöp kutusu yüklenirken hata oluştu.",
      },
      {
        status: 500,
      }
    );
  }
});
