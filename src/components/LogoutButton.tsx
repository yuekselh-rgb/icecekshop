"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const variantClasses = {
  light:
    "bg-white px-4 py-2 font-semibold text-red-500 shadow hover:bg-red-50",
  dark: "bg-white/10 px-4 py-3 font-bold text-white hover:bg-white/20",
};

export default function LogoutButton({
  label,
  variant = "light",
  redirectTo = "/giris",
}: {
  label: string;
  variant?: "light" | "dark";
  redirectTo?: string;
}) {
  const router = useRouter();

  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } finally {
      router.push(redirectTo);
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loggingOut}
      className={`inline-flex items-center gap-2 rounded-xl transition disabled:opacity-50 ${variantClasses[variant]}`}
    >
      <LogOut size={18} />
      {label}
    </button>
  );
}
