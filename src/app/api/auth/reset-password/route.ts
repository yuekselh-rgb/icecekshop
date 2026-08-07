import { prisma } from "@/lib/prisma";
import { withTenant } from "@/lib/tenant";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

const MAX_ATTEMPTS = 5;

export const POST = withTenant(async (request: NextRequest) => {
  try {
    const { email, code, password } = await request.json();

    const normalizedEmail = String(email || "")
      .trim()
      .toLowerCase();

    if (!normalizedEmail || !code || !password) {
      return NextResponse.json(
        { error: "Eksik bilgi gönderildi." },
        { status: 400 },
      );
    }

    if (String(password).length < 8) {
      return NextResponse.json(
        { error: "Şifre en az 8 karakter olmalıdır." },
        { status: 400 },
      );
    }

    const user = await prisma.user.findFirst({
      where: {
        email: normalizedEmail,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Kullanıcı bulunamadı." },
        { status: 404 },
      );
    }

    const codeHash = crypto
      .createHash("sha256")
      .update(String(code))
      .digest("hex");

    const verification = await prisma.verificationCode.findFirst({
      where: {
        userId: user.id,
        type: "RESET_PASSWORD",
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!verification) {
      return NextResponse.json(
        { error: "Kod hatalı." },
        { status: 400 },
      );
    }

    if (verification.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Kodun süresi dolmuş." },
        { status: 400 },
      );
    }

    if (verification.attempts >= MAX_ATTEMPTS) {
      return NextResponse.json(
        { error: "Çok fazla hatalı deneme. Lütfen yeni bir kod isteyin." },
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
        { error: "Kod hatalı." },
        { status: 400 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        passwordHash,
      },
    });

    await prisma.verificationCode.deleteMany({
      where: {
        userId: user.id,
        type: "RESET_PASSWORD",
      },
    });

    return NextResponse.json({
      message: "Şifre başarıyla değiştirildi.",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Şifre değiştirilemedi.",
      },
      {
        status: 500,
      },
    );
  }
});
