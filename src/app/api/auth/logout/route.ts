import { getRequestLanguage } from "@/lib/request-language";
import { NextResponse } from "next/server";

export async function POST() {
  const language = await getRequestLanguage();

  const response =
    NextResponse.json({
      message:
        language === "de" ? "Abgemeldet." : "Çıkış yapıldı.",
    });

  response.cookies.set(
    "paketmarket_session",
    "",
    {
      httpOnly: true,
      expires: new Date(0),
      path: "/",
    }
  );

  return response;
}
