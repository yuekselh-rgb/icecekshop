import { getFullTenantCompanySettings } from "@/lib/tenant-company";
import CheckoutClient from "./CheckoutClient";

export default async function CheckoutPage() {
  const result = await getFullTenantCompanySettings();

  return <CheckoutClient initialSettings={result?.initialSettings} />;
}
