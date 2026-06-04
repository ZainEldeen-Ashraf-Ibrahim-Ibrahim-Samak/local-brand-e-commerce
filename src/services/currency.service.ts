import { getWebsiteSettings } from "@/services/settings.service";

/**
 * Active-currency resolution + conversion (feature 005, FR-021). Product prices are
 * stored in base-currency minor units; display converts by the admin-set rate. Reads
 * come from the cached settings singleton, so no extra DB hit on the request path.
 */
export type ActiveCurrency = { code: string; symbol: string; rate: number };

const DEFAULT: ActiveCurrency = { code: "USD", symbol: "$", rate: 1 };

export async function getActiveCurrency(): Promise<ActiveCurrency> {
  const settings = await getWebsiteSettings();
  const currency = (settings as { currency?: { active?: string; options?: ActiveCurrency[] } }).currency;
  if (!currency?.active || !currency.options?.length) return DEFAULT;
  const opt = currency.options.find((o) => o.code === currency.active);
  if (!opt) return DEFAULT;
  // Sanitize the code: strip any stray non-letter characters and normalize case so a
  // misconfigured value (e.g. "ÙEGP") still resolves to a valid ISO code where possible.
  const code = (opt.code ?? "").replace(/[^A-Za-z]/g, "").toUpperCase();
  return { code: code || DEFAULT.code, symbol: opt.symbol, rate: opt.rate };
}

/** Convert base-currency minor units to the active currency's minor units. */
export function convertMinor(baseMinor: number, rate: number): number {
  return Math.round(baseMinor * rate);
}
