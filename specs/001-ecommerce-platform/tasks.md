---
description: "Task list for Local Brand E-Commerce Platform implementation"
---

# Tasks: Local Brand E-Commerce Platform

**Input**: Design documents from `specs/001-ecommerce-platform/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Targeted tests are included ONLY for the correctness-critical paths the plan committed to
(no-oversell concurrency, coupon/discount no-stacking, guest-tracking non-enumeration). Other tasks
are implementation-focused.

**Organization**: Tasks are grouped by user story so each story is independently implementable and
testable. Stack: Next.js 15 (App Router, TypeScript), MongoDB/Mongoose, Redis/ioredis, Cloudinary,
SMTP/Nodemailer, WhatsApp, Tailwind, next-intl (AR/EN, RTL), next-themes, Auth.js.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1–US7 (user-story tasks only)
- All paths are relative to the repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and tooling

- [ ] T001 Initialize Next.js 15 App Router + TypeScript project at repo root (`package.json`, `tsconfig.json`, `next.config.ts`, `src/app/`)
- [ ] T002 Install runtime dependencies (mongoose, ioredis, next-intl, next-themes, cloudinary, nodemailer, zod, next-auth, argon2) in `package.json`
- [ ] T003 [P] Configure Tailwind CSS with CSS-variable token theme in `tailwind.config.ts` and `src/app/globals.css`
- [ ] T004 [P] Configure ESLint + Prettier + strict TS in `eslint.config.mjs`, `.prettierrc`, `tsconfig.json`
- [ ] T005 [P] Configure Vitest + React Testing Library + Playwright + MongoDB Memory Server in `vitest.config.ts` and `playwright.config.ts`
- [ ] T006 Create the source folder skeleton per plan.md (`src/app`, `src/components/ui`, `src/lib`, `src/models`, `src/services`, `src/messages`, `tests/`)
- [ ] T007 [P] Add `.env.example` with all required variables from quickstart.md (no secrets committed)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Infrastructure & cross-cutting

- [ ] T008 Implement MongoDB connection helper (singleton, hot-reload safe) in `src/lib/db/connect.ts`
- [ ] T009 [P] Implement Redis client + cache-aside + tag-based invalidation helpers in `src/lib/cache/index.ts`
- [ ] T010 [P] Implement environment config loader + validation in `src/lib/config/env.ts`
- [ ] T011 [P] Implement structured JSON logger + request correlation IDs in `src/lib/observability/logger.ts`
- [ ] T012 Implement central API error handler + typed error responses in `src/lib/http/errors.ts`
- [ ] T013 [P] Implement Cloudinary upload/transform + signed-upload helper in `src/lib/media/cloudinary.ts`
- [ ] T014 [P] Implement notification dispatcher (email SMTP + WhatsApp) with bounded retry/backoff + NotificationLog model in `src/lib/notifications/dispatcher.ts` and `src/models/NotificationLog.ts`
- [ ] T015 [P] Implement provider-agnostic payment adapter interface (createPaymentSession/verifyWebhook/getPaymentStatus) + Stripe implementation in `src/lib/payments/adapter.ts` and `src/lib/payments/stripe.ts`

### Auth & authorization (FR-016, FR-017, FR-037)

- [ ] T016 Implement Auth.js credentials config (argon2 verify, server sessions) in `src/lib/auth/config.ts`
- [ ] T017 Create User model (admin|buyer, passwordHash, createdByUserId) in `src/models/User.ts`
- [ ] T018 Implement route-group middleware + server-side role guards (admin/buyer/guest) in `src/middleware.ts` and `src/lib/auth/guards.ts`
- [ ] T019 Implement auth route handlers (signin/signout/session) in `src/app/api/auth/[...nextauth]/route.ts`

### i18n, theming & reusable UI (Principles I & II)

- [ ] T020 Configure next-intl locale routing (`[locale]` ar/en) + RTL `dir` at layout root in `src/i18n/request.ts`, `src/app/[locale]/layout.tsx`
- [ ] T021 [P] Create AR/EN message catalogs scaffold in `src/messages/ar.json` and `src/messages/en.json`
- [ ] T022 [P] Implement design-token schema + runtime token→CSS-variable resolver in `src/lib/design-tokens/index.ts`
- [ ] T023 [P] Implement dark/light theme provider (next-themes) bound to tokens in `src/components/theme/ThemeProvider.tsx`
- [ ] T024 [P] Build reusable UI primitives (Button, Input, Select, Card, Modal, Badge, Spinner) consuming tokens in `src/components/ui/`

### Admin-configurable singletons + storefront shell (Principle V)

- [ ] T025 [P] Create WebsiteSettings, ThemeSettings, TaxShippingPolicy singleton models in `src/models/WebsiteSettings.ts`, `src/models/ThemeSettings.ts`, `src/models/TaxShippingPolicy.ts`
- [ ] T026 Implement settings/theme service with cache + public read in `src/services/settings.service.ts`
- [ ] T027 Implement public settings endpoint `GET /api/storefront/settings` in `src/app/api/storefront/settings/route.ts`
- [ ] T028 Build storefront layout shell (header/footer/SEO from WebsiteSettings, theme applied via CSS vars) in `src/app/[locale]/(storefront)/layout.tsx`
- [ ] T029 Implement DB seed script (admin from env, singletons defaults, demo categories/products/variations) in `scripts/seed.ts`

**Checkpoint**: Foundation ready — user stories can now begin.

---

## Phase 3: User Story 1 - Guest browses catalog and completes a purchase (Priority: P1) 🎯 MVP

**Goal**: A guest can browse, search, filter, view a product, add a variant to the cart, and check
out with secure payment — no account required.

**Independent Test**: Seed products, browse/search/filter to a product, add a variant, complete
checkout to a confirmed order with an order number — without logging in.

### Models for US1

- [ ] T030 [P] [US1] Create Category model in `src/models/Category.ts`
- [ ] T031 [P] [US1] Create Product model (attributes, status, ownerUserId, images, seo) in `src/models/Product.ts`
- [ ] T032 [P] [US1] Create Variation model (sku, options, stock, priceOverride) in `src/models/Variation.ts`
- [ ] T033 [P] [US1] Create Order model (orderNumber, lines, totals, status lifecycle, statusHistory, payment) in `src/models/Order.ts`

### Critical-path tests for US1 (write first; must fail before implementation)

- [ ] T034 [P] [US1] Unit test: concurrent purchase of last unit yields exactly one success, no negative stock (SC-010) in `tests/unit/inventory.oversell.test.ts`
- [ ] T035 [P] [US1] Unit test: pricing resolver computes subtotal + tax + shipping correctly in `tests/unit/pricing.base.test.ts`

### Services & logic for US1

- [ ] T036 [US1] Implement catalog service (list with combined filters + facets, search, product-by-slug) with cache in `src/services/catalog.service.ts`
- [ ] T037 [P] [US1] Implement pricing resolver (base price + tax + shipping; discount/coupon hooks stubbed) in `src/lib/pricing/resolve.ts`
- [ ] T038 [US1] Implement inventory service: atomic conditional stock decrement inside an order transaction (R3, FR-034) in `src/services/inventory.service.ts`
- [ ] T039 [US1] Implement order service (create pending order, order-number generation, confirm on payment, fail/preserve cart) in `src/services/order.service.ts`

### Storefront API for US1 (contracts/storefront-api.md)

- [ ] T040 [P] [US1] Implement `GET /api/storefront/products` (filters/search/facets) in `src/app/api/storefront/products/route.ts`
- [ ] T041 [P] [US1] Implement `GET /api/storefront/products/[slug]` in `src/app/api/storefront/products/[slug]/route.ts`
- [ ] T042 [P] [US1] Implement `GET /api/storefront/categories` in `src/app/api/storefront/categories/route.ts`
- [ ] T043 [P] [US1] Implement `POST /api/storefront/cart/validate` (reprice + availability) in `src/app/api/storefront/cart/validate/route.ts`
- [ ] T044 [P] [US1] Implement `POST /api/storefront/checkout/quote` in `src/app/api/storefront/checkout/quote/route.ts`
- [ ] T045 [US1] Implement `POST /api/storefront/checkout` (atomic stock check, create order, init payment) in `src/app/api/storefront/checkout/route.ts`
- [ ] T046 [US1] Implement `POST /api/storefront/payments/webhook` (verify, confirm/fail order, commit stock, dispatch confirmation) in `src/app/api/storefront/payments/webhook/route.ts`

### Storefront UI for US1

- [ ] T047 [P] [US1] Build ProductCard + FilterPanel + VariantPicker components in `src/components/product/`
- [ ] T048 [US1] Build home + catalog listing page (with filters/search/facets) in `src/app/[locale]/(storefront)/page.tsx` and `src/app/[locale]/(storefront)/products/page.tsx`
- [ ] T049 [US1] Build product detail page (variant select, availability, add to cart) in `src/app/[locale]/(storefront)/products/[slug]/page.tsx`
- [ ] T050 [US1] Build cart + checkout flow (cart summary, checkout form, totals, payment redirect, confirmation) in `src/app/[locale]/(storefront)/cart/` and `src/app/[locale]/(storefront)/checkout/`

**Checkpoint**: US1 fully functional — guest can purchase end to end (MVP).

---

## Phase 4: User Story 2 - Guest tracks an order and receives notifications (Priority: P1)

**Goal**: A guest tracks an order via order number + email + WhatsApp and receives automatic email +
WhatsApp notifications on every status change.

**Independent Test**: Place a guest order, retrieve status by order#+email+WhatsApp, and confirm a
status-change notification is dispatched on both channels.

### Critical-path test for US2

- [ ] T051 [P] [US2] Unit test: tracking returns uniform not-found on mismatch and is rate-limited (R5, non-enumeration) in `tests/unit/tracking.enumeration.test.ts`

### Implementation for US2

- [ ] T052 [US2] Implement order-tracking service (exact match order#+email+whatsapp, rate-limited via Redis) in `src/services/tracking.service.ts`
- [ ] T053 [US2] Implement `POST /api/storefront/orders/track` (uniform non-revealing response) in `src/app/api/storefront/orders/track/route.ts`
- [ ] T054 [US2] Wire order status-change events to the notification dispatcher with localized AR/EN templates (FR-014, FR-015) in `src/services/order.service.ts` and `src/lib/notifications/templates/`
- [ ] T055 [US2] Build order-tracking page (lookup form + status timeline) in `src/app/[locale]/(storefront)/track/page.tsx`

**Checkpoint**: US1 + US2 work independently — guest can buy and track.

---

## Phase 5: User Story 3 - Admin manages catalog, inventory, and orders (Priority: P2)

**Goal**: Admin signs in and manages products/variations/categories, inventory, and order status, and
sees a sales/inventory dashboard.

**Independent Test**: Sign in as admin, create a product with two variants + images, publish it (appears
in storefront), and advance an order's status (reflected in tracking).

### Implementation for US3 (contracts/admin-api.md)

- [ ] T056 [US3] Implement admin catalog service (CRUD products/variations/categories, publish/unpublish, cache invalidation) in `src/services/admin/catalog.admin.service.ts`
- [ ] T057 [P] [US3] Implement admin product/variation/category endpoints under `src/app/api/admin/products/`, `src/app/api/admin/variations/`, `src/app/api/admin/categories/`
- [ ] T058 [P] [US3] Implement signed media upload endpoint `POST /api/admin/media/sign` in `src/app/api/admin/media/sign/route.ts`
- [ ] T059 [US3] Implement stock-adjust endpoint `PATCH /api/admin/variations/[id]/stock` (logged) in `src/app/api/admin/variations/[id]/stock/route.ts`
- [ ] T060 [US3] Implement admin order endpoints (list, detail, validated status transition) under `src/app/api/admin/orders/`
- [ ] T061 [P] [US3] Implement dashboard summary endpoint `GET /api/admin/dashboard` (sales + inventory) in `src/app/api/admin/dashboard/route.ts`
- [ ] T062 [US3] Build admin layout + auth-gated shell in `src/app/[locale]/(admin)/admin/layout.tsx`
- [ ] T063 [P] [US3] Build admin product/category management UI (forms reuse `components/ui`) in `src/components/admin/catalog/` and `src/app/[locale]/(admin)/admin/products/`
- [ ] T064 [P] [US3] Build admin orders UI (list, detail, status transitions) in `src/app/[locale]/(admin)/admin/orders/`
- [ ] T065 [P] [US3] Build admin dashboard UI (sales/inventory widgets) in `src/app/[locale]/(admin)/admin/page.tsx`

**Checkpoint**: Admins can stock the store and fulfill orders.

---

## Phase 6: User Story 4 - Admin configures branding, content, and identity (Priority: P2)

**Goal**: Admin customizes store identity, content pages, SEO, social links, homepage slider, and the
visual theme (colors/fonts/layout/default mode/default language) without code changes.

**Independent Test**: Change store name, logo, primary color, default language, and a slider offer →
storefront reflects all changes within 1 minute.

### Implementation for US4

- [ ] T066 [P] [US4] Create Offer/HomepageSliderSlide model in `src/models/Offer.ts`
- [ ] T067 [US4] Implement admin settings/theme service (PUT singletons + immediate cache invalidation) in `src/services/admin/settings.admin.service.ts`
- [ ] T068 [P] [US4] Implement `GET/PUT /api/admin/settings` and `GET/PUT /api/admin/theme` in `src/app/api/admin/settings/route.ts` and `src/app/api/admin/theme/route.ts`
- [ ] T069 [P] [US4] Implement offers CRUD + reorder endpoints under `src/app/api/admin/offers/`
- [ ] T070 [US4] Implement `GET /api/storefront/home` (slider + featured) in `src/app/api/storefront/home/route.ts`
- [ ] T071 [P] [US4] Build admin settings UI (name, logo, header/footer, contact, about, social, SEO) in `src/app/[locale]/(admin)/admin/settings/`
- [ ] T072 [P] [US4] Build admin theme editor UI (color/font/layout/mode/language pickers with live preview) in `src/app/[locale]/(admin)/admin/theme/`
- [ ] T073 [P] [US4] Build admin offers/slider manager UI in `src/app/[locale]/(admin)/admin/offers/`
- [ ] T074 [US4] Build homepage slider component consuming Offers in `src/components/storefront/HomeSlider.tsx`

**Checkpoint**: Store identity and theme are fully admin-configurable.

---

## Phase 7: User Story 5 - Admin runs promotions: offers, discounts, coupons (Priority: P2)

**Goal**: Admin creates discounts and coupons; customers get eligible discounts automatically and can
redeem valid coupons — with no stacking (larger reduction wins).

**Independent Test**: Create a discount and a coupon, then as guest confirm only the larger single
reduction applies at checkout.

### Critical-path test for US5

- [ ] T075 [P] [US5] Unit test: coupon never stacks with active discount; larger reduction wins (FR-038) in `tests/unit/pricing.nostacking.test.ts`

### Implementation for US5

- [ ] T076 [P] [US5] Create Coupon and Discount models in `src/models/Coupon.ts` and `src/models/Discount.ts`
- [ ] T077 [US5] Extend pricing resolver with discount/coupon resolution + no-stacking rule (R4, FR-038) in `src/lib/pricing/resolve.ts`
- [ ] T078 [US5] Implement coupon service (validate window/usage/eligibility, atomic usage increment) in `src/services/promotions.service.ts`
- [ ] T079 [P] [US5] Implement `POST /api/storefront/coupons/apply` in `src/app/api/storefront/coupons/apply/route.ts`
- [ ] T080 [P] [US5] Implement admin coupons/discounts CRUD endpoints under `src/app/api/admin/coupons/` and `src/app/api/admin/discounts/`
- [ ] T081 [US5] Integrate coupon entry + discount display into checkout flow in `src/app/[locale]/(storefront)/checkout/`
- [ ] T082 [P] [US5] Build admin promotions UI (coupons + discounts) in `src/app/[locale]/(admin)/admin/promotions/`

**Checkpoint**: Promotions work end to end with correct no-stacking pricing.

---

## Phase 8: User Story 6 - Admin configures tax, shipping, and delivery (Priority: P2)

**Goal**: Admin defines tax rules and shipping/delivery options and costs, applied at checkout.

**Independent Test**: Set a tax rate and two shipping options; as guest confirm selected shipping and
computed tax appear in the order total.

### Implementation for US6

- [ ] T083 [US6] Implement tax/shipping admin service (PUT TaxShippingPolicy + cache invalidation) in `src/services/admin/taxshipping.admin.service.ts`
- [ ] T084 [P] [US6] Implement `GET/PUT /api/admin/tax-shipping` in `src/app/api/admin/tax-shipping/route.ts`
- [ ] T085 [US6] Ensure checkout quote/order consume TaxShippingPolicy (selectable shipping option, tax line) in `src/lib/pricing/resolve.ts` and `src/services/order.service.ts`
- [ ] T086 [P] [US6] Build admin tax/shipping settings UI in `src/app/[locale]/(admin)/admin/tax-shipping/`

**Checkpoint**: Checkout totals reflect admin-configured tax and shipping.

---

## Phase 9: User Story 7 - Buyer manages their own products and orders (Priority: P3)

**Goal**: A buyer (internal seller) manages only the products they own and views only orders related to
those products.

**Independent Test**: Sign in as buyer, create/edit an owned product (appears in storefront), view
orders for owned products, and get 403 when touching others' products.

### Implementation for US7

- [ ] T087 [US7] Implement buyer service with ownership scoping (ownerUserId == session user) in `src/services/buyer.service.ts`
- [ ] T088 [P] [US7] Implement buyer product endpoints (GET/POST/PATCH own products, 403 otherwise) under `src/app/api/buyer/products/`
- [ ] T089 [P] [US7] Implement buyer orders endpoint (orders containing owned products only) in `src/app/api/buyer/orders/route.ts`
- [ ] T090 [US7] Build buyer (seller) dashboard + product management UI in `src/app/[locale]/(buyer)/seller/`

**Checkpoint**: Buyer role works with strict ownership isolation.

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Final hardening across all stories

- [ ] T091 [P] E2E test: guest purchase + order tracking happy paths (Playwright) in `tests/e2e/guest-journey.spec.ts`
- [ ] T092 [P] E2E test: admin smoke (login, publish product, advance order) in `tests/e2e/admin-smoke.spec.ts`
- [ ] T093 [P] Accessibility + AR-RTL/EN-LTR + dark/light + responsive audit across key pages (SC-008, FR-032)
- [ ] T094 [P] Add health endpoint + metrics (checkout success, notification delivery, cache hit, stock conflicts) per R2 in `src/app/api/health/route.ts`
- [ ] T095 [P] Verify all secrets are env-only and add security headers/rate-limit defaults (Principle III) in `next.config.ts` and `src/middleware.ts`
- [ ] T096 [P] Performance pass: confirm Redis caching + invalidation and Cloudinary responsive images on storefront (SC-002, SC-009)
- [ ] T097 [P] Author README + run `quickstart.md` validation end to end

---

## Dependencies & Execution Order

### Phase dependencies

- **Setup (Phase 1)**: no dependencies — start immediately
- **Foundational (Phase 2)**: depends on Setup — BLOCKS all user stories
- **User Stories (Phases 3–9)**: all depend on Foundational
  - US1 (P1) and US2 (P1) are the MVP; US2 depends on US1's Order model + order service
  - US3, US4, US5, US6 (P2) depend on Foundational; US5 extends US1's pricing resolver; US6 refines US1 checkout totals
  - US7 (P3) depends on Foundational (+ Product model from US1)
- **Polish (Phase 10)**: depends on the targeted user stories being complete

### User story dependencies

- US1: Foundational only
- US2: US1 (Order model + order.service)
- US3: Foundational (uses US1 catalog/order models)
- US4: Foundational (singletons exist; adds editing + Offer model)
- US5: US1 pricing resolver (extends it); Foundational
- US6: US1 checkout (refines tax/shipping consumption); Foundational
- US7: US1 Product model; Foundational

### Within each story

- Models → services → endpoints → UI
- Critical-path tests written before their implementation (T034/T035, T051, T075)

---

## Parallel Execution Examples

### Foundational (after T008)

```text
# Independent infra tasks can run together:
T009 Redis cache · T010 env config · T011 logger · T013 Cloudinary · T014 notifications · T015 payments
T021 messages · T022 tokens · T023 theme provider · T024 UI primitives · T025 singleton models
```

### User Story 1

```text
# Models in parallel:
T030 Category · T031 Product · T032 Variation · T033 Order
# Critical-path tests in parallel (write first):
T034 oversell · T035 pricing-base
# Read endpoints in parallel:
T040 products · T041 product-detail · T042 categories · T043 cart-validate · T044 quote
```

---

## Implementation Strategy

### MVP first

1. Phase 1 Setup → Phase 2 Foundational
2. Phase 3 (US1) → **STOP & VALIDATE**: guest can purchase end to end
3. Phase 4 (US2) → guest can track + receive notifications → **MVP complete (both P1 stories)**
4. Deploy/demo

### Incremental delivery

- Add US3 (admin catalog/orders) → operators can run the store
- Add US4 (branding/theme), US5 (promotions), US6 (tax/shipping) → full P2 capability
- Add US7 (buyer role) → P3
- Phase 10 polish before launch

---

## Notes

- [P] = different files, no dependencies
- Every privileged endpoint re-checks role server-side (Principle III/IV)
- No hard-coded colors/sizes — all via `components/ui` + design tokens (Principle I)
- Verify the three critical-path tests pass before shipping the MVP (oversell, no-stacking, tracking)
- Commit after each task or logical group
