import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function getBillingDateLabel(day: number): string {
  if (day === 1) return "1st";
  if (day === 2) return "2nd";
  if (day === 3) return "3rd";
  if (day >= 4 && day <= 20) return `${day}th`;
  if (day === 21) return "21st";
  if (day === 22) return "22nd";
  if (day === 23) return "23rd";
  return `${day}th`;
}
