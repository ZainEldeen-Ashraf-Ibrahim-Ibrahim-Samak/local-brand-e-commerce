/**
 * Pure pricing resolver (research R4). All money is integer minor units.
 *
 * No-stacking rule (spec FR-038): a coupon never compounds with an active
 * discount — the LARGER single reduction wins. US1 passes no discounts/coupons;
 * US5 supplies candidate reductions via `reductions`. Keeping the logic here keeps
 * pricing deterministic and unit-testable.
 */
export type PriceLineInput = {
  unitPrice: number; // list price (minor units)
  quantity: number;
  /** Best automatic product/category discount reduction per unit (minor units). */
  discountPerUnit?: number;
  /** Coupon reduction per unit if a coupon targets this line (minor units). */
  couponPerUnit?: number;
};

export type PriceLineResult = {
  unitPrice: number;
  appliedUnitDiscount: number;
  quantity: number;
  lineTotal: number;
};

export function resolveLine(input: PriceLineInput): PriceLineResult {
  const discount = Math.max(0, input.discountPerUnit ?? 0);
  const coupon = Math.max(0, input.couponPerUnit ?? 0);
  // No stacking: take the larger single reduction, capped at the unit price.
  const reduction = Math.min(input.unitPrice, Math.max(discount, coupon));
  const effectiveUnit = input.unitPrice - reduction;
  return {
    unitPrice: input.unitPrice,
    appliedUnitDiscount: reduction,
    quantity: input.quantity,
    lineTotal: effectiveUnit * input.quantity,
  };
}

/** A percentage (basis points) or fixed (minor units) reduction (coupon or discount). */
export type Reduction = { type: "percentage" | "fixed"; value: number };

/**
 * Convert a coupon/discount definition into a concrete minor-unit reduction against
 * an eligible base. Percentage `value` is basis points (1400 = 14%); fixed `value`
 * is minor units. Result is rounded and clamped to the base (never negative).
 */
export function reductionAmount(r: Reduction, base: number): number {
  if (base <= 0 || r.value <= 0) return 0;
  const raw = r.type === "percentage" ? Math.round((base * r.value) / 10000) : r.value;
  return Math.min(Math.max(0, raw), base);
}

/** Largest single reduction (no stacking, research R4 / FR-038). Clamped to subtotal. */
export function bestReduction(candidates: number[], subtotal: number): number {
  const valid = candidates.filter((c) => c > 0);
  if (valid.length === 0) return 0;
  return Math.min(Math.max(...valid), subtotal);
}

export type CartPriceInput = {
  lines: PriceLineInput[];
  /** Cart-level candidate reductions (discounts + coupon); only the largest applies. */
  reductions?: number[];
  taxRateBasisPoints: number; // e.g. 1400 = 14%
  taxInclusive?: boolean;
  shippingCost?: number;
};

export type CartPriceResult = {
  lines: PriceLineResult[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  shippingCost: number;
  grandTotal: number;
};

/** Compute full cart totals: subtotal (after discounts) + tax + shipping. */
export function resolveCart(input: CartPriceInput): CartPriceResult {
  const lines = input.lines.map(resolveLine);
  const grossSubtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
  const lineDiscount = lines.reduce((sum, l) => sum + l.appliedUnitDiscount * l.quantity, 0);

  // Cart-level reduction: the single largest candidate (never summed — FR-038).
  const cartReduction = bestReduction(input.reductions ?? [], grossSubtotal);
  const subtotalAfter = grossSubtotal - cartReduction;
  const discountTotal = lineDiscount + cartReduction;
  const shippingCost = input.shippingCost ?? 0;

  let taxTotal: number;
  if (input.taxInclusive) {
    // Tax already included in prices: extract the tax portion for display.
    taxTotal = Math.round((subtotalAfter * input.taxRateBasisPoints) / (10000 + input.taxRateBasisPoints));
  } else {
    taxTotal = Math.round((subtotalAfter * input.taxRateBasisPoints) / 10000);
  }

  const grandTotal = input.taxInclusive
    ? subtotalAfter + shippingCost
    : subtotalAfter + taxTotal + shippingCost;

  return { lines, subtotal: grossSubtotal, discountTotal, taxTotal, shippingCost, grandTotal };
}
