import { requireAdminPermission } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { getRequestLanguage } from "@/lib/request-language";
import { withTenant } from "@/lib/tenant";
import { NextRequest, NextResponse } from "next/server";

const allowedPartyTypes = [
  "CUSTOMER",
  "SUPPLIER",
  "WHOLESALER",
  "METRO",
  "TRINKGUT",
  "OTHER_COMPANY",
  "OWN_BRANCH",
  "OTHER",
] as const;

export const POST = withTenant(async (request: NextRequest, _context, tenant) => {
  const language = await getRequestLanguage();

  const admin = await requireAdminPermission("managePfand");

  if (!admin) {
    return NextResponse.json(
      {
        error:
          language === "de"
            ? "Sie sind nicht berechtigt, einen Pfand-Ausgang zu erfassen."
            : "Pfand çıkışı kaydetme yetkiniz yok.",
      },
      { status: 403 },
    );
  }

  try {
    const body = await request.json();

    const partyType = allowedPartyTypes.includes(body.partyType)
      ? body.partyType
      : null;

    if (!partyType) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Geben Sie an, wer das Pfand mitgenommen hat."
              : "Pfandı kimin götürdüğünü belirtin.",
        },
        { status: 400 },
      );
    }

    const partyName = String(body.partyName || "").trim();

    if (!partyName) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Der Name der Person/Firma ist erforderlich."
              : "Kişi/firma adı zorunludur.",
        },
        { status: 400 },
      );
    }

    const note = body.note ? String(body.note).trim() : null;

    const rawItems = Array.isArray(body.items) ? body.items : [];

    const items = rawItems
      .map((item: { name?: unknown; quantity?: unknown; unitAmount?: unknown }) => ({
        name: String(item.name || "").trim(),
        quantity: Math.round(Number(item.quantity)),
        unitAmount: Number(item.unitAmount),
      }))
      .filter(
        (item: { name: string; quantity: number; unitAmount: number }) =>
          item.name &&
          Number.isFinite(item.quantity) &&
          item.quantity > 0 &&
          Number.isFinite(item.unitAmount) &&
          item.unitAmount >= 0,
      );

    if (items.length === 0) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Sie müssen mindestens eine Pfand-Position mit Menge angeben."
              : "En az bir Pfand kalemi ve miktarı girmelisiniz.",
        },
        { status: 400 },
      );
    }

    const preparedItems = items.map(
      (item: { name: string; quantity: number; unitAmount: number }) => ({
        name: item.name,
        quantity: item.quantity,
        unitAmount: item.unitAmount,
        totalAmount: Number((item.quantity * item.unitAmount).toFixed(2)),
      }),
    );

    const totalAmount = Number(
      preparedItems
        .reduce(
          (total: number, item: { totalAmount: number }) => total + item.totalAmount,
          0,
        )
        .toFixed(2),
    );

    const movement = await prisma.pfandWarehouseMovement.create({
      data: {
        tenantId: tenant.id,
        type: "OUT",
        partyType,
        partyName,
        note,
        totalAmount,
        createdById: admin.user.id,

        items: {
          create: preparedItems,
        },
      },

      include: {
        items: true,
      },
    });

    return NextResponse.json(
      {
        message:
          language === "de"
            ? "Pfand-Ausgang wurde erfasst."
            : "Pfand çıkışı kaydedildi.",

        movement: {
          ...movement,
          totalAmount: Number(movement.totalAmount),
          items: movement.items.map((item) => ({
            ...item,
            unitAmount: Number(item.unitAmount),
            totalAmount: Number(item.totalAmount),
          })),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("CREATE_PFAND_WAREHOUSE_OUT_ERROR", error);

    return NextResponse.json(
      {
        error:
          language === "de"
            ? "Pfand-Ausgang konnte nicht gespeichert werden."
            : "Pfand çıkışı kaydedilemedi.",
      },
      { status: 500 },
    );
  }
});
