import { describe, it, expect } from "vitest";
import { resolveCart, reductionAmount, bestReduction, type Reduction } from "@/lib/pricing/resolve";

/**
 * FR-038 / research R4: a coupon never stacks with an active discount. When both
 * are eligible, the single largest reduction applies — reductions are never summed.
 */
describe("pricing resolver (no stacking)", () => {
  it("applies the larger of an active discount vs a coupon (never both)", () => {
    const subtotal = 10000;
    const discount: Reduction = { type: "percentage", value: 1000 }; // 10% = 1000
    const coupon: Reduction = { type: "fixed", value: 2500 }; // 2500

    const discountAmt = reductionAmount(discount, subtotal); // 1000
    const couponAmt = reductionAmount(coupon, subtotal); // 2500

    const r = resolveCart({
      lines: [{ unitPrice: 10000, quantity: 1 }],
      reductions: [discountAmt, couponAmt],
      taxRateBasisPoints: 0,
    });

    expect(discountAmt).toBe(1000);
    expect(couponAmt).toBe(2500);
    // Larger single reduction wins; not summed (would be 3500).
    expect(r.discountTotal).toBe(2500);
    expect(r.grandTotal).toBe(7500);
  });

  it("falls back to the discount when it beats the coupon", () => {
    const subtotal = 10000;
    const discountAmt = reductionAmount({ type: "percentage", value: 4000 }, subtotal); // 40% = 4000
    const couponAmt = reductionAmount({ type: "fixed", value: 1500 }, subtotal); // 1500
    expect(bestReduction([discountAmt, couponAmt], subtotal)).toBe(4000);
  });

  it("clamps a reduction to the subtotal (never negative totals)", () => {
    expect(reductionAmount({ type: "fixed", value: 999999 }, 5000)).toBe(5000);
    expect(reductionAmount({ type: "percentage", value: 20000 }, 5000)).toBe(5000);
  });
});
