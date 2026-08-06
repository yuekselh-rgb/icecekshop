import { NextResponse } from "next/server";

export async function POST() {
  const response =
    NextResponse.json({
      message:
        "Çıkış yapıldı.",
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
