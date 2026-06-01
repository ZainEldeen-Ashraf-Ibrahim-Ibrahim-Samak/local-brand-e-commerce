import { test, expect } from "@playwright/test";

const adminEmail = process.env.E2E_ADMIN_EMAIL || "admin@example.com";
const adminPassword = process.env.E2E_ADMIN_PASSWORD || "change-me";

test.describe("Accounts & Support E2E flow", () => {
  // Check if credentials are set
  test.skip(!adminEmail || !adminPassword, "Needs E2E admin credentials");

  test("admin can provision buyer, buyer signs in, guest submits inquiry and admin handles it", async ({ page }) => {
    // 1. Admin logs in
    await page.goto("/en/login");
    await page.getByLabel("Email").fill(adminEmail);
    await page.getByLabel("Password").fill(adminPassword);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/admin/);

    // 2. Go to staff accounts page
    await page.goto("/en/admin/accounts");
    await expect(page.getByRole("heading", { name: /staff accounts/i })).toBeVisible();

    // 3. Create a new buyer account via temporary password
    const testBuyerEmail = `e2ebuyer_${Date.now()}@example.com`;
    const testBuyerName = "E2E Buyer User";
    const testBuyerPassword = "buyer-temp-password-123";

    await page.getByLabel("Full Name").fill(testBuyerName);
    await page.getByLabel("Email Address").fill(testBuyerEmail);
    await page.getByLabel("Role").selectOption("buyer");
    await page.getByLabel("Method").selectOption("temp-password");
    await page.getByLabel("Temporary Password").fill(testBuyerPassword);
    await page.getByRole("button", { name: /create/i }).click();

    // Verify success banner/alert
    await expect(page.getByText(/created successfully/i)).toBeVisible();

    // Verify the user is added to the table
    await expect(page.locator("table")).toContainText(testBuyerEmail);

    // 4. Sign out
    await page.context().clearCookies();

    // 5. Try to sign in as the new buyer
    await page.goto("/en/login");
    await page.getByLabel("Email").fill(testBuyerEmail);
    await page.getByLabel("Password").fill(testBuyerPassword);
    await page.getByRole("button", { name: /sign in/i }).click();

    // Buyer should be redirected to seller dashboard (under /en/seller)
    await expect(page).toHaveURL(/\/seller/);

    // 6. Clear buyer session
    await page.context().clearCookies();

    // 7. Go to contact page as guest
    await page.goto("/en/contact");
    await expect(page.getByRole("heading", { name: /contact/i })).toBeVisible();

    // 8. Submit a support inquiry
    const inquiryName = "Guest User";
    const inquiryEmail = "guest@example.com";
    const inquirySubject = `E2E Inquiry ${Date.now()}`;
    const inquiryMessage = "This is a test support message submitted by Playwright E2E.";

    await page.getByLabel("Name").fill(inquiryName);
    await page.getByLabel("Email").fill(inquiryEmail);
    await page.getByLabel("Subject").fill(inquirySubject);
    await page.getByLabel("Message").fill(inquiryMessage);
    await page.getByRole("button", { name: /send/i }).click();

    // Expect success banner
    await expect(page.getByText(/successfully/i)).toBeVisible();

    // 9. Sign in back as admin to verify the inbox
    await page.context().clearCookies();
    await page.goto("/en/login");
    await page.getByLabel("Email").fill(adminEmail);
    await page.getByLabel("Password").fill(adminPassword);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/admin/);

    // 10. Go to support inbox
    await page.goto("/en/admin/support");
    await expect(page.getByRole("heading", { name: /support inbox/i })).toBeVisible();

    // Verify the inquiry is in the inbox list
    await expect(page.locator("body")).toContainText(inquirySubject);
  });
});
