import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const units = [
  {
    code: "KASA",
    nameTr: "Kasa",
    nameDe: "Kiste",
    sortOrder: 10,
  },
  {
    code: "KARTON",
    nameTr: "Karton",
    nameDe: "Karton",
    sortOrder: 20,
  },
  {
    code: "PAKET",
    nameTr: "Paket",
    nameDe: "Packung",
    sortOrder: 30,
  },
  {
    code: "ADET",
    nameTr: "Adet",
    nameDe: "Stück",
    sortOrder: 40,
  },
];

async function main() {
  for (const unit of units) {
    await prisma.stockUnitOption.upsert({
      where: {
        code: unit.code,
      },
      update: {
        nameTr: unit.nameTr,
        nameDe: unit.nameDe,
        active: true,
        sortOrder: unit.sortOrder,
      },
      create: {
        ...unit,
        active: true,
      },
    });
  }

  console.log("✅ Varsayılan stok birimleri kaydedildi.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
