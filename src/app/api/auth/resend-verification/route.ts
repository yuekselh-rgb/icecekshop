import { prisma } from "@/lib/prisma";
import { sendVerificationCode } from "@/lib/email";
import { getRequestLanguage } from "@/lib/request-language";
import { withTenant } from "@/lib/tenant";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

function generateCode() {
  return crypto.randomInt(100000, 1000000).toString();
}

export const POST = withTenant(async (request: NextRequest, _context, tenant) => {
  const language = await getRequestLanguage();

  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: language === "de" ? "E-Mail-Adresse erforderlich." : "E-posta gerekli." },
        { status: 400 },
      );
    }

    const user = await prisma.user.findFirst({
      where: {
        email: String(email).trim().toLowerCase(),
      },
    });

    if (user && user.emailVerified) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Dieses Konto ist bereits bestätigt."
              : "Bu hesap zaten doğrulanmış.",
        },
        { status: 400 },
      );
    }

    /*
     * Hesap bulunamasa bile aynı genel mesaj döndürülür.
     * Aksi halde bu uç nokta e-posta adreslerinin sistemde
     * kayıtlı olup olmadığını taramak için kullanılabilir.
     */
    if (user) {
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
          tenantId: tenant.id,
          userId: user.id,
          code: codeHash,
          type: "REGISTER",
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        },
      });

      const companySettings = await prisma.companySetting.findUnique({
        where: {
          tenantId: tenant.id,
        },
        select: {
          logoUrl: true,
          companyName: true,
        },
      });

      await sendVerificationCode(user.email, code, {
        logoUrl: companySettings?.logoUrl,
        companyName: companySettings?.companyName,
      });
    }

    return NextResponse.json({
      message:
        language === "de"
          ? "Falls zu dieser E-Mail-Adresse ein Konto existiert, wurde ein neuer Code gesendet."
          : "Bu e-posta adresine ait bir hesap varsa, yeni kod gönderildi.",
    });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          language === "de"
            ? "Code konnte nicht gesendet werden."
            : "Kod gönderilemedi.",
      },
      {
        status: 500,
      },
    );
  }
});
