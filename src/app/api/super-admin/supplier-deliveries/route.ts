import { getAdminWithPermissions } from "@/lib/admin-auth";
import { logAuditEvent } from "@/lib/audit-log";
import { prisma } from "@/lib/prisma";
import { getRequestLanguage } from "@/lib/request-language";
import { withTenant } from "@/lib/tenant";
import { NextRequest, NextResponse } from "next/server";

async function requireSuperAdmin() {
  const admin = await getAdminWithPermissions();

  if (!admin || !admin.isSuperAdmin) {
    return null;
  }

  return admin;
}

export const GET = withTenant(async (_request: NextRequest, _context, tenant) => {
  const language = await getRequestLanguage();

  const admin = await requireSuperAdmin();

  if (!admin) {
    return NextResponse.json(
      {
        error: language === "de" ? "Unbefugter Zugriff." : "Yetkisiz erişim.",
      },
      {
        status: 403,
      },
    );
  }

  const deliveries = await prisma.supplierDelivery.findMany({
    where: {
      tenantId: tenant.id,
    },
    include: {
      supplier: {
        select: {
          id: true,
          name: true,
        },
      },
      items: true,
      payments: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
    orderBy: {
      deliveredAt: "desc",
    },
  });

  return NextResponse.json({
    deliveries: deliveries.map((delivery) => ({
      id: delivery.id,
      deliveredAt: delivery.deliveredAt,
      totalAmount: Number(delivery.totalAmount),
      paidAmount: Number(delivery.paidAmount),
      note: delivery.note,
      documentUrls: delivery.documentUrls,
      createdAt: delivery.createdAt,
      supplier: delivery.supplier,
      items: delivery.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        quantity: Number(item.quantity),
        unit: item.unit,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
      })),
      payments: delivery.payments.map((payment) => ({
        id: payment.id,
        amount: Number(payment.amount),
        note: payment.note,
        createdAt: payment.createdAt,
      })),
    })),
  });
});

