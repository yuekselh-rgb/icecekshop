import {
  getAdminWithPermissions,
  requireAdminPermission,
} from "@/lib/admin-auth";
import {
  adminOrderInclude,
  serializeAdminOrder,
} from "@/lib/admin-order-serializer";
import { prisma } from "@/lib/prisma";
import { withTenant } from "@/lib/tenant";
import { NextRequest, NextResponse } from "next/server";

const allowedStatuses = [
  "NEW",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
] as const;

type OrderStatusValue = (typeof allowedStatuses)[number];

export const GET = withTenant(async (
  _request: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  },
) => {
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

  const { id } = await context.params;

  try {
    const order = await prisma.order.findFirst({
      where: {
        id,
        deletedAt: null,
      },

      include: adminOrderInclude,
    });

    if (!order) {
      return NextResponse.json(
        {
          error: "Sipariş bulunamadı.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json({
      order: serializeAdminOrder(order),
    });
  } catch (error) {
    console.error("ADMIN_ORDER_DETAIL_ERROR", error);

    return NextResponse.json(
      {
        error: "Sipariş yüklenirken hata oluştu.",
      },
      {
        status: 500,
      },
    );
  }
});

export const PATCH = withTenant(async (
  request: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  },
  tenant,
) => {
  const admin = await getAdminWithPermissions();

  if (!admin) {
    return NextResponse.json(
      {
        error: "Yetkisiz erişim.",
      },
      {
        status: 403,
      },
    );
  }

  const { id } = await context.params;

  try {
    const body = await request.json();

    const requestedStatus = body.status
      ? (String(body.status) as OrderStatusValue)
      : null;

    const hasDriverId = Object.prototype.hasOwnProperty.call(body, "driverId");

    const requestedDriverId =
      hasDriverId && body.driverId ? String(body.driverId) : null;

    const hasPaymentStatus = Object.prototype.hasOwnProperty.call(
      body,
      "paymentStatus",
    );

    const requestedPaymentStatus = hasPaymentStatus
      ? String(body.paymentStatus)
      : null;

    if (
      requestedPaymentStatus !== null &&
      requestedPaymentStatus !== "OPEN" &&
      requestedPaymentStatus !== "PAID"
    ) {
      return NextResponse.json(
        {
          error: "Geçersiz ödeme durumu.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * Sipariş durumu ve şoför ataması updateOrder yetkisi ister.
     * Müşteri tahsilatının kasaya alınması ise ayrı
     * approveCustomerPayment yetkisi ister.
     */
    if (
      (requestedStatus !== null || hasDriverId) &&
      !admin.isSuperAdmin &&
      !admin.permissions.updateOrder
    ) {
      return NextResponse.json(
        {
          error: "Sipariş bilgilerini değiştirme yetkiniz yok.",
        },
        {
          status: 403,
        },
      );
    }

    if (
      hasPaymentStatus &&
      requestedPaymentStatus === "PAID" &&
      !admin.isSuperAdmin &&
      !admin.permissions.approveCustomerPayment
    ) {
      return NextResponse.json(
        {
          error: "Müşteri tahsilatını onaylama yetkiniz yok.",
        },
        {
          status: 403,
        },
      );
    }

    if (requestedStatus && !allowedStatuses.includes(requestedStatus)) {
      return NextResponse.json(
        {
          error: "Geçersiz sipariş durumu.",
        },
        {
          status: 400,
        },
      );
    }

    if (!requestedStatus && !hasDriverId && !hasPaymentStatus) {
      return NextResponse.json(
        {
          error: "Güncellenecek bir alan gönderilmedi.",
        },
        {
          status: 400,
        },
      );
    }

    if (requestedDriverId) {
      const driver = await prisma.user.findFirst({
        where: {
          id: requestedDriverId,
          role: "DRIVER",
        },

        select: {
          id: true,
        },
      });

      if (!driver) {
        return NextResponse.json(
          {
            error: "Seçilen şoför bulunamadı.",
          },
          {
            status: 404,
          },
        );
      }
    }

    const existingOrder = await prisma.order.findFirst({
      where: {
        id,
        deletedAt: null,
      },

      include: {
        items: true,

        pfandReturns: {
          orderBy: {
            createdAt: "desc",
          },

          take: 1,
        },

        payments: {
          orderBy: {
            reportedAt: "asc",
          },
        },
      },
    });

    if (!existingOrder) {
      return NextResponse.json(
        {
          error: "Sipariş bulunamadı.",
        },
        {
          status: 404,
        },
      );
    }

    /*
     * Gerçek Kasaya alınmış, admin tarafından kesin onaylanmış
     * bir ödeme tekrar OPEN durumuna çevrilemez.
     */
    if (
      hasPaymentStatus &&
      requestedPaymentStatus === "OPEN" &&
      (existingOrder.paymentStatus === "PAID" ||
        existingOrder.paymentApprovedAt !== null)
    ) {
      return NextResponse.json(
        {
          error:
            "Admin tarafından onaylanan ödeme tekrar açılamaz. Kasa hareketi kesinleşmiştir.",
        },
        {
          status: 409,
        },
      );
    }

    const statusChanged =
      requestedStatus !== null && existingOrder.status !== requestedStatus;

    const driverChanged =
      hasDriverId && existingOrder.driverId !== requestedDriverId;

    if (
      driverChanged &&
      existingOrder.status === "DELIVERED" &&
      admin.session.role !== "SUPER_ADMIN"
    ) {
      return NextResponse.json(
        {
          error:
            "Teslim edilmiş siparişin Lieferfahrer bilgisi yalnızca Super Admin tarafından değiştirilebilir.",
        },
        {
          status: 403,
        },
      );
    }

    const paymentChanged =
      hasPaymentStatus &&
      existingOrder.paymentStatus !== requestedPaymentStatus;

    console.log("PAYMENT DEBUG", {
      order: existingOrder.orderNumber,
      hasPaymentStatus,
      requestedPaymentStatus,
      currentPaymentStatus: existingOrder.paymentStatus,
      paymentChanged,
    });

    if (!statusChanged && !driverChanged && !paymentChanged) {
      return NextResponse.json({
        message: "Siparişte değişiklik yapılmadı.",
        order: existingOrder,
      });
    }

    const wasCancelled = existingOrder.status === "CANCELLED";

    const willBeCancelled = requestedStatus === "CANCELLED";

    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Sipariş ilk kez iptal ediliyorsa stokları geri ekle.
      if (!wasCancelled && willBeCancelled) {
        for (const item of existingOrder.items) {
          await tx.product.update({
            where: {
              id: item.productId,
            },

            data: {
              stock: {
                increment: item.quantity,
              },
            },
          });

          await tx.stockMovement.create({
            data: {
              tenantId: tenant.id,
              productId: item.productId,
              amount: item.quantity,
              reason: `İptal edilen sipariş ${existingOrder.orderNumber}`,
            },
          });
        }
      }

      // İptal edilmiş sipariş tekrar açılıyorsa stokları yeniden düş.
      if (wasCancelled && !willBeCancelled) {
        for (const item of existingOrder.items) {
          const updatedProduct = await tx.product.updateMany({
            where: {
              id: item.productId,
              active: true,

              stock: {
                gte: item.quantity,
              },
            },

            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          });

          if (updatedProduct.count !== 1) {
            throw new Error(`INSUFFICIENT_STOCK:${item.name}`);
          }

          await tx.stockMovement.create({
            data: {
              tenantId: tenant.id,
              productId: item.productId,
              amount: -item.quantity,
              reason: `Yeniden açılan sipariş ${existingOrder.orderNumber}`,
            },
          });
        }
      }

      const latestPfandReturn = existingOrder.pfandReturns[0];

      const pfandReturnAmount = latestPfandReturn
        ? Number(
            latestPfandReturn.approvedAmount ??
              latestPfandReturn.totalAmount ??
              0,
          )
        : 0;

      const effectiveOrderTotal = Number(
        Math.max(
          0,
          Number(existingOrder.subtotal) +
            Number(existingOrder.pfandAmount) +
            Number(existingOrder.deliveryFee) -
            pfandReturnAmount,
        ).toFixed(2),
      );

      let approvedTotalAfter = Number(
        existingOrder.payments
          .filter((payment) => payment.status === "APPROVED")
          .reduce((total, payment) => total + Number(payment.amount), 0)
          .toFixed(2),
      );

      let remainingAmountAfter = Number(
        Math.max(0, effectiveOrderTotal - approvedTotalAfter).toFixed(2),
      );

      let approvedPaymentAmount = 0;

      if (paymentChanged && requestedPaymentStatus === "PAID") {
        let pendingPayment = await tx.orderPayment.findFirst({
          where: {
            orderId: existingOrder.id,
            status: "PENDING",
          },

          orderBy: {
            reportedAt: "asc",
          },
        });

        /*
         * Eski şoför araç satışlarında driverPaymentReportedAmount
         * kaydedilmiş olabilir fakat OrderPayment kaydı bulunmayabilir.
         *
         * Böyle bir durumda eksik PENDING ödeme kaydını burada
         * otomatik oluşturuyoruz. Böylece mevcut satışlar da
         * admin tarafından onaylanabilir.
         */
        if (
          !pendingPayment &&
          existingOrder.driverPaymentReportedAt &&
          existingOrder.driverPaymentReportedAmount &&
          Number(existingOrder.driverPaymentReportedAmount) > 0
        ) {
          const legacyReportedAmount = Number(
            existingOrder.driverPaymentReportedAmount,
          );

          pendingPayment = await tx.orderPayment.create({
            data: {
              tenantId: tenant.id,
              orderId: existingOrder.id,
              customerId: existingOrder.userId,
              driverId: existingOrder.driverId,

              amount: legacyReportedAmount,

              status: "PENDING",

              reportedById: existingOrder.driverId || admin.session.userId,

              reporterRole: existingOrder.driverId ? "DRIVER" : "ADMIN",

              reportedAt: existingOrder.driverPaymentReportedAt || new Date(),

              note:
                `Eksik ödeme kaydı admin onayı sırasında otomatik oluşturuldu. ` +
                `Sipariş: ${existingOrder.orderNumber}. ` +
                `Bildirilen tutar: ${legacyReportedAmount.toFixed(2)} €.`,
            },
          });
        }

        if (!pendingPayment) {
          throw new Error("PENDING_PAYMENT_NOT_FOUND");
        }

        approvedPaymentAmount = Number(pendingPayment.amount);

        if (
          !Number.isFinite(approvedPaymentAmount) ||
          approvedPaymentAmount <= 0
        ) {
          throw new Error("INVALID_PENDING_PAYMENT_AMOUNT");
        }

        const remainingAmountBefore = Number(
          Math.max(0, effectiveOrderTotal - approvedTotalAfter).toFixed(2),
        );

        if (approvedPaymentAmount > remainingAmountBefore) {
          throw new Error("PAYMENT_EXCEEDS_OPEN_AMOUNT");
        }

        const approvalDate = new Date();

        await tx.orderPayment.update({
          where: {
            id: pendingPayment.id,
          },

          data: {
            status: "APPROVED",
            approvedById: admin.session.userId,
            approvedAt: approvalDate,
          },
        });

        approvedTotalAfter = Number(
          (approvedTotalAfter + approvedPaymentAmount).toFixed(2),
        );

        remainingAmountAfter = Number(
          Math.max(0, effectiveOrderTotal - approvedTotalAfter).toFixed(2),
        );

        const customerName =
          existingOrder.userId || `Müşteri ${existingOrder.id}`;

        const movementDescriptionPrefix = `Onaylı müşteri tahsilatı [${pendingPayment.id}]:`;

        const existingCashMovement = await tx.cashMovement.findFirst({
          where: {
            accountType: "BAR",
            direction: "IN",
            category: "MANUAL_INCOME",
            orderId: existingOrder.id,

            description: {
              startsWith: movementDescriptionPrefix,
            },
          },

          select: {
            id: true,
          },
        });

        if (!existingCashMovement) {
          await tx.cashMovement.create({
            data: {
              tenantId: tenant.id,
              accountType: "BAR",
              direction: "IN",
              category: "MANUAL_INCOME",
              amount: approvedPaymentAmount,
              orderId: existingOrder.id,
              createdById: admin.session.userId,
              companyName: customerName,

              description:
                `${movementDescriptionPrefix} ` +
                `${existingOrder.orderNumber}. ` +
                `Kasaya alınan tutar: ${approvedPaymentAmount.toFixed(2)} €. ` +
                `Siparişte kalan açık tutar: ${remainingAmountAfter.toFixed(
                  2,
                )} €.`,
            },
          });
        }
      }

      return tx.order.update({
        where: {
          id,
        },

        data: {
          ...(statusChanged && requestedStatus
            ? {
                status: requestedStatus,
              }
            : {}),

          ...(driverChanged
            ? {
                driverId: requestedDriverId,
                assignedAt: requestedDriverId ? new Date() : null,
              }
            : {}),

          ...(paymentChanged
            ? requestedPaymentStatus === "PAID"
              ? {
                  paymentStatus:
                    remainingAmountAfter <= 0.009 ? "PAID" : "OPEN",

                  paidAt: remainingAmountAfter <= 0.009 ? new Date() : null,

                  paymentApprovedAt: new Date(),
                  paymentApprovedById: admin.session.userId,

                  /*
                   * Mevcut şoför bildirimi onaylandı.
                   * Kalan bakiye için şoför daha sonra yeni bir bildirim yapabilir.
                   */
                  driverPaymentReportedAt: null,
                  driverPaymentReportedAmount: null,
                }
              : {
                  paymentStatus: "OPEN",
                  paidAt: null,

                  driverPaymentReportedAt: null,
                  driverPaymentReportedAmount: null,
                }
            : {}),
        },

        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              companyName: true,
              phone: true,
              customerType: true,
            },
          },

          driver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },

          items: {
            orderBy: {
              name: "asc",
            },
          },
        },
      });
    });

    return NextResponse.json({
      message:
        driverChanged && !statusChanged
          ? requestedDriverId
            ? "Lieferfahrer siparişe atandı."
            : "Lieferfahrer ataması kaldırıldı."
          : requestedStatus === "CANCELLED"
            ? "Sipariş iptal edildi ve stoklar geri eklendi."
            : wasCancelled && statusChanged
              ? "Sipariş yeniden açıldı ve stoklar tekrar düşüldü."
              : driverChanged
                ? "Sipariş ve Lieferfahrer bilgisi güncellendi."
                : requestedPaymentStatus === "PAID"
                  ? updatedOrder.paymentStatus === "PAID"
                    ? "Tahsilat onaylandı. Sipariş hesabı tamamen kapandı."
                    : "Kısmi tahsilat onaylandı. Kalan tutar açık hesapta bırakıldı."
                  : "Sipariş durumu güncellendi.",

      order: {
        ...updatedOrder,

        subtotal: Number(updatedOrder.subtotal),

        deliveryFee: Number(updatedOrder.deliveryFee),

        pfandAmount: Number(updatedOrder.pfandAmount),

        totalAmount: Number(updatedOrder.totalAmount),

        items: updatedOrder.items.map((item) => ({
          ...item,

          price: Number(item.price),

          pfand: Number(item.pfand),
        })),
      },
    });
  } catch (error) {
    console.error("UPDATE_ORDER_ERROR", error);

    const message = error instanceof Error ? error.message : "";

    if (
      message === "DRIVER_PAYMENT_NOT_REPORTED" ||
      message === "PENDING_PAYMENT_NOT_FOUND"
    ) {
      return NextResponse.json(
        {
          error:
            "Onay bekleyen bir tahsilat bildirimi bulunamadı. Şoför önce müşteriden aldığı tutarı bildirmelidir.",
        },
        {
          status: 409,
        },
      );
    }

    if (message === "INVALID_PENDING_PAYMENT_AMOUNT") {
      return NextResponse.json(
        {
          error: "Onay bekleyen tahsilat tutarı geçersiz.",
        },
        {
          status: 409,
        },
      );
    }

    if (message === "PAYMENT_EXCEEDS_OPEN_AMOUNT") {
      return NextResponse.json(
        {
          error:
            "Onaylanmak istenen tahsilat, siparişin kalan açık tutarından büyüktür.",
        },
        {
          status: 409,
        },
      );
    }

    if (message.startsWith("INSUFFICIENT_STOCK:")) {
      const productName = message.split(":")[1];

      return NextResponse.json(
        {
          error: `${productName} için yeterli stok bulunmadığından sipariş yeniden açılamadı.`,
        },
        {
          status: 409,
        },
      );
    }

    return NextResponse.json(
      {
        error: "Sipariş güncellenirken hata oluştu.",
      },
      {
        status: 500,
      },
    );
  }
});

export const DELETE = withTenant(async (
  _request: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  },
) => {
  const admin = await requireAdminPermission("deleteOrder");

  if (!admin) {
    return NextResponse.json(
      {
        error: "Sipariş silme yetkiniz yok.",
      },
      {
        status: 403,
      },
    );
  }

  const { id } = await context.params;

  try {
    const order = await prisma.order.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!order) {
      return NextResponse.json(
        {
          error: "Sipariş bulunamadı.",
        },
        {
          status: 404,
        },
      );
    }

    await prisma.order.update({
      where: {
        id,
      },

      data: {
        deletedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: "Sipariş geçmiş listeden kaldırıldı.",
    });
  } catch (error) {
    console.error("DELETE_ORDER_ERROR", error);

    return NextResponse.json(
      {
        error: "Sipariş silinemedi.",
      },
      {
        status: 500,
      },
    );
  }
});
