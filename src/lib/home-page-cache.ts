import { prisma } from "@/lib/prisma";
import { queryPublicProductsForTenant } from "@/lib/public-products";
import { unstable_cache } from "next/cache";

/*
 * Die Startseite wird pro Tenant über den Host-Header aufgelöst und
 * bleibt deshalb zwangsläufig eine dynamische Route (kein HTTP-Caching
 * über Vercel/CDN möglich, ohne das Risiko, die Seite eines Tenants an
 * die Domain eines anderen auszuliefern). Diese drei Datenbankabfragen
 * sind aber reine Lesezugriffe und ändern sich selten — sie werden hier
 * für 30 Sekunden pro tenantId im Next.js Data Cache gehalten, sodass
 * mehrere Aufrufe der Startseite im selben Zeitfenster nicht jedes Mal
 * erneut gegen die Datenbank laufen. Alle Felder werden bewusst zu
 * einfachen, serialisierbaren Werten (Strings statt Date-Objekten)
 * normalisiert, bevor sie zurückgegeben werden.
 */
export const getCachedHomePageData = unstable_cache(
  async (tenantId: string) => {
    const [companySetting, categories, products] = await Promise.all([
      prisma.companySetting
        .findUnique({ where: { tenantId } })
        .catch(() => null),

      prisma.category
        .findMany({
          where: { tenantId },
          select: {
            id: true,
            slug: true,
            name: true,
            nameTr: true,
            nameDe: true,
            type: true,
          },
          orderBy: [
            { sortOrder: "asc" },
            { type: "asc" },
            { name: "asc" },
          ],
        })
        .catch(() => []),

      queryPublicProductsForTenant(tenantId).catch(() => []),
    ]);

    return {
      companySetting: companySetting
        ? {
            ...companySetting,
            createdAt: companySetting.createdAt.toISOString(),
            updatedAt: companySetting.updatedAt.toISOString(),
          }
        : null,
      categories,
      products,
    };
  },
  ["home-page-data"],
  { revalidate: 30 },
);
