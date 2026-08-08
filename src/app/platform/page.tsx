import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { isPlatformHost } from "@/lib/tenant";
import PlatformDashboard from "./PlatformDashboard";

export const dynamic = "force-dynamic";

export default async function PlatformDashboardPage() {
  if (!isPlatformHost((await headers()).get("host"))) {
    redirect("/");
  }

  const session = await getSession();

  if (!session) {
    redirect("/platform/giris");
  }

  if (session.role !== "PLATFORM_OWNER") {
    redirect("/");
  }

  return <PlatformDashboard />;
}
