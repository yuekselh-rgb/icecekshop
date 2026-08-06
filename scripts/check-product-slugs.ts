import { prisma } from "../src/lib/prisma";

async function main() {
  const products = await prisma.product.findMany({
    include: {
      category: true,
    },
    orderBy: [
      { category: { slug: "asc" } },
      { name: "asc" },
    ],
  });

  console.table(
    products.map((p) => ({
      product: p.name,
      category: p.category.name,
      slug: p.category.slug,
    })),
  );
}

main()
  .finally(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
  });
