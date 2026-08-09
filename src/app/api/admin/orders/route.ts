import { requireAdminPermission } from "@/lib/admin-auth";
import {
  adminOrderInclude,
  serializeAdminOrder,
} from "@/lib/admin-order-serializer";
import { prisma } from "@/lib/prisma";
import { withTenant } from "@/lib/tenant";
import { NextResponse } from "next/server";

export const GET = withTenant(async () => {
  const admin = await requireAdminPermission("viewOrders");

  if (!admin) {
    return NextResponse.json(
      {
        error: "Siparişleri görüntüleme yetkiniz yok.",
      },
      {
        status: 403,
      },
    );
  }

  try {
    const orders = await prisma.order.findMany({
      where: {
        deletedAt: null,
      },

      include: adminOrderInclude,

      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      orders: orders.map((order) => serializeAdminOrder(order)),
    });
  } catch (error) {
    console.error("ADMIN_ORDERS_ERROR", error);

    return NextResponse.json(
      {
        error: "Siparişler yüklenirken hata oluştu.",
      },
      {
        status: 500,
      },
    );
  }
});
