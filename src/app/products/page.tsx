import { getFullTenantCompanySettings } from "@/lib/tenant-company";
import ProductsClient from "./ProductsClient";

export default async function ProductsPage() {
  const result = await getFullTenantCompanySettings();

  return <ProductsClient initialSettings={result?.initialSettings} />;
}
