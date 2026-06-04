import type { AppLocale } from "@/lib/config/env";

/** Active currency for display: code drives Intl formatting, rate converts from base. */
export type DisplayCurrency = { code: string; symbol?: string; rate: number };

/**
 * Format minor-unit money for display per locale and active currency (feature 005).
 * `minor` is in the BASE currency; when a `DisplayCurrency` is supplied its `rate`
 * converts the amount and its `code` selects the symbol/formatting (FR-021). A bare
 * string currency code is still accepted for backwards compatibility (rate = 1).
 */
export function formatMoney(
  minor: number,
  locale: AppLocale,
  currency: string | DisplayCurrency = "USD",
): string {
  const cfg: DisplayCurrency = typeof currency === "string" ? { code: currency, rate: 1 } : currency;
  const amount = Math.round(minor * cfg.rate) / 100;
  const intlLocale = locale === "ar" ? "ar-EG" : "en-US";
  // ISO 4217 codes are 3 letters; anything else makes Intl throw a RangeError.
  const code = (cfg.code ?? "").replace(/[^A-Za-z]/g, "").toUpperCase();
  if (/^[A-Z]{3}$/.test(code)) {
    try {
      return new Intl.NumberFormat(intlLocale, { style: "currency", currency: code }).format(amount);
    } catch {
      // fall through to the symbol/plain fallback below
    }
  }
  // Misconfigured currency — never crash rendering; show the symbol/code + number.
  const num = new Intl.NumberFormat(intlLocale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  const label = cfg.symbol || code || "";
  return label ? `${label} ${num}` : num;
}
