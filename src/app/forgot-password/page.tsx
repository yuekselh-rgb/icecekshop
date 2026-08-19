import { getFullTenantCompanySettings } from "@/lib/tenant-company";
import ForgotPasswordClient from "./ForgotPasswordClient";

export default async function ForgotPasswordPage() {
  const result = await getFullTenantCompanySettings();

  return <ForgotPasswordClient initialSettings={result?.initialSettings} />;
}
