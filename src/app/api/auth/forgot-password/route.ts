import { prisma } from "@/lib/prisma";
import { sendPasswordResetCode } from "@/lib/email";
import crypto from "crypto";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    const normalizedEmail = String(email || "")
      .trim()
      .toLowerCase();

    if (!normalizedEmail) {
      return NextResponse.json(
        { error: "E-posta zorunludur." },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          error: "Bu e-posta adresine ait kullanıcı bulunamadı.",
        },
        {
          status: 404,
        },
      );
    }

    await prisma.verificationCode.deleteMany({
      where: {
        userId: user.id,
        type: "RESET_PASSWORD",
      },
    });

    const code = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();

    const codeHash = crypto
      .createHash("sha256")
      .update(code)
      .digest("hex");

    const expiresAt = new Date(
      Date.now() + 10 * 60 * 1000,
    );

    await prisma.verificationCode.create({
      data: {
        userId: user.id,
        code: codeHash,
        type: "RESET_PASSWORD",
        expiresAt,
      },
    });

    await sendPasswordResetCode(
      user.email,
      code,
    );

    return NextResponse.json({
      message: "Kod gönderildi.",
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
