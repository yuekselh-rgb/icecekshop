import { prisma } from "../src/lib/prisma";

const TENANT_ID = "tenant_fluss_getraenke";

const categoryId = "cmsbr8kqx0000rybslvz1c7p6";

const products = [
  {
    name: "Fanta 24x330ml",
    slug: "fanta-24x330ml",
    price: 22,
    purchasePrice: 18,
    pfandAmount: 3.30,
    stock: 80,
  },
  {
    name: "Sprite 24x330ml",
    slug: "sprite-24x330ml",
    price: 22,
    purchasePrice: 18,
    pfandAmount: 3.30,
    stock: 90,
  },
  {
    name: "Mezzo Mix 24x330ml",
    slug: "mezzo-mix-24x330ml",
    price: 23,
    purchasePrice: 19,
    pfandAmount: 3.30,
    stock: 70,
  },
  {
    name: "Uludağ Gazoz 24x200ml",
    slug: "uludag-gazoz-24x200ml",
    price: 19,
    purchasePrice: 15,
    pfandAmount: 3.30,
    stock: 60,
  },
  {
    name: "Ayran 20x250ml",
    slug: "ayran-20x250ml",
    price: 16,
    purchasePrice: 13,
    pfandAmount: 0,
    stock: 50,
  },
  {
    name: "Saka Su 12x1L",
    slug: "saka-su-12x1l",
    price: 8,
    purchasePrice: 6,
    pfandAmount: 0,
    stock: 120,
  },
  {
    name: "Fuse Tea Pfirsich 12x1.5L",
    slug: "fuse-tea-pfirsich-12x15l",
    price: 15,
    purchasePrice: 12,
    pfandAmount: 3.30,
    stock: 55,
  },
  {
    name: "Red Bull 24x250ml",
    slug: "red-bull-24x250ml",
    price: 34,
    purchasePrice: 29,
    pfandAmount: 3.30,
    stock: 45,
  },
  {
    name: "Monster Energy 24x500ml",
    slug: "monster-energy-24x500ml",
    price: 38,
    purchasePrice: 32,
    pfandAmount: 3.30,
    stock: 35,
  },
  {
    name: "Pepsi 24x330ml",
    slug: "pepsi-24x330ml",
    price: 21,
    purchasePrice: 17,
    pfandAmount: 3.30,
    stock: 85,
  }
];


products.push(
  { name:"Coca-Cola Vanilla 24x330ml", slug:"coca-cola-vanilla-24x330ml", price:23, purchasePrice:19, pfandAmount:3.30, stock:50 },
  { name:"Coca-Cola Lime 24x330ml", slug:"coca-cola-lime-24x330ml", price:23, purchasePrice:19, pfandAmount:3.30, stock:50 },
  { name:"Fanta Zero 24x330ml", slug:"fanta-zero-24x330ml", price:22, purchasePrice:18, pfandAmount:3.30, stock:60 },
  { name:"Sprite Lemon 24x330ml", slug:"sprite-lemon-24x330ml", price:22, purchasePrice:18, pfandAmount:3.30, stock:60 },
  { name:"Pepsi Max 24x330ml", slug:"pepsi-max-24x330ml", price:21, purchasePrice:17, pfandAmount:3.30, stock:80 },
  { name:"7UP 24x330ml", slug:"7up-24x330ml", price:21, purchasePrice:17, pfandAmount:3.30, stock:70 },
  { name:"Mirinda Orange 24x330ml", slug:"mirinda-orange-24x330ml", price:21, purchasePrice:17, pfandAmount:3.30, stock:65 },
  { name:"Uludağ Premium 24x200ml", slug:"uludag-premium-24x200ml", price:20, purchasePrice:16, pfandAmount:3.30, stock:45 },
  { name:"Beypazarı Soda 24x200ml", slug:"beypazari-soda-24x200ml", price:12, purchasePrice:9, pfandAmount:0, stock:100 },
  { name:"Kızılay Soda 24x200ml", slug:"kizilay-soda-24x200ml", price:12, purchasePrice:9, pfandAmount:0, stock:100 },
  { name:"Erikli Su 12x1.5L", slug:"erikli-su-12x15l", price:8, purchasePrice:6, pfandAmount:0, stock:120 },
  { name:"Hayat Su 12x1.5L", slug:"hayat-su-12x15l", price:8, purchasePrice:6, pfandAmount:0, stock:120 },
  { name:"Sırma Su 12x1.5L", slug:"sirma-su-12x15l", price:8, purchasePrice:6, pfandAmount:0, stock:120 },
  { name:"Lipton Ice Tea Peach", slug:"lipton-ice-tea-peach", price:15, purchasePrice:12, pfandAmount:3.30, stock:55 },
  { name:"Lipton Ice Tea Lemon", slug:"lipton-ice-tea-lemon", price:15, purchasePrice:12, pfandAmount:3.30, stock:55 },
  { name:"Nestea Peach", slug:"nestea-peach", price:15, purchasePrice:12, pfandAmount:3.30, stock:55 },
  { name:"Powerade Blue", slug:"powerade-blue", price:19, purchasePrice:15, pfandAmount:3.30, stock:40 },
  { name:"Monster Mango Loco", slug:"monster-mango-loco", price:39, purchasePrice:33, pfandAmount:3.30, stock:30 },
  { name:"Red Bull Sugarfree", slug:"red-bull-sugarfree", price:35, purchasePrice:30, pfandAmount:3.30, stock:35 },
  { name:"Red Bull Tropical", slug:"red-bull-tropical", price:35, purchasePrice:30, pfandAmount:3.30, stock:35 }
);


async function main() {
  for (const p of products) {
    await prisma.product.upsert({
      where: {
        tenantId_slug: {
          tenantId: TENANT_ID,
          slug: p.slug,
        },
      },
      update: {},
      create: {
        ...p,
        tenantId: TENANT_ID,
        nameDe: p.name,
        nameTr: p.name,
        stockUnit: "KASA",
        unitsPerPackage: 24,
        active: true,
        categoryId,
      },
    });
  }

  console.log(`✅ ${products.length} ürün eklendi.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
