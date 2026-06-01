import type { ReactNode } from "react";
import { SiteHeader } from "@/components/storefront/SiteHeader";
import { SiteFooter } from "@/components/storefront/SiteFooter";
import { getWebsiteSettings } from "@/services/settings.service";
import { listCategoryTree } from "@/services/catalog.service";
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
  const [settings, categories] = await Promise.all([getWebsiteSettings(), listCategoryTree()]);
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader settings={settings} categories={categories} locale={locale as AppLocale} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
      <SiteFooter settings={settings} categories={categories} locale={locale as AppLocale} />
    </div>
  );
}
