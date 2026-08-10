import {
  verifySessionToken,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRequestLanguage } from "@/lib/request-language";
import { withTenant } from "@/lib/tenant";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

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

export const GET = withTenant(async () => {
  const language = await getRequestLanguage();

  const session =
    await getSuperAdminSession();

  if (!session) {
    return NextResponse.json(
      {
        error: language === "de" ? "Unbefugter Zugriff." : "Yetkisiz erişim.",
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

export const POST = withTenant(async (
  request: NextRequest,
  _context,
  tenant,
) => {
  const language = await getRequestLanguage();

  const session =
    await getSuperAdminSession();

  if (!session) {
    return NextResponse.json(
      {
        error: language === "de" ? "Unbefugter Zugriff." : "Yetkisiz erişim.",
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
            language === "de"
              ? "Vorname, Nachname, E-Mail und Passwort sind erforderlich."
              : "Ad, soyad, e-posta ve şifre zorunludur.",
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
            language === "de"
              ? "Das Passwort muss mindestens 8 Zeichen lang sein."
              : "Şifre en az 8 karakter olmalıdır.",
        },
        {
          status: 400,
        }
      );
    }

    const existingUser =
      await prisma.user.findFirst({
        where: {
          email,
        },
      });

    if (existingUser) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Diese E-Mail-Adresse wird bereits verwendet."
              : "Bu e-posta adresi zaten kullanılıyor.",
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
          tenantId: tenant.id,
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
          language === "de"
            ? "Fahrer-Konto wurde erfolgreich erstellt."
            : "Şoför hesabı başarıyla oluşturuldu.",
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
          language === "de"
            ? "Beim Erstellen des Fahrers ist ein Fehler aufgetreten."
            : "Şoför oluşturulurken hata oluştu.",
      },
      {
        status: 500,
      }
    );
  }
});
