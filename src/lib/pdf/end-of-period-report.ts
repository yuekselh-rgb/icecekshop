import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { prisma } from "@/lib/prisma";

export async function createEndOfPeriodPdf(): Promise<Buffer> {
  const customers = await prisma.user.findMany({
    where: {
      role: "CUSTOMER",
      isActive: true,
    },

    select: {
      email: true,
      firstName: true,
      lastName: true,
      companyName: true,
      phone: true,

      orders: {
        select: {
          totalAmount: true,
          paymentStatus: true,
        },
      },

      pfandReturns: {
        select: {
          approvedAmount: true,
        },
      },
    },

    orderBy: [
      { companyName: "asc" },
      { firstName: "asc" },
      { lastName: "asc" },
    ],
  });

  const pdf = new jsPDF({
    orientation: "landscape",
  });

  pdf.setFontSize(16);
  pdf.text(
    `Donem Sonu Raporu - ${new Date().toLocaleString("de-DE")}`,
    14,
    16,
  );

  autoTable(pdf, {
    startY: 24,

    head: [
      [
        "Musteri",
        "Telefon",
        "Toplam",
        "Acik Cari",
        "Tahsil Edilen",
        "Pfand",
      ],
    ],

    body: customers.map((customer) => {
      const totalPurchase = customer.orders.reduce(
        (sum, order) => sum + Number(order.totalAmount),
        0,
      );

      const openBalance = customer.orders
        .filter((order) => order.paymentStatus === "OPEN")
        .reduce((sum, order) => sum + Number(order.totalAmount), 0);

      const paidTotal = customer.orders
        .filter((order) => order.paymentStatus === "PAID")
        .reduce((sum, order) => sum + Number(order.totalAmount), 0);

      const pfandTotal = customer.pfandReturns.reduce(
        (sum, pfandReturn) => sum + Number(pfandReturn.approvedAmount ?? 0),
        0,
      );

      return [
        customer.companyName ||
          `${customer.firstName ?? ""} ${customer.lastName ?? ""}`.trim() ||
          customer.email,
        customer.phone ?? "",
        `EUR ${totalPurchase.toFixed(2)}`,
        `EUR ${openBalance.toFixed(2)}`,
        `EUR ${paidTotal.toFixed(2)}`,
        `EUR ${pfandTotal.toFixed(2)}`,
      ];
    }),

    styles: {
      fontSize: 8,
    },

    headStyles: {
      fillColor: [234, 88, 12],
    },
  });

  const arrayBuffer = pdf.output("arraybuffer");

  return Buffer.from(arrayBuffer);
}
