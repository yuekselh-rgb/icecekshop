import { verifySessionToken } from "@/lib/auth";
import { getCurrentTenant } from "@/lib/tenant";
import { cookies } from "next/headers";

/**
 * Reads and verifies the session cookie, and additionally checks that the
 * session's tenant matches the tenant resolved for the current host. This
 * stops a session cookie issued on one tenant's domain from being usable on
 * another tenant's domain (e.g. a cookie set under a shared apex/CDN).
 */
export async function getSession() {
  const cookieStore = await cookies();

  const token = cookieStore.get(
    "paketmarket_session"
  )?.value;

  if (!token) {
    return null;
  }

  const session = await verifySessionToken(token);

  if (!session) {
    return null;
  }

  if (session.role === "PLATFORM_OWNER") {
    return session.tenantId === null ? session : null;
  }

  const tenant = await getCurrentTenant();

  if (!tenant || session.tenantId !== tenant.id) {
    return null;
  }

  return session;
}
