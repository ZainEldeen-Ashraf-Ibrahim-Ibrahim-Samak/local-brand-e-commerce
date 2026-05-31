import { pickLocale } from "@/lib/shared/types";
import type { WebsiteSettingsDoc } from "@/models/WebsiteSettings";
import type { AppLocale } from "@/lib/config/env";

/** Storefront footer rendered from admin WebsiteSettings (FR-026). */
export function SiteFooter({ settings, locale }: { settings: WebsiteSettingsDoc; locale: AppLocale }) {
  const about = pickLocale((settings.footer?.aboutShort ?? { en: "", ar: "" }) as { en: string; ar: string }, locale);
  return (
    <footer className="mt-12 border-t border-border bg-muted">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-muted-fg">
        {about && <p className="mb-4 max-w-prose">{about}</p>}
        <div className="flex flex-wrap gap-4">
          {(settings.socialLinks ?? []).map((s) => (
            <a
              key={s.url ?? s.platform}
              href={s.url ?? "#"}
              className="hover:text-primary"
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
