import "dotenv/config";

import { prisma } from "../src/lib/prisma";
import bcrypt from "bcryptjs";

const TENANT_ID = "tenant_fluss_getraenke";

async function main() {
  const email =
    process.argv[2];

  const password =
    process.argv[3];

  if (
    !email ||
    !password
  ) {
    console.error(
      "Kullanım: npm run create-super-admin -- email sifre"
    );

    process.exit(1);
  }

  if (
    password.length < 8
  ) {
    console.error(
      "Şifre en az 8 karakter olmalıdır."
    );

    process.exit(1);
  }

  const normalizedEmail =
    email
      .trim()
      .toLowerCase();

  const passwordHash =
    await bcrypt.hash(
      password,
      12
    );

  const user =
    await prisma.user.upsert({
      where: {
        tenantId_email: {
          tenantId: TENANT_ID,
          email:
            normalizedEmail,
        },
      },

      update: {
        passwordHash,
        role:
          "SUPER_ADMIN",
      },

      create: {
        tenantId:
          TENANT_ID,
        email:
          normalizedEmail,
        passwordHash,
        role:
          "SUPER_ADMIN",
        firstName:
          "Super",
        lastName:
          "Admin",
        profileCompleted:
          true,
      },
    });

  console.log(
    `✅ Super Admin hazır: ${user.email}`
  );
}

main()
  .catch((error) => {
    console.error(error);

    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
