import { SignJWT, jwtVerify } from "jose";

export type AuthRole =
  "CUSTOMER" | "DRIVER" | "DEALER" | "ADMIN" | "SUPER_ADMIN";

export type SessionPayload = {
  userId: string;
  email: string;
  role: AuthRole;
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
        payload.role !== "SUPER_ADMIN")
    ) {
      return null;
    }

    return {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    };
  } catch {
    return null;
  }
}
