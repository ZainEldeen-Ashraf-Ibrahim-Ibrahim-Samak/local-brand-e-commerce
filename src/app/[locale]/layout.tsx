import type { ReactNode } from "react";
import "@/app/globals.css";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { getThemeSettings } from "@/services/settings.service";
import { resolveTokens, tokensToStyle } from "@/lib/design-tokens";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

// Theme/settings are read from the DB at request time (cached in Redis), so this
// shell renders dynamically rather than being statically prerendered at build.
export const dynamic = "force-dynamic";

/**
 * Locale shell: sets <html lang/dir>, injects admin theme tokens as CSS variables
 * (light + dark via .dark scope), and wires i18n + dark/light providers.
 */
export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) notFound();
  setRequestLocale(locale);

  const [messages, theme] = await Promise.all([getMessages(), getThemeSettings()]);
  const { light, dark } = resolveTokens({
    primaryColor: theme.primaryColor,
    secondaryColor: theme.secondaryColor,
    fontFamily: theme.fontFamily,
    baseFontSizePx: theme.baseFontSizePx,
    palette: theme.palette as { light?: Record<string, string>; dark?: Record<string, string> },
  });
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <head>
        {/* Admin-configured tokens; dark palette applied under .dark (next-themes). */}
        <style>{`:root{${tokensToStyle(light)}} .dark{${tokensToStyle(dark)}}`}</style>
      </head>
      <body>
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider defaultMode={theme.defaultMode as "light" | "dark"}>{children}</ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
