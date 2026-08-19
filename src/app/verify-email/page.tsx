import { getFullTenantCompanySettings } from "@/lib/tenant-company";
import VerifyEmailClient from "./VerifyEmailClient";

export default async function VerifyEmailPage() {
  const result = await getFullTenantCompanySettings();

  return <VerifyEmailClient initialSettings={result?.initialSettings} />;
}
