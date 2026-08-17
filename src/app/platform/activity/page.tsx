import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { isPlatformHost } from "@/lib/tenant";
import ActivityDashboard from "./ActivityDashboard";

export const dynamic = "force-dynamic";

export default async function PlatformActivityPage() {
  if (!isPlatformHost((await headers()).get("host"))) {
    redirect("/");
  }

  const session = await getSession();

  if (!session) {
    redirect("/platform/login");
  }

  if (session.role !== "PLATFORM_OWNER") {
    redirect("/");
  }

  return <ActivityDashboard />;
}
