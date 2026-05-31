import type { AppLocale } from "@/lib/config/env";

/** Format minor-unit money for display per locale (single store currency). */
export function formatMoney(minor: number, locale: AppLocale, currency = "USD"): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US", {
    style: "currency",
    currency,
  }).format(minor / 100);
}
