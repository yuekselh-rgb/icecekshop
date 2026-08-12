import BenefitsSection from "@/components/home/BenefitsSection";
import PfandSection from "@/components/home/PfandSection";
import GastroSection from "@/components/home/GastroSection";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import CtaSection from "@/components/home/CtaSection";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import CategorySection from "@/components/home/CategorySection";
import HeroSection from "@/components/home/HeroSection";
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

  // Angepasste Reihenfolge (Kundenwunsch): Header, Hero, Kategorien,
  // Produkte, Vorteile, Pfand, Gastro, Testimonial, CTA, Footer.
  return (
    <main className="min-h-screen bg-[#F2F2F2]">
      <Header />
      <HeroSection />
      <CategorySection initialCategories={categories} />

      <FeaturedProducts
        initialProducts={products}
        initialShowOffers={companySetting?.showOffers !== false}
      />
      <BenefitsSection />
      <PfandSection />
      <GastroSection />
      <TestimonialsSection />
      <CtaSection />
      <Footer initialSettings={initialSettings} />
    </main>
  );
}
