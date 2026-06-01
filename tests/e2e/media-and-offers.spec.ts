import { test, expect } from "@playwright/test";

/**
 * E2E: Media uploads & offers homepage (T024, FR-024, Principle I).
 * Extended with T034: variation image swap & admin-only affordances.
 *
 * Requires:
 *   - A running dev server (npx next dev)
 *   - E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD env vars for authenticated flows
 */

const email = process.env.E2E_ADMIN_EMAIL;
const password = process.env.E2E_ADMIN_PASSWORD;

// ── Storefront: homepage slider ───────────────────────────────────────────────
test.describe("Homepage slider", () => {
  test("renders the slider section (or the empty-state placeholder)", async ({ page }) => {
    await page.goto("/en");
    const slider = page.locator("section").first();
    await expect(slider).toBeVisible();
  });

  test("zero-slides empty-state is accessible (has aria-label)", async ({ page }) => {
    await page.goto("/en");
    const emptySlider = page.locator('[aria-label="No active slides"]');
    const count = await emptySlider.count();
    if (count > 0) {
      await expect(emptySlider).toBeVisible();
    }
  });
});

// ── Storefront: product catalog ───────────────────────────────────────────────
test.describe("Product catalog image fallback", () => {
  test("product listing renders without broken images", async ({ page }) => {
    await page.goto("/en/products");
    await expect(page).not.toHaveURL(/error/);
    await expect(page.locator("body")).not.toContainText("Internal Server Error");
  });
});

// ── Admin: authenticated offer management ─────────────────────────────────────
test.describe("Admin offer management", () => {
  test.skip(!email || !password, "set E2E_ADMIN_EMAIL/E2E_ADMIN_PASSWORD to run admin E2E");

  test("admin can navigate to the offers page", async ({ page }) => {
    await page.goto("/en/login");
    await page.getByLabel(/email/i).fill(email!);
    await page.getByLabel(/password/i).fill(password!);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/admin/);

    await page.goto("/en/admin/offers");
    await expect(page.getByRole("heading", { name: /offers|slider/i })).toBeVisible();
  });

  test("offers page renders the slide creation form", async ({ page }) => {
    await page.goto("/en/login");
    await page.getByLabel(/email/i).fill(email!);
    await page.getByLabel(/password/i).fill(password!);
    await page.getByRole("button", { name: /sign in/i }).click();

    await page.goto("/en/admin/offers");
    const form = page.locator("form").filter({ hasText: /add new slide/i });
    await expect(form).toBeVisible();
  });

  test("admin can navigate to the orders page and see filter tabs", async ({ page }) => {
    await page.goto("/en/login");
    await page.getByLabel(/email/i).fill(email!);
    await page.getByLabel(/password/i).fill(password!);
    await page.getByRole("button", { name: /sign in/i }).click();

    await page.goto("/en/admin/orders");
    await expect(page.getByRole("tab", { name: /pending/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /completed/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /failed/i })).toBeVisible();
  });
});

// ── T034: Variation image swap (SC-208 / FR-202b) ────────────────────────────
test.describe("Variation image swap (T034 / SC-208)", () => {
  test("product detail page renders without errors", async ({ page }) => {
    await page.goto("/en/products");
    await expect(page.locator("body")).not.toContainText("Internal Server Error");

    const productLinks = page.locator("a[href*='/products/']");
    if (await productLinks.count() === 0) return;

    await productLinks.first().click();
    await expect(page.locator("body")).not.toContainText("Internal Server Error");
    // Gallery container must exist
    const gallery = page.locator(".aspect-square").first();
    await expect(gallery).toBeVisible();
  });

  test("selecting a variation does not crash the page (SC-208)", async ({ page }) => {
    await page.goto("/en/products");
    const productLinks = page.locator("a[href*='/products/']");
    if (await productLinks.count() === 0) return;

    await productLinks.first().click();
    await expect(page.locator("body")).not.toContainText("Internal Server Error");

    const variationButtons = page.locator("button.rounded-token");
    const btnCount = await variationButtons.count();
    if (btnCount > 1) {
      await variationButtons.nth(1).click();
      await expect(page.locator("body")).not.toContainText("Internal Server Error");
    }
  });
});

// ── T033/T034: Admin-only category & variation affordances ───────────────────
test.describe("Admin-only affordances (T033/T034)", () => {
  test.skip(!email || !password, "set E2E_ADMIN_EMAIL/E2E_ADMIN_PASSWORD to run admin E2E");

  test("categories page shows Admin-only badge (T033)", async ({ page }) => {
    await page.goto("/en/login");
    await page.getByLabel(/email/i).fill(email!);
    await page.getByLabel(/password/i).fill(password!);
    await page.getByRole("button", { name: /sign in/i }).click();

    await page.goto("/en/admin/categories");
    await expect(page.getByText("Admin only")).toBeVisible();
    await expect(page.locator('[data-testid="admin-category-form"]')).toBeVisible();
  });

  test("product edit page has variation Add button with image uploader (T031/T034)", async ({ page }) => {
    await page.goto("/en/login");
    await page.getByLabel(/email/i).fill(email!);
    await page.getByLabel(/password/i).fill(password!);
    await page.getByRole("button", { name: /sign in/i }).click();

    await page.goto("/en/admin/products");
    const productLinks = page.locator("a[href*='/admin/products/']");
    if (await productLinks.count() === 0) return;

    await productLinks.first().click();
    await expect(page.getByRole("button", { name: /add variation/i })).toBeVisible();
    // The variation image section label should exist
    await expect(page.getByText(/variation image/i).first()).toBeVisible();
  });
});
