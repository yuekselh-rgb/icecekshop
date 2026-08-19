import { getFullTenantCompanySettings } from "@/lib/tenant-company";
import MyOrdersClient from "./MyOrdersClient";

export default async function MyOrdersPage() {
  const result = await getFullTenantCompanySettings();

  return <MyOrdersClient initialSettings={result?.initialSettings} />;
}
