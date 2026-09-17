import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatUSD(amount: number | string): string {
  const val = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val || 0);
}

export function formatKHR(amount: number | string): string {
  const val = typeof amount === "string" ? parseFloat(amount) : amount;
  const rounded = Math.round(val || 0);
  return new Intl.NumberFormat("km-KH", {
    style: "decimal",
  }).format(rounded) + " ៛";
}

export function generateOrderNumber(): string {
  const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, "");
  const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `AD-${dateStr}-${randomSuffix}`;
}
