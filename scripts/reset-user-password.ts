import "dotenv/config";

import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";

const TENANT_ID = "tenant_fluss_getraenke";

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];

  if (!email || !password) {
    console.error(
      "Kullanım: npm run reset-user-password -- email yeniSifre"
    );
    process.exit(1);
  }

  if (password.length < 8) {
    console.error(
      "Şifre en az 8 karakter olmalıdır."
    );
    process.exit(1);
  }

  const normalizedEmail = email.trim().toLowerCase();

  const user = await prisma.user.findFirst({
    where: {
      tenantId: TENANT_ID,
      email: normalizedEmail,
    },
  });

  if (!user) {
    console.error(
      "❌ Bu e-posta ile kullanıcı bulunamadı."
    );
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(
    password,
    12
  );

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      passwordHash,
    },
  });

  console.log(
    `✅ Şifre güncellendi: ${normalizedEmail}`
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
