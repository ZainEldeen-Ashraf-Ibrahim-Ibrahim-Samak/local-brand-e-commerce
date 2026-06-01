import { connectDB } from "@/lib/db/connect";
import { Coupon, type CouponDoc } from "@/models/Coupon";
import { Discount } from "@/models/Discount";
import { Product } from "@/models/Product";
import { reductionAmount, type Reduction } from "@/lib/pricing/resolve";
import { Errors } from "@/lib/http/errors";

/**
 * Promotions resolution (spec FR-023/FR-025/FR-038). Computes candidate reductions
 * from active discounts (auto, by scope) and an optional coupon. The pricing resolver
 * applies only the single largest — coupons never stack with discounts (research R4).
 */
export type PromotionLine = { productId: string; categoryId?: string; lineTotal: number };

/** Sum of reductions for all active discounts that match the cart's eligible lines. */
export async function discountReductionCandidates(lines: PromotionLine[]): Promise<number[]> {
  await connectDB();
  const now = new Date();
  const discounts = await Discount.find({ isActive: true }).lean();
  const candidates: number[] = [];

  for (const d of discounts) {
    if (d.startsAt && d.startsAt > now) continue;
    if (d.endsAt && d.endsAt < now) continue;

    const eligibleBase = lines.reduce((sum, l) => {
      const matches =
        d.scope === "all" ||
        (d.scope === "product" && d.productIds.some((id) => String(id) === l.productId)) ||
        (d.scope === "category" && l.categoryId != null && d.categoryIds.some((id) => String(id) === l.categoryId));
      return matches ? sum + l.lineTotal : sum;
    }, 0);

    const amount = reductionAmount({ type: d.type, value: d.value } as Reduction, eligibleBase);
    if (amount > 0) candidates.push(amount);
  }
  return candidates;
}

export type CouponValidation =
  | { ok: true; coupon: CouponDoc & { _id: unknown }; reduction: number }
  | { ok: false; reason: string };

/** Validate a coupon code against window / usage / minimum subtotal (no increment). */
export async function validateCoupon(code: string, subtotal: number): Promise<CouponValidation> {
  await connectDB();
  const coupon = await Coupon.findOne({ code: code.toUpperCase().trim(), isActive: true }).lean();
  if (!coupon) return { ok: false, reason: "INVALID" };

  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now) return { ok: false, reason: "NOT_STARTED" };
  if (coupon.endsAt && coupon.endsAt < now) return { ok: false, reason: "EXPIRED" };
  if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) return { ok: false, reason: "USAGE_LIMIT" };
  if (subtotal < (coupon.minSubtotal ?? 0)) return { ok: false, reason: "MIN_SUBTOTAL" };

  const reduction = reductionAmount({ type: coupon.type, value: coupon.value } as Reduction, subtotal);
  if (reduction <= 0) return { ok: false, reason: "NO_VALUE" };
  return { ok: true, coupon: coupon as CouponDoc & { _id: unknown }, reduction };
}

/**
 * Atomically redeem a coupon: increment `usedCount` only if still under the limit.
 * Returns true if the redemption was counted. Safe under concurrency.
 */
export async function redeemCoupon(code: string): Promise<boolean> {
  await connectDB();
  const normalized = code.toUpperCase().trim();
  // Unlimited coupons: best-effort increment.
  const unlimited = await Coupon.updateOne(
    { code: normalized, isActive: true, usageLimit: 0 },
    { $inc: { usedCount: 1 } },
  );
  if (unlimited.modifiedCount === 1) return true;
  // Limited coupons: only increment while usedCount < usageLimit (atomic guard).
  const limited = await Coupon.updateOne(
    { code: normalized, isActive: true, $expr: { $lt: ["$usedCount", "$usageLimit"] } },
    { $inc: { usedCount: 1 } },
  );
  return limited.modifiedCount === 1;
}

/** Build the line metadata the promotion engine needs (productId + categoryId per line). */
export async function buildPromotionLines(
  items: Array<{ productId: string; lineTotal: number }>,
): Promise<PromotionLine[]> {
  await connectDB();
  const ids = [...new Set(items.map((i) => i.productId))];
  const products = await Product.find({ _id: { $in: ids } }, { category: 1 }).lean();
  const catMap = new Map<string, string>(
    (products as Array<{ _id: unknown; category: unknown }>).map((p) => [String(p._id), String(p.category)]),
  );
  return items.map((i) => ({ productId: i.productId, categoryId: catMap.get(i.productId), lineTotal: i.lineTotal }));
}

export function couponError(reason: string): never {
  throw Errors.validation({ code: "COUPON_" + reason, message: "Coupon cannot be applied" });
}
