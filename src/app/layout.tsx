import type { Metadata } from "next";
import { CartProvider } from "@/context/CartContext";
import { LanguageProvider } from "@/context/LanguageContext";
import "./globals.css";
import { cn } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { getCurrentTenant } from "@/lib/tenant";


export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getCurrentTenant();

  const companySettings = tenant
    ? await prisma.companySetting.findUnique({
        where: { tenantId: tenant.id },
        select: { companyName: true, logoUrl: true },
      })
    : null;

  const title = companySettings?.companyName || tenant?.name || "Online Shop";

  return {
    formatDetection: {
      telephone: false,
      email: false,
      address: false,
    },

    title,
    description:
      "Getränke, Verpackungen und Reinigungsprodukte bequem bestellen.",

    icons: companySettings?.logoUrl
      ? { icon: companySettings.logoUrl }
      : undefined,
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className="font-sans" data-scroll-behavior="smooth">
      <body>
        <LanguageProvider>
          <CartProvider>{children}</CartProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
