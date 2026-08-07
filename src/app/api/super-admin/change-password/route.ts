import { verifySessionToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withTenant } from "@/lib/tenant";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

async function getSuperAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("paketmarket_session")?.value;

  if (!token) return null;

  const session = await verifySessionToken(token);

  if (!session || session.role !== "SUPER_ADMIN") {
    return null;
  }

  return session;
}

export const POST = withTenant(async (request: NextRequest) => {
  const session = await getSuperAdminSession();

  if (!session) {
    return NextResponse.json(
      { error: "Yetkisiz erişim." },
      { status: 403 },
    );
  }

  try {
    const body = await request.json();

    const currentPassword = String(body.currentPassword || "");
    const newPassword = String(body.newPassword || "");
    const confirmPassword = String(body.confirmPassword || "");

    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: "Tüm alanlar zorunludur." },
        { status: 400 },
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Yeni şifre en az 8 karakter olmalıdır." },
        { status: 400 },
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: "Yeni şifreler eşleşmiyor." },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        id: session.userId,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Kullanıcı bulunamadı." },
        { status: 404 },
      );
    }

    const ok = await bcrypt.compare(
      currentPassword,
      user.passwordHash,
    );

    if (!ok) {
      return NextResponse.json(
        { error: "Mevcut şifre hatalı." },
        { status: 400 },
      );
    }

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        passwordHash: await bcrypt.hash(newPassword, 12),
      },
    });

    return NextResponse.json({
      message: "Şifre başarıyla değiştirildi.",
    });
  } catch (error) {
    console.error("CHANGE_PASSWORD_ERROR", error);

    return NextResponse.json(
      {
        error: "Şifre değiştirilirken hata oluştu.",
      },
      {
        status: 500,
      },
    );
  }
});
