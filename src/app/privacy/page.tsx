import { getFullTenantCompanySettings } from "@/lib/tenant-company";
import PrivacyClient from "./PrivacyClient";

export default async function PrivacyPolicyPage() {
  const result = await getFullTenantCompanySettings();

  return <PrivacyClient initialSettings={result?.initialSettings} />;
}
