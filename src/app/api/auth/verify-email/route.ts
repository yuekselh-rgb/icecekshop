import { prisma } from "@/lib/prisma";
import { getRequestLanguage } from "@/lib/request-language";
import { withTenant } from "@/lib/tenant";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

const MAX_ATTEMPTS = 5;

export const POST = withTenant(async (request: NextRequest) => {
  const language = await getRequestLanguage();

  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: language === "de" ? "Code fehlt." : "Kod eksik." },
        { status: 400 },
      );
    }

    const codeHash = crypto
      .createHash("sha256")
      .update(String(code))
      .digest("hex");

    const user = await prisma.user.findFirst({
      where: {
        email: String(email).trim().toLowerCase(),
      },
      select: {
        id: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Benutzer nicht gefunden."
              : "Kullanıcı bulunamadı.",
        },
        {
          status: 404,
        },
      );
    }

    const verification = await prisma.verificationCode.findFirst({
      where: {
        userId: user.id,
        type: "REGISTER",
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!verification) {
      return NextResponse.json(
        { error: language === "de" ? "Falscher Code." : "Kod hatalı." },
        { status: 400 },
      );
    }

    if (verification.expiresAt < new Date()) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Der Code ist abgelaufen."
              : "Kodun süresi dolmuş.",
        },
        { status: 400 },
      );
    }

    if (verification.attempts >= MAX_ATTEMPTS) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Zu viele fehlgeschlagene Versuche. Bitte fordern Sie einen neuen Code an."
              : "Çok fazla hatalı deneme. Lütfen yeni bir kod isteyin.",
        },
        { status: 429 },
      );
    }

    if (verification.code !== codeHash) {
      await prisma.verificationCode.update({
        where: {
          id: verification.id,
        },
        data: {
          attempts: {
            increment: 1,
          },
        },
      });

      return NextResponse.json(
        { error: language === "de" ? "Falscher Code." : "Kod hatalı." },
        { status: 400 },
      );
    }

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        emailVerified: true,
      },
    });

    await prisma.verificationCode.deleteMany({
      where: {
        userId: user.id,
        type: "REGISTER",
      },
    });

    return NextResponse.json({
      message:
        language === "de" ? "E-Mail-Adresse bestätigt." : "E-posta doğrulandı.",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          language === "de"
            ? "Bestätigung fehlgeschlagen."
            : "Doğrulama başarısız.",
      },
      {
        status: 500,
      },
    );
  }
});
