import { createSessionToken } from "@/lib/auth";
import { logLoginEvent } from "@/lib/audit-log";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    const normalizedEmail = String(email || "").trim().toLowerCase();
    const rawPassword = String(password || "");

    const user = await prisma.user.findFirst({
      where: {
        email: normalizedEmail,
        role: "PLATFORM_OWNER",
        tenantId: null,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "E-Mail oder Passwort ist falsch." },
        { status: 401 },
      );
    }

    const passwordMatches = await bcrypt.compare(rawPassword, user.passwordHash);

    if (!passwordMatches) {
      return NextResponse.json(
        { error: "E-Mail oder Passwort ist falsch." },
        { status: 401 },
      );
    }

    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      tenantId: null,
    });

    await logLoginEvent({
      tenantId: null,
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const response = NextResponse.json({ message: "Angemeldet." });

    response.cookies.set("paketmarket_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error("PLATFORM_LOGIN_ERROR", error);

    return NextResponse.json(
      { error: "Anmeldung fehlgeschlagen." },
      { status: 500 },
    );
  }
}
