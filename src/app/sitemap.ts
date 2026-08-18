import { headers } from "next/headers";
import type { MetadataRoute } from "next";

const STATIC_ROUTES = [
  { path: "", priority: 1, changeFrequency: "daily" as const },
  { path: "/products", priority: 0.9, changeFrequency: "daily" as const },
  { path: "/pfand", priority: 0.6, changeFrequency: "monthly" as const },
  { path: "/register", priority: 0.5, changeFrequency: "monthly" as const },
  { path: "/impressum", priority: 0.3, changeFrequency: "yearly" as const },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" as const },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" as const },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const host = (await headers()).get("host");

  if (!host) {
    return [];
  }

  const baseUrl = `https://${host}`;

  return STATIC_ROUTES.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
