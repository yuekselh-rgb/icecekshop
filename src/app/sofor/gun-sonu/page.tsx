import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export default async function GunSonuPage() {

  const session = await getSession();

  if (!session) {
    return null;
  }


  const orders = await prisma.order.findMany({
    where: {
      status: "DELIVERED",
      driverId: session.userId,
      payments: {
        some: {
          status: "PENDING",
        },
      },
    },
    include: {
      pfandReturns: {
        include: {
          items: true,
        },
      },
      payments: true,
    },
  });

  
  
  const totalSales = orders.reduce(
    (total, order) =>
      total +
      order.payments
        .filter((p) => p.status === "PENDING")
        .reduce((sum, p) => sum + Number(p.amount), 0),
    0,
  );

  const cash = orders.reduce(
    (t,o)=>
      t+
      o.payments
        .filter(p=>p.paymentMethod==="CASH")
        .reduce((x,p)=>x+Number(p.amount),0),
    0,
  );

  const card = orders.reduce(
    (t,o)=>
      t+
      o.payments
        .filter(p=>p.paymentMethod==="CARD")
        .reduce((x,p)=>x+Number(p.amount),0),
    0,
  );

  const pfand = orders.reduce(
    (t,o)=>
      t+
      o.pfandReturns.reduce(
        (x,r)=>x+Number(r.totalAmount),
        0,
      ),
    0,
  );


  
const open = orders.reduce(
  (total, order) =>
    total +
    order.payments
      .filter((p) => p.status === "PENDING")
      .reduce((sum, p) => sum + Number(p.amount), 0),
  0,
);


return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-6xl">

        <h1 className="mb-6 text-4xl font-black">
          Gün Sonu
        </h1>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">

          <Card title="Toplam Satış" value={totalSales}/>
          <Card title="Nakit" value={cash}/>
          <Card title="Kart" value={card}/>
          {open > 0 && (
          <Card title="Açık Hesap" value={open}/>
        )}
          <Card title="Pfand" value={pfand}/>

        

<a
  href="/api/sofor/gun-sonu"
  className="mt-8 block w-full rounded-2xl bg-green-600 py-4 text-center text-xl font-black text-white hover:bg-green-700"
>
Gün Sonunu Kapat
</a>


</div>

      </div>

    </main>
  );
}

function Card({
  title,
  value,
}:{
  title:string;
  value:number;
}){

  return(
    <div className="rounded-2xl bg-white p-6 shadow">
      <p className="text-xs uppercase text-slate-500">
        {title}
      </p>

      <p className="mt-3 text-3xl font-black">
        {value.toLocaleString("de-DE",{
          style:"currency",
          currency:"EUR",
        })}
      </p>
    </div>
  );
}
