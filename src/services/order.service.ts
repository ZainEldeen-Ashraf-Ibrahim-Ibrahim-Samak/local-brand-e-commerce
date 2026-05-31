import { ulid } from "ulid";
import { connectDB } from "@/lib/db/connect";
import { Variation } from "@/models/Variation";
import { Product } from "@/models/Product";
import { Order, type OrderDoc } from "@/models/Order";
import { getTaxShippingPolicy } from "@/services/settings.service";
import { reserveStock, restoreStock, type StockItem } from "@/services/inventory.service";
import { resolveCart, type PriceLineInput } from "@/lib/pricing/resolve";
import { Errors } from "@/lib/http/errors";
import { canTransition, type OrderStatus } from "@/lib/shared/types";
import { dispatchOrderNotification } from "@/lib/notifications/dispatcher";
import { orderStatusMessage } from "@/lib/notifications/templates";

/**
 * Order domain service (spec FR-007–FR-013, FR-036). Builds authoritative pricing
 * from current catalog + tax/shipping policy, reserves stock atomically, creates a
 * pending order, and drives status transitions (each notifies the customer).
 */
export type CartItemInput = { variationId: string; quantity: number };

type ResolvedLine = {
  variationId: string;
  productId: string;
  productName: { en: string; ar: string };
  options: Record<string, string>;
  unitPrice: number;
  quantity: number;
  available: boolean;
};

async function resolveLines(items: CartItemInput[]): Promise<{ lines: ResolvedLine[]; unavailable: string[] }> {
  await connectDB();
  const lines: ResolvedLine[] = [];
  const unavailable: string[] = [];
  for (const item of items) {
    const v = await Variation.findById(item.variationId).lean();
    if (!v || !v.isActive) {
      unavailable.push(item.variationId);
      continue;
    }
    const p = await Product.findOne({ _id: v.product, status: "published" }).lean();
    if (!p) {
      unavailable.push(item.variationId);
      continue;
    }
    const available = v.stock >= item.quantity;
    if (!available) unavailable.push(item.variationId);
    lines.push({
      variationId: String(v._id),
      productId: String(p._id),
      productName: p.name as { en: string; ar: string },
      options: (v.options ?? {}) as Record<string, string>,
      unitPrice: v.priceOverride ?? p.basePrice,
      quantity: item.quantity,
      available,
    });
  }
  return { lines, unavailable };
}

export type CartPricing = Awaited<ReturnType<typeof priceCart>>;

/** Price a cart against current catalog + tax/shipping policy. Coupon support: US5. */
export async function priceCart(items: CartItemInput[], shippingOptionId?: string) {
  const { lines, unavailable } = await resolveLines(items);
  const policy = await getTaxShippingPolicy();
  const shippingOption =
    policy.shippingOptions.find((s) => s.id === shippingOptionId && s.isActive) ?? policy.shippingOptions[0];

  const priceInputs: PriceLineInput[] = lines
    .filter((l) => l.available)
    .map((l) => ({ unitPrice: l.unitPrice, quantity: l.quantity }));

  const totals = resolveCart({
    lines: priceInputs,
    taxRateBasisPoints: policy.tax?.rateBasisPoints ?? 0,
    taxInclusive: policy.tax?.inclusive ?? false,
    shippingCost: shippingOption?.cost ?? 0,
  });

  return { lines, unavailable, totals, shippingOption };
}

export type CreateOrderInput = {
  items: CartItemInput[];
  shippingOptionId: string;
  couponCode?: string;
  customer: { email: string; whatsapp: string; name: string };
  shippingAddress: {
    line1: string;
    line2?: string;
    city: string;
    region?: string;
    postalCode?: string;
    country: string;
    phone?: string;
  };
};

