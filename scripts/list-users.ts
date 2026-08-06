import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  const users = await prisma.user.findMany({
    select: {
      email: true,
      role: true,
      isActive: true,
    },
    orderBy: {
      email: "asc",
    },
  });

  console.table(users);
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
