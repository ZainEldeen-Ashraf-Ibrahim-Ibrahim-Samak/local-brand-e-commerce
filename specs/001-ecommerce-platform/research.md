# Phase 0 Research: Local Brand E-Commerce Platform

**Feature**: 001-ecommerce-platform | **Date**: 2026-05-30

This document resolves the open/deferred unknowns from the spec clarification and the Technical
Context, and records best-practice decisions for the fixed technology stack (per constitution v1.0.0).

---

## R1. Payment gateway provider (deferred from clarify)

- **Decision**: Integrate through a **provider-agnostic payment adapter** (`lib/payments`) with a
  **hosted-checkout / redirect-or-SDK** flow, and ship **Stripe** as the default v1 provider behind
  that interface. The adapter exposes `createPaymentSession`, `verifyWebhook`, and `getPaymentStatus`
  so a regional provider (e.g., Paymob, Tap, PayTabs) can replace Stripe without touching order logic.
- **Rationale**: The constitution mandates a secure gateway and that the app never stores card data.
  A hosted/redirect flow keeps the app out of PCI scope. An adapter avoids lock-in for a local brand
  that may later need a MENA-region processor for local cards/wallets.
- **Alternatives considered**: Direct single-provider coupling (rejected — lock-in, harder regional
  swap); storing card data / custom card form (rejected — unacceptable PCI and security exposure per
  Principle III).

## R2. Reliability & observability targets (deferred from clarify)

- **Decision**: Target **99.9% monthly availability** for the storefront; structured JSON logging for
  all API handlers with request correlation IDs; capture metrics for checkout success rate, order
  notification delivery, cache hit ratio, and stock-conflict rate; alert on payment-webhook failures
  and notification-dispatch failures. Health endpoint for the hosting platform's load balancer.
- **Rationale**: Revenue-critical paths (checkout, notifications) need visibility to meet SC-003 and
  SC-004. 99.9% is a realistic single-region target for v1 without multi-region complexity.
- **Alternatives considered**: No formal targets (rejected — unverifiable operations, Principle VI);
  full distributed tracing/APM (deferred — valuable but beyond v1 scope, can be added later).

## R3. No-oversell concurrency control (FR-034, SC-010)

- **Decision**: On checkout confirmation, decrement stock using an **atomic conditional MongoDB
  update** (`updateOne` with `stock >= qty` filter and `$inc`) per variation, wrapped in a
  **multi-document transaction** spanning the order's line items. Use a short-lived **Redis lock**
  keyed per variation only as a fast pre-check; the database conditional update is the source of truth.
- **Rationale**: The conditional update guarantees no negative stock even under concurrent buyers;
  the transaction makes the whole order atomic so a partial failure rolls back. Redis pre-check
  reduces contention but is not relied on for correctness.
- **Alternatives considered**: Read-then-write without conditional (rejected — race allows oversell);
  Redis-only counters as source of truth (rejected — durability/consistency risk if Redis evicts).

## R4. Pricing engine — discount/coupon no-stacking (FR-024, FR-038)

- **Decision**: A pure `lib/pricing` resolver computes, per line item, the effective unit price as
  `min(price_after_best_active_discount, price_after_applied_coupon)` — i.e., the single **larger
  reduction wins**; the coupon and discount never compound. Order total = sum(line effective) + tax +
  shipping. Coupon validity (dates, usage limit, eligibility) is checked server-side at checkout and
  re-checked at payment confirmation.
- **Rationale**: Matches the clarified no-stacking rule (Q4→A), keeps pricing deterministic and
  unit-testable, and prevents margin erosion.
- **Alternatives considered**: Compounding stack (rejected — clarified out); per-coupon configurable
  stacking (rejected for v1 — added complexity without a stated need).

## R5. Guest order tracking & identity (FR-013)

- **Decision**: Orders are keyed by a unique, non-sequential **order number** (e.g., ULID-based,
  human-readable prefix). Tracking requires an exact match of **order number + email + WhatsApp
  number**; lookups are **rate-limited** (Redis) and return a uniform "not found / mismatch" response
  to avoid enumeration. No guest account or password is created.
- **Rationale**: Satisfies guest-friendly commerce (Principle IV) while preventing order enumeration
  and PII leakage (Principle III). Non-sequential IDs avoid guessability.
- **Alternatives considered**: Email-only tracking (rejected — weak, enumerable); magic-link email
  (deferred — good enhancement but email may be the same channel being tracked).

## R6. Internationalization & RTL (FR-030, SC-008)

- **Decision**: Use **next-intl** with a `[locale]` route segment for `ar` and `en`, message catalogs
  in `src/messages`, and `dir="rtl"` driven by locale at the layout root. Numbers/prices formatted via
  `Intl.NumberFormat` per locale. Logical CSS properties (`ms-`, `me-`, `ps-`, `pe-`) via Tailwind so
  layouts mirror correctly. Admin-configured default language sets the initial locale for new visitors.
- **Rationale**: First-class routing-based i18n with correct RTL is a launch requirement (Principle
  II); logical properties avoid per-direction overrides.
