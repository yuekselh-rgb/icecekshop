import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import { NextResponse } from "next/server";

async function requirePlatformOwner() {
  const session = await getSession();

  if (!session || session.role !== "PLATFORM_OWNER") {
    return null;
  }

  return session;
}

const TICKET_TTL_MS = 60 * 1000;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requirePlatformOwner();

  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 403 });
  }

  try {
    const { id: tenantId } = await params;

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      return NextResponse.json(
        { error: "Tenant nicht gefunden." },
        { status: 404 },
      );
    }

    if (!tenant.active) {
      return NextResponse.json(
        { error: "Dieser Tenant ist deaktiviert." },
        { status: 400 },
      );
    }

    const targetUser = await prisma.user.findFirst({
      where: {
        tenantId,
        role: "SUPER_ADMIN",
        isActive: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        {
          error:
            "Für diesen Tenant wurde kein aktiver Super-Admin gefunden.",
        },
        { status: 400 },
      );
    }

    const domain =
      (await prisma.tenantDomain.findFirst({
        where: { tenantId, isPrimary: true },
      })) ||
      (await prisma.tenantDomain.findFirst({
        where: { tenantId },
        orderBy: { createdAt: "asc" },
      }));

    if (!domain) {
      return NextResponse.json(
        { error: "Für diesen Tenant ist keine Domain hinterlegt." },
        { status: 500 },
      );
    }

    const token = randomBytes(32).toString("hex");

    await prisma.impersonationTicket.create({
      data: {
        token,
        tenantId,
        targetUserId: targetUser.id,
        platformOwnerId: session.userId,
        platformOwnerEmail: session.email,
        expiresAt: new Date(Date.now() + TICKET_TTL_MS),
      },
    });

    const protocol =
      process.env.NODE_ENV === "production" ? "https" : "http";

    const redirectUrl = `${protocol}://${domain.domain}/api/impersonate/consume?ticket=${token}`;

    return NextResponse.json({ redirectUrl });
  } catch (error) {
    console.error("CREATE_IMPERSONATION_TICKET_ERROR", error);

    return NextResponse.json(
      { error: "Zugriff konnte nicht vorbereitet werden." },
      { status: 500 },
    );
  }
}
