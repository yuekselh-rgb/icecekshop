import type { Metadata } from "next";
import { headers } from "next/headers";
import Script from "next/script";
import CookieConsentBanner from "@/components/CookieConsentBanner";
import MetaPixel from "@/components/MetaPixel";
import TikTokPixel from "@/components/TikTokPixel";
import { CartProvider } from "@/context/CartContext";
import { LanguageProvider } from "@/context/LanguageContext";
import "./globals.css";
import { cn } from "@/lib/utils";
import { getTenantCompanySettings } from "@/lib/tenant-company";

const SCHEMA_DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];


export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export async function generateMetadata(): Promise<Metadata> {
  const host = (await headers()).get("host");
  const result = await getTenantCompanySettings();
  const settings = result?.settings;

  const companyName = settings?.companyName || result?.tenant.name || "Online Shop";

  const title = settings?.city
    ? `${companyName} – Getränke-Lieferservice in ${settings.city}`
    : companyName;

  const description = settings?.city
    ? `${companyName} – Getränke-Lieferservice in ${settings.city}. Getränke, Verpackungen und Reinigungsprodukte bequem online bestellen und liefern lassen.`
    : "Getränke, Verpackungen und Reinigungsprodukte bequem bestellen.";

  const siteUrl = host ? `https://${host}` : undefined;

  return {
    metadataBase: siteUrl ? new URL(siteUrl) : undefined,

    formatDetection: {
      telephone: false,
      email: false,
      address: false,
    },

    title,
    description,

    icons: settings?.logoUrl
      ? {
          icon: settings.logoUrl,
          apple: settings.logoUrl,
        }
      : undefined,

    manifest: "/manifest.webmanifest",

    openGraph: {
      title,
      description,
      url: siteUrl,
      siteName: companyName,
      locale: "de_DE",
      type: "website",
      images: settings?.logoUrl ? [settings.logoUrl] : undefined,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const host = (await headers()).get("host");
  const result = await getTenantCompanySettings();
  const settings = result?.settings;

  const hasAddress = Boolean(settings?.street && settings?.city);

  const localBusinessJsonLd = hasAddress
    ? {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        name: settings!.companyName,
        image: settings!.logoUrl || undefined,
        url: host ? `https://${host}` : undefined,
        telephone: settings!.phone || undefined,
        email: settings!.email || undefined,

        address: {
          "@type": "PostalAddress",
          streetAddress: [settings!.street, settings!.houseNumber]
            .filter(Boolean)
            .join(" "),
          addressLocality: settings!.city,
          postalCode: settings!.postalCode || undefined,
          addressCountry: "DE",
        },

        openingHoursSpecification:
          settings!.businessHoursEnabled && Array.isArray(settings!.businessHours)
            ? (settings!.businessHours as Array<Record<string, unknown>>)
                .filter((entry) => !entry.closed)
                .map((entry) => ({
                  "@type": "OpeningHoursSpecification",
                  dayOfWeek: SCHEMA_DAY_NAMES[Number(entry.day)],
                  opens: entry.open,
                  closes: entry.close,
                }))
            : undefined,

        sameAs:
          [
            settings!.instagram,
            settings!.facebook,
            settings!.linkedin,
            settings!.tiktok,
            settings!.twitter,
          ].filter(Boolean) || undefined,
      }
    : null;

  return (
    <html lang="de" className="font-sans" data-scroll-behavior="smooth">
      <body>
        <Script id="disable-scroll-restoration" strategy="beforeInteractive">
          {"try{if('scrollRestoration' in history){history.scrollRestoration='manual';}}catch(e){}"}
        </Script>
        {localBusinessJsonLd ? (
          <Script
            id="local-business-jsonld"
            type="application/ld+json"
            strategy="beforeInteractive"
          >
            {JSON.stringify(localBusinessJsonLd)}
          </Script>
        ) : null}
        <LanguageProvider>
          <CartProvider>{children}</CartProvider>
          <CookieConsentBanner />
          <MetaPixel pixelId={settings?.metaPixelId || null} />
          <TikTokPixel pixelId={settings?.tiktokPixelId || null} />
        </LanguageProvider>
      </body>
    </html>
  );
}
