import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const localized = { en: { type: String, default: "" }, ar: { type: String, default: "" } };

/**
 * Automatic discount applied to eligible products (spec FR-023). Eligibility is by
 * scope: whole catalog, a category, or specific products. Never stacks with coupons
 * (FR-038) — the pricing resolver picks the single largest reduction.
 */
const discountSchema = new Schema(
  {
    name: localized,
    type: { type: String, enum: ["percentage", "fixed"], required: true },
    value: { type: Number, required: true, min: 0 }, // percentage=basis points, fixed=minor units
    scope: { type: String, enum: ["all", "category", "product"], default: "all" },
    categoryIds: { type: [Schema.Types.ObjectId], ref: "Category", default: [] },
    productIds: { type: [Schema.Types.ObjectId], ref: "Product", default: [] },
    startsAt: { type: Date },
    endsAt: { type: Date },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

export type DiscountDoc = InferSchemaType<typeof discountSchema>;

export const Discount: Model<DiscountDoc> =
  (models.Discount as Model<DiscountDoc>) ?? model<DiscountDoc>("Discount", discountSchema);
