import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get("address") || "";
  const userAgent = request.headers.get("user-agent") || "";

  const isApple = /iPhone|iPad|iPod|Macintosh/i.test(userAgent);

  const destination = isApple
    ? `https://maps.apple.com/?q=${encodeURIComponent(address)}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

  return NextResponse.redirect(destination);
}
