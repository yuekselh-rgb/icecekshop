import { getAdminWithPermissions } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { getCurrentTenant } from "@/lib/tenant";
import { notFound, redirect } from "next/navigation";
import PrintControls from "./PrintControls";

export default async function WarehousePrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await getAdminWithPermissions();

  if (!admin) {
    redirect("/giris");
  }

  if (!admin.isSuperAdmin && !admin.permissions.viewStock) {
    redirect("/admin");
  }

  const { id } = await params;
  const tenant = await getCurrentTenant();

  const log = tenant
    ? await prisma.warehouseLog.findUnique({
    where: {
      id,
      tenantId: tenant.id,
    },
    include: {
      items: {
        orderBy: {
          itemName: "asc",
        },
      },
    },
  })
    : null;

  if (!log) {
    notFound();
  }

  const isIncoming = log.type === "IN";

  return (
    <main className="min-h-screen bg-slate-100 p-2 text-slate-950 print:bg-white print:p-0">
      <div className="mx-auto max-w-[210mm] bg-white p-5 shadow print:max-w-none print:p-4 print:shadow-none">
        <PrintControls />

        <header className="border-b-2 border-slate-950 pb-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">
                Fluss Getränke
              </p>

              <h1 className="mt-1 text-2xl font-black">
                {isIncoming
                  ? "Mal Giriş Teslim Belgesi"
                  : "Mal Çıkış Teslim Belgesi"}
              </h1>

              <p className="mt-1 text-xs text-slate-500">
                Bağımsız depo giriş–çıkış kaydı
              </p>
            </div>

            <div className="text-right text-xs">
              <p className="font-black">
                Kayıt No
              </p>

              <p className="font-mono text-[9px]">
                {log.id}
              </p>

              <p className="mt-1 font-black">
                Tarih
              </p>

              <p>
                {new Date(log.createdAt).toLocaleString("de-DE")}
              </p>
            </div>
          </div>
        </header>

        <section className="mt-4 grid grid-cols-3 gap-x-5 gap-y-2 text-xs">
          <Info
            label={isIncoming ? "Getiren Firma / Kişi" : "Götüren Firma / Kişi"}
            value={log.companyName}
          />

          <Info label="Şoför Adı" value={log.driverName} />

          <Info label="Araç Plakası" value={log.vehiclePlate} />

          <Info label="İrsaliye Numarası" value={log.deliveryNoteNo} />

          <Info
            label={isIncoming ? "Teslim Alan Kişi" : "Teslim Eden Kişi"}
            value={log.contactPerson}
          />

          <Info
            label={isIncoming ? "Geldiği Yer" : "Gideceği Yer"}
            value={log.destination}
          />
        </section>

        <section className="mt-5">
          <h2 className="text-base font-black">
            Mal Kalemleri
          </h2>

          <table className="mt-2 w-full border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950 text-white">
                <th className="border border-slate-950 px-2 py-1.5 text-left">
                  No
                </th>

                <th className="border border-slate-950 px-2 py-1.5 text-left">
                  Mal Adı
                </th>

                <th className="border border-slate-950 px-2 py-1.5 text-right">
                  Miktar
                </th>

                <th className="border border-slate-950 px-2 py-1.5 text-left">
                  Birim
                </th>

                <th className="border border-slate-950 px-2 py-1.5 text-left">
                  Açıklama
                </th>
              </tr>
            </thead>

            <tbody>
              {log.items.map((item, index) => (
                <tr key={item.id}>
                  <td className="border border-slate-300 px-2 py-1.5">
                    {index + 1}
                  </td>

                  <td className="border border-slate-300 px-2 py-1.5 font-bold">
                    {item.itemName}
                  </td>

                  <td className="border border-slate-300 px-2 py-1.5 text-right">
                    {Number(item.quantity).toLocaleString("de-DE", {
                      maximumFractionDigits: 3,
                    })}
                  </td>

                  <td className="border border-slate-300 px-2 py-1.5">
                    {item.unit}
                  </td>

                  <td className="border border-slate-300 px-2 py-1.5">
                    {item.note || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {log.note ? (
          <section className="mt-4 rounded-lg border border-slate-300 p-2.5">
            <p className="text-[9px] font-black uppercase text-slate-500">
              Genel Açıklama
            </p>

            <p className="mt-1 whitespace-pre-wrap text-xs">
              {log.note}
            </p>
          </section>
        ) : null}

        <section className="mt-9 grid grid-cols-2 gap-10">
          <Signature
            title={isIncoming ? "Teslim Eden / Şoför" : "Malı Teslim Alan"}
            name={log.driverName}
          />

          <Signature
            title={isIncoming ? "Teslim Alan Personel" : "Teslim Eden Personel"}
            name={log.contactPerson}
          />
        </section>

        <footer className="mt-7 border-t pt-2 text-center text-[9px] text-slate-500">
          Bu belge bağımsız depo kayıt sisteminden oluşturulmuştur.
        </footer>
      </div>
    </main>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div className="border-b border-slate-300 pb-1">
      <p className="text-[9px] font-black uppercase text-slate-500">
        {label}
      </p>

      <p className="mt-0.5 min-h-4 text-xs font-bold">
        {value || "-"}
      </p>
    </div>
  );
}

function Signature({
  title,
  name,
}: {
  title: string;
  name: string | null;
}) {
  return (
    <div className="pt-10 text-center">
      <div className="border-t border-slate-950 pt-2">
        <p className="font-black">
          {title}
        </p>

        <p className="mt-0.5 text-xs text-slate-500">
          {name || "Ad Soyad / İmza"}
        </p>
      </div>
    </div>
  );
}
