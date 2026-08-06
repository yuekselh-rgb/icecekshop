import type { Metadata } from "next";
import { CartProvider } from "@/context/CartContext";
import { LanguageProvider } from "@/context/LanguageContext";
import "./globals.css";
import { cn } from "@/lib/utils";


export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
    formatDetection: {
      telephone: false,
      email: false,
      address: false,
    },

  title: "Online Sipariş Sistemi",
  description:
    "Getränke, Verpackungen und Reinigungsprodukte bequem bestellen.",
};

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
