import { getAdminWithPermissions } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { getCurrentTenant } from "@/lib/tenant";
import { notFound, redirect } from "next/navigation";
import PrintControls from "./PrintControls";

export default async function WarehousePrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const admin = await getAdminWithPermissions();

  if (!admin) {
    redirect("/login");
  }

  if (!admin.isSuperAdmin && !admin.permissions.viewStock) {
    redirect("/admin");
  }

  const { id } = await params;
  const { lang } = await searchParams;

  const language = lang === "de" ? "de" : "tr";

  const t =
    language === "de"
      ? {
          incomingTitle: "Wareneingang-Lieferschein",
          outgoingTitle: "Warenausgang-Lieferschein",
          subtitle: "Unabhängige Lager-Ein-/Ausgangsbuchung",
          recordNo: "Buchungs-Nr.",
          date: "Datum",
          incomingCompany: "Anliefernde Firma / Person",
          outgoingCompany: "Abholende Firma / Person",
          driverName: "Name des Fahrers",
          vehiclePlate: "Kennzeichen",
          deliveryNoteNo: "Lieferscheinnummer",
          receivedBy: "Empfangen von",
          handedOverBy: "Übergeben von",
          origin: "Herkunftsort",
          destination: "Zielort",
          items: "Warenpositionen",
          no: "Nr.",
          itemName: "Warenname",
          quantity: "Menge",
          unit: "Einheit",
          note: "Beschreibung",
          generalNote: "Allgemeine Beschreibung",
          handedOverSignature: "Übergeben von / Fahrer",
          receivedGoodsSignature: "Ware entgegengenommen",
          receivedStaffSignature: "Empfangen von Mitarbeiter",
          handedOverStaffSignature: "Übergeben von Mitarbeiter",
          nameSignature: "Name / Unterschrift",
          footer:
            "Dieses Dokument wurde vom unabhängigen Lagerbuchungssystem erstellt.",
        }
      : {
          incomingTitle: "Mal Giriş Teslim Belgesi",
          outgoingTitle: "Mal Çıkış Teslim Belgesi",
          subtitle: "Bağımsız depo giriş–çıkış kaydı",
          recordNo: "Kayıt No",
          date: "Tarih",
          incomingCompany: "Getiren Firma / Kişi",
          outgoingCompany: "Götüren Firma / Kişi",
          driverName: "Şoför Adı",
          vehiclePlate: "Araç Plakası",
          deliveryNoteNo: "İrsaliye Numarası",
          receivedBy: "Teslim Alan Kişi",
          handedOverBy: "Teslim Eden Kişi",
          origin: "Geldiği Yer",
          destination: "Gideceği Yer",
          items: "Mal Kalemleri",
          no: "No",
          itemName: "Mal Adı",
          quantity: "Miktar",
          unit: "Birim",
          note: "Açıklama",
          generalNote: "Genel Açıklama",
          handedOverSignature: "Teslim Eden / Şoför",
          receivedGoodsSignature: "Malı Teslim Alan",
          receivedStaffSignature: "Teslim Alan Personel",
          handedOverStaffSignature: "Teslim Eden Personel",
          nameSignature: "Ad Soyad / İmza",
          footer: "Bu belge bağımsız depo kayıt sisteminden oluşturulmuştur.",
        };

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
        <PrintControls language={language} />

        <header className="border-b-2 border-slate-950 pb-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">
                Fluss Getränke
              </p>

              <h1 className="mt-1 text-2xl font-black">
                {isIncoming ? t.incomingTitle : t.outgoingTitle}
              </h1>

              <p className="mt-1 text-xs text-slate-500">
                {t.subtitle}
              </p>
            </div>

            <div className="text-right text-xs">
              <p className="font-black">
                {t.recordNo}
              </p>

              <p className="font-mono text-[9px]">
                {log.id}
              </p>

              <p className="mt-1 font-black">
                {t.date}
              </p>

              <p>
                {new Date(log.createdAt).toLocaleString("de-DE")}
              </p>
            </div>
          </div>
        </header>

        <section className="mt-4 grid grid-cols-3 gap-x-5 gap-y-2 text-xs">
          <Info
            label={isIncoming ? t.incomingCompany : t.outgoingCompany}
            value={log.companyName}
          />

          <Info label={t.driverName} value={log.driverName} />

          <Info label={t.vehiclePlate} value={log.vehiclePlate} />

          <Info label={t.deliveryNoteNo} value={log.deliveryNoteNo} />

          <Info
            label={isIncoming ? t.receivedBy : t.handedOverBy}
            value={log.contactPerson}
          />

          <Info
            label={isIncoming ? t.origin : t.destination}
            value={log.destination}
          />
        </section>

        <section className="mt-5">
          <h2 className="text-base font-black">
            {t.items}
          </h2>

          <table className="mt-2 w-full border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950 text-white">
                <th className="border border-slate-950 px-2 py-1.5 text-left">
                  {t.no}
                </th>

                <th className="border border-slate-950 px-2 py-1.5 text-left">
                  {t.itemName}
                </th>

                <th className="border border-slate-950 px-2 py-1.5 text-right">
                  {t.quantity}
                </th>

                <th className="border border-slate-950 px-2 py-1.5 text-left">
                  {t.unit}
                </th>

                <th className="border border-slate-950 px-2 py-1.5 text-left">
                  {t.note}
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
              {t.generalNote}
            </p>

            <p className="mt-1 whitespace-pre-wrap text-xs">
              {log.note}
            </p>
          </section>
        ) : null}

        <section className="mt-9 grid grid-cols-2 gap-10">
          <Signature
            title={isIncoming ? t.handedOverSignature : t.receivedGoodsSignature}
            name={log.driverName}
            nameFallback={t.nameSignature}
          />

          <Signature
            title={
              isIncoming ? t.receivedStaffSignature : t.handedOverStaffSignature
            }
            name={log.contactPerson}
            nameFallback={t.nameSignature}
          />
        </section>

        <footer className="mt-7 border-t pt-2 text-center text-[9px] text-slate-500">
          {t.footer}
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
  nameFallback,
}: {
  title: string;
  name: string | null;
  nameFallback: string;
}) {
  return (
    <div className="pt-10 text-center">
      <div className="border-t border-slate-950 pt-2">
        <p className="font-black">
          {title}
        </p>

        <p className="mt-0.5 text-xs text-slate-500">
          {name || nameFallback}
        </p>
      </div>
    </div>
  );
}
