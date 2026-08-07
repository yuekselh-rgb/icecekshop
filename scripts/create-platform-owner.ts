import "dotenv/config";

import { prisma } from "../src/lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];

  if (!email || !password) {
    console.error("Kullanım: npm run create-platform-owner -- email sifre");
    process.exit(1);
  }

  if (password.length < 8) {
    console.error("Şifre en az 8 karakter olmalıdır.");
    process.exit(1);
  }

  const normalizedEmail = email.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(password, 12);

  const existing = await prisma.user.findFirst({
    where: {
      email: normalizedEmail,
      role: "PLATFORM_OWNER",
      tenantId: null,
    },
  });

  const user = existing
    ? await prisma.user.update({
        where: { id: existing.id },
        data: { passwordHash },
      })
    : await prisma.user.create({
        data: {
          tenantId: null,
          email: normalizedEmail,
          passwordHash,
          role: "PLATFORM_OWNER",
          firstName: "Platform",
          lastName: "Owner",
          profileCompleted: true,
          emailVerified: true,
        },
      });

  console.log(`✅ Platform Owner hazır: ${user.email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
