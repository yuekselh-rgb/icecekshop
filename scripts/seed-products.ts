import "dotenv/config";

import { prisma } from "../src/lib/prisma";

type CategorySeed = {
  slug: string;
  nameTr: string;
  nameDe: string;
};

type ProductSeed = {
  slug: string;
  nameTr: string;
  nameDe: string;
  categorySlug: string;
  packageInfo: string;
  price: number;
  oldPrice?: number;
  image: string;
  badgeTr?: string;
  badgeDe?: string;
  stock: number;
};

const categories: CategorySeed[] = [
  {
    slug: "icecekler",
    nameTr: "İçecekler",
    nameDe: "Getränke",
  },
  {
    slug: "ambalaj",
    nameTr: "Ambalaj",
    nameDe: "Verpackungen",
  },
  {
    slug: "take-away",
    nameTr: "Take Away",
    nameDe: "Take Away",
  },
  {
    slug: "temizlik",
    nameTr: "Temizlik",
    nameDe: "Reinigung",
  },
];

const products: ProductSeed[] = [
  {
    slug: "dogal-kaynak-suyu",
    nameTr: "Doğal Kaynak Suyu",
    nameDe: "Natürliches Mineralwasser",
    categorySlug: "icecekler",
    packageInfo: "24 x 500 ml",
    price: 6.99,
    oldPrice: 8.49,
    image: "💧",
    badgeTr: "Çok Satan",
    badgeDe: "Bestseller",
    stock: 100,
  },
  {
    slug: "karton-kahve-bardagi",
    nameTr: "Karton Kahve Bardağı",
    nameDe: "Kaffeebecher aus Pappe",
    categorySlug: "ambalaj",
    packageInfo: "100 Stück",
    price: 9.9,
    oldPrice: 11.5,
    image: "☕",
    badgeTr: "İndirimli",
    badgeDe: "Angebot",
    stock: 100,
  },
  {
    slug: "pizza-kutusu-32-cm",
    nameTr: "Pizza Kutusu 32 cm",
    nameDe: "Pizzakarton 32 cm",
    categorySlug: "take-away",
    packageInfo: "100 Stück",
    price: 34.9,
    oldPrice: 39.9,
    image: "🍕",
    badgeTr: "Popüler",
    badgeDe: "Beliebt",
    stock: 100,
  },
  {
    slug: "enerji-icecegi",
    nameTr: "Enerji İçeceği",
    nameDe: "Energy Drink",
    categorySlug: "icecekler",
    packageInfo: "24 x 250 ml",
    price: 22.5,
    oldPrice: 25.99,
    image: "⚡",
    badgeTr: "Yeni",
    badgeDe: "Neu",
    stock: 100,
  },
  {
    slug: "kola",
    nameTr: "Kola",
    nameDe: "Cola",
    categorySlug: "icecekler",
    packageInfo: "24 x 330 ml",
    price: 18.9,
    image: "🥤",
    stock: 100,
  },
  {
    slug: "burger-kutusu",
    nameTr: "Burger Kutusu",
    nameDe: "Burgerbox",
    categorySlug: "ambalaj",
    packageInfo: "100 Stück",
    price: 21.9,
    image: "🍔",
    stock: 100,
  },
  {
    slug: "kagit-pecete",
    nameTr: "Kağıt Peçete",
    nameDe: "Papierservietten",
    categorySlug: "temizlik",
    packageInfo: "500 Stück",
    price: 7.5,
    image: "🧻",
    stock: 100,
  },
  {
    slug: "temizlik-spreyi",
    nameTr: "Temizlik Spreyi",
    nameDe: "Reinigungsspray",
    categorySlug: "temizlik",
    packageInfo: "750 ml",
    price: 4.99,
    image: "🧴",
    stock: 0,
  },
];

async function main() {
  for (const category of categories) {
    await prisma.category.upsert({
      where: {
        slug: category.slug,
      },
      update: {
        name: category.nameDe,
        nameTr: category.nameTr,
        nameDe: category.nameDe,
      },
      create: {
        slug: category.slug,
        name: category.nameDe,
        nameTr: category.nameTr,
        nameDe: category.nameDe,
      },
    });
  }

  const databaseCategories = await prisma.category.findMany({
    select: {
      id: true,
      slug: true,
    },
  });

  const categoryIdBySlug = new Map(
    databaseCategories.map((category) => [
      category.slug,
      category.id,
    ])
  );

  for (const product of products) {
    const categoryId = categoryIdBySlug.get(product.categorySlug);

    if (!categoryId) {
      throw new Error(
        `Kategori bulunamadı: ${product.categorySlug}`
      );
    }

    await prisma.product.upsert({
      where: {
        slug: product.slug,
      },
      update: {
        name: product.nameDe,
        nameTr: product.nameTr,
        nameDe: product.nameDe,
        badgeTr: product.badgeTr ?? null,
        badgeDe: product.badgeDe ?? null,
        packageInfo: product.packageInfo,
        price: product.price,
        oldPrice: product.oldPrice ?? null,
        imageUrl: product.image,
        stock: product.stock,
        minStock: 10,
        active: true,
        categoryId,
      },
      create: {
        slug: product.slug,
        name: product.nameDe,
        nameTr: product.nameTr,
        nameDe: product.nameDe,
        badgeTr: product.badgeTr ?? null,
        badgeDe: product.badgeDe ?? null,
        packageInfo: product.packageInfo,
        price: product.price,
        oldPrice: product.oldPrice ?? null,
        imageUrl: product.image,
        stock: product.stock,
        minStock: 10,
        pfandAmount: 0,
        active: true,
        categoryId,
      },
    });
  }

  const productCount = await prisma.product.count();
  const categoryCount = await prisma.category.count();

  console.log(`✅ ${categoryCount} kategori veritabanında`);
  console.log(`✅ ${productCount} ürün veritabanında`);
}

main()
  .catch((error) => {
    console.error("❌ Seed işlemi başarısız:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
