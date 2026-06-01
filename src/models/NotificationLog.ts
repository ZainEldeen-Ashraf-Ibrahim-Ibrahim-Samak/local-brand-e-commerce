import mongoose, { Schema, type InferSchemaType } from "mongoose";

/** Audit + retry record for order notifications (spec FR-014/FR-015). */
const notificationLogSchema = new Schema(
  {
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    channel: { type: String, enum: ["email", "whatsapp"], required: true },
    event: { type: String, required: true }, // e.g. "status:shipped"
    status: { type: String, enum: ["queued", "sent", "failed"], default: "queued" },
    attempts: { type: Number, default: 0 },
    lastError: { type: String },
  },
  { timestamps: true },
);

export type NotificationLogDoc = InferSchemaType<typeof notificationLogSchema>;

export const NotificationLog: mongoose.Model<NotificationLogDoc> =
  (mongoose.models.NotificationLog as mongoose.Model<NotificationLogDoc>) ??
  mongoose.model<NotificationLogDoc>("NotificationLog", notificationLogSchema);
