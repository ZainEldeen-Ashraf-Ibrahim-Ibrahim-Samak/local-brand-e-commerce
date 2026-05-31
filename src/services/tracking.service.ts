import { connectDB } from "@/lib/db/connect";
import { Order } from "@/models/Order";
import { rateLimit } from "@/lib/cache";
import { Errors } from "@/lib/http/errors";

/**
 * Guest order tracking (spec FR-013, research R5). Requires an EXACT match of
 * order number + email + WhatsApp. Lookups are rate-limited and return a uniform
 * "not found" so orders cannot be enumerated or details probed.
 */
export type TrackingInput = { orderNumber: string; email: string; whatsapp: string; ip?: string };

export type OrderTrackingDTO = {
  orderNumber: string;
  status: string;
  statusHistory: { to: string; at: Date }[];
  items: { name: { en: string; ar: string }; options: Record<string, string>; quantity: number; lineTotal: number }[];
  totals: { subtotal: number; discountTotal: number; taxTotal: number; shippingCost: number; grandTotal: number };
};

export async function trackOrder(input: TrackingInput): Promise<OrderTrackingDTO> {
  // Rate-limit by IP (or order number) to deter enumeration/brute force.
  const key = `track:${input.ip ?? "anon"}`;
  const allowed = await rateLimit(key, 20, 60);
  if (!allowed) throw Errors.validation({ code: "RATE_LIMITED" });

  await connectDB();
  const order = await Order.findOne({
    orderNumber: input.orderNumber.trim(),
    "customer.email": input.email.trim().toLowerCase(),
    "customer.whatsapp": input.whatsapp.trim(),
  }).lean();

  // Uniform non-revealing response on any mismatch (no enumeration).
  if (!order) throw Errors.notFound("Order");

  return {
    orderNumber: order.orderNumber,
    status: order.status ?? "pending",
    statusHistory: (order.statusHistory ?? []).map((s) => ({ to: s.to, at: s.at ?? new Date() })),
    items: (order.items ?? []).map((i) => ({
      name: i.productNameSnapshot as { en: string; ar: string },
      options: (i.options ?? {}) as Record<string, string>,
      quantity: i.quantity,
      lineTotal: i.lineTotal,
    })),
    totals: {
      subtotal: order.subtotal,
      discountTotal: order.discountTotal ?? 0,
      taxTotal: order.taxTotal ?? 0,
      shippingCost: order.shippingOption?.cost ?? 0,
      grandTotal: order.grandTotal,
    },
  };
}
