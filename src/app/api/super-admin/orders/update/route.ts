import {
  verifySessionToken,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withTenant } from "@/lib/tenant";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const allowedStatuses = [
  "NEW",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
] as const;

type AllowedStatus =
  (typeof allowedStatuses)[number];

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
    session.role !==
      "SUPER_ADMIN"
  ) {
    return null;
  }

  return session;
}

export const PATCH = withTenant(async (
  request: NextRequest
) => {
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
    const body =
      await request.json();

    const orderId =
      String(
        body.orderId || ""
      ).trim();

    const status =
      body.status !== undefined
        ? String(
            body.status
          ).trim()
        : undefined;

    const driverId =
      body.driverId !== undefined
        ? String(
            body.driverId || ""
          ).trim()
        : undefined;

    if (!orderId) {
      return NextResponse.json(
        {
          error:
            "Sipariş ID eksik.",
        },
        {
          status: 400,
        }
      );
    }

    const order =
      await prisma.order.findFirst({
        where: {
          id: orderId,
          deletedAt: null,
        },
        select: {
          id: true,
          status: true,
          driverId: true,
        },
      });

    if (!order) {
      return NextResponse.json(
        {
          error:
            "Sipariş bulunamadı.",
        },
        {
          status: 404,
        }
      );
    }

    const data: {
      status?: AllowedStatus;
      driverId?: string | null;
      assignedAt?: Date | null;
      deliveredAt?: Date | null;
      outForDeliveryAt?: Date | null;
    } = {};

    if (
      status !== undefined
    ) {
      if (
        !allowedStatuses.includes(
          status as AllowedStatus
        )
      ) {
        return NextResponse.json(
          {
            error:
              "Geçersiz sipariş durumu.",
          },
          {
            status: 400,
          }
        );
      }

      data.status =
        status as AllowedStatus;

      if (
        status === "DELIVERED"
      ) {
        data.deliveredAt =
          new Date();
      } else {
        data.deliveredAt =
          null;
      }

      if (
        status ===
        "OUT_FOR_DELIVERY"
      ) {
        data.outForDeliveryAt =
          new Date();
      } else if (
        order.status ===
        "OUT_FOR_DELIVERY"
      ) {
        data.outForDeliveryAt =
          null;
      }
    }

    if (
      driverId !== undefined
    ) {
      if (!driverId) {
        data.driverId =
          null;

        data.assignedAt =
          null;
      } else {
        const driver =
          await prisma.user.findFirst({
            where: {
              id: driverId,
              role: "DRIVER",
            },
            select: {
              id: true,
            },
          });

        if (!driver) {
          return NextResponse.json(
            {
              error:
                "Lieferfahrer bulunamadı.",
            },
            {
              status: 404,
            }
          );
        }

        data.driverId =
          driverId;

        data.assignedAt =
          new Date();
      }
    }

    if (
      Object.keys(data)
        .length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "Güncellenecek alan bulunamadı.",
        },
        {
          status: 400,
        }
      );
    }

    const updated =
      await prisma.order.update({
        where: {
          id: orderId,
        },
        data,

        include: {
          driver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },

          user: {
            select: {
              firstName: true,
              lastName: true,
              companyName: true,
              email: true,
              phone: true,
            },
          },
        },
      });

    return NextResponse.json({
      message:
        "Sipariş güncellendi.",
      order: {
        ...updated,
        totalAmount:
          Number(
            updated.totalAmount
          ),
      },
    });
  } catch (error) {
    console.error(
      "SUPER_ADMIN_UPDATE_ORDER_ERROR",
      error
    );

    return NextResponse.json(
      {
        error:
          "Sipariş güncellenirken hata oluştu.",
      },
      {
        status: 500,
      }
    );
  }
});
