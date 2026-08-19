import { getFullTenantCompanySettings } from "@/lib/tenant-company";
import LoginClient from "./LoginClient";

export default async function LoginPage() {
  const result = await getFullTenantCompanySettings();

  return <LoginClient initialSettings={result?.initialSettings} />;
}
