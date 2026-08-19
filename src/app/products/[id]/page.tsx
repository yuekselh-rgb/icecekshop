import { getFullTenantCompanySettings } from "@/lib/tenant-company";
import ProductDetailClient from "./ProductDetailClient";

export default async function ProductDetailPage() {
  const result = await getFullTenantCompanySettings();

  return <ProductDetailClient initialSettings={result?.initialSettings} />;
}
