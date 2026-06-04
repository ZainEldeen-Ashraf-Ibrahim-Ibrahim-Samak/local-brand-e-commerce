import { getWebsiteSettings } from "@/services/settings.service";
import { HeroEditor, type HeroInitial } from "@/components/admin/content/HeroEditor";
import { CurrencyManager, type CurrencyInitial, type CurrencyOption } from "@/components/admin/content/CurrencyManager";
import { LegalPagesEditor, type LegalInitial } from "@/components/admin/content/LegalPagesEditor";
import type { LocalizedText, MediaRef } from "@/lib/shared/types";

export const dynamic = "force-dynamic";

type HeroDoc = {
  background?: MediaRef | null;
  heading?: LocalizedText;
  subtext?: LocalizedText;
  cta?: { label?: LocalizedText; href?: string };
  showHeading?: boolean;
  showSubtext?: boolean;
  showCta?: boolean;
};

type CurrencyDoc = {
  base?: string;
  active?: string;
  options?: Array<{ code: string; label?: LocalizedText; symbol?: string; rate?: number }>;
};

/** Admin page to manage hero, currency, and legal pages (feature 005). */
export default async function AdminContentPage() {
  const s = await getWebsiteSettings();
  const hero = ((s as { hero?: HeroDoc }).hero ?? {}) as HeroDoc;
  const currency = ((s as { currency?: CurrencyDoc }).currency ?? {}) as CurrencyDoc;
  const privacy = ((s as { privacyPage?: { body?: LocalizedText } }).privacyPage?.body ?? { en: "", ar: "" });
  const terms = ((s as { termsPage?: { body?: LocalizedText } }).termsPage?.body ?? { en: "", ar: "" });

  const heroInitial: HeroInitial = {
    background: hero.background?.cloudinaryId
      ? { cloudinaryId: hero.background.cloudinaryId, version: hero.background.version as string, alt: hero.background.alt }
      : null,
    headingEn: hero.heading?.en ?? "",
    headingAr: hero.heading?.ar ?? "",
    subtextEn: hero.subtext?.en ?? "",
    subtextAr: hero.subtext?.ar ?? "",
    ctaLabelEn: hero.cta?.label?.en ?? "",
    ctaLabelAr: hero.cta?.label?.ar ?? "",
    ctaHref: hero.cta?.href ?? "",
    showHeading: hero.showHeading ?? true,
    showSubtext: hero.showSubtext ?? true,
    showCta: hero.showCta ?? true,
  };

  const options: CurrencyOption[] = (currency.options ?? []).map((o) => ({
    code: o.code,
    labelEn: o.label?.en ?? "",
    labelAr: o.label?.ar ?? "",
    symbol: o.symbol ?? "",
    rate: o.rate ?? 1,
  }));
  const currencyInitial: CurrencyInitial = {
    base: currency.base ?? "USD",
    active: currency.active ?? currency.base ?? "USD",
    options,
  };

  const legalInitial: LegalInitial = {
    privacyEn: privacy.en ?? "",
    privacyAr: privacy.ar ?? "",
    termsEn: terms.en ?? "",
    termsAr: terms.ar ?? "",
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-fg">Content & storefront</h1>
      <HeroEditor initial={heroInitial} />
      <CurrencyManager initial={currencyInitial} />
      <LegalPagesEditor initial={legalInitial} />
    </div>
  );
}