/** Reserve stock atomically and create a `pending` order. Throws OUT_OF_STOCK on conflict. */
export async function createPendingOrder(input: CreateOrderInput): Promise<OrderDoc & { _id: unknown }> {
  const priced = await priceCart(input.items, input.shippingOptionId);
  if (priced.unavailable.length > 0) {
    throw Errors.outOfStock({ unavailable: priced.unavailable });
  }

  const stockItems: StockItem[] = input.items.map((i) => ({ variationId: i.variationId, quantity: i.quantity }));
  await reserveStock(stockItems); // atomic; throws OUT_OF_STOCK if any line lost the race

  const orderNumber = `LB-${ulid()}`;
  const orderItems = priced.lines.map((l, idx) => {
    const lineResult = priced.totals.lines[idx];
    return {
      variation: l.variationId,
      product: l.productId,
      productNameSnapshot: l.productName,
      options: l.options,
      unitPrice: l.unitPrice,
      appliedUnitDiscount: lineResult?.appliedUnitDiscount ?? 0,
      quantity: l.quantity,
      lineTotal: lineResult?.lineTotal ?? l.unitPrice * l.quantity,
    };
  });

  try {
    const order = await Order.create({
      orderNumber,
      items: orderItems,
      customer: input.customer,
      shippingAddress: input.shippingAddress,
      subtotal: priced.totals.subtotal,
      discountTotal: priced.totals.discountTotal,
      appliedCouponCode: input.couponCode,
      taxTotal: priced.totals.taxTotal,
      shippingOption: {
        id: priced.shippingOption?.id,
        label: priced.shippingOption?.label,
        cost: priced.shippingOption?.cost,
      },
      grandTotal: priced.totals.grandTotal,
      status: "pending",
      statusHistory: [{ to: "pending", at: new Date() }],
      payment: { status: "pending" },
    });
    return order as OrderDoc & { _id: unknown };
  } catch (err) {
    // Order persist failed after reserving — release the stock we took.
    await restoreStock(stockItems);
    throw err;
  }
}

async function notify(order: OrderDoc, status: OrderStatus) {
  if (!order.customer) return;
  const { subject, message } = orderStatusMessage(order.orderNumber, status);
  await dispatchOrderNotification({
    orderId: String((order as OrderDoc & { _id: unknown })._id),
    event: `status:${status}`,
    email: order.customer.email,
    whatsapp: order.customer.whatsapp,
    subject,
    message,
  });
}

/** Transition an order's status (validated against the FR-036 lifecycle) + notify. */
export async function transitionOrder(orderId: string, to: OrderStatus, byUserId?: string, note?: string): Promise<OrderDoc> {
  await connectDB();
  const order = await Order.findById(orderId);
  if (!order) throw Errors.notFound("Order");
  const from = order.status as OrderStatus;
  if (from !== to && !canTransition(from, to)) {
    throw Errors.validation({ message: `Cannot transition order from ${from} to ${to}` });
  }
  order.status = to;
  order.statusHistory.push({ from, to, at: new Date(), byUserId: byUserId as never, note });
  await order.save();
  await notify(order, to);
  return order;
}

/** Webhook: payment succeeded → confirm order + notify. */
export async function markOrderPaid(orderId: string, reference: string): Promise<void> {
  await connectDB();
  const order = await Order.findById(orderId);
  if (!order || order.status !== "pending") return; // idempotent
  order.payment = { ...order.payment, status: "paid", reference };
  order.status = "confirmed";
  order.statusHistory.push({ from: "pending", to: "confirmed", at: new Date() });
  await order.save();
  await notify(order, "confirmed");
}

/** Webhook: payment failed/abandoned → fail order + release stock (FR-012). */
export async function markOrderFailed(orderId: string, reference: string): Promise<void> {
  await connectDB();
  const order = await Order.findById(orderId);
  if (!order || order.status !== "pending") return;
  order.payment = { ...order.payment, status: "failed", reference };
  order.status = "failed";
  order.statusHistory.push({ from: "pending", to: "failed", at: new Date() });
  await order.save();
  await restoreStock(order.items.map((i) => ({ variationId: String(i.variation), quantity: i.quantity })));
}
