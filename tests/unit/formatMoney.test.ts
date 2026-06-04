import { describe, it, expect } from "vitest";
import { formatMoney } from "@/lib/format";

describe("formatMoney (FR-021 + resilience)", () => {
  it("formats a valid currency code", () => {
    const out = formatMoney(12000, "en", { code: "USD", rate: 1 });
    expect(out).toContain("120");
  });

  it("applies the exchange rate to convert from base", () => {
    const out = formatMoney(10000, "en", { code: "USD", rate: 2 });
    expect(out).toContain("200");
  });

  it("does not throw on an invalid currency code (stray character)", () => {
    expect(() => formatMoney(12000, "en", { code: "ÙEGP", symbol: "E£", rate: 1 })).not.toThrow();
    // The stray char is stripped → resolves to a valid EGP formatting.
    const out = formatMoney(12000, "en", { code: "ÙEGP", symbol: "E£", rate: 1 });
    expect(out).toMatch(/120/);
  });

  it("falls back to symbol + number for a non-resolvable code", () => {
    const out = formatMoney(5000, "en", { code: "??", symbol: "₿", rate: 1 });
    expect(out).toContain("₿");
    expect(out).toContain("50");
  });
});
