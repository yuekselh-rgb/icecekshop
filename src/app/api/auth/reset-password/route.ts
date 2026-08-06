import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
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

    const user = await prisma.user.findUnique({
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
        code: codeHash,
        type: "RESET_PASSWORD",
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
}
