import { getFullTenantCompanySettings } from "@/lib/tenant-company";
import ImpressumClient from "./ImpressumClient";

export default async function ImpressumPage() {
  const result = await getFullTenantCompanySettings();

  return <ImpressumClient initialSettings={result?.initialSettings} />;
}
