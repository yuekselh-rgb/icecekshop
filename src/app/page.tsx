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

  const initialSettings = {
    companyName: companySetting?.companyName || "Firma Adı",
    companySubtitle: companySetting?.companySubtitle ?? null,
    logoUrl: companySetting?.logoUrl ?? null,
    logoWidth: companySetting?.logoWidth ?? 260,
    logoHeight: companySetting?.logoHeight ?? 120,
    updatedAt: companySetting?.updatedAt?.toISOString(),
  };

  return (
    <main className="min-h-screen bg-[#f7f7f5]">
      <Header />
      <CategorySection initialCategories={categories} />

      <div className="mx-auto mt-3 mb-0 flex w-full max-w-7xl items-center justify-center rounded-2xl bg-white px-4 py-0 lg:px-8 lg:py-0 shadow-sm">

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
      <Footer />
    </main>
  );
}