- **Alternatives considered**: Client-only string swap without routing (rejected — poor SEO, no
  per-locale URLs); manual RTL stylesheets (rejected — duplication, maintenance burden).

## R7. Admin-driven theming via design tokens (FR-027, Principle I & V)

- **Decision**: Store **ThemeSettings** (primary/secondary colors, font family/size, layout, default
  mode, default language) as data. At request time, resolve tokens into **CSS custom properties**
  injected on the root element; Tailwind consumes those variables (e.g., `bg-[var(--color-primary)]`
  via a token-mapped theme). Dark/light handled by `next-themes` with both palettes derived from the
  same token set. No hard-coded colors in components.
- **Rationale**: Lets admins re-skin the store with no deploy (Principle V) while keeping one token
  source of truth (Principle I); CSS variables apply instantly for SSR and client.
- **Alternatives considered**: Rebuild Tailwind config per change (rejected — requires deploy);
  inline per-component colors (rejected — violates Principle I).

## R8. Caching strategy (Principle VI, SC-002, SC-009)

- **Decision**: **Cache-aside** in `lib/cache` (Redis) for catalog listings, product detail, category
  trees, website/theme settings, and active promotions. Each write to a product/category/settings/
  promotion **explicitly invalidates** the related keys (tag-style key prefixes). Next.js route-level
  caching/ISR for storefront pages with on-demand revalidation triggered by the same writes.
- **Rationale**: Read-heavy storefront with bursty promo traffic needs cached reads with correct
  invalidation (Principle VI). Explicit invalidation on writes prevents stale catalog/pricing.
- **Alternatives considered**: TTL-only expiry (rejected — risks stale prices during promotions);
  no caching (rejected — fails SC-002/SC-009 under load).

## R9. Media handling (Principle VI, FR-001)

- **Decision**: Upload product/branding images to **Cloudinary**; store the public ID + version on the
  entity; render via `next/image` with a Cloudinary loader producing responsive, format-optimized
  (AVIF/WebP) sizes. Admin uploads go through a signed server-side endpoint.
- **Rationale**: Offloads optimization and delivery, satisfies "optimized media not raw uploads"
  (Principle VI), and keeps Cloudinary credentials server-side (Principle III).
- **Alternatives considered**: Storing raw images in app/DB (rejected — no optimization, scaling
  cost); client-direct unsigned uploads (rejected — abuse risk).

## R10. Notifications: email + WhatsApp with retry (FR-014, FR-015, SC-004)

- **Decision**: A `lib/notifications` dispatcher sends order status-change messages via **SMTP
  (Nodemailer)** and a **WhatsApp Business API** integration. Dispatch is enqueued and processed with
  **bounded retries + exponential backoff**; failures are logged and surfaced to admins but never
  block order status progression. Templates are localized (AR/EN).
- **Rationale**: Meets the 5-minute notification SLA (SC-004) and the requirement that channel
  failures don't block fulfillment (FR-015).
- **Alternatives considered**: Synchronous send inside the request (rejected — a slow/failed channel
  would block order updates); SMS/push (out of scope per Assumptions).

## R11. Authentication & role enforcement (FR-016, FR-017, FR-037)

- **Decision**: **Auth.js (NextAuth) credentials provider** with hashed passwords (bcrypt/argon2) and
  server-side sessions for **admin** and **buyer**. Admin-only provisioning of accounts (no public
  privileged self-registration). Authorization enforced in **middleware** (route-group level) **and**
  re-checked in each API handler/service (defense in depth). Guests are unauthenticated throughout.
- **Rationale**: Server-side authorization on every privileged action is non-negotiable (Principle
  III/IV); admin-only provisioning matches clarification Q3→A.
- **Alternatives considered**: Client-side route guards only (rejected — bypassable); third-party
  IdP/OAuth (deferred — unnecessary for an internal-seller model in v1).

## R12. Testing approach (Technical Context)

- **Decision**: **Vitest + React Testing Library** for component and pure-logic units (pricing,
  stock, validation); **MongoDB Memory Server** for integration tests of services/handlers;
  **Playwright** for the P1 critical journeys (guest purchase, order tracking) and a smoke admin flow.
  Tests are not mandated by spec but included for the revenue-critical and concurrency-sensitive paths.
- **Rationale**: Concurrency (SC-010) and pricing (FR-038) are correctness-critical and cheap to unit
  test; E2E guards the MVP journeys.
- **Alternatives considered**: Manual testing only (rejected — concurrency/pricing regressions are
  easy to introduce and hard to catch by hand).

---

## Resolved unknowns summary

| Unknown | Resolution |
|---------|-----------|
| Payment provider | Provider-agnostic adapter; Stripe default (R1) |
| Reliability/observability targets | 99.9% target + structured logging/metrics/alerts (R2) |
| Oversell prevention | Atomic conditional update + transaction (R3) |
| Discount/coupon stacking | No stacking; larger reduction wins (R4) |
| Testing stack | Vitest/RTL + Mongo Memory Server + Playwright (R12) |

All Technical Context items are resolved — **no remaining NEEDS CLARIFICATION**.
