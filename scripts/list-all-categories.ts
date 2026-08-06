import { prisma } from "../src/lib/prisma";

async function main() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });

  console.table(categories);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
