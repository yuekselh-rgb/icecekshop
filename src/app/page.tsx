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
import { getCachedHomePageData } from "@/lib/home-page-cache";
import { getCurrentTenant, isPlatformHost } from "@/lib/tenant";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

export default async function HomePage() {
  if (isPlatformHost((await headers()).get("host"))) {
    redirect("/platform");
  }

  const tenant = await getCurrentTenant();

  const { companySetting, categories, products } = tenant
    ? await getCachedHomePageData(tenant.id)
    : { companySetting: null, categories: [], products: [] };

  const initialSettings = companySetting
    ? companySetting
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
      <Header initialSettings={initialSettings} />
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
