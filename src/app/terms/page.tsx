import { getFullTenantCompanySettings } from "@/lib/tenant-company";
import TermsClient from "./TermsClient";

export default async function TermsOfUsePage() {
  const result = await getFullTenantCompanySettings();

  return <TermsClient initialSettings={result?.initialSettings} />;
}
