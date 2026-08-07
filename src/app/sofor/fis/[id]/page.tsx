import { prisma } from "@/lib/prisma";
import AutoPrint from "./AutoPrint";

export default async function DriverReceiptPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const { id } = await params;
  const { lang } = await searchParams;

  const language = lang === "de" ? "de" : "tr";

  const t =
    language === "de"
      ? {
          notFound: "Beleg nicht gefunden.",
          tagline: "Getränke & Verpackung",
          receiptNo: "Beleg-Nr.",
          date: "Datum",
          customer: "Kunde",
          phone: "Telefon",
          subtotal: "Zwischensumme",
          pfand: "Pfand",
          total: "GESAMT",
          thankYou: "Vielen Dank.",
          seeYouAgain: "Wir freuen uns auf Ihren nächsten Besuch.",
        }
      : {
          notFound: "Fiş bulunamadı.",
          tagline: "İçecek & Ambalaj",
          receiptNo: "Fiş No",
          date: "Tarih",
          customer: "Müşteri",
          phone: "Telefon",
          subtotal: "Ara Toplam",
          pfand: "Pfand",
          total: "TOPLAM",
          thankYou: "Teşekkür ederiz.",
          seeYouAgain: "Yine bekleriz.",
        };

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: true,
      items: true,
    },
  });

  if (!order) {
    return (
      <div className="flex min-h-screen items-center justify-center text-2xl font-black">
        {t.notFound}
      </div>
    );
  }

  const customerName =
    order.user.companyName ||
    `${order.user.firstName ?? ""} ${order.user.lastName ?? ""}`.trim();

  const subtotal = order.items.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0,
  );

  const totalPfand = order.items.reduce(
    (sum, item) => sum + Number(item.pfand) * item.quantity,
    0,
  );

  return (
    <main className="mx-auto max-w-[80mm] bg-white p-4 font-mono text-xs text-black">

      <AutoPrint />

      <div className="text-center">
        <h1 className="text-xl font-black">
          FLUSS GETRÄNKE
        </h1>

        <p>{t.tagline}</p>

        <p className="mt-2">
          --------------------------------
        </p>
      </div>

      <div className="mt-3 space-y-1">
        <div>{t.receiptNo} : {order.orderNumber}</div>

        <div>
          {t.date} : {new Date(order.createdAt).toLocaleString("de-DE")}
        </div>

        <div>{t.customer} : {customerName}</div>

        {order.user.phone ? (
          <div>{t.phone} : {order.user.phone}</div>
        ) : null}
      </div>

      <div className="my-3 border-y border-dashed py-2">
        {order.items.map((item) => (
          <div
            key={item.id}
            className="mb-2"
          >
            <div className="font-bold">
              {item.name}
            </div>

            <div className="flex justify-between">
              <span>
                {item.quantity} × {Number(item.price).toFixed(2)} €
              </span>

              <span>
                {(Number(item.price) * item.quantity).toFixed(2)} €
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-1">
        <div className="flex justify-between">
          <span>{t.subtotal}</span>
          <span>{subtotal.toFixed(2)} €</span>
        </div>

        <div className="flex justify-between">
          <span>{t.pfand}</span>
          <span>{totalPfand.toFixed(2)} €</span>
        </div>

        <div className="flex justify-between border-t pt-2 text-base font-black">
          <span>{t.total}</span>
          <span>{Number(order.totalAmount).toFixed(2)} €</span>
        </div>
      </div>

      <div className="mt-6 text-center">
        <p>******************************</p>
        <p>{t.thankYou}</p>
        <p>{t.seeYouAgain}</p>
      </div>

    </main>
  );
}
