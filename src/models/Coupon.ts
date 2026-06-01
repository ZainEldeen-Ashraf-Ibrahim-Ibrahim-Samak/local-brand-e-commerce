import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

/**
 * Redeemable coupon code (spec FR-025). Validity is bounded by window, usage limit,
 * and a minimum subtotal. `usedCount` is incremented atomically on redemption to
 * prevent over-use under concurrency. Never stacks with discounts (FR-038).
 */
const couponSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    type: { type: String, enum: ["percentage", "fixed"], required: true },
    value: { type: Number, required: true, min: 0 }, // percentage=basis points, fixed=minor units
    minSubtotal: { type: Number, default: 0 }, // minor units
    startsAt: { type: Date },
    endsAt: { type: Date },
    usageLimit: { type: Number, default: 0 }, // 0 = unlimited
    usedCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

export type CouponDoc = InferSchemaType<typeof couponSchema>;

export const Coupon: Model<CouponDoc> =
  (models.Coupon as Model<CouponDoc>) ?? model<CouponDoc>("Coupon", couponSchema);
