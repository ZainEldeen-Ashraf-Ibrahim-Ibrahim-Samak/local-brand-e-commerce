import { connectDB } from "@/lib/db/connect";
import { Offer, type OfferDoc } from "@/models/Offer";
import { cacheAside, CacheKeys } from "@/lib/cache";
import { listProducts, type ProductCardDTO } from "@/services/catalog.service";
import { getWebsiteSettings } from "@/services/settings.service";
import type { LocalizedText, MediaRef } from "@/lib/shared/types";

/** Public homepage payload: active slider slides (in window) + featured products (FR-024). */
export type HomeSlide = {
  id: string;
  title: LocalizedText;
  subtitle: LocalizedText;
  image?: MediaRef;
  ctaLabel: LocalizedText;
  ctaHref: string;
};

/** Admin-configured hero block rendered full-bleed on the home page (FR-005). */
export type HeroConfig = {
  background?: MediaRef;
  heading: LocalizedText;
  subtext: LocalizedText;
  cta: { label: LocalizedText; href: string };
  showHeading: boolean;
  showSubtext: boolean;
  showCta: boolean;
};

export type HomePayload = {
  hero: HeroConfig | null;
  /** Slides for the hero slider (placement: "hero"). */
  heroSlides: HomeSlide[];
  /** Slides for the offer slider (placement: "offer"). */
  offerSlides: HomeSlide[];
  /** @deprecated kept for back-compat; equals offerSlides. */
  slides: HomeSlide[];
  featured: ProductCardDTO[];
};

function toSlide(o: OfferDoc & { _id: unknown }): HomeSlide {
  return {
    id: String(o._id),
    title: o.title as LocalizedText,
    subtitle: o.subtitle as LocalizedText,
    image: o.image?.cloudinaryId ? (o.image as MediaRef) : undefined,
    ctaLabel: o.ctaLabel as LocalizedText,
    ctaHref: o.ctaHref ?? "",
  };
}

export async function getHome(): Promise<HomePayload> {
  return cacheAside(CacheKeys.home, 120, async () => {
    await connectDB();
    const now = new Date();
    const [offers, settings, { items }] = await Promise.all([
      Offer.find({ isActive: true }).sort({ sortOrder: 1, createdAt: 1 }).lean(),
      getWebsiteSettings(),
      listProducts({ pageSize: 8, sort: "newest" }),
    ]);
    const inWindow = (offers as Array<OfferDoc & { _id: unknown }>).filter(
      (o) => (!o.startsAt || o.startsAt <= now) && (!o.endsAt || o.endsAt >= now),
    );
    const heroSlides = inWindow.filter((o) => o.placement === "hero").map(toSlide);
    const offerSlides = inWindow.filter((o) => (o.placement ?? "offer") === "offer").map(toSlide);

    const heroRaw = (settings as { hero?: HeroConfig }).hero;
    const hero: HeroConfig | null = heroRaw
      ? {
          background: heroRaw.background?.cloudinaryId ? heroRaw.background : undefined,
          heading: heroRaw.heading,
          subtext: heroRaw.subtext,
          cta: heroRaw.cta,
          showHeading: heroRaw.showHeading,
          showSubtext: heroRaw.showSubtext,
          showCta: heroRaw.showCta,
        }
      : null;

    return { hero, heroSlides, offerSlides, slides: offerSlides, featured: items };
  });
}
