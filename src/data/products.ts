export type LocalizedText = {
  tr: string;
  de: string;
};

export type Product = {
  id: number;
  name: LocalizedText;
  category: LocalizedText;
  categorySlug: string;
  packageInfo: string;
  price: number;
  oldPrice?: number;
  image: string;
  badge?: LocalizedText;
  inStock: boolean;
};

export const products: Product[] = [
  {
    id: 1,
    name: {
      tr: "Doğal Kaynak Suyu",
      de: "Natürliches Mineralwasser",
    },
    category: {
      tr: "İçecekler",
      de: "Getränke",
    },
    categorySlug: "icecekler",
    packageInfo: "24 x 500 ml",
    price: 6.99,
    oldPrice: 8.49,
    image: "💧",
    badge: {
      tr: "Çok Satan",
      de: "Bestseller",
    },
    inStock: true,
  },
  {
    id: 2,
    name: {
      tr: "Karton Kahve Bardağı",
      de: "Kaffeebecher aus Pappe",
    },
    category: {
      tr: "Ambalaj",
      de: "Verpackungen",
    },
    categorySlug: "ambalaj",
    packageInfo: "100 Stück",
    price: 9.9,
    oldPrice: 11.5,
    image: "☕",
    badge: {
      tr: "İndirimli",
      de: "Angebot",
    },
    inStock: true,
  },
  {
    id: 3,
    name: {
      tr: "Pizza Kutusu 32 cm",
      de: "Pizzakarton 32 cm",
    },
    category: {
      tr: "Take Away",
      de: "Take Away",
    },
    categorySlug: "take-away",
    packageInfo: "100 Stück",
    price: 34.9,
    oldPrice: 39.9,
    image: "🍕",
    badge: {
      tr: "Popüler",
      de: "Beliebt",
    },
    inStock: true,
  },
  {
    id: 4,
    name: {
      tr: "Enerji İçeceği",
      de: "Energy Drink",
    },
    category: {
      tr: "İçecekler",
      de: "Getränke",
    },
    categorySlug: "icecekler",
    packageInfo: "24 x 250 ml",
    price: 22.5,
    oldPrice: 25.99,
    image: "⚡",
    badge: {
      tr: "Yeni",
      de: "Neu",
    },
    inStock: true,
  },
  {
    id: 5,
    name: {
      tr: "Kola",
      de: "Cola",
    },
    category: {
      tr: "İçecekler",
      de: "Getränke",
    },
    categorySlug: "icecekler",
    packageInfo: "24 x 330 ml",
    price: 18.9,
    image: "🥤",
    inStock: true,
  },
  {
    id: 6,
    name: {
      tr: "Burger Kutusu",
      de: "Burgerbox",
    },
    category: {
      tr: "Ambalaj",
      de: "Verpackungen",
    },
    categorySlug: "ambalaj",
    packageInfo: "100 Stück",
    price: 21.9,
    image: "🍔",
    inStock: true,
  },
  {
    id: 7,
    name: {
      tr: "Kağıt Peçete",
      de: "Papierservietten",
    },
    category: {
      tr: "Temizlik",
      de: "Reinigung",
    },
    categorySlug: "temizlik",
    packageInfo: "500 Stück",
    price: 7.5,
    image: "🧻",
    inStock: true,
  },
  {
    id: 8,
    name: {
      tr: "Temizlik Spreyi",
      de: "Reinigungsspray",
    },
    category: {
      tr: "Temizlik",
      de: "Reinigung",
    },
    categorySlug: "temizlik",
    packageInfo: "750 ml",
    price: 4.99,
    image: "🧴",
    inStock: false,
  },
];
