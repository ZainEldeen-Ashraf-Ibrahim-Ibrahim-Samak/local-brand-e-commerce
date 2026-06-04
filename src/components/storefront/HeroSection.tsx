import { Link } from "@/i18n/navigation";
import { pickLocale } from "@/lib/shared/types";
import { mediaUrl } from "@/lib/media/cloudinary-url";
import type { HeroConfig } from "@/services/home.service";
import type { AppLocale } from "@/lib/config/env";

/** Full-bleed home hero with an admin-uploaded background and toggleable overlay components (FR-005). */
export function HeroSection({ hero, locale }: { hero: HeroConfig; locale: AppLocale }) {
  const heading = pickLocale(hero.heading, locale);
  const subtext = pickLocale(hero.subtext, locale);
  const ctaLabel = pickLocale(hero.cta.label, locale);
  const bg = hero.background?.cloudinaryId
    ? mediaUrl({ cloudinaryId: hero.background.cloudinaryId, version: hero.background.version as string }, 1600)
    : null;

  const hasContent = (hero.showHeading && heading) || (hero.showSubtext && subtext) || (hero.showCta && ctaLabel);
  if (!bg && !hasContent) return null;

  return (
    // Full-bleed: break out of the centered max-w container so the hero spans the
    // entire viewport width on every page (not just a boxed section).
    <section className="relative isolate -mt-6 ml-[calc(50%-50vw)] mr-[calc(50%-50vw)] w-screen overflow-hidden bg-muted">
      {bg && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={bg} alt={pickLocale(hero.background?.alt ?? { en: "", ar: "" }, locale)} className="absolute inset-0 h-full w-full object-cover" />
      )}
      <div className="absolute inset-0 bg-black/40" aria-hidden />
      <div className="relative mx-auto flex min-h-[320px] max-w-3xl flex-col items-center justify-center gap-4 px-6 py-20 text-center text-white md:min-h-[480px]">
        {hero.showHeading && heading && <h1 className="text-3xl font-bold tracking-tight md:text-5xl">{heading}</h1>}
        {hero.showSubtext && subtext && <p className="max-w-xl text-base text-white/90 md:text-lg">{subtext}</p>}
        {hero.showCta && ctaLabel && hero.cta.href && (
          <Link
            href={hero.cta.href}
            className="inline-flex items-center justify-center rounded-token bg-primary px-6 py-3 text-sm font-medium text-primary-fg transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
          >
            {ctaLabel}
          </Link>
        )}
      </div>
    </section>
  );
}
