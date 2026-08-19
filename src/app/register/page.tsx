import { getFullTenantCompanySettings } from "@/lib/tenant-company";
import RegisterClient from "./RegisterClient";

export default async function RegisterPage() {
  const result = await getFullTenantCompanySettings();

  return <RegisterClient initialSettings={result?.initialSettings} />;
}
