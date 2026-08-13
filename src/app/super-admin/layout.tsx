import { getAdminSession } from "@/lib/admin-auth";
import { redirect } from "next/navigation";

import SuperAdminSidebar from "./_components/SuperAdminSidebar";

export const dynamic = "force-dynamic";

export default async function SuperAdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getAdminSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== "SUPER_ADMIN") {
    redirect("/");
  }

  return <SuperAdminSidebar>{children}</SuperAdminSidebar>;
}
