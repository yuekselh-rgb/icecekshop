import { verifySessionToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

async function getDriverSession() {
  const cookieStore = await cookies();

  const token = cookieStore.get("paketmarket_session")?.value;

  if (!token) {
    return null;
  }

  const session = await verifySessionToken(token);

  if (!session || session.role !== "DRIVER") {
    return null;
  }

  return session;
}

type ProductStockSummary = {
  productId: string;
  displayName: { tr: string; de: string };
  stockUnit: string;
  packageInfo: string | null;
  imageUrl: string | null;
  salePrice: number;

  loadedQuantity: number;
  soldQuantity: number;
  returnedQuantity: number;
  adjustmentQuantity: number;
  currentQuantity: number;
};

export async function GET() {
  const session = await getDriverSession();

  if (!session) {
    return NextResponse.json(
      {
        error: "Yetkisiz erişim.",
      },
      {
        status: 403,
      },
    );
  }

  try {
    /*
     * Güncel araç stoku DriverStock tablosundan alınır.
     *
     * Yüklenen, satılan ve geri alınan toplamlar ise
     * DriverStockMovement hareketlerinden hesaplanır.
     */
    const [currentStocks, movements] = await Promise.all([
      prisma.driverStock.findMany({
        where: {
          driverId: session.userId,
        },

        select: {
          productId: true,
          quantity: true,

          product: {
            select: {
              id: true,
              name: true,
              nameTr: true,
              nameDe: true,
              stockUnit: true,
              packageInfo: true,
              imageUrl: true,
              price: true,
            },
          },
        },
      }),

      prisma.driverStockMovement.findMany({
        where: {
          driverId: session.userId,
        },

        select: {
          productId: true,
          type: true,
          amount: true,
          createdAt: true,

          product: {
            select: {
              id: true,
              name: true,
              nameTr: true,
              nameDe: true,
              stockUnit: true,
              packageInfo: true,
              imageUrl: true,
              price: true,
            },
          },
        },

        orderBy: {
          createdAt: "asc",
        },
      }),
    ]);

    const stockByProductId = new Map(
      currentStocks.map((stock) => [stock.productId, stock.quantity]),
    );

    type DriverMovement = {
      productId: string;
      type: string;
      amount: number;
      createdAt: Date;

      product: {
        id: string;
        name: string;
        nameTr: string | null;
        nameDe: string | null;
        stockUnit: string;
        packageInfo: string | null;
        imageUrl: string | null;
        price: unknown;
      };
    };

    const movementList = movements as DriverMovement[];

    /*
     * Şoförün halen devam eden araç turunu bütün ürünler üzerinden bulur.
     *
     * Tur, araç tamamen boşken gelen ilk LOAD ile başlar.
     * Bütün ürünlerin hareket bakiyesi tekrar sıfır olduğunda tur kapanır.
     *
     * Böylece tamamen satılmış ve DriverStock satırı silinmiş ürünler de
     * sabah yüklenen mal değerinin içinde kalmaya devam eder.
     */
    function getCurrentVehicleCycleMovements() {
      const orderedMovements = [...movementList].sort(
        (first, second) =>
          new Date(first.createdAt).getTime() -
          new Date(second.createdAt).getTime(),
      );

      const balances = new Map<string, number>();

      let cycleStartIndex = 0;

      for (let index = 0; index < orderedMovements.length; index += 1) {
        const movement = orderedMovements[index];

        const previousBalance = balances.get(movement.productId) || 0;

        let nextBalance = previousBalance;

        if (movement.type === "LOAD") {
          nextBalance += Math.abs(movement.amount);
        }

        if (movement.type === "SALE" || movement.type === "RETURN") {
          nextBalance -= Math.abs(movement.amount);
        }

        if (movement.type === "ADJUSTMENT") {
          nextBalance += movement.amount;
        }

        balances.set(movement.productId, Math.max(0, nextBalance));

        const vehicleIsEmpty = Array.from(balances.values()).every(
          (quantity) => quantity <= 0,
        );

        if (vehicleIsEmpty) {
          cycleStartIndex = index + 1;
        }
      }

      /*
       * Gerçek araç stokunda hiçbir ürün kalmadıysa açık tur yoktur.
       */
      const hasCurrentVehicleStock = currentStocks.some(
        (stock) => stock.quantity > 0,
      );

      if (!hasCurrentVehicleStock) {
        return [];
      }

      return orderedMovements.slice(cycleStartIndex);
    }

    const currentVehicleCycleMovements = getCurrentVehicleCycleMovements();

    /*
     * Bu turun toplam yüklenen mal değeri.
     *
     * Satış yapıldığında azalmaz.
     * Ürün tamamen satılsa ve DriverStock satırı silinse bile LOAD hareketi
     * tur kapanana kadar toplam değerin içinde kalır.
     */
    const currentTripLoadedValue = Number(
      currentVehicleCycleMovements
        .filter((movement) => movement.type === "LOAD")
        .reduce(
          (total, movement) =>
            total +
            Math.abs(movement.amount) * Number(movement.product.price || 0),
          0,
        )
        .toFixed(2),
    );

    /*
     * Her ürün için yalnızca en son araç turu hesaplanır.
     *
     * Bir tur:
     * - İlk LOAD hareketiyle başlar.
     * - SALE, RETURN ve ADJUSTMENT hareketleriyle azalır.
     * - Hesaplanan araç miktarı sıfıra ulaştığında kapanır.
     * - Sonraki LOAD tamamen yeni bir tur başlatır.
     *
     * Böylece geçmiş günlerin yüklemeleri yeni güne eklenmez.
     */
    function getLatestCycle(productId: string) {
      const productMovements = movementList
        .filter((movement) => movement.productId === productId)
        .sort(
          (first, second) =>
            new Date(first.createdAt).getTime() -
            new Date(second.createdAt).getTime(),
        );

      let runningQuantity = 0;
      let cycleOpen = false;

      let loadedQuantity = 0;
      let soldQuantity = 0;
      let returnedQuantity = 0;
      let adjustmentQuantity = 0;

      for (const movement of productMovements) {
        if (movement.type === "LOAD") {
          /*
           * Önceki tur kapanmışsa bu LOAD yeni turun başlangıcıdır.
           * Eski turun bütün rakamları temizlenir.
           */
          if (!cycleOpen || runningQuantity <= 0) {
            runningQuantity = 0;
            loadedQuantity = 0;
            soldQuantity = 0;
            returnedQuantity = 0;
            adjustmentQuantity = 0;
            cycleOpen = true;
          }

          const quantity = Math.abs(movement.amount);

          loadedQuantity += quantity;
          runningQuantity += quantity;

          continue;
        }

        /*
         * Henüz yeni turun LOAD hareketi başlamadıysa
         * geçmiş satış/iade hareketlerini dikkate alma.
         */
        if (!cycleOpen) {
          continue;
        }

        if (movement.type === "SALE") {
          const quantity = Math.abs(movement.amount);

          soldQuantity += quantity;
          runningQuantity -= quantity;
        }

        if (movement.type === "RETURN") {
          const quantity = Math.abs(movement.amount);

          returnedQuantity += quantity;
          runningQuantity -= quantity;
        }

        if (movement.type === "ADJUSTMENT") {
          adjustmentQuantity += movement.amount;
          runningQuantity += movement.amount;
        }

        /*
         * Araç stoğu tamamen kapandı.
         * Bir sonraki LOAD yeni tur olacaktır.
         */
        if (runningQuantity <= 0) {
          runningQuantity = 0;
          cycleOpen = false;
        }
      }

      return {
        loadedQuantity,
        soldQuantity,
        returnedQuantity,
        adjustmentQuantity,
      };
    }

    /*
     * Şoför ekranında yalnızca DriverStock tablosunda şu anda
     * gerçekten bulunan ürünler gösterilir.
     *
     * Akşam iadesi tamamlandığında DriverStock satırı silindiği
     * veya miktarı sıfır olduğu için ürün burada görünmez.
     */
    const stocks: ProductStockSummary[] = currentStocks
      .filter((stock) => stock.quantity > 0)
      .map((stock) => {
        const latestCycle = getLatestCycle(stock.productId);

        return {
          productId: stock.product.id,

          displayName: {
            tr: stock.product.nameTr || stock.product.name,
            de: stock.product.nameDe || stock.product.name,
          },

          stockUnit: stock.product.stockUnit,
          packageInfo: stock.product.packageInfo,
          imageUrl: stock.product.imageUrl,
          salePrice: Number(stock.product.price || 0),

          loadedQuantity: latestCycle.loadedQuantity,
          soldQuantity: latestCycle.soldQuantity,
          returnedQuantity: latestCycle.returnedQuantity,
          adjustmentQuantity: latestCycle.adjustmentQuantity,

          /*
           * Kalan miktar hareket hesabından değil,
           * gerçek araç stok tablosundan alınır.
           */
          currentQuantity: stock.quantity,
        };
      })
      .sort((first, second) =>
        first.displayName.tr.localeCompare(second.displayName.tr, "tr"),
      );

    return NextResponse.json({
      summary: {
        currentTripLoadedValue,
      },

      stocks,
    });
  } catch (error) {
    console.error("DRIVER_STOCK_GET_ERROR", error);

    return NextResponse.json(
      {
        error: "Araç stok bilgileri yüklenemedi.",
      },
      {
        status: 500,
      },
    );
  }
}
