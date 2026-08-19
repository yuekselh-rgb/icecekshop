import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.0.171"],
  turbopack: {
    root: process.cwd(),
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // Customer-facing pages
      { source: "/giris", destination: "/login", permanent: true },
      { source: "/kayit", destination: "/register", permanent: true },
      { source: "/urunler", destination: "/products", permanent: true },
      { source: "/urunler/:id", destination: "/products/:id", permanent: true },
      { source: "/sepet", destination: "/cart", permanent: true },
      { source: "/siparis", destination: "/checkout", permanent: true },
      { source: "/siparislerim", destination: "/orders", permanent: true },
      { source: "/sifremi-unuttum", destination: "/forgot-password", permanent: true },
      { source: "/sifre-sifirla", destination: "/reset-password", permanent: true },
      { source: "/gizlilik", destination: "/privacy", permanent: true },
      { source: "/kullanim-sartlari", destination: "/terms", permanent: true },
      { source: "/email-dogrula", destination: "/verify-email", permanent: true },
      { source: "/sofor", destination: "/driver", permanent: true },
      { source: "/sofor/fis/:id", destination: "/driver/receipt/:id", permanent: true },
      { source: "/sofor/gun-sonu", destination: "/driver/end-of-day", permanent: true },
      { source: "/platform/giris", destination: "/platform/login", permanent: true },

      // Admin pages
      { source: "/admin/musteriler", destination: "/admin/customers", permanent: true },
      { source: "/admin/musteriler/:id", destination: "/admin/customers/:id", permanent: true },
      { source: "/admin/stok", destination: "/admin/stock", permanent: true },
      { source: "/admin/stok/mevcut/yazdir", destination: "/admin/stock/current/print", permanent: true },
      { source: "/admin/stok/yazdir/:id", destination: "/admin/stock/print/:id", permanent: true },
      { source: "/admin/urunler", destination: "/admin/products", permanent: true },
      { source: "/admin/bar-kasa", destination: "/admin/bar-cash", permanent: true },
      { source: "/admin/bar-satis-raporu", destination: "/admin/bar-sales-report", permanent: true },
      { source: "/admin/bar-satis", destination: "/admin/bar-sales", permanent: true },
      { source: "/admin/bayiler", destination: "/admin/dealers", permanent: true },
      { source: "/admin/siparisler", destination: "/admin/orders", permanent: true },
      { source: "/admin/sofor-stok", destination: "/admin/driver-stock", permanent: true },

      // Super-admin pages
      { source: "/super-admin/adminler", destination: "/super-admin/admins", permanent: true },
      { source: "/super-admin/adminler/:id/yetkiler", destination: "/super-admin/admins/:id/permissions", permanent: true },
      { source: "/super-admin/ayarlar", destination: "/super-admin/settings", permanent: true },
      { source: "/super-admin/cop-kutusu", destination: "/super-admin/trash", permanent: true },
      { source: "/super-admin/musteriler", destination: "/super-admin/customers", permanent: true },
      { source: "/super-admin/musteriler/:id", destination: "/super-admin/customers/:id", permanent: true },
      { source: "/super-admin/sifre-degistir", destination: "/super-admin/change-password", permanent: true },
      { source: "/super-admin/siparisler", destination: "/super-admin/orders", permanent: true },
      { source: "/super-admin/soforler", destination: "/super-admin/drivers", permanent: true },
      { source: "/super-admin/stok", destination: "/super-admin/stock", permanent: true },
    ];
  },
};

export default nextConfig;
