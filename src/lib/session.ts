import { verifySessionToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function getSession() {
  const cookieStore = await cookies();

  const token = cookieStore.get(
    "paketmarket_session"
  )?.value;

  if (!token) {
    return null;
  }

  return verifySessionToken(token);
}
