import { SignJWT, jwtVerify } from "jose";

export type AuthRole =
  | "CUSTOMER"
  | "DRIVER"
  | "DEALER"
  | "ADMIN"
  | "SUPER_ADMIN"
  | "PLATFORM_OWNER";

export type SessionPayload = {
  userId: string;
  email: string;
  role: AuthRole;
  tenantId: string | null;

  /*
   * Gesetzt, wenn diese Session über die Platform-Owner-Zugangsfunktion
   * erstellt wurde (Login als Tenant-Super-Admin) — enthält die
   * E-Mail-Adresse des Platform Owners, der den Zugriff ausgelöst hat.
   */
  impersonatedByEmail?: string;
};

function getSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET environment variable is missing");
  }

  return new TextEncoder().encode(secret);
}

export async function createSessionToken(payload: SessionPayload) {
  return new SignJWT({
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
    tenantId: payload.tenantId,
    impersonatedByEmail: payload.impersonatedByEmail,
  })
    .setProtectedHeader({
      alg: "HS256",
    })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifySessionToken(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());

    if (
      typeof payload.userId !== "string" ||
      typeof payload.email !== "string" ||
      (payload.role !== "CUSTOMER" &&
        payload.role !== "DRIVER" &&
        payload.role !== "DEALER" &&
        payload.role !== "ADMIN" &&
        payload.role !== "SUPER_ADMIN" &&
        payload.role !== "PLATFORM_OWNER") ||
      (payload.tenantId !== null && typeof payload.tenantId !== "string") ||
      (payload.impersonatedByEmail !== undefined &&
        typeof payload.impersonatedByEmail !== "string")
    ) {
      return null;
    }

    return {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      tenantId: payload.tenantId ?? null,
      impersonatedByEmail:
        typeof payload.impersonatedByEmail === "string"
          ? payload.impersonatedByEmail
          : undefined,
    };
  } catch {
    return null;
  }
}
