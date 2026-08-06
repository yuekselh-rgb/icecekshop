import { getAdminWithPermissions } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import PrintControls from "./PrintControls";

type Balance = {
  itemName: string;
  unit: string;
  incoming: number;
  outgoing: number;
  current: number;
};

type UnitTotal = {
  unit: string;
  incoming: number;
  outgoing: number;
  current: number;
};

export default async function WarehouseStockPrintPage() {
  const admin = await getAdminWithPermissions();

  if (!admin) {
    redirect("/giris");
  }

  if (!admin.isSuperAdmin && !admin.permissions.viewStock) {
    redirect("/admin");
  }

  const logs = await prisma.warehouseLog.findMany({
    select: {
      type: true,
      items: {
        select: {
          itemName: true,
          quantity: true,
          unit: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const balanceMap = new Map<string, Balance>();

  for (const log of logs) {
    for (const item of log.items) {
      const itemName = item.itemName.trim();
      const unit = item.unit.trim().toLocaleUpperCase("tr-TR");
      const key = `${itemName.toLocaleLowerCase("tr-TR")}::${unit}`;
      const quantity = Number(item.quantity);

      const balance = balanceMap.get(key) || {
        itemName,
        unit,
        incoming: 0,
        outgoing: 0,
        current: 0,
      };

      if (log.type === "IN") {
        balance.incoming += quantity;
      } else {
        balance.outgoing += quantity;
      }

      balance.current = balance.incoming - balance.outgoing;
      balanceMap.set(key, balance);
    }
  }

  const balances = Array.from(balanceMap.values()).sort((a, b) =>
    a.itemName.localeCompare(b.itemName, "tr"),
  );

  const unitTotalMap = new Map<string, UnitTotal>();

  for (const item of balances) {
    const total = unitTotalMap.get(item.unit) || {
      unit: item.unit,
      incoming: 0,
      outgoing: 0,
      current: 0,
    };

    total.incoming += item.incoming;
    total.outgoing += item.outgoing;
    total.current += item.current;

    unitTotalMap.set(item.unit, total);
  }

  const unitTotals = Array.from(unitTotalMap.values()).sort((a, b) =>
    a.unit.localeCompare(b.unit, "tr"),
  );

  const formatQuantity = (value: number) =>
    value.toLocaleString("tr-TR", {
      maximumFractionDigits: 3,
    });

  return (
    <main className="min-h-screen bg-slate-100 p-3 text-slate-950 print:bg-white print:p-0">
      <div className="mx-auto max-w-[210mm] bg-white p-6 shadow print:max-w-none print:p-4 print:shadow-none">
        <PrintControls />

        <header className="border-b-2 border-slate-950 pb-3">
          <div className="flex items-start justify-between gap-5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">
                Fluss Getränke
              </p>

              <h1 className="mt-1 text-2xl font-black">
                Bağımsız Depo Mevcudu
              </h1>

              <p className="mt-1 text-xs text-slate-500">
                Bütün bağımsız depo giriş ve çıkış kayıtlarının güncel özeti
              </p>
            </div>

            <div className="text-right text-xs">
              <p className="font-black">Rapor Tarihi</p>
              <p>{new Date().toLocaleString("de-DE")}</p>

              <p className="mt-2 font-black">Mal Çeşidi</p>
              <p>{balances.length}</p>
            </div>
          </div>
        </header>

        <table className="mt-4 w-full border-collapse text-[11px]">
          <thead>
            <tr className="bg-slate-950 text-white">
              <th className="border border-slate-950 px-2 py-1.5 text-left">
                No
              </th>
              <th className="border border-slate-950 px-2 py-1.5 text-left">
                Mal Adı
              </th>
              <th className="border border-slate-950 px-2 py-1.5 text-right">
                Toplam Giren
              </th>
              <th className="border border-slate-950 px-2 py-1.5 text-right">
                Toplam Çıkan
              </th>
              <th className="border border-slate-950 px-2 py-1.5 text-right">
                Şu Anda Kalan
              </th>
              <th className="border border-slate-950 px-2 py-1.5 text-left">
                Birim
              </th>
            </tr>
          </thead>

          <tbody>
            {balances.map((item, index) => (
              <tr key={`${item.itemName}-${item.unit}`}>
                <td className="border border-slate-300 px-2 py-1.5">
                  {index + 1}
                </td>

                <td className="border border-slate-300 px-2 py-1.5 font-bold">
                  {item.itemName}
                </td>

                <td className="border border-slate-300 px-2 py-1.5 text-right">
                  {formatQuantity(item.incoming)}
                </td>

                <td className="border border-slate-300 px-2 py-1.5 text-right">
                  {formatQuantity(item.outgoing)}
                </td>

                <td className="border border-slate-300 px-2 py-1.5 text-right font-black">
                  {formatQuantity(item.current)}
                </td>

                <td className="border border-slate-300 px-2 py-1.5 font-bold">
                  {item.unit}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <section className="mt-5">
          <h2 className="text-base font-black">
            Birim Bazında Genel Toplamlar
          </h2>

          <table className="mt-2 w-full border-collapse text-[11px]">
            <thead>
              <tr className="bg-slate-200">
                <th className="border border-slate-400 px-2 py-1.5 text-left">
                  Birim
                </th>
                <th className="border border-slate-400 px-2 py-1.5 text-right">
                  Toplam Giren
                </th>
                <th className="border border-slate-400 px-2 py-1.5 text-right">
                  Toplam Çıkan
                </th>
                <th className="border border-slate-400 px-2 py-1.5 text-right">
                  Şu Anda Kalan
                </th>
              </tr>
            </thead>

            <tbody>
              {unitTotals.map((total) => (
                <tr key={total.unit} className="font-black">
                  <td className="border border-slate-300 px-2 py-1.5">
                    {total.unit}
                  </td>

                  <td className="border border-slate-300 px-2 py-1.5 text-right text-green-700">
                    {formatQuantity(total.incoming)}
                  </td>

                  <td className="border border-slate-300 px-2 py-1.5 text-right text-red-700">
                    {formatQuantity(total.outgoing)}
                  </td>

                  <td className="border border-slate-300 px-2 py-1.5 text-right">
                    {formatQuantity(total.current)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <footer className="mt-7 border-t pt-2 text-center text-[9px] text-slate-500">
          Bu rapor bağımsız depo kayıt sisteminden oluşturulmuştur.
        </footer>
      </div>
    </main>
  );
}
