import { pickLocale } from "@/lib/shared/types";
import type { WebsiteSettingsDoc } from "@/models/WebsiteSettings";
import type { AppLocale } from "@/lib/config/env";
import type { StoreCategory } from "@/services/catalog.service";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";

/** Storefront footer rendered from admin WebsiteSettings (FR-026). */
export async function SiteFooter({
  settings,
  categories = [],
  locale,
}: {
  settings: WebsiteSettingsDoc;
  categories?: StoreCategory[];
  locale: AppLocale;
}) {
  const t = await getTranslations("nav");
  const about = pickLocale((settings.footer?.aboutShort ?? { en: "", ar: "" }) as { en: string; ar: string }, locale);
  return (
    <footer className="mt-12 border-t border-border bg-muted">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-muted-fg">
        {about && <p className="mb-4 max-w-prose">{about}</p>}
        {categories.length > 0 && (
          <div className="mb-4">
            <h2 className="mb-2 font-semibold text-fg">{t("products")}</h2>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {categories.map((c) => (
                <Link
                  key={c.id}
                  href={{ pathname: "/products", query: { category: c.slug } }}
                  className="hover:text-fg focus:outline-none focus:underline"
                >
                  {pickLocale(c.name, locale) || c.slug}
                </Link>
              ))}
            </div>
          </div>
        )}
        <div className="mb-4 flex flex-wrap gap-4">
          <Link href="/about" className="hover:text-fg focus:outline-none focus:underline">
            {t("about")}
          </Link>
          <Link href="/contact" className="hover:text-fg focus:outline-none focus:underline">
            {t("contact")}
          </Link>
          <Link href="/privacy" className="hover:text-fg focus:outline-none focus:underline">
            {t("privacy")}
          </Link>
          <Link href="/terms" className="hover:text-fg focus:outline-none focus:underline">
            {t("terms")}
          </Link>
        </div>
        <div className="flex flex-wrap gap-4">
          {(settings.socialLinks ?? []).map((s) => (
            <a
              key={s.url ?? s.platform}
              href={s.url ?? "#"}
              className="hover:text-fg focus:outline-none focus:underline"
              target="_blank"
              rel="noreferrer"
            >
              {s.platform}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}

