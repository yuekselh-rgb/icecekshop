import { createSessionToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

function getRedirectPath(role: string) {
  if (role === "SUPER_ADMIN") {
    return "/super-admin";
  }

  if (role === "ADMIN") {
    return "/admin";
  }

  if (role === "DRIVER") {
    return "/";
  }

  return "/";
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";

    /*
     * React çalışıyorsa JSON gelir.
     * Telefonda JavaScript çalışmazsa klasik HTML form verisi gelir.
     */
    const isFormSubmission =
      contentType.includes("application/x-www-form-urlencoded") ||
      contentType.includes("multipart/form-data");

    let rawEmail: FormDataEntryValue | string | null = null;
    let rawPassword: FormDataEntryValue | string | null = null;

    if (isFormSubmission) {
      const formData = await request.formData();

      rawEmail = formData.get("email");
      rawPassword = formData.get("password");
    } else {
      const body = await request.json();

      rawEmail = body.email;
      rawPassword = body.password;
    }

    const email = String(rawEmail || "")
      .trim()
      .toLowerCase();

    const password = String(rawPassword || "").trim();

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });


    if (!user) {
      if (isFormSubmission) {
        return NextResponse.redirect(
          new URL("/giris?error=invalid", request.url),
          303,
        );
      }

      return NextResponse.json(
        {
          error: "E-posta veya şifre hatalı.",
        },
        {
          status: 401,
        },
      );
    }

    const MAX_LOGIN_ATTEMPTS = 5;

    const LOCKOUT_MINUTES = 15;

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      if (isFormSubmission) {
        return NextResponse.redirect(
          new URL("/giris?error=locked", request.url),
          303,
        );
      }

      return NextResponse.json(
        {
          error:
            "Çok fazla hatalı deneme. Lütfen birkaç dakika sonra tekrar deneyin.",
        },
        {
          status: 429,
        },
      );
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      const attempts = user.failedLoginAttempts + 1;

      await prisma.user.update({
        where: {
          id: user.id,
        },
        data:
          attempts >= MAX_LOGIN_ATTEMPTS
            ? {
                failedLoginAttempts: 0,
                lockedUntil: new Date(
                  Date.now() + LOCKOUT_MINUTES * 60 * 1000,
                ),
              }
            : {
                failedLoginAttempts: attempts,
              },
      });

      if (isFormSubmission) {
        return NextResponse.redirect(
          new URL("/giris?error=invalid", request.url),
          303,
        );
      }

      return NextResponse.json(
        {
          error: "E-posta veya şifre hatalı.",
        },
        {
          status: 401,
        },
      );
    }

    if (!user.emailVerified) {
      if (isFormSubmission) {
        return NextResponse.redirect(
          new URL("/giris?error=verify-email", request.url),
          303,
        );
      }

      return NextResponse.json(
        {
          error: "Lütfen önce e-posta adresinizi doğrulayın.",
          code: "EMAIL_NOT_VERIFIED",
        },
        {
          status: 403,
        },
      );
    }

    if (!user.isActive) {
      if (isFormSubmission) {
        return NextResponse.redirect(
          new URL("/giris?error=inactive", request.url),
          303,
        );
      }

      return NextResponse.json(
        {
          error: "Bu hesap Super Admin tarafından kapatılmıştır.",
        },
        {
          status: 403,
        },
      );
    }

    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      });
    }

    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    /*
     * JavaScript çalışmayan cihazda doğrudan doğru panele yönlendir.
     */
    const response = isFormSubmission
      ? NextResponse.redirect(
          new URL(getRedirectPath(user.role), request.url),
          303,
        )
      : NextResponse.json({
          message: "Giriş başarılı.",
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
          },
        });

    response.cookies.set("paketmarket_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error("LOGIN_ERROR", error);

    return NextResponse.json(
      {
        error: "Giriş sırasında beklenmeyen bir hata oluştu.",
      },
      {
        status: 500,
      },
    );
  }
}
