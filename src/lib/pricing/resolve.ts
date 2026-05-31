/**
 * Pure pricing resolver (research R4). All money is integer minor units.
 *
 * No-stacking rule (spec FR-038): a coupon never compounds with an active
 * discount on the same item — the LARGER single reduction wins. US1 passes no
 * discounts/coupons; US5 supplies them. Keeping the logic here keeps pricing
 * deterministic and unit-testable.
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

export type CartPriceInput = {
  lines: PriceLineInput[];
  taxRateBasisPoints: number; // e.g. 1400 = 14%
  taxInclusive: boolean;
  shippingCost: number;
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
  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
  const discountTotal = lines.reduce((sum, l) => sum + l.appliedUnitDiscount * l.quantity, 0);

  let taxTotal: number;
  if (input.taxInclusive) {
    // Tax already included in prices: extract the tax portion for display.
    taxTotal = Math.round((subtotal * input.taxRateBasisPoints) / (10000 + input.taxRateBasisPoints));
  } else {
    taxTotal = Math.round((subtotal * input.taxRateBasisPoints) / 10000);
  }

  const grandTotal = input.taxInclusive
    ? subtotal + input.shippingCost
    : subtotal + taxTotal + input.shippingCost;

  return { lines, subtotal, discountTotal, taxTotal, shippingCost: input.shippingCost, grandTotal };
}
