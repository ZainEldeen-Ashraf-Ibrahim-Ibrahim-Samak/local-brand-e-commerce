import mongoose, { Schema, type InferSchemaType } from "mongoose";

/**
 * Customer support inquiry (Phase 4 User Story 2: T018).
 * Represents inquiries submitted by guests, containing contact data,
 * messages, and handling status history.
 */

const statusHistorySchema = new Schema(
  {
    status: { type: String, enum: ["new", "in_progress", "resolved"], required: true },
    changedAt: { type: Date, default: Date.now },
    changedByUserId: { type: Schema.Types.ObjectId, ref: "User" },
    note: { type: String },
  },
  { _id: false }
);

const supportInquirySchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    whatsapp: { type: String, trim: true },
    orderNumber: { type: String, trim: true },
    subject: { type: String, trim: true },
    message: { type: String, required: true },
    status: { type: String, enum: ["new", "in_progress", "resolved"], default: "new", required: true },
    handledByUserId: { type: Schema.Types.ObjectId, ref: "User" },
    statusHistory: [statusHistorySchema],
    sourceIp: { type: String, select: false },
  },
  { timestamps: true }
);

// Indexes (FR-109 / FR-111 / performance)
supportInquirySchema.index({ status: 1, createdAt: -1 });
supportInquirySchema.index({ email: 1 });

export type SupportInquiryDoc = InferSchemaType<typeof supportInquirySchema>;

export const SupportInquiry =
  (mongoose.models.SupportInquiry as mongoose.Model<SupportInquiryDoc>) ??
  mongoose.model<SupportInquiryDoc>("SupportInquiry", supportInquirySchema);
