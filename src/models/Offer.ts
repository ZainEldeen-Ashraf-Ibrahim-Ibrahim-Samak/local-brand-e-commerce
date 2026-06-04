import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const localized = { en: { type: String, default: "" }, ar: { type: String, default: "" } };
const mediaRef = { cloudinaryId: String, version: String, alt: { en: String, ar: String } };

/** Homepage slider slide / promotional offer (spec FR-024). Ordered by `sortOrder`. */
const offerSchema = new Schema(
  {
    title: localized,
    subtitle: localized,
    image: mediaRef,
    ctaLabel: localized,
    ctaHref: { type: String, default: "" },
    placement: { type: String, enum: ["hero", "offer"], default: "offer", index: true },
    isActive: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0, index: true },
    startsAt: { type: Date },
    endsAt: { type: Date },
  },
  { timestamps: true },
);

export type OfferDoc = InferSchemaType<typeof offerSchema>;

export const Offer: Model<OfferDoc> = (models.Offer as Model<OfferDoc>) ?? model<OfferDoc>("Offer", offerSchema);
