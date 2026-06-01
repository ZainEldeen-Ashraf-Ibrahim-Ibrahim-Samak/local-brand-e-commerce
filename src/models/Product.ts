import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const localized = { en: { type: String, default: "" }, ar: { type: String, default: "" } };
const mediaRef = { cloudinaryId: { type: String, required: true }, version: { type: String, required: true }, alt: localized };

/** Sellable item for the single brand (spec FR-001, FR-004). */
const productSchema = new Schema(
  {
    name: localized,
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    description: localized,
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true, index: true },
    basePrice: { type: Number, required: true, min: 0 }, // minor units
    images: { type: [mediaRef], default: [] },
    attributes: {
      type: [
        {
          key: { type: String, required: true }, // e.g. "size", "color"
          label: localized,
          values: { type: [String], default: [] },
        },
      ],
      default: [],
    },
    status: { type: String, enum: ["draft", "published", "unpublished"], default: "draft", index: true },
    ownerUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    seo: { title: localized, keywords: { type: [String], default: [] } },
  },
  { timestamps: true },
);

// Text index supports keyword search (FR-002).
productSchema.index({ "name.en": "text", "name.ar": "text", "description.en": "text", "description.ar": "text" });

export type ProductDoc = InferSchemaType<typeof productSchema>;

export const Product: mongoose.Model<ProductDoc> =
  (mongoose.models.Product as mongoose.Model<ProductDoc>) ??
  mongoose.model<ProductDoc>("Product", productSchema);
