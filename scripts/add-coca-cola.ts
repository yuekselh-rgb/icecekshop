import { prisma } from "../src/lib/prisma";

const TENANT_ID = "tenant_fluss_getraenke";

async function main() {
  const product = await prisma.product.create({
    data: {
      tenantId: TENANT_ID,
      name: "Coca-Cola 24x330ml",
      nameDe: "Coca-Cola 24x330ml",
      nameTr: "Coca-Cola 24x330ml",
      slug: "coca-cola-24x330ml",
      price: 22.00,
      purchasePrice: 18.00,
      pfandAmount: 3.30,
      stock: 100,
      minStock: 10,
      stockUnit: "KASA",
      unitsPerPackage: 24,
      active: true,
      categoryId: "cmsbr8kqx0000rybslvz1c7p6",
    },
  });

  console.log("✅ Ürün eklendi:");
  console.log(product);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
