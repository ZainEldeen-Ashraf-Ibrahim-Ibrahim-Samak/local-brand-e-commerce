import mongoose, { Schema, type InferSchemaType } from "mongoose";
import { ORDER_STATUSES } from "@/lib/shared/types";

const localized = { en: { type: String, default: "" }, ar: { type: String, default: "" } };

const orderLine = {
  variation: { type: Schema.Types.ObjectId, ref: "Variation", required: true },
  product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  productNameSnapshot: localized,
  options: { type: Schema.Types.Mixed, default: {} },
  unitPrice: { type: Number, required: true }, // list price, minor units
  appliedUnitDiscount: { type: Number, default: 0 },
  quantity: { type: Number, required: true, min: 1 },
  lineTotal: { type: Number, required: true },
};

const statusChange = {
  from: { type: String, enum: ORDER_STATUSES },
  to: { type: String, enum: ORDER_STATUSES, required: true },
  at: { type: Date, default: Date.now },
  byUserId: { type: Schema.Types.ObjectId, ref: "User" },
  note: String,
};

/** Confirmed purchase (spec FR-007–FR-013, FR-036). No card data stored. */
const orderSchema = new Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    items: { type: [orderLine], required: true },
    customer: {
      email: { type: String, required: true, lowercase: true, index: true },
      whatsapp: { type: String, required: true, index: true },
      name: { type: String, required: true },
    },
    shippingAddress: {
      line1: { type: String, required: true },
      line2: String,
      city: { type: String, required: true },
      region: String,
      postalCode: String,
      country: { type: String, required: true },
      phone: String,
    },
    subtotal: { type: Number, required: true },
    discountTotal: { type: Number, default: 0 },
    appliedCouponCode: { type: String },
    taxTotal: { type: Number, default: 0 },
    shippingOption: {
      id: { type: String, required: true },
      label: localized,
      cost: { type: Number, required: true },
    },
    grandTotal: { type: Number, required: true },
    status: { type: String, enum: ORDER_STATUSES, default: "pending", index: true },
    statusHistory: { type: [statusChange], default: [] },
    payment: {
      provider: String,
      method: { type: String, enum: ["card", "cod"] },
      sessionId: String,
      status: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
      reference: String,
    },
    /** Moment at which a still-pending order becomes expired (FR-013). Set on create. */
    expiresAt: { type: Date, index: true },
    /** Guards idempotency: stock is restored at most once per order (FR-013). */
    stockRestored: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export type OrderDoc = InferSchemaType<typeof orderSchema>;

export const Order: mongoose.Model<OrderDoc> =
  (mongoose.models.Order as mongoose.Model<OrderDoc>) ?? mongoose.model<OrderDoc>("Order", orderSchema);
