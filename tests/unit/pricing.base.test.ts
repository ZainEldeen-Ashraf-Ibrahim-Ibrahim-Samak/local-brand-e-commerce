import { describe, it, expect } from "vitest";
import { resolveCart, resolveLine } from "@/lib/pricing/resolve";

describe("pricing resolver — base (T035)", () => {
  it("computes line total from unit price * quantity with no discounts", () => {
    const line = resolveLine({ unitPrice: 5000, quantity: 3 });
    expect(line.appliedUnitDiscount).toBe(0);
    expect(line.lineTotal).toBe(15000);
  });

  it("computes subtotal + exclusive tax + shipping", () => {
    const result = resolveCart({
      lines: [
        { unitPrice: 5000, quantity: 2 }, // 10000
        { unitPrice: 3000, quantity: 1 }, // 3000
      ],
      taxRateBasisPoints: 1400, // 14%
      taxInclusive: false,
      shippingCost: 3000,
    });
    expect(result.subtotal).toBe(13000);
    expect(result.taxTotal).toBe(1820); // 13000 * 0.14
    expect(result.shippingCost).toBe(3000);
    expect(result.grandTotal).toBe(13000 + 1820 + 3000);
  });

  it("extracts tax portion when tax is inclusive (not added on top)", () => {
    const result = resolveCart({
      lines: [{ unitPrice: 11400, quantity: 1 }],
      taxRateBasisPoints: 1400,
      taxInclusive: true,
      shippingCost: 0,
    });
    expect(result.subtotal).toBe(11400);
    // tax portion = 11400 * 1400 / 11400... extracted from inclusive price
    expect(result.taxTotal).toBe(Math.round((11400 * 1400) / 11400));
    expect(result.grandTotal).toBe(11400); // not added on top
  });
});
