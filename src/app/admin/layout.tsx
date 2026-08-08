import { getAdminWithPermissions } from "@/lib/admin-auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const admin = await getAdminWithPermissions();

  if (!admin) {
    redirect("/login");
  }

  return children;
}
