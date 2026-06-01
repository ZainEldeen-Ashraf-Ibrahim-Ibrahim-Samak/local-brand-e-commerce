# Quickstart: Accounts, Support, Customer Records & Content Pages

This feature extends the running `001-ecommerce-platform`. No new environment variables or dependencies
are required; it reuses the existing MongoDB, Redis, and SMTP configuration.

## Prerequisites

- `001` is set up and runnable (`.env.local` with `MONGODB_URI`, `REDIS_URL`/Upstash, `SMTP_*`,
  `WHATSAPP_*`, Cloudinary, `AUTH_SECRET`), and an initial admin exists (`npm run db:seed`).
- Optional: set the admin-alert recipient. The Contact-page email (`WebsiteSettings.contactPage.email`)
  is used; add `SUPPORT_ALERT_EMAIL` as an env fallback if that field is empty.

## Validate each user story

### US1 — Staff accounts
1. Sign in as admin → go to `/{locale}/admin/accounts`.
2. **Temp password**: create a buyer with method "temp password"; sign out; sign in as that buyer →
   land on `/{locale}/seller`. (SC-101, target < 2 min.)
3. **Invite**: create a buyer with method "invite"; open the invite link from the email (or logged dev
   link) → set a password at the accept page → sign in.
4. Deactivate that buyer → confirm sign-in is now rejected.
5. Try to deactivate the only admin → confirm it is blocked with the "last admin" message (SC-102).

### US2 — Support inquiries
1. As a guest, open `/{locale}/contact`, submit the form → see the success confirmation (SC-103).
2. Submit rapidly several times → confirm rate-limiting kicks in (HTTP 429).
3. As admin, open `/{locale}/admin/support` → the inquiry appears newest-first; advance
   `new → in_progress → resolved` and confirm status + history update.
4. Confirm an admin-alert email was attempted (check logs if SMTP is sandboxed).

### US3 — Customer records
1. Seed/place a few guest orders sharing one email.
2. As admin, open `/{locale}/admin/customers` → that customer appears once with correct order count and
   total spend (SC-105). Search by email/name/WhatsApp.
3. Open the customer → see full order history linking to each order (SC-104, target < 30s).

### US4 — About / Contact pages
1. In admin settings, set About body and Contact details.
2. Visit `/{locale}/about` and `/{locale}/contact` in both `ar` and `en`, dark and light, on a narrow
   viewport → content renders correctly, no broken layout, nav links work (SC-106).
3. Clear the About body → confirm the empty-state placeholder (not an error).

## Tests

```bash
npm run test            # unit + integration (Vitest, MongoDB Memory Server)
npm run test:e2e        # Playwright: accounts-support journey
```

Critical-path tests to confirm green before shipping:
- `tests/unit/accounts.last-admin.test.ts` — last active admin cannot be deactivated (FR-104).
- `tests/unit/customers.aggregation.test.ts` — spend totals equal underlying orders (SC-105).
- `tests/integration/accounts.create.test.ts` — email uniqueness + admin-only (FR-103/105).
- `tests/integration/support.submit.test.ts` — rate-limit + non-enumeration (FR-108/112).
