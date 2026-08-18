import { headers } from "next/headers";
import type { MetadataRoute } from "next";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const host = (await headers()).get("host");

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/admin/",
        "/super-admin/",
        "/driver/",
        "/platform/",
        "/cart",
        "/checkout",
        "/orders",
      ],
    },

    sitemap: host ? `https://${host}/sitemap.xml` : undefined,
  };
}
