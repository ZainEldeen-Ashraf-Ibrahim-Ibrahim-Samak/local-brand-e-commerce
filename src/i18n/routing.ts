import { defineRouting } from "next-intl/routing";

/** AR/EN locale routing. Arabic is the default (admin-configurable at runtime). */
export const routing = defineRouting({
  locales: ["ar", "en"],
  defaultLocale: "ar",
  localePrefix: "always",
});

export type Locale = (typeof routing.locales)[number];
