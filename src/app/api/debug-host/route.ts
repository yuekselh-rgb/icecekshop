import { NextRequest, NextResponse } from "next/server";

/*
 * Temporärer Diagnose-Endpunkt, um einen PLATFORM_HOST-Konfigurationsfehler
 * einzugrenzen. Gibt keine Secrets zurück, nur den gesehenen Host-Header und
 * den aktuell gesetzten PLATFORM_HOST-Wert. Nach der Fehlersuche entfernen.
 */
export async function GET(request: NextRequest) {
  const rawHost = request.headers.get("host");
  const platformHost = process.env.PLATFORM_HOST ?? null;

  return NextResponse.json({
    rawHost,
    rawHostLength: rawHost?.length ?? null,
    platformHostEnv: platformHost,
    platformHostEnvLength: platformHost?.length ?? null,
    matches: rawHost?.split(":")[0] === platformHost,
  });
}
