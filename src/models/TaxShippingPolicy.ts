import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const localized = { en: { type: String, default: "" }, ar: { type: String, default: "" } };

/** Checkout tax + shipping policy singleton (spec FR-028). */
const taxShippingPolicySchema = new Schema(
  {
    singleton: { type: String, default: "main", unique: true },
    tax: {
      rateBasisPoints: { type: Number, default: 0 }, // e.g. 1400 = 14%
      inclusive: { type: Boolean, default: false },
      label: localized,
    },
    shippingOptions: [
      {
        id: { type: String, required: true },
        label: localized,
        cost: { type: Number, required: true }, // minor units
        estimatedDays: Number,
        isActive: { type: Boolean, default: true },
      },
    ],
  },
  { timestamps: true },
);

export type TaxShippingPolicyDoc = InferSchemaType<typeof taxShippingPolicySchema>;

export const TaxShippingPolicy: mongoose.Model<TaxShippingPolicyDoc> =
  (mongoose.models.TaxShippingPolicy as mongoose.Model<TaxShippingPolicyDoc>) ??
  mongoose.model<TaxShippingPolicyDoc>("TaxShippingPolicy", taxShippingPolicySchema);
