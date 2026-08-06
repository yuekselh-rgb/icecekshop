import { prisma } from "../src/lib/prisma";

async function main() {
  const categories = await prisma.category.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });

  console.table(categories);
}

main()
  .finally(() => prisma.$disconnect());
