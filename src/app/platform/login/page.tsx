import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { isPlatformHost } from "@/lib/tenant";
import PlatformLoginForm from "./PlatformLoginForm";

export const dynamic = "force-dynamic";

export default async function PlatformLoginPage() {
  if (!isPlatformHost((await headers()).get("host"))) {
    redirect("/");
  }

  const session = await getSession();

  if (session?.role === "PLATFORM_OWNER") {
    redirect("/platform");
  }

  return <PlatformLoginForm />;
}
