import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const localized = { en: { type: String, default: "" }, ar: { type: String, default: "" } };

/** A specific purchasable configuration with its own stock/price (spec FR-004, FR-005). */
const variationSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    sku: { type: String, required: true, unique: true, trim: true },
    options: { type: Schema.Types.Mixed, default: {} }, // e.g. { size: "M", color: "red" }
    priceOverride: { type: Number, min: 0 }, // minor units; falls back to product.basePrice
    stock: { type: Number, required: true, min: 0, default: 0 },
    image: { cloudinaryId: String, version: String, alt: localized },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export type VariationDoc = InferSchemaType<typeof variationSchema>;

export const Variation: mongoose.model<VariationDoc> =
  (mongoose.models.Variation as mongoose.model<VariationDoc>) ?? mongoose.model<VariationDoc>("Variation", variationSchema);
