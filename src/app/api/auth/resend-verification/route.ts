import { prisma } from "@/lib/prisma";
import { sendVerificationCode } from "@/lib/email";
import crypto from "crypto";
import { NextResponse } from "next/server";

function generateCode() {
  return crypto.randomInt(100000, 1000000).toString();
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "E-posta gerekli." },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        email: String(email).trim().toLowerCase(),
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Kullanıcı bulunamadı." },
        { status: 404 },
      );
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { error: "Bu hesap zaten doğrulanmış." },
        { status: 400 },
      );
    }

    await prisma.verificationCode.deleteMany({
      where: {
        userId: user.id,
        type: "REGISTER",
      },
    });

    const code = generateCode();

    const codeHash = crypto
      .createHash("sha256")
      .update(code)
      .digest("hex");

    await prisma.verificationCode.create({
      data: {
        userId: user.id,
        code: codeHash,
        type: "REGISTER",
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    await sendVerificationCode(user.email, code);

    return NextResponse.json({
      message: "Yeni doğrulama kodu gönderildi.",
    });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Kod gönderilemedi.",
      },
      {
        status: 500,
      },
    );
  }
}
