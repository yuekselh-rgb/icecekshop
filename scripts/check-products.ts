import { prisma } from "../src/lib/prisma";

async function main() {
  const count = await prisma.product.count();

  console.log("Ürün sayısı:", count);

  const products = await prisma.product.findMany({
    take: 20,
    select: {
      id: true,
      name: true,
      stock: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  console.table(products);
}

main().finally(async () => {
  await prisma.$disconnect();
});
