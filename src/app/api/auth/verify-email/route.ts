import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: "Kod eksik." },
        { status: 400 },
      );
    }

    const codeHash = crypto
      .createHash("sha256")
      .update(String(code))
      .digest("hex");

    const user = await prisma.user.findUnique({
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
          error: "Kullanıcı bulunamadı.",
        },
        {
          status: 404,
        },
      );
    }

    const verification = await prisma.verificationCode.findFirst({
      where: {
        userId: user.id,
        code: codeHash,
        type: "REGISTER",
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
      message: "E-posta doğrulandı.",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Doğrulama başarısız.",
      },
      {
        status: 500,
      },
    );
  }
}
