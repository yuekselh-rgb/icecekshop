import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { prisma } from "@/lib/prisma";
import { getRequestLanguage } from "@/lib/request-language";
import { getCurrentTenant } from "@/lib/tenant";
import { CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function OrderConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const language = await getRequestLanguage();

  const t =
    language === "de"
      ? {
          eyebrow: "Bestellung",
          invalidTitle: "Link ungültig",
          invalidDescription:
            "Dieser Bestätigungslink ist ungültig oder gehört zu keiner Bestellung.",
          alreadyTitle: "Bereits bestätigt",
          alreadyDescription:
            "Diese Bestellung wurde bereits bestätigt. Wir bereiten sie vor.",
          successTitle: "Bestellung bestätigt!",
          successDescription:
            "Vielen Dank. Wir bereiten Ihre Bestellung jetzt vor.",
          orderNumberLabel: "Bestellnummer",
          myOrders: "Meine Bestellungen",
        }
      : {
          eyebrow: "Sipariş",
          invalidTitle: "Geçersiz bağlantı",
          invalidDescription:
            "Bu onay bağlantısı geçersiz veya herhangi bir siparişe ait değil.",
          alreadyTitle: "Zaten onaylandı",
          alreadyDescription:
            "Bu sipariş zaten onaylandı. Hazırlığa başlıyoruz.",
          successTitle: "Sipariş onaylandı!",
          successDescription: "Teşekkürler. Siparişinizi şimdi hazırlıyoruz.",
          orderNumberLabel: "Sipariş numarası",
          myOrders: "Siparişlerim",
        };

  const tenant = await getCurrentTenant();

  const order =
    tenant && token
      ? await prisma.order.findFirst({
          where: {
            tenantId: tenant.id,
            confirmationToken: token,
          },
          select: {
            id: true,
            orderNumber: true,
            confirmedAt: true,
          },
        })
      : null;

  let title = t.invalidTitle;
  let description = t.invalidDescription;
  let icon = <XCircle size={48} className="text-red-500" />;
  let orderNumber: string | null = null;

  if (order) {
    orderNumber = order.orderNumber;

    if (order.confirmedAt) {
      title = t.alreadyTitle;
      description = t.alreadyDescription;
      icon = <CheckCircle2 size={48} className="text-orange-500" />;
    } else {
      await prisma.order.update({
        where: { id: order.id },
        data: { confirmedAt: new Date() },
      });

      title = t.successTitle;
      description = t.successDescription;
      icon = <CheckCircle2 size={48} className="text-emerald-500" />;
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f7f5]">
      <Header />

      <section className="px-4 py-16 lg:px-8">
        <div className="mx-auto max-w-md">
          <div className="rounded-[32px] bg-white p-7 text-center shadow-sm sm:p-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-50">
              {icon}
            </div>

            <p className="mt-6 font-bold text-orange-500">{t.eyebrow}</p>

            <h1 className="mt-2 text-3xl font-black text-slate-950">
              {title}
            </h1>

            <p className="mt-3 leading-6 text-slate-500">{description}</p>

            {orderNumber ? (
              <p className="mt-4 text-sm font-semibold text-slate-700">
                {t.orderNumberLabel}: {orderNumber}
              </p>
            ) : null}

            <Link
              href="/orders"
              className="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-orange-500 px-6 py-4 font-black text-white transition hover:bg-orange-600"
            >
              {t.myOrders}
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
