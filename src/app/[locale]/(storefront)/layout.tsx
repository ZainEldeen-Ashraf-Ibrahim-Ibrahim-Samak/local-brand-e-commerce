import type { ReactNode } from "react";
import { SiteHeader } from "@/components/storefront/SiteHeader";
import { SiteFooter } from "@/components/storefront/SiteFooter";
import { getWebsiteSettings } from "@/services/settings.service";
import type { AppLocale } from "@/lib/config/env";

export const dynamic = "force-dynamic";

/** Storefront shell: header + footer from WebsiteSettings around guest pages. */
export default async function StorefrontLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const settings = await getWebsiteSettings();
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader settings={settings} locale={locale as AppLocale} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
      <SiteFooter settings={settings} locale={locale as AppLocale} />
    </div>
  );
}
