import { createSessionToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withTenant } from "@/lib/tenant";
import { NextRequest, NextResponse } from "next/server";

/*
 * Wird auf der Domain des jeweiligen Tenants aufgerufen (nicht auf dem
 * Platform-Host), damit das Session-Cookie für die richtige Host-Domain
 * gesetzt werden kann. Das Ticket wurde zuvor über
 * /api/platform/tenants/[id]/impersonate erstellt und ist nur einmal
 * und nur kurz gültig.
 */
export const GET = withTenant(async (request: NextRequest, _context, tenant) => {
  const loginUrl = new URL("/login", request.url);

  const token = request.nextUrl.searchParams.get("ticket");

  if (!token) {
    return NextResponse.redirect(loginUrl);
  }

  try {
    const ticket = await prisma.$transaction(async (tx) => {
      const found = await tx.impersonationTicket.findUnique({
        where: { token },
      });

      if (
        !found ||
        found.usedAt ||
        found.expiresAt < new Date() ||
        found.tenantId !== tenant.id
      ) {
        return null;
      }

      /*
       * Bedingtes Update (usedAt: null in der WHERE-Klausel) statt
       * eines unbedingten Updates, damit bei zwei gleichzeitigen
       * Einlöseversuchen mit demselben Ticket garantiert nur einer
       * erfolgreich ist — sonst könnten beide die vorherige
       * findUnique-Prüfung noch vor dem jeweils anderen Update
       * passieren (Race Condition).
       */
      const claimed = await tx.impersonationTicket.updateMany({
        where: { id: found.id, usedAt: null },
        data: { usedAt: new Date() },
      });

      if (claimed.count === 0) {
        return null;
      }

      return found;
    });

    if (!ticket) {
      return NextResponse.redirect(loginUrl);
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: ticket.targetUserId },
    });

    if (
      !targetUser ||
      !targetUser.isActive ||
      targetUser.tenantId !== tenant.id ||
      targetUser.role !== "SUPER_ADMIN"
    ) {
      return NextResponse.redirect(loginUrl);
    }

    const sessionToken = await createSessionToken({
      userId: targetUser.id,
      email: targetUser.email,
      role: "SUPER_ADMIN",
      tenantId: tenant.id,
      impersonatedByEmail: ticket.platformOwnerEmail,
    });

    const response = NextResponse.redirect(
      new URL("/super-admin", request.url),
    );

    response.cookies.set("paketmarket_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error("CONSUME_IMPERSONATION_TICKET_ERROR", error);

    return NextResponse.redirect(loginUrl);
  }
});
