import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { getCurrentTenant } from "@/lib/tenant";

/**
 * Fields needed by root metadata, structured data, and the Meta Pixel —
 * fetched once per request (React `cache`) instead of once per consumer.
 */
export const getTenantCompanySettings = cache(async () => {
  const tenant = await getCurrentTenant();

  if (!tenant) {
    return null;
  }

  const settings = await prisma.companySetting.findUnique({
    where: { tenantId: tenant.id },
    select: {
      companyName: true,
      companyDescription: true,
      logoUrl: true,
      metaPixelId: true,
      tiktokPixelId: true,
      street: true,
      houseNumber: true,
      postalCode: true,
      city: true,
      country: true,
      phone: true,
      email: true,
      website: true,
      instagram: true,
      facebook: true,
      linkedin: true,
      tiktok: true,
      twitter: true,
      businessHoursEnabled: true,
      businessHours: true,
    },
  });

  return { tenant, settings };
});
