import { verifySessionToken } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit-log";
import { prisma } from "@/lib/prisma";
import { getRequestLanguage } from "@/lib/request-language";
import { withTenant } from "@/lib/tenant";
import { Prisma } from "@prisma/client";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

async function getSuperAdminSession() {
  const cookieStore = await cookies();

  const token = cookieStore.get("paketmarket_session")?.value;

  if (!token) {
    return null;
  }

  const session = await verifySessionToken(token);

  if (!session || session.role !== "SUPER_ADMIN") {
    return null;
  }

  return session;
}

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export const PATCH = withTenant(async (request: NextRequest, context: RouteContext) => {
  const language = await getRequestLanguage();

  const session = await getSuperAdminSession();

  if (!session) {
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
    const { id } = await context.params;

    const body = await request.json();

    if (typeof body.isActive !== "boolean") {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Es wurde kein gültiger Kontostatus übermittelt."
              : "Geçerli hesap durumu gönderilmedi.",
        },
        {
          status: 400,
        },
      );
    }

    const existingAdmin = await prisma.user.findFirst({
      where: {
        id,
        role: "ADMIN",
      },
      select: {
        id: true,
      },
    });

    if (!existingAdmin) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Admin-Konto nicht gefunden."
              : "Admin hesabı bulunamadı.",
        },
        {
          status: 404,
        },
      );
    }

    const allPermissionsDisabled = {
      viewProducts: false,
      createProduct: false,
      updateProduct: false,
      deleteProduct: false,
      changePrice: false,

      viewCategories: false,
      createCategory: false,
      updateCategory: false,
      deleteCategory: false,

      viewStock: false,
      addStock: false,
      reduceStock: false,

      viewOrders: false,
      updateOrder: false,
      approveCustomerPayment: false,
      deleteOrder: false,
      printOrder: false,

      viewCustomers: false,
      managePfand: false,

      makeBarSale: false,
      viewBarSalesReport: false,
      viewOrderReport: false,
    };

    const admin = await prisma.$transaction(async (tx) => {
      const updatedAdmin = await tx.user.update({
        where: {
          id,
        },
        data: {
          isActive: body.isActive,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          isActive: true,
          createdAt: true,
        },
      });

      /*
       * Hesap kapatılırken bütün yetkiler sıfırlanır.
       * Hesap tekrar açıldığında yetkiler otomatik geri gelmez.
       */
      if (!body.isActive) {
        await tx.adminPermission.upsert({
          where: {
            userId: id,
          },
          update: allPermissionsDisabled,
          create: {
            userId: id,
            ...allPermissionsDisabled,
          },
        });
      }

      return updatedAdmin;
    });

    return NextResponse.json({
      message:
        language === "de"
          ? body.isActive
            ? "Admin-Konto wurde wieder aktiviert."
            : "Admin-Konto wurde deaktiviert."
          : body.isActive
            ? "Admin hesabı tekrar açıldı."
            : "Admin hesabı kapatıldı.",
      admin,
    });
  } catch (error) {
    console.error("UPDATE_ADMIN_STATUS_ERROR", error);

    return NextResponse.json(
      {
        error:
          language === "de"
            ? "Admin-Kontostatus konnte nicht geändert werden."
            : "Admin hesap durumu değiştirilemedi.",
      },
      {
        status: 500,
      },
    );
  }
});

export const DELETE = withTenant(async (_request: NextRequest, context: RouteContext, tenant) => {
  const language = await getRequestLanguage();

  const session = await getSuperAdminSession();

  if (!session) {
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
    const { id } = await context.params;

    const existingAdmin = await prisma.user.findFirst({
      where: {
        id,
        role: "ADMIN",
      },
      select: {
        id: true,
        email: true,
      },
    });

    if (!existingAdmin) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Admin-Konto nicht gefunden."
              : "Admin hesabı bulunamadı.",
        },
        {
          status: 404,
        },
      );
    }

    await prisma.user.delete({
      where: {
        id,
      },
    });

    await logAuditEvent({
      tenantId: tenant.id,
      actorUserId: session.userId,
      actorEmail: session.email,
      actorRole: session.role,
      action: "admin.deleted",
      summary: `Admin ${existingAdmin.email} gelöscht.`,
      entityType: "User",
      entityId: id,
    });

    return NextResponse.json({
      message:
        language === "de"
          ? "Admin-Konto wurde endgültig gelöscht."
          : "Admin hesabı kalıcı olarak silindi.",
    });
  } catch (error) {
    console.error("DELETE_ADMIN_ERROR", error);

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      return NextResponse.json(
        {
          error:
            language === "de"
              ? "Dieser Admin wird noch in anderen Datensätzen verwendet und kann nicht endgültig gelöscht werden. Deaktivieren Sie das Konto stattdessen."
              : "Bu admin başka kayıtlarda kullanıldığı için kalıcı olarak silinemiyor. Bunun yerine hesabı kapatın.",
        },
        {
          status: 409,
        },
      );
    }

    return NextResponse.json(
      {
        error:
          language === "de"
            ? "Admin-Konto konnte nicht gelöscht werden."
            : "Admin hesabı silinemedi.",
      },
      {
        status: 500,
      },
    );
  }
});
