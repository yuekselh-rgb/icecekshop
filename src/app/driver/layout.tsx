import { getAdminSession } from "@/lib/admin-auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DriverLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getAdminSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== "DRIVER") {
    redirect("/");
  }

  return children;
}
