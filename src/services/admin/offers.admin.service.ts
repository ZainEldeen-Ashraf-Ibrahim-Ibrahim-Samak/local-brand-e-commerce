import { connectDB } from "@/lib/db/connect";
import { Offer, type OfferDoc } from "@/models/Offer";
import { cacheInvalidate, CacheKeys } from "@/lib/cache";
import { Errors } from "@/lib/http/errors";
import type { LocalizedText, MediaRef } from "@/lib/shared/types";
import { destroyAsset } from "@/lib/media/cloudinary";
import { logger } from "@/lib/observability/logger";

/**
 * Admin offers / homepage slider management (spec FR-024). Writes invalidate the
 * public home cache so the slider updates quickly (Principle VI).
 */
export type OfferInput = {
  title: LocalizedText;
  subtitle?: LocalizedText;
  /** null means "remove the existing image" */
  image?: MediaRef | null;
  ctaLabel?: LocalizedText;
  ctaHref?: string;
  /** Which storefront slider this slide belongs to (feature 005, FR-006). */
  placement?: "hero" | "offer";
  isActive?: boolean;
  sortOrder?: number;
  startsAt?: string | null;
  endsAt?: string | null;
};

export async function listAdminOffers(): Promise<Array<OfferDoc & { _id: unknown }>> {
  await connectDB();
  const offers = await Offer.find().sort({ sortOrder: 1, createdAt: 1 }).lean();
  return offers as Array<OfferDoc & { _id: unknown }>;
}

export async function createOffer(input: OfferInput): Promise<OfferDoc> {
  await connectDB();
  const count = await Offer.countDocuments();
  const offer = await Offer.create({
    title: input.title,
    subtitle: input.subtitle ?? { en: "", ar: "" },
    image: input.image,
    ctaLabel: input.ctaLabel ?? { en: "", ar: "" },
    ctaHref: input.ctaHref ?? "",
    placement: input.placement ?? "offer",
    isActive: input.isActive ?? true,
    sortOrder: input.sortOrder ?? count,
    startsAt: input.startsAt ? new Date(input.startsAt) : undefined,
    endsAt: input.endsAt ? new Date(input.endsAt) : undefined,
  });
  await cacheInvalidate(CacheKeys.home);
  return offer.toObject();
}

export async function updateOffer(id: string, patch: Partial<OfferInput>): Promise<OfferDoc> {
  await connectDB();
  const offer = await Offer.findById(id);
  if (!offer) throw Errors.notFound("Offer");

  if (patch.image !== undefined) {
    const oldId = offer.image?.cloudinaryId;
    const newId = patch.image?.cloudinaryId;
    if (oldId && oldId !== newId) {
      destroyAsset(oldId).then((success) => {
        if (!success) {
          logger.error(`[Cloudinary Retry] Failed to delete asset: ${oldId}`);
        }
      });
    }
  }

  if (patch.title) offer.title = patch.title as never;
  if (patch.subtitle) offer.subtitle = patch.subtitle as never;
  if (patch.image !== undefined) offer.image = patch.image as never;
  if (patch.ctaLabel) offer.ctaLabel = patch.ctaLabel as never;
  if (patch.ctaHref != null) offer.ctaHref = patch.ctaHref;
  if (patch.placement) offer.placement = patch.placement as never;
  if (patch.isActive != null) offer.isActive = patch.isActive;
  if (patch.sortOrder != null) offer.sortOrder = patch.sortOrder;
  if (patch.startsAt !== undefined) offer.startsAt = (patch.startsAt ? new Date(patch.startsAt) : undefined) as never;
  if (patch.endsAt !== undefined) offer.endsAt = (patch.endsAt ? new Date(patch.endsAt) : undefined) as never;
  await offer.save();
  await cacheInvalidate(CacheKeys.home);
  return offer.toObject();
}

export async function deleteOffer(id: string): Promise<void> {
  await connectDB();
  const offer = await Offer.findById(id);
  if (!offer) throw Errors.notFound("Offer");

  if (offer.image?.cloudinaryId) {
    destroyAsset(offer.image.cloudinaryId).then((success) => {
      if (!success) {
        logger.error(`[Cloudinary Retry] Failed to delete asset: ${offer.image!.cloudinaryId}`);
      }
    });
  }

  await Offer.findByIdAndDelete(id);
  await cacheInvalidate(CacheKeys.home);
}

/** Persist a new ordering (array of offer ids in display order). */
export async function reorderOffers(orderedIds: string[]): Promise<void> {
  await connectDB();
  await Promise.all(orderedIds.map((id, index) => Offer.updateOne({ _id: id }, { $set: { sortOrder: index } })));
  await cacheInvalidate(CacheKeys.home);
}
