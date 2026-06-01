import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/**
 * Authenticated account: admin or buyer (spec FR-016/FR-017/FR-037).
 * Guests are NOT users. Accounts are provisioned by admins only.
 */
const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: false, select: false },
    role: { type: String, enum: ["admin", "buyer"], required: true },
    name: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    status: { type: String, enum: ["pending", "active", "inactive"], default: "active" },
    inviteTokenHash: { type: String, select: false },
    inviteExpiresAt: { type: Date },
    invitedAt: { type: Date },
    createdByUserId: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

export type UserDoc = InferSchemaType<typeof userSchema>;

export const User: mongoose.Model<UserDoc> =
  (mongoose.models.User as mongoose.Model<UserDoc>) ?? mongoose.model<UserDoc>("User", userSchema);
