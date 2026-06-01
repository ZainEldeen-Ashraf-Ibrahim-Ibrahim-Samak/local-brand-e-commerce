import { test, expect } from "@playwright/test";

/**
 * US3 admin smoke E2E. Requires a seeded admin account (see scripts/seed.ts) and a
 * running server. Credentials come from env so secrets stay out of the repo:
 *   E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD
 */
const email = process.env.E2E_ADMIN_EMAIL;
const password = process.env.E2E_ADMIN_PASSWORD;

test.describe("Admin smoke", () => {
  test("admin area redirects anonymous users to login", async ({ page }) => {
    await page.goto("/en/admin");
    await expect(page).toHaveURL(/\/login/);
  });

  test.skip(!email || !password, "set E2E_ADMIN_EMAIL/E2E_ADMIN_PASSWORD to run authenticated smoke");

  test("admin can sign in and reach the dashboard", async ({ page }) => {
    await page.goto("/en/login");
    await page.getByLabel("Email").fill(email!);
    await page.getByLabel("Password").fill(password!);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/admin/);
    await expect(page.getByRole("heading", { name: /dashboard/i })).toBeVisible();
  });
});
