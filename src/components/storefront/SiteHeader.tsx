import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { pickLocale } from "@/lib/shared/types";
import type { WebsiteSettingsDoc } from "@/models/WebsiteSettings";
import type { AppLocale } from "@/lib/config/env";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";

/** Storefront header rendered from admin WebsiteSettings (FR-026). */
export async function SiteHeader({ settings, locale }: { settings: WebsiteSettingsDoc; locale: AppLocale }) {
  const t = await getTranslations("nav");
  const storeName = pickLocale(settings.storeName as { en: string; ar: string }, locale) || "Local Brand";
  return (
    <header className="border-b border-border bg-bg">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-semibold text-fg">
          {storeName}
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
    </header>
  );
}
