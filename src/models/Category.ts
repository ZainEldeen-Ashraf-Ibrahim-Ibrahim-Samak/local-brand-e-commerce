import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const localized = { en: { type: String, default: "" }, ar: { type: String, default: "" } };

/** Product grouping for browsing (spec FR-001). May nest via `parent`. */
const categorySchema = new Schema(
  {
    name: localized,
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    parent: { type: Schema.Types.ObjectId, ref: "Category", default: null },
    image: { cloudinaryId: String, version: String, alt: localized },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export type CategoryDoc = InferSchemaType<typeof categorySchema>;

export const Category: mongoose.model<CategoryDoc> =
  (mongoose.models.Category as mongoose.model<CategoryDoc>) ?? mongoose.model<CategoryDoc>("Category", categorySchema);
