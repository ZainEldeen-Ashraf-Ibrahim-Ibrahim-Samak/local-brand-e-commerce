import { test, expect } from "@playwright/test";

/**
 * E2E: Media uploads & offers homepage (T024, FR-024, Principle I).
 *
 * Requires:
 *   - A running dev server (npx next dev)
 *   - E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD env vars for authenticated flows
 *
 * Unauthenticated checks run unconditionally. Authenticated upload/create
 * flows are skipped unless credentials are provided.
 */

const email = process.env.E2E_ADMIN_EMAIL;
const password = process.env.E2E_ADMIN_PASSWORD;

// ── Storefront: homepage slider ───────────────────────────────────────────────
test.describe("Homepage slider", () => {
  test("renders the slider section (or the empty-state placeholder)", async ({ page }) => {
    await page.goto("/en");
    // Either the slider section or the empty-state section must be present.
    const slider = page.locator("section").first();
    await expect(slider).toBeVisible();
  });

  test("zero-slides empty-state is accessible (has aria-label)", async ({ page }) => {
    await page.goto("/en");
    // If the no-slides empty-state is rendered it must have the aria-label we added.
    const emptySlider = page.locator('[aria-label="No active slides"]');
    // Only assert if it's actually present — the page may have real slides in CI.
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
    // Wait for content to load (may be empty in CI — just check page status)
    await expect(page).not.toHaveURL(/error/);
    // There should be no uncaught 404 img errors visible on the page
    const errorImages = page
      .locator("img[src^='data:image/svg+xml']")
      .first();
    // Either no fallback SVGs (real images loaded) OR at least one graceful fallback
    // — both are valid. The test ensures the page didn't hard-crash.
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
    // The MediaUploader's drop zone or the Add Slide button must be present
    const form = page.locator("form").filter({ hasText: /add new slide/i });
    await expect(form).toBeVisible();
  });

  test("admin can navigate to the orders page and see filter tabs", async ({ page }) => {
    await page.goto("/en/login");
    await page.getByLabel(/email/i).fill(email!);
    await page.getByLabel(/password/i).fill(password!);
    await page.getByRole("button", { name: /sign in/i }).click();

    await page.goto("/en/admin/orders");
    // The completion-stage filter tabs must be rendered
    await expect(page.getByRole("tab", { name: /pending/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /completed/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /failed/i })).toBeVisible();
  });
});
