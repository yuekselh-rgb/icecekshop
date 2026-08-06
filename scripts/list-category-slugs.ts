import { prisma } from "../src/lib/prisma";

async function main() {
  const categories = await prisma.category.findMany({
    orderBy: {
      createdAt: "asc",
    },
  });

  console.table(
    categories.map((c) => ({
      name: c.name,
      slug: c.slug,
      type: c.type,
    })),
  );
}

main()
  .finally(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
  });
