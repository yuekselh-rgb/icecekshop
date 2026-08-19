import { getFullTenantCompanySettings } from "@/lib/tenant-company";
import ResetPasswordClient from "./ResetPasswordClient";

export default async function ResetPasswordPage() {
  const result = await getFullTenantCompanySettings();

  return <ResetPasswordClient initialSettings={result?.initialSettings} />;
}
