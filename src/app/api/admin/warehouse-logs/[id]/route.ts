import { requireAdminPermission } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { getRequestLanguage } from "@/lib/request-language";
import { withTenant } from "@/lib/tenant";
import { NextRequest, NextResponse } from "next/server";

export const DELETE = withTenant(async (
  _request: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  },
) => {
  const language = await getRequestLanguage();

  const admin = await requireAdminPermission("deleteWarehouseLog");

  if (!admin) {
    return NextResponse.json(
      {
        error:
          language === "de"
            ? "Sie sind nicht berechtigt, eigenständige Lagerprotokolle zu löschen."
            : "Bağımsız depo kaydını silme yetkiniz yok.",
      },
      {
        status: 403,
      },
    );
  }

  const { id } = await context.params;

  try {
    const existing = await prisma.warehouseLog.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Lagerprotokoll nicht gefunden."
              : "Depo kaydı bulunamadı.",
        },
        {
          status: 404,
        },
      );
    }

    await prisma.warehouseLog.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      message:
        language === "de"
          ? "Eigenständiges Lagerprotokoll wurde endgültig gelöscht."
          : "Bağımsız depo kaydı kalıcı olarak silindi.",
    });
  } catch (error) {
    console.error("DELETE_WAREHOUSE_LOG_ERROR", error);

    return NextResponse.json(
      {
        error:
          language === "de"
            ? "Lagerprotokoll konnte nicht gelöscht werden."
            : "Depo kaydı silinemedi.",
      },
      {
        status: 500,
      },
    );
  }
});
