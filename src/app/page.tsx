import BenefitsSection from "@/components/home/BenefitsSection";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import CategorySection from "@/components/home/CategorySection";
import HeroSection from "@/components/home/HeroSection";
import CompanyBrand from "@/components/company/CompanyBrand";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { prisma } from "@/lib/prisma";
import { getPublicProducts } from "@/lib/public-products";
import { getCurrentTenant, isPlatformHost } from "@/lib/tenant";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  if (isPlatformHost((await headers()).get("host"))) {
    redirect("/platform");
  }

  const tenant = await getCurrentTenant();

  const [companySetting, categories, products] = await Promise.all([
    tenant
      ? prisma.companySetting
          .findUnique({
            where: {
              tenantId: tenant.id,
            },
          })
          .catch(() => null)
      : null,

    tenant
      ? prisma.category
          .findMany({
            where: {
              tenantId: tenant.id,
            },
            orderBy: [
              { sortOrder: "asc" },
              { type: "asc" },
              { name: "asc" },
            ],
          })
          .catch(() => [])
      : [],

    getPublicProducts().catch(() => []),
  ]);

  const initialSettings = companySetting
    ? {
        ...companySetting,
        createdAt: companySetting.createdAt.toISOString(),
        updatedAt: companySetting.updatedAt.toISOString(),
      }
    : {
        companyName: "Firma Adı",
        companySubtitle: null,
        logoUrl: null,
        logoWidth: 260,
        logoHeight: 120,
      };

  return (
    // bg: Flussgetränke Scheme 3 background (neutral-lightest #F2F2F2)
    <main className="min-h-screen bg-[#F2F2F2]">
      <Header />
      <CategorySection initialCategories={categories} />

      {/* card: Flussgetränke "default" card style — sharp corners (radiusLarge 0px),
          1px border in scheme-border color instead of a drop shadow */}
      <div className="mx-auto mt-3 mb-0 flex w-full max-w-7xl items-center justify-center rounded-none border border-[#05090a26] bg-white px-4 py-0 lg:px-8 lg:py-0">

<div className="w-full max-w-[500px] sm:max-w-[700px] md:max-w-[900px] lg:max-w-[1100px]">
  <CompanyBrand variant="header" initialSettings={initialSettings} />
</div>

      </div>

      <HeroSection />
      <FeaturedProducts
        initialProducts={products}
        initialShowOffers={companySetting?.showOffers !== false}
      />
      <BenefitsSection />
      <Footer initialSettings={initialSettings} />
    </main>
  );
}
