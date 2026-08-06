import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  const admins = await prisma.user.findMany({
    where: {
      role: "ADMIN",
      adminPermission: null,
    },
    select: {
      id: true,
      email: true,
    },
  });

  for (const admin of admins) {
    await prisma.adminPermission.create({
      data: {
        userId: admin.id,
        viewProducts: true,
        viewCategories: true,
        viewStock: true,
        viewOrders: true,
      },
    });

    console.log(`✅ Yetkiler oluşturuldu: ${admin.email}`);
  }

  if (admins.length === 0) {
    console.log("✅ Eksik admin yetkisi bulunmuyor");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
