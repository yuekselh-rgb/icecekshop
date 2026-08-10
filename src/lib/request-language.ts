import { cookies } from "next/headers";

export type RequestLanguage = "de" | "tr";

export async function getRequestLanguage(): Promise<RequestLanguage> {
  const cookieStore = await cookies();
  const value = cookieStore.get("paketmarket_language")?.value;

  return value === "tr" ? "tr" : "de";
}
