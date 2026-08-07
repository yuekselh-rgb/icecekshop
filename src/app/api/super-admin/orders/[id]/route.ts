import {
  verifySessionToken,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withTenant } from "@/lib/tenant";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

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

/*
 * Aktif siparişi çöp kutusuna taşır.
 */
export const DELETE = withTenant(async (
  _request: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
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

  const { id } =
    await context.params;

  try {
    const order =
      await prisma.order.findFirst({
        where: {
          id,
          deletedAt: null,
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

    await prisma.order.update({
      where: {
        id,
      },

      data: {
        deletedAt:
          new Date(),
      },
    });

    return NextResponse.json({
      message:
        "Sipariş çöp kutusuna taşındı.",
    });
  } catch (error) {
    console.error(
      "SUPER_ADMIN_DELETE_ORDER_ERROR",
      error
    );

    return NextResponse.json(
      {
        error:
          "Sipariş çöp kutusuna taşınırken hata oluştu.",
      },
      {
        status: 500,
      }
    );
  }
});

/*
 * Çöp kutusundaki siparişi geri getirir.
 */
export const PATCH = withTenant(async (
  _request: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
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

  const { id } =
    await context.params;

  try {
    const order =
      await prisma.order.findFirst({
        where: {
          id,

          deletedAt: {
            not: null,
          },
        },
      });

    if (!order) {
      return NextResponse.json(
        {
          error:
            "Çöp kutusunda bu sipariş bulunamadı.",
        },
        {
          status: 404,
        }
      );
    }

    await prisma.order.update({
      where: {
        id,
      },

      data: {
        deletedAt:
          null,
      },
    });

    return NextResponse.json({
      message:
        "Sipariş başarıyla geri getirildi.",
    });
  } catch (error) {
    console.error(
      "SUPER_ADMIN_RESTORE_ORDER_ERROR",
      error
    );

    return NextResponse.json(
      {
        error:
          "Sipariş geri getirilirken hata oluştu.",
      },
      {
        status: 500,
      }
    );
  }
});

/*
 * Çöp kutusundaki siparişi kalıcı olarak siler.
 * Super Admin şifresi zorunludur.
 */
export const POST = withTenant(async (
  request: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
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

  const { id } =
    await context.params;

  try {
    const body =
      await request.json();

    const password =
      String(
        body.password || ""
      );

    if (!password) {
      return NextResponse.json(
        {
          error:
            "Super Admin şifresi zorunludur.",
        },
        {
          status: 400,
        }
      );
    }

    const superAdmin =
      await prisma.user.findUnique({
        where: {
          id:
            session.userId,
        },

        select: {
          id: true,
          role: true,
          passwordHash: true,
        },
      });

    if (
      !superAdmin ||
      superAdmin.role !==
        "SUPER_ADMIN"
    ) {
      return NextResponse.json(
        {
          error:
            "Super Admin hesabı bulunamadı.",
        },
        {
          status: 403,
        }
      );
    }

    const passwordCorrect =
      await bcrypt.compare(
        password,
        superAdmin.passwordHash
      );

    if (!passwordCorrect) {
      return NextResponse.json(
        {
          error:
            "Super Admin şifresi yanlış.",
        },
        {
          status: 401,
        }
      );
    }

    const order =
      await prisma.order.findFirst({
        where: {
          id,

          deletedAt: {
            not: null,
          },
        },

        select: {
          id: true,
          orderNumber: true,
        },
      });

    if (!order) {
      return NextResponse.json(
        {
          error:
            "Sipariş çöp kutusunda bulunamadı.",
        },
        {
          status: 404,
        }
      );
    }

    await prisma.$transaction(
      async (tx) => {
        /*
         * Önce Pfand alt kayıtlarını kaldır.
         */
        await tx.pfandReturnItem.deleteMany({
          where: {
            pfandReturn: {
              orderId: id,
            },
          },
        });

        await tx.pfandReturn.deleteMany({
          where: {
            orderId: id,
          },
        });

        /*
         * Sipariş ürünlerini kaldır.
         */
        await tx.orderItem.deleteMany({
          where: {
            orderId: id,
          },
        });

        /*
         * En son siparişin kendisini sil.
         */
        await tx.order.delete({
          where: {
            id,
          },
        });
      }
    );

    return NextResponse.json({
      message:
        `${order.orderNumber} kalıcı olarak silindi.`,
    });
  } catch (error) {
    console.error(
      "SUPER_ADMIN_PERMANENT_DELETE_ORDER_ERROR",
      error
    );

    return NextResponse.json(
      {
        error:
          "Sipariş kalıcı olarak silinirken hata oluştu.",
      },
      {
        status: 500,
      }
    );
  }
});
