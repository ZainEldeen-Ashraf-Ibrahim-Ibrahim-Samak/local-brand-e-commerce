# Phase 0 Research: Accounts, Support, Customer Records & Content Pages

All Technical Context items are inherited from `001-ecommerce-platform` (no NEEDS CLARIFICATION
remained after `/speckit-clarify`). Research here records the design decisions for the four new
capabilities, grounded in the existing codebase.

## R1 — Staff account credential provisioning (FR-101)

- **Decision**: Support both flows on one create endpoint via a `method` field. `temp_password` →
  admin supplies an initial password, stored bcrypt-hashed (reuse `001` bcryptjs hashing); the user
  signs in immediately and changes it later. `invite` → generate a cryptographically random token,
  store only its SHA-256 hash plus an expiry (default 72h) on the `User`, and email the plaintext token
  as an accept-invite link; the user posts the token + chosen password to `POST /api/auth/invite`,
  which verifies, hashes the password, clears the invite fields, and activates the account.
- **Rationale**: One model + one collection serves both flows; hashing the invite token (never storing
  plaintext) and expiring it satisfies Principle III. Reuses the existing SMTP transport.
- **Alternatives considered**: Separate `Invitation` collection (rejected — adds a model for data that
  belongs to the pending user); magic-link passwordless sign-in (rejected — out of scope, `001` is
  password-credentials based).

## R2 — Account status & last-admin protection (FR-102/FR-104)

- **Decision**: Reuse the existing `User.isActive` boolean for activate/deactivate (soft only; no hard
  delete). Add a `pending` state for invited-but-not-accepted accounts via `isActive=false` +
  presence of invite fields. Before any deactivation/role-change away from admin, the service counts
  active admins with `isActive:true, role:"admin"` excluding the target; if the result is zero, reject
  with a 422. Auth.js session callback already reads the user; deactivated users fail the next
  server-side `requireUser` because the credentials/session lookup checks `isActive`.
- **Rationale**: Minimal schema change; guarantees the store always retains administrative access.
- **Alternatives considered**: Soft-delete `deletedAt` timestamp (rejected — `isActive` already models
  this and is used by `001`).

## R3 — Support inquiry submission, rate-limiting & non-enumeration (FR-107/108/112)

- **Decision**: New `SupportInquiry` collection. Guest `POST /api/storefront/support` validates input
  with Zod and applies a Redis fixed-window rate limit keyed by client IP + email (e.g. 5 / 10 min),
  reusing the Redis client used for `001` tracking. An optional `orderNumber` is stored verbatim as a
  best-effort reference and is **never** validated against the Order collection in a way that leaks
  existence — the submitter always receives the same uniform "received" acknowledgement. On success the
  service fires an admin-alert email (non-blocking) and returns confirmation.
- **Rationale**: Mirrors the non-enumeration posture of `001` order tracking (R5 there); rate limiting
  protects the inbox without harming legitimate users (Principle VI).
- **Alternatives considered**: CAPTCHA (rejected for v1 — no new dependency; rate limit suffices);
  validating the order reference and showing order context (rejected — would enable enumeration).

## R4 — Admin alert email for new inquiries (FR-122)

- **Decision**: Extract the SMTP transport currently private to `lib/notifications/dispatcher.ts` into a
  reusable `lib/notifications/email.ts` exposing `sendEmail(to, subject, text)` and a thin
  `sendAdminEmail(subject, text)` that targets the configured store/admin address
  (`WebsiteSettings.contactPage.email` or an env fallback). The dispatcher keeps using it for orders.
  Inquiry alerts are fire-and-forget (`void`-ed, logged on failure) so the submitter is never blocked.
- **Rationale**: Avoids duplicating SMTP setup; the existing dispatcher is order-coupled
  (`NotificationLog.orderId` is required), so a generic helper is the clean seam.
- **Alternatives considered**: Forcing inquiries through `dispatchOrderNotification` (rejected — requires
  an orderId and WhatsApp; inappropriate for a non-order admin alert).

## R5 — Customer records as read-only aggregation (FR-113–116)

- **Decision**: No stored customer entity. `customers.admin.service` runs a MongoDB aggregation over
  `Order`, grouping by the lowercased checkout email: `{ email, name (latest), whatsapp (latest),
  orderCount, totalSpend (sum of order totals), lastOrderAt }`, with `$match` for the search term
  (email/name/whatsapp regex, case-insensitive) and pagination. Detail view queries orders for one
  email. Read-only; never affects checkout (FR-116).
- **Rationale**: Guests have no account; the order log is the source of truth. Aggregation keeps data
  consistent (SC-105) with zero sync risk.
- **Alternatives considered**: Materialized `Customer` collection updated on order write (rejected —
  premature; introduces consistency burden for v1 volumes).

## R6 — Storefront About/Contact pages (FR-117–121)

- **Decision**: Two new Server Component pages under `(storefront)` that read the Redis-cached
  `WebsiteSettings` via the existing settings service. About renders `aboutPage.body`; Contact renders
  `contactPage.{body,email,phone,whatsapp,address}` + `socialLinks` and embeds the client `ContactForm`.
  Both use shared `Card`/typography primitives, localized via next-intl, with empty-state fallbacks when
  content is unset (FR-121). Header nav and footer columns link to `/about` and `/contact` (FR-119).
- **Rationale**: Content already exists in the admin-editable singleton (Principle V); only rendering +
  navigation were missing. Cached read keeps it fast (Principle VI).
- **Alternatives considered**: A generic CMS page model (rejected — over-engineering; the two pages are
  fixed and already modeled in WebsiteSettings).

## Summary of new/changed surfaces

| Area | New collections | New services | New endpoints | New pages |
|------|-----------------|--------------|---------------|-----------|
| Accounts | (User invite fields) | accounts.admin.service | `/api/admin/accounts`(+`[id]`), `/api/auth/invite` | admin/accounts |
| Support | SupportInquiry | support.service | `/api/storefront/support`, `/api/admin/support`(+`[id]`) | contact, admin/support |
| Customers | none (aggregation) | customers.admin.service | `/api/admin/customers`(+`[email]`) | admin/customers(+detail) |
| Content | none | (reuse settings.service) | none | about, contact |

**Output**: All decisions resolved; no remaining unknowns. Proceed to Phase 1.
