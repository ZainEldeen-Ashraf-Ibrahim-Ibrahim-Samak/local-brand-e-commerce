import { z } from "zod";
import type { AppLocale } from "@/lib/config/env";

/** Bilingual text stored on content/catalog entities (Constitution Principle II). */
export type LocalizedText = { en: string; ar: string };

export const localizedTextSchema = z.object({ en: z.string(), ar: z.string() });

export function pickLocale(text: LocalizedText, locale: AppLocale, fallback: AppLocale = "en"): string {
  return text[locale]?.trim() || text[fallback] || "";
}

/** Reference to a Cloudinary asset (we store the id + version, not the file). */
export type MediaRef = { cloudinaryId: string; version: string; alt?: LocalizedText };

export const mediaRefSchema = z.object({
  cloudinaryId: z.string(),
  version: z.string(),
  alt: localizedTextSchema.optional(),
  format: z.string().optional(),
  bytes: z.number().optional(),
});

/** Canonical order status lifecycle (spec FR-036). */
export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "failed",
  "returned",
  "refunded",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** Allowed transitions per FR-036. Empty array = terminal. */
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "cancelled", "failed"],
  confirmed: ["processing", "cancelled", "failed"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: ["returned", "refunded"],
  returned: ["refunded"],
  cancelled: [],
  failed: [],
  refunded: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_TRANSITIONS[from]?.includes(to) ?? false;
}

export type Role = "admin" | "buyer";
