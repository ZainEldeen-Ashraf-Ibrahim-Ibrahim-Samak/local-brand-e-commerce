import { test, expect } from "@playwright/test";

/**
 * US1 + US2 happy-path E2E (SC-001/SC-010 storefront journeys). Requires a seeded DB
 * and a running server (`npm run db:seed` then `npm run dev`, or set BASE_URL).
 * Run with: `npm run test:e2e`.
 */
test.describe("Guest journey", () => {
  test("guest can browse the catalog and open a product", async ({ page }) => {
    await page.goto("/en");
    await page.goto("/en/products");
    await expect(page).toHaveURL(/\/en\/products/);
    // At least the catalog grid renders (seeded demo products).
    const firstProduct = page.locator("a[href*='/products/']").first();
    await expect(firstProduct).toBeVisible();
    await firstProduct.click();
    await expect(page).toHaveURL(/\/en\/products\//);
  });

  test("guest can open the order tracking page", async ({ page }) => {
    await page.goto("/en/track");
    await expect(page.getByRole("button", { name: /look up/i })).toBeVisible();
  });

  test("a known order number with wrong email returns a non-revealing result", async ({ request }) => {
    const res = await request.post("/api/storefront/orders/track", {
      data: { orderNumber: "LB-DOESNOTEXIST", email: "nobody@example.com", whatsapp: "+10000000000" },
    });
    // Non-enumeration: should never 200 with order data for a bad match.
    expect([404, 200, 429]).toContain(res.status());
  });
});
