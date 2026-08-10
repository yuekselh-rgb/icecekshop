import { requireAdminPermission } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { getRequestLanguage } from "@/lib/request-language";
import { withTenant } from "@/lib/tenant";
import { NextRequest, NextResponse } from "next/server";

export const PATCH = withTenant(async (
  request: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  },
  tenant,
) => {
  const language = await getRequestLanguage();

  const admin = await requireAdminPermission("managePfand");

  if (!admin) {
    return NextResponse.json(
      {
        error:
          language === "de"
            ? "Sie sind nicht berechtigt, diese Zahlung zu bestätigen."
            : "Bu ödemeyi onaylama yetkiniz yok.",
      },
      { status: 403 },
    );
  }

  const { id } = await context.params;

  try {
    const body = await request.json().catch(() => ({}));

    const action = String(body.action || "");

    if (action !== "MARK_PAID") {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Ungültige Aktion."
              : "Geçersiz işlem.",
        },
        { status: 400 },
      );
    }

    const movement = await prisma.pfandWarehouseMovement.findFirst({
      where: {
        id,
        type: "OUT",
      },
    });

    if (!movement) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Pfand-Ausgang nicht gefunden."
              : "Pfand çıkışı bulunamadı.",
        },
        { status: 404 },
      );
    }

    if (movement.paidAt) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Diese Zahlung wurde bereits in die Kasse gebucht."
              : "Bu ödeme zaten kasaya işlendi.",
        },
        { status: 409 },
      );
    }

    const amount = Number(movement.totalAmount);

    const description =
      language === "de"
        ? `Pfand-Ausgang an ${movement.partyName || "-"}${
            movement.note ? ` (${movement.note})` : ""
          }`
        : `${movement.partyName || "-"} adına Pfand çıkışı${
            movement.note ? ` (${movement.note})` : ""
          }`;

    const [updatedMovement] = await prisma.$transaction([
      prisma.pfandWarehouseMovement.update({
        where: {
          id: movement.id,
        },
        data: {
          paidAt: new Date(),
        },
      }),

      prisma.cashMovement.create({
        data: {
          tenantId: tenant.id,
          accountType: "BAR",
          direction: "IN",
          category: "PFAND_COLLECTION",
          amount,
          companyName: movement.partyName,
          description,
          createdById: admin.user.id,
        },
      }),
    ]);

    return NextResponse.json({
      message:
        language === "de"
          ? "Zahlung wurde in die Kasse gebucht."
          : "Ödeme kasaya işlendi.",

      movement: {
        ...updatedMovement,
        totalAmount: Number(updatedMovement.totalAmount),
      },
    });
  } catch (error) {
    console.error("PFAND_WAREHOUSE_MARK_PAID_ERROR", error);

    return NextResponse.json(
      {
        error:
          language === "de"
            ? "Zahlung konnte nicht in die Kasse gebucht werden."
            : "Ödeme kasaya işlenemedi.",
      },
      { status: 500 },
    );
  }
});
