import { prisma } from "../src/lib/prisma";

const categories = [
  { name: "Getränke", slug: "icecek" },
  { name: "Verpackung", slug: "ambalaj" },
  { name: "Take Away", slug: "take-away" },
  { name: "Reinigung", slug: "temizlik" },
  { name: "Snacks", slug: "snacks" },
  { name: "Milchprodukte", slug: "milchprodukte" },
  { name: "Kaffee", slug: "kaffee" },
  { name: "Tiefkühl", slug: "tiefkuhl" },
];

async function main() {
  for (const c of categories) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: {},
      create: c,
    });
  }

  console.log("✅ Kategoriler oluşturuldu.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
