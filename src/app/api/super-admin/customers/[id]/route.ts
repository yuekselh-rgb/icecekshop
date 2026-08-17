import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/admin-auth";
import { logAuditEvent } from "@/lib/audit-log";
import { getRequestLanguage } from "@/lib/request-language";
import { withTenant } from "@/lib/tenant";
import { NextRequest, NextResponse } from "next/server";

export const DELETE = withTenant(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
  tenant,
) => {
  const language = await getRequestLanguage();

  const session = await getAdminSession();

  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json(
      {
        error:
          language === "de"
            ? "Sie sind für diesen Vorgang nicht berechtigt."
            : "Bu işlem için yetkiniz yok.",
      },
      { status: 403 },
    );
  }

  const { id } = await params;

  const customerForLog = await prisma.user.findUnique({
    where: { id },
    select: { email: true },
  });

  try {
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
      action: "customer.deleted",
      summary: `Kunde ${customerForLog?.email || id} gelöscht.`,
      entityType: "User",
      entityId: id,
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("DELETE_CUSTOMER_ERROR", error);

    return NextResponse.json(
      {
        error:
          language === "de"
            ? "Kunde konnte nicht gelöscht werden."
            : "Müşteri silinemedi.",
      },
      {
        status: 500,
      },
    );
  }
});
