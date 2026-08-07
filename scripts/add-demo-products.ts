import { prisma } from "../src/lib/prisma";

const TENANT_ID = "tenant_fluss_getraenke";

const demoProducts: Record<string, string[]> = {
  Kaffee: [
    "Jacobs Krönung",
    "Mehmet Efendi",
    "Nescafe Gold",
    "Espresso Bohnen",
    "Filter Kaffee",
  ],
  Milchprodukte: [
    "Süt 1L",
    "Yoğurt 1kg",
    "Kaşar",
    "Tereyağı",
    "Ayran 1L",
  ],
  Reinigung: [
    "Fairy",
    "Domestos",
    "Cif",
    "Cam Sil",
    "Çamaşır Suyu",
  ],
  Snacks: [
    "Doritos",
    "Ruffles",
    "Albeni",
    "Eti Burçak",
    "Fındık",
  ],
  "Take Away": [
    "Pizza Kutusu",
    "Hamburger Kutusu",
    "Karton Bardak",
    "Plastik Çatal",
    "Pipet",
  ],
  Tiefkühl: [
    "Donmuş Pizza",
    "Patates",
    "Nugget",
    "Dondurma",
    "Börek",
  ],
  Verpackung: [
    "Poşet Büyük",
    "Poşet Küçük",
    "Streç Film",
    "Alüminyum Folyo",
    "Kapak",
  ],
};

async function main() {
  const categories = await prisma.category.findMany({
    include: { products: true },
  });

  for (const category of categories) {
    const list = demoProducts[category.name];
    if (!list) continue;

    for (const name of list) {
      const exists = category.products.find((p) => p.name === name);
      if (exists) continue;

      await prisma.product.create({
        data: {
          tenantId: TENANT_ID,
          name,
          slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          active: true,
          stock: 100,
          price: 9.99,
          purchasePrice: 5.50,
          pfandAmount: 0,
          categoryId: category.id,
        },
      });

      console.log("✓", category.name, "-", name);
    }
  }

  console.log("✅ Demo ürünleri eklendi.");
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
