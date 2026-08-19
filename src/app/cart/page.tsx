import { getFullTenantCompanySettings } from "@/lib/tenant-company";
import CartClient from "./CartClient";

export default async function CartPage() {
  const result = await getFullTenantCompanySettings();

  return <CartClient initialSettings={result?.initialSettings} />;
}
