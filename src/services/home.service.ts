import { connectDB } from "@/lib/db/connect";
import { Offer, type OfferDoc } from "@/models/Offer";
import { cacheAside, CacheKeys } from "@/lib/cache";
import { listProducts, type ProductCardDTO } from "@/services/catalog.service";
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

export type HomePayload = { slides: HomeSlide[]; featured: ProductCardDTO[] };

export async function getHome(): Promise<HomePayload> {
  return cacheAside(CacheKeys.home, 120, async () => {
    await connectDB();
    const now = new Date();
    const offers = await Offer.find({ isActive: true }).sort({ sortOrder: 1, createdAt: 1 }).lean();
    const slides: HomeSlide[] = (offers as Array<OfferDoc & { _id: unknown }>)
      .filter((o) => (!o.startsAt || o.startsAt <= now) && (!o.endsAt || o.endsAt >= now))
      .map((o) => ({
        id: String(o._id),
        title: o.title as LocalizedText,
        subtitle: o.subtitle as LocalizedText,
        image: o.image?.cloudinaryId ? (o.image as MediaRef) : undefined,
        ctaLabel: o.ctaLabel as LocalizedText,
        ctaHref: o.ctaHref ?? "",
      }));
    const { items } = await listProducts({ pageSize: 8, sort: "newest" });
    return { slides, featured: items };
  });
}