export const POST = withTenant(async (request: NextRequest, _context, tenant) => {
  const language = await getRequestLanguage();

  const admin = await requireSuperAdmin();

  if (!admin) {
    return NextResponse.json(
      {
        error: language === "de" ? "Unbefugter Zugriff." : "Yetkisiz erişim.",
      },
      {
        status: 403,
      },
    );
  }

  try {
    const body = await request.json();

    const supplierId = String(body.supplierId || "").trim();

    if (!supplierId) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Bitte wählen Sie einen Lieferanten aus."
              : "Lütfen bir toptancı seçin.",
        },
        {
          status: 400,
        },
      );
    }

    const supplier = await prisma.supplier.findFirst({
      where: {
        id: supplierId,
      },
    });

    if (!supplier) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Lieferant nicht gefunden."
              : "Toptancı bulunamadı.",
        },
        {
          status: 404,
        },
      );
    }

    const rawItems = Array.isArray(body.items) ? body.items : [];

    const items = rawItems
      .map((rawItem: unknown) => {
        const item = rawItem as Record<string, unknown>;

        const productName = String(item?.productName || "").trim();
        const quantity = Number(item?.quantity);
        const unit = String(item?.unit || "").trim();
        const unitPrice = Number(item?.unitPrice);
        const productId = String(item?.productId || "").trim() || null;

        return {
          productName,
          quantity,
          unit: unit || null,
          unitPrice,
          productId,
        };
      })
      .filter(
        (item: {
          productName: string;
          quantity: number;
          unitPrice: number;
          productId: string | null;
        }) =>
          item.productName &&
          Number.isFinite(item.quantity) &&
          item.quantity > 0 &&
          Number.isFinite(item.unitPrice) &&
          item.unitPrice >= 0,
      );

    if (items.length === 0) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Bitte erfassen Sie mindestens eine Ware mit Menge und Preis."
              : "Lütfen en az bir ürün, miktar ve fiyat girin.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * Verknüpfte Produkte gehören per Definition zum aktuellen Tenant —
     * prisma.product ist in TENANT_SCOPED_MODELS, ein findMany hier findet
     * daher nie ein Produkt aus einem anderen Tenant, egal welche ID der
     * Client schickt.
     */
    const linkedProductIds: string[] = Array.from(
      new Set(
        items
          .map((item: { productId: string | null }) => item.productId)
          .filter((id: string | null): id is string => Boolean(id)),
      ),
    );

    if (linkedProductIds.length > 0) {
      const linkedProducts = await prisma.product.findMany({
        where: {
          id: { in: linkedProductIds },
        },
        select: {
          id: true,
        },
      });

      const foundIds = new Set(linkedProducts.map((product) => product.id));

      for (const item of items as {
        productId: string | null;
        quantity: number;
      }[]) {
        if (item.productId && !foundIds.has(item.productId)) {
          return NextResponse.json(
            {
              error:
                language === "de"
                  ? "Ein verknüpftes Produkt wurde nicht gefunden."
                  : "Bağlantılı bir ürün bulunamadı.",
            },
            {
              status: 404,
            },
          );
        }

        if (item.productId && !Number.isInteger(item.quantity)) {
          return NextResponse.json(
            {
              error:
                language === "de"
                  ? "Bei einer Produktverknüpfung muss die Menge eine ganze Zahl sein."
                  : "Ürün bağlantısı olan satırlarda miktar tam sayı olmalıdır.",
            },
            {
              status: 400,
            },
          );
        }
      }
    }

    const documentUrls = Array.isArray(body.documentUrls)
      ? body.documentUrls
          .map((url: unknown) => String(url || "").trim())
          .filter((url: string) => url.startsWith("https://"))
      : [];

    const note = String(body.note || "").trim() || null;

    const deliveredAtRaw = body.deliveredAt
      ? new Date(String(body.deliveredAt))
      : new Date();

    const deliveredAt = Number.isNaN(deliveredAtRaw.getTime())
      ? new Date()
      : deliveredAtRaw;

    const totalAmount = items.reduce(
      (sum: number, item: { quantity: number; unitPrice: number }) =>
        sum + item.quantity * item.unitPrice,
      0,
    );

    const initialPaidAmount = Math.max(
      0,
      Math.min(Number(body.initialPaidAmount) || 0, totalAmount),
    );

    const delivery = await prisma.$transaction(async (tx) => {
      const created = await tx.supplierDelivery.create({
        data: {
          tenantId: tenant.id,
          supplierId: supplier.id,
          deliveredAt,
          totalAmount: Number(totalAmount.toFixed(2)),
          paidAmount: 0,
          note,
          documentUrls,
          createdById: admin.session.userId,
          items: {
            create: items.map(
              (item: {
                productName: string;
                quantity: number;
                unit: string | null;
                unitPrice: number;
                productId: string | null;
              }) => ({
                productId: item.productId,
                productName: item.productName,
                quantity: item.quantity,
                unit: item.unit,
                unitPrice: Number(item.unitPrice.toFixed(2)),
                totalPrice: Number(
                  (item.quantity * item.unitPrice).toFixed(2),
                ),
              }),
            ),
          },
        },
      });

      /*
       * Verknüpfte Zeilen erhöhen den Lagerbestand automatisch — Menge
       * wurde oben bereits als Ganzzahl validiert, wenn productId gesetzt
       * ist. Nur Bestand + letzter Einkaufspreis werden aktualisiert
       * (nicht Verkaufspreis/Pfand — das bleibt eine bewusste Admin-
       * Entscheidung, nicht automatisch aus einer Lieferung ableitbar).
       */
      for (const item of items as {
        productId: string | null;
        quantity: number;
        unitPrice: number;
      }[]) {
        if (!item.productId) {
          continue;
        }

        const stockAmount = Math.round(item.quantity);

        await tx.product.update({
          where: {
            id: item.productId,
          },
          data: {
            stock: {
              increment: stockAmount,
            },
            purchasePrice: Number(item.unitPrice.toFixed(2)),
          },
        });

        await tx.stockMovement.create({
          data: {
            tenantId: tenant.id,
            productId: item.productId,
            amount: stockAmount,
            reason:
              (language === "de"
                ? `Lieferung von ${supplier.name}`
                : `${supplier.name} teslimatı`) +
              ` · ${stockAmount} × ${item.unitPrice.toFixed(2)} € · ` +
              `Lieferung: ${created.id}`,
          },
        });
      }

      if (initialPaidAmount > 0) {
        await tx.supplierDeliveryPayment.create({
          data: {
            deliveryId: created.id,
            amount: Number(initialPaidAmount.toFixed(2)),
            createdById: admin.session.userId,
          },
        });

        return tx.supplierDelivery.update({
          where: {
            id: created.id,
          },
          data: {
            paidAmount: Number(initialPaidAmount.toFixed(2)),
          },
          include: {
            supplier: {
              select: {
                id: true,
                name: true,
              },
            },
            items: true,
            payments: true,
          },
        });
      }

      return tx.supplierDelivery.findUniqueOrThrow({
        where: {
          id: created.id,
        },
        include: {
          supplier: {
            select: {
              id: true,
              name: true,
            },
          },
          items: true,
          payments: true,
        },
      });
    });

    await logAuditEvent({
      tenantId: tenant.id,
      actorUserId: admin.session.userId,
      actorEmail: admin.session.email,
      actorRole: admin.session.role,
      action: "supplier_delivery.created",
      summary:
        `Lieferung von "${supplier.name}" erfasst: ` +
        `${totalAmount.toFixed(2)} € (${items.length} Position${items.length === 1 ? "" : "en"}).`,
      entityType: "SupplierDelivery",
      entityId: delivery.id,
      metadata: {
        supplierName: supplier.name,
        totalAmount,
        initialPaidAmount,
      },
    });

    return NextResponse.json(
      {
        message:
          language === "de"
            ? "Lieferung erfasst."
            : "Teslimat kaydedildi.",

        delivery: {
          id: delivery.id,
          deliveredAt: delivery.deliveredAt,
          totalAmount: Number(delivery.totalAmount),
          paidAmount: Number(delivery.paidAmount),
          note: delivery.note,
          documentUrls: delivery.documentUrls,
          supplier: delivery.supplier,
        },
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("CREATE_SUPPLIER_DELIVERY_ERROR", error);

    return NextResponse.json(
      {
        error:
          language === "de"
            ? "Lieferung konnte nicht gespeichert werden."
            : "Teslimat kaydedilemedi.",
      },
      {
        status: 500,
      },
    );
  }
});
