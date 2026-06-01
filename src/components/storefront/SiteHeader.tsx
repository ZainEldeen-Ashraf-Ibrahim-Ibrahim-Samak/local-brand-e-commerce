import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { pickLocale } from "@/lib/shared/types";
import type { WebsiteSettingsDoc } from "@/models/WebsiteSettings";
import type { AppLocale } from "@/lib/config/env";
import type { StoreCategory } from "@/services/catalog.service";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { mediaUrl } from "@/lib/media/cloudinary-url";

/** Storefront header rendered from admin WebsiteSettings (FR-026). */
export async function SiteHeader({
  settings,
  categories = [],
  locale,
}: {
  settings: WebsiteSettingsDoc;
  categories?: StoreCategory[];
  locale: AppLocale;
}) {
  const t = await getTranslations("nav");
  const storeName = pickLocale(settings.storeName as { en: string; ar: string }, locale) || "Local Brand";
  const logoUrl = settings.logo?.cloudinaryId
    ? mediaUrl({ cloudinaryId: settings.logo.cloudinaryId, version: settings.logo.version as string }, 160)
    : null;
  return (
    <header className="border-b border-border bg-bg">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-fg">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={storeName} className="h-8 w-auto" />
          ) : (
            storeName
          )}
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/products" className="text-fg hover:text-primary">
            {t("products")}
          </Link>
          <Link href="/about" className="text-fg hover:text-primary">
            {t("about")}
          </Link>
          <Link href="/contact" className="text-fg hover:text-primary">
            {t("contact")}
          </Link>
          <Link href="/track" className="text-fg hover:text-primary">
            {t("trackOrder")}
          </Link>
          <Link href="/cart" className="text-fg hover:text-primary">
            {t("cart") /* cart label wired in US1 */}
          </Link>
          <LanguageSwitcher />
        </nav>
      </div>
      {categories.length > 0 && (
        <div className="border-t border-border bg-muted/40">
          <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2 text-sm">
            <Link href="/products" className="font-medium text-fg hover:text-primary">
              {t("products")}
            </Link>
            {categories.map((c) => (
              <Link
                key={c.id}
                href={{ pathname: "/products", query: { category: c.slug } }}
                className="flex items-center gap-2 text-muted-fg hover:text-primary"
              >
                {c.image?.cloudinaryId && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={mediaUrl({ cloudinaryId: c.image.cloudinaryId, version: c.image.version }, 48)}
                    alt=""
                    className="h-6 w-6 rounded-full object-cover ring-1 ring-border"
                  />
                )}
                {pickLocale(c.name, locale) || c.slug}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
