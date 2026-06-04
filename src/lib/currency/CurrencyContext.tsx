"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { DisplayCurrency } from "@/lib/format";

/**
 * Active display currency made available to client components (cart, checkout,
 * variant picker) so prices convert + format consistently site-wide (FR-021).
 * The value is resolved server-side (getActiveCurrency) and injected by the
 * storefront layout.
 */
const CurrencyContext = createContext<DisplayCurrency>({ code: "USD", symbol: "$", rate: 1 });

export function CurrencyProvider({ value, children }: { value: DisplayCurrency; children: ReactNode }) {
  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

/** Active currency for the current request (code + symbol + rate). */
export function useDisplayCurrency(): DisplayCurrency {
  return useContext(CurrencyContext);
}
