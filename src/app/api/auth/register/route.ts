import { prisma } from "@/lib/prisma";
import { sendVerificationCode } from "@/lib/email";
import { withTenant } from "@/lib/tenant";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

export const POST = withTenant(async (request: NextRequest, _context, tenant) => {
  let language: "de" | "tr" = "tr";

  try {
    const body =
      await request.json();

    language = body.language === "de" ? "de" : "tr";

    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      customerType,
      companyName,
      street,
      houseNumber,
      postalCode,
      city,
      floor,
      doorbellName,
    } = body;

    if (
      !email ||
      !password ||
      !firstName ||
      !lastName ||
      !phone ||
      !customerType ||
      !street ||
      !houseNumber ||
      !postalCode ||
      !city ||
      !floor ||
      !doorbellName
    ) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Bitte füllen Sie alle Pflichtfelder aus."
              : "Lütfen tüm zorunlu alanları doldurun.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      customerType !== "PRIVATE" &&
      customerType !== "BUSINESS"
    ) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Ungültiger Kundentyp."
              : "Geçersiz müşteri türü.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      customerType === "BUSINESS" &&
      !companyName
    ) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Firmenname ist erforderlich."
              : "Firma adı zorunludur.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !/^\d{5}$/.test(
        String(postalCode)
      )
    ) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Geben Sie eine gültige 5-stellige deutsche Postleitzahl ein."
              : "Geçerli bir 5 haneli Alman posta kodu girin.",
        },
        {
          status: 400,
        }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Das Passwort muss mindestens 8 Zeichen lang sein."
              : "Şifre en az 8 karakter olmalıdır.",
        },
        {
          status: 400,
        }
      );
    }

    const normalizedEmail =
      String(email)
        .trim()
        .toLowerCase();

    const existingUser =
      await prisma.user.findFirst({
        where: {
          email: normalizedEmail,
        },
      });

    if (existingUser) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Diese E-Mail-Adresse ist bereits registriert."
              : "Bu e-posta adresi zaten kayıtlı.",
        },
        {
          status: 409,
        }
      );
    }

    const passwordHash =
      await bcrypt.hash(
        password,
        12
      );

    const code = crypto.randomInt(100000, 1000000).toString();

    const codeHash = crypto
      .createHash("sha256")
      .update(code)
      .digest("hex");

    const expiresAt = new Date(
      Date.now() + 10 * 60 * 1000
    );

    const user =
      await prisma.user.create({
        data: {
          tenantId: tenant.id,

          email:
            normalizedEmail,

          passwordHash,

          firstName:
            String(
              firstName
            ).trim(),

          lastName:
            String(
              lastName
            ).trim(),

          phone:
            String(
              phone
            ).trim(),

          customerType,

          companyName:
            customerType ===
            "BUSINESS"
              ? String(
                  companyName
                ).trim()
              : null,

          profileCompleted:
            true,

          addresses: {
            create: {
              tenantId: tenant.id,

              street:
                String(
                  street
                ).trim(),

              houseNumber:
                String(
                  houseNumber
                ).trim(),

              postalCode:
                String(
                  postalCode
                ).trim(),

              city:
                String(
                  city
                ).trim(),

              country:
                "Deutschland",

              floor:
                String(
                  floor
                ).trim(),

              doorbellName:
                String(
                  doorbellName
                ).trim(),

              isDefault:
                true,
            },
          },
        },

        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          customerType: true,
          profileCompleted: true,

          addresses: {
            select: {
              street: true,
              houseNumber: true,
              postalCode: true,
              city: true,
              country: true,
            },
          },
        },
      });

    await prisma.verificationCode.create({
      data: {
        tenantId: tenant.id,
        userId: user.id,
        code: codeHash,
        type: "REGISTER",
        expiresAt,
      },
    });

    try {
      await sendVerificationCode(
        user.email,
        code,
      );
    } catch (emailError) {
      console.error(
        "REGISTER_EMAIL_ERROR",
        emailError,
      );
    }

    return NextResponse.json(
      {
        message: "Doğrulama kodu e-posta adresinize gönderildi.",
        email: user.email,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "REGISTER_ERROR",
      error
    );

    return NextResponse.json(
      {
        error:
          language === "de"
            ? "Bei der Registrierung ist ein unerwarteter Fehler aufgetreten."
            : "Kayıt sırasında beklenmeyen bir hata oluştu.",
      },
      {
        status: 500,
      }
    );
  }
});
