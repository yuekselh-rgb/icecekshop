import {
  verifySessionToken,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

async function getSuperAdminSession() {
  const cookieStore = await cookies();

  const token = cookieStore.get(
    "paketmarket_session"
  )?.value;

  if (!token) {
    return null;
  }

  const session = await verifySessionToken(token);

  if (
    !session ||
    session.role !== "SUPER_ADMIN"
  ) {
    return null;
  }

  return session;
}

export async function GET() {
  const session =
    await getSuperAdminSession();

  if (!session) {
    return NextResponse.json(
      {
        error: "Yetkisiz erişim.",
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
          createdAt: true,

          _count: {
            select: {
              driverOrders: true,
            },
          },
        },

        orderBy: {
          createdAt: "desc",
        },
      });

    return NextResponse.json({
      drivers,
    });
  } catch (error) {
    console.error(
      "LOAD_DRIVERS_ERROR",
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

export async function POST(
  request: Request
) {
  const session =
    await getSuperAdminSession();

  if (!session) {
    return NextResponse.json(
      {
        error: "Yetkisiz erişim.",
      },
      {
        status: 403,
      }
    );
  }

  try {
    const body =
      await request.json();

    const firstName =
      String(
        body.firstName || ""
      ).trim();

    const lastName =
      String(
        body.lastName || ""
      ).trim();

    const email =
      String(
        body.email || ""
      )
        .trim()
        .toLowerCase();

    const phone =
      String(
        body.phone || ""
      ).trim();

    const password =
      String(
        body.password || ""
      );

    if (
      !firstName ||
      !lastName ||
      !email ||
      !password
    ) {
      return NextResponse.json(
        {
          error:
            "Ad, soyad, e-posta ve şifre zorunludur.",
        },
        {
          status: 400,
        }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          error:
            "Şifre en az 8 karakter olmalıdır.",
        },
        {
          status: 400,
        }
      );
    }

    const existingUser =
      await prisma.user.findUnique({
        where: {
          email,
        },
      });

    if (existingUser) {
      return NextResponse.json(
        {
          error:
            "Bu e-posta adresi zaten kullanılıyor.",
        },
        {
          status: 409,
        }
      );
    }

    const passwordHash =
      await bcrypt.hash(
        password,
        12
      );

    const driver =
      await prisma.user.create({
        data: {
          firstName,
          lastName,
          email,
          phone:
            phone || null,
          passwordHash,
          role: "DRIVER",
          profileCompleted: true,
          emailVerified: true,
        },

        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          createdAt: true,
        },
      });

    return NextResponse.json(
      {
        message:
          "Şoför hesabı başarıyla oluşturuldu.",
        driver,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "CREATE_DRIVER_ERROR",
      error
    );

    return NextResponse.json(
      {
        error:
          "Şoför oluşturulurken hata oluştu.",
      },
      {
        status: 500,
      }
    );
  }
}
