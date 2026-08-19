import { getFullTenantCompanySettings } from "@/lib/tenant-company";
import PfandClient from "./PfandClient";

export default async function PfandPage() {
  const result = await getFullTenantCompanySettings();

  return <PfandClient initialSettings={result?.initialSettings} />;
}
