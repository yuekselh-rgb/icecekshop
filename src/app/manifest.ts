import { prisma } from "@/lib/prisma";
import { getCurrentTenant } from "@/lib/tenant";
import type { MetadataRoute } from "next";

function guessMimeType(url: string) {
  const extension = url.split(".").pop()?.toLowerCase().split("?")[0];

  switch (extension) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "webp":
      return "image/webp";
    case "svg":
      return "image/svg+xml";
    default:
      return "image/png";
  }
}

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const tenant = await getCurrentTenant();

  const companySettings = tenant
    ? await prisma.companySetting.findUnique({
        where: { tenantId: tenant.id },
        select: { companyName: true, logoUrl: true },
      })
    : null;

  const name = companySettings?.companyName || tenant?.name || "Online Shop";

  const icons = companySettings?.logoUrl
    ? [
        {
          src: companySettings.logoUrl,
          sizes: "192x192",
          type: guessMimeType(companySettings.logoUrl),
        },
        {
          src: companySettings.logoUrl,
          sizes: "512x512",
          type: guessMimeType(companySettings.logoUrl),
        },
      ]
    : [];

  return {
    name,
    short_name: name,
    icons,
    start_url: "/",
    display: "standalone",
    background_color: "#f7f7f5",
    theme_color: "#f7f7f5",
  };
}
