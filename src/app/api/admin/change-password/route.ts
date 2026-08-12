import { getAdminWithPermissions } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { getRequestLanguage } from "@/lib/request-language";
import { withTenant } from "@/lib/tenant";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

export const POST = withTenant(async (request: NextRequest) => {
  const language = await getRequestLanguage();

  const admin = await getAdminWithPermissions();

  if (!admin) {
    return NextResponse.json(
      { error: language === "de" ? "Unbefugter Zugriff." : "Yetkisiz erişim." },
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
        {
          error:
            language === "de"
              ? "Alle Felder sind erforderlich."
              : "Tüm alanlar zorunludur.",
        },
        { status: 400 },
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Das neue Passwort muss mindestens 8 Zeichen lang sein."
              : "Yeni şifre en az 8 karakter olmalıdır.",
        },
        { status: 400 },
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Die neuen Passwörter stimmen nicht überein."
              : "Yeni şifreler eşleşmiyor.",
        },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        id: admin.user.id,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          error: language === "de" ? "Benutzer nicht gefunden." : "Kullanıcı bulunamadı.",
        },
        { status: 404 },
      );
    }

    const ok = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!ok) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Das aktuelle Passwort ist falsch."
              : "Mevcut şifre hatalı.",
        },
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
      message:
        language === "de"
          ? "Passwort wurde erfolgreich geändert."
          : "Şifre başarıyla değiştirildi.",
    });
  } catch (error) {
    console.error("ADMIN_CHANGE_PASSWORD_ERROR", error);

    return NextResponse.json(
      {
        error:
          language === "de"
            ? "Beim Ändern des Passworts ist ein Fehler aufgetreten."
            : "Şifre değiştirilirken hata oluştu.",
      },
      {
        status: 500,
      },
    );
  }
});
