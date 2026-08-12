import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isPlaceholderEmail(email: string | null | undefined) {
  return Boolean(email && email.endsWith("@paketmarket.local"))
}
