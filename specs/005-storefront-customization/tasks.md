---
description: "Task list for Storefront Customization & Shopper Tools"
---

# Tasks: Storefront Customization & Shopper Tools

**Input**: Design documents from `specs/005-storefront-customization/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: INCLUDED — the plan's Testing section and quickstart name explicit Vitest
integration/unit suites; test tasks are generated accordingly.

**Organization**: Tasks are grouped by user story (US1–US8) for independent implementation
and testing. Stack: Next.js 15 (App Router, TS) · Mongoose/MongoDB · Redis (`lib/cache`) ·
Cloudinary (signed upload) · next-intl (AR/EN, RTL) · next-themes · Tailwind + `components/ui`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1–US8 maps to spec user stories

## Path Conventions

Single full-stack Next.js project; source under `src/`, tests under `tests/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm scaffolding for new modules; no new runtime dependencies.

- [ ] T001 Create new source folders per plan: `src/lib/favorites/`, `src/lib/compare/`, `src/components/storefront/`, `src/components/admin/content/`, `src/components/admin/catalog/`, `tests/integration/`, `tests/unit/`
- [ ] T002 [P] Add next-intl message keys placeholders for new surfaces (hero, filters, favorites, compare, badges, privacy, terms, currency) in `src/i18n` message catalogs (en + ar)
- [ ] T003 [P] Verify Vitest + MongoDB Memory Server config covers new `tests/integration` and `tests/unit` paths in the existing test config

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Additive schema + service plumbing shared by the admin-config stories (US1, US2, US8). 

**⚠️ CRITICAL**: Complete before US1/US2/US8 begin.

- [ ] T004 Extend `WebsiteSettings` model in `src/models/WebsiteSettings.ts` — add `privacyPage.body`, `termsPage.body`, `hero{ background, heading, subtext, cta{label,href}, showHeading, showSubtext, showCta }`, `currency{ base, active, options:[{code,label,symbol,rate}] }`, `homeSections:[{key,isVisible,sortOrder}]` (all additive, defaults preserved)
- [ ] T005 [P] Extend `Offer` model in `src/models/Offer.ts` — add `placement: "hero" | "offer"` (default `"offer"`, indexed)
- [ ] T006 Extend cached reads in `src/services/settings.service.ts` so hero/currency/privacyPage/termsPage/homeSections are returned from the cached settings singleton
- [ ] T007 Extend `src/services/admin/settings.admin.service.ts` to accept the new settings fields and invalidate both `settings` and `home` caches on write
- [ ] T008 [P] Create shared Zod schemas for content/hero/currency/slider/category request bodies in `src/lib/validation/content.ts` (reused by admin routes in US1/US2/US7/US8)

**Checkpoint**: Schema + settings plumbing ready — admin-config stories can begin.

---

## Phase 3: User Story 1 - Admin manages site content & legal pages (Priority: P1) 🎯 MVP

**Goal**: Admin edits header/footer/nav/home sections + About/Contact/Privacy/Terms without code; storefront reflects changes.

**Independent Test**: Edit footer text + a nav link and a Privacy body; reload storefront and confirm changes appear in AR and EN; non-admin write → 403.

### Tests for User Story 1

- [ ] T009 [P] [US1] Integration test `tests/integration/content.settings.test.ts` — `PUT /api/admin/content` updates fields, invalidates cache, guest→401 / buyer→403 / admin→200

### Implementation for User Story 1

- [ ] T010 [US1] Implement `PUT /api/admin/content` in `src/app/api/admin/content/route.ts` — admin guard + Zod (T008) + `updateWebsiteSettings` (T007)
- [ ] T011 [P] [US1] Build `src/components/admin/content/ContentManager.tsx` — header/nav/footer/homeSections + About/Contact/Privacy/Terms editor using `components/ui` primitives + design tokens
- [ ] T012 [US1] Create admin content page `src/app/[locale]/(admin)/admin/content/page.tsx` rendering ContentManager (shared shell extended by US2/US8)
- [ ] T013 [P] [US1] Create storefront `src/app/[locale]/(storefront)/privacy/page.tsx` rendering `privacyPage.body` with "not available" empty state
- [ ] T014 [P] [US1] Create storefront `src/app/[locale]/(storefront)/terms/page.tsx` rendering `termsPage.body` with empty state
- [ ] T015 [US1] Ensure storefront header/footer/nav components read nav links + footer columns from settings (modify existing storefront layout/footer/header components as needed)
- [ ] T016 [P] [US1] Add AR/EN message strings for content/privacy/terms surfaces in `src/i18n`

**Checkpoint**: US1 fully functional and independently testable.

---

## Phase 4: User Story 2 - Admin manages hero & offer sliders with uploadable background (Priority: P1)

**Goal**: Admin uploads a full-bleed hero background, toggles overlay components, and curates hero/offer slides; storefront home renders them.

**Independent Test**: Upload background, enable CTA, add one offer + one hero slide; home shows full-bleed bg with CTA and both sliders rotating their own slides.

### Tests for User Story 2

- [ ] T017 [P] [US2] Integration test `tests/integration/sliders.placement.test.ts` — slides scoped by `placement`; CRUD + reorder; admin authz

### Implementation for User Story 2

- [ ] T018 [US2] Implement `GET/POST /api/admin/sliders` in `src/app/api/admin/sliders/route.ts` (placement-aware) + `PUT/DELETE /api/admin/sliders/[id]` in `src/app/api/admin/sliders/[id]/route.ts` — admin guard + Zod (T008) + invalidate `home`
- [ ] T019 [US2] Extend `src/services/home.service.ts` to return hero config + `heroSlides`/`offerSlides` split by `placement`
- [ ] T020 [US2] Extend `PUT /api/admin/content/hero` (in `src/app/api/admin/content/route.ts` or `.../hero/route.ts`) to save hero config; reuse existing signed upload `POST /api/admin/media/sign` for background
- [ ] T021 [P] [US2] Build `src/components/admin/content/HeroEditor.tsx` — background upload (signed) + component visibility/content toggles
- [ ] T022 [P] [US2] Build `src/components/admin/content/SliderManager.tsx` — hero/offer slides CRUD + reorder
- [ ] T023 [US2] Wire HeroEditor + SliderManager into the admin content page `src/app/[locale]/(admin)/admin/content/page.tsx`
- [ ] T024 [P] [US2] Build storefront `src/components/storefront/HeroSection.tsx` — full-bleed background with toggleable overlay components (AR/RTL + dark/light)
- [ ] T025 [US2] Render HeroSection + hero/offer sliders on the storefront home page consuming the extended home payload

**Checkpoint**: US1 + US2 work independently.

---

## Phase 5: User Story 3 - Shopper filters the catalog (Priority: P1)

**Goal**: Shopper narrows the catalog by category, sub-category, price, and attributes with a clear no-results/reset state.

**Independent Test**: Apply category + price + size; results match and a count shows; force zero matches → no-results+reset; clear → full list returns.

### Tests for User Story 3

- [ ] T026 [P] [US3] Integration test `tests/integration/catalog.subcategory-filter.test.ts` — parent category includes descendant sub-category products; price/size/color filters; facets include `subCategories`; zero-match returns empty + total 0

### Implementation for User Story 3

- [ ] T027 [US3] Extend `src/services/catalog.service.ts` `listProducts` — resolve descendant category `_id` set for a selected parent slug; add `subCategories` to `facets`
- [ ] T028 [US3] Extend `GET /api/storefront/products` in `src/app/api/storefront/products/route.ts` to surface `facets.subCategories` and the active `currency` block
- [ ] T029 [P] [US3] Build `src/components/storefront/FilterPanel.tsx` — category, sub-category, price range, size, color; active-filter display + reset
- [ ] T030 [US3] Wire FilterPanel + no-results/reset state into the storefront catalog page and bind filters to URL query params
- [ ] T031 [P] [US3] Add AR/EN strings for filters + no-results state in `src/i18n`

**Checkpoint**: US1–US3 (all P1) deliver the MVP.

---

## Phase 6: User Story 4 - Shopper saves favorites (Priority: P2)

**Goal**: Browser-local favorites with toggle controls and a dedicated list.

**Independent Test**: Favorite two products, view list (both shown), toggle one off; reload → favorites persist.

### Tests for User Story 4

- [ ] T032 [P] [US4] Unit test `tests/unit/useFavorites.test.ts` — add/remove/persist + `lb_fav_change` event + count

### Implementation for User Story 4

- [ ] T033 [P] [US4] Create `src/lib/favorites/useFavorites.ts` — localStorage hook (`lb_fav_v1`) mirroring `useCart`, emits `lb_fav_change`
- [ ] T034 [P] [US4] Build `src/components/storefront/FavoriteButton.tsx` — toggle + active state (shared component + tokens)
- [ ] T035 [US4] Create `src/app/[locale]/(storefront)/favorites/page.tsx` — list with links; resolve against published catalog and omit unavailable items (FR-018)
- [ ] T036 [US4] Wire FavoriteButton into product card + product detail components

**Checkpoint**: US4 works independently.

---

## Phase 7: User Story 5 - Shopper compares products (Priority: P2)

**Goal**: Browser-local compare list (max 3) with a side-by-side view.

**Independent Test**: Add products to compare, open compare view (side by side), attempt 4th → blocked with "list full".

### Tests for User Story 5

- [ ] T037 [P] [US5] Unit test `tests/unit/useCompare.test.ts` — max-3 guard, add/remove, `lb_cmp_change` event

### Implementation for User Story 5

- [ ] T038 [P] [US5] Create `src/lib/compare/useCompare.ts` — localStorage hook (`lb_cmp_v1`), max 3, full-list guard, emits `lb_cmp_change`
- [ ] T039 [P] [US5] Build `src/components/storefront/CompareButton.tsx` — toggle + full-list message
- [ ] T040 [US5] Create `src/app/[locale]/(storefront)/compare/page.tsx` — side-by-side comparable attributes; omit unavailable items (FR-018)
- [ ] T041 [US5] Wire CompareButton into product card + product detail components

**Checkpoint**: US4 + US5 work independently.

---

## Phase 8: User Story 6 - Shopper sees live count indicators (Priority: P2)

**Goal**: Numeric badges on cart, favorites, and compare controls that update live.

**Independent Test**: Add to cart/favorites/compare → each badge shows count; remove → decrements; reload/switch tab → accurate; empty → zero/no badge.

**Dependencies**: Cart count exists; favorites (US4) and compare (US5) hooks for full coverage.

### Implementation for User Story 6

- [ ] T042 [P] [US6] Build shared `src/components/ui/CountBadge.tsx` — numeric badge using design tokens (reused by cart/favorites/compare)
- [ ] T043 [US6] Wire CountBadge to `useCart`, `useFavorites` (T033), `useCompare` (T038) in the storefront header/nav; ensure event + `storage` listeners keep counts accurate across tabs/reloads

**Checkpoint**: Badges accurate across all three lists.

---

## Phase 9: User Story 7 - Admin organizes catalog with sub-categories (Priority: P2)

**Goal**: Admin creates nested sub-categories and assigns products; storefront browses/filters by them.

**Independent Test**: Create a sub-category under a parent, assign a product; it nests under parent and appears when browsing/filtering that sub-category.

**Dependencies**: Storefront sub-category filtering delivered in US3 (T027); this story adds admin management.

### Tests for User Story 7

- [ ] T044 [P] [US7] Integration test `tests/integration/categories.admin.test.ts` — create/update/delete nested category; unique slug (409), cyclic/invalid parent (422); admin authz

### Implementation for User Story 7

- [ ] T045 [US7] Create category admin service in `src/services/admin/categories.admin.service.ts` — CRUD with parent validation (existing parent, no cycles) + invalidate `categories` cache
- [ ] T046 [US7] Implement `GET/POST /api/admin/categories` in `src/app/api/admin/categories/route.ts` + `PUT/DELETE /api/admin/categories/[id]` in `src/app/api/admin/categories/[id]/route.ts` — admin guard + Zod (T008); reject delete when sub-categories/products attached (409)
- [ ] T047 [P] [US7] Build `src/components/admin/catalog/SubCategoryManager.tsx` — nested category CRUD + product assignment
- [ ] T048 [US7] Create admin categories page `src/app/[locale]/(admin)/admin/categories/page.tsx`

**Checkpoint**: US7 admin management complete and integrated with US3 filtering.

---

## Phase 10: User Story 8 - Admin sets the site currency (Priority: P3)

**Goal**: Admin selects active currency + per-currency rates; storefront prices convert and display consistently; historical orders unchanged.

**Independent Test**: Add EGP with a rate, set active; catalog/product/cart/checkout show EGP via the rate; an old order keeps its original amount.

### Tests for User Story 8

- [ ] T049 [P] [US8] Integration test `tests/integration/currency.conversion.test.ts` — rate-based conversion; `active` ∈ options + rate>0 validation (422); previously placed order amounts preserved

### Implementation for User Story 8

- [ ] T050 [P] [US8] Create `src/services/currency.service.ts` — resolve active currency from cached settings + convert base minor units by stored rate
- [ ] T051 [US8] Extend `src/lib/format.ts` `formatMoney` to apply active currency + rate (default to base when unconfigured)
- [ ] T052 [US8] Implement `PUT /api/admin/currency` in `src/app/api/admin/currency/route.ts` — admin guard + Zod (T008, active∈options & rate>0) + invalidate `settings`+`home`
- [ ] T053 [P] [US8] Build `src/components/admin/content/CurrencyForm.tsx` — active currency + per-currency rate editor; wire into admin content page
- [ ] T054 [US8] Apply currency-aware display across catalog/product/cart/checkout price surfaces using `formatMoney` + active currency

**Checkpoint**: All user stories independently functional.

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Quality gates spanning all stories.

- [ ] T055 [P] Verify every new surface in AR/RTL and EN/LTR and in light + dark mode (Principle II, FR-019, SC-007)
- [ ] T056 [P] Verify responsive layout (desktop/tablet/mobile) for hero, filters, favorites, compare, badges, admin editors
- [ ] T057 Reuse-first review: confirm no bespoke buttons/inputs/cards or hard-coded colors; only `components/ui` + design tokens (Principle I)
- [ ] T058 Security pass: confirm server-side admin authorization + Zod validation on every `/api/admin/**` endpoint; guest→401, buyer→403 (Principle III, FR-009)
- [ ] T059 [P] Confirm cache invalidation on all admin writes so storefront reflects changes within one reload (SC-001, Principle VI)
- [ ] T060 Run `quickstart.md` end-to-end validation across all 8 user stories

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup. BLOCKS US1, US2, US8 (model/service plumbing).
- **US3 (Phase 5)**, **US4 (Phase 6)**, **US5 (Phase 7)**: Depend only on Setup (use existing catalog/localStorage patterns) — may start in parallel with Foundational.
- **US6 (Phase 8)**: Best after US4 + US5 (for favorites/compare counts); cart count works immediately.
- **US7 (Phase 9)**: Admin management independent; storefront filtering relies on US3 (T027).
- **Polish (Phase 11)**: After all targeted stories complete.

### User Story Dependencies

- US1, US2, US8 → require Foundational (Phase 2).
- US2 hero/slider extends the admin content page created in US1 (T012) but is independently testable.
- US3 independent (categories already exist); US7 enriches it with admin-managed sub-categories.
- US4, US5 independent; US6 consumes their counts.

### Parallel Opportunities

- Setup: T002, T003 in parallel.
- Foundational: T005, T008 in parallel with T004/T006/T007 (different files).
- After Foundational, US1/US2/US8 can proceed alongside the independent US3/US4/US5.
- Within stories, all [P] tasks (separate files: tests, components, models, i18n) run in parallel.

---

## Parallel Example: User Story 1

```bash
# Test first:
Task: "Integration test PUT /api/admin/content in tests/integration/content.settings.test.ts"

# Then parallel components/pages (different files):
Task: "Build src/components/admin/content/ContentManager.tsx"
Task: "Create src/app/[locale]/(storefront)/privacy/page.tsx"
Task: "Create src/app/[locale]/(storefront)/terms/page.tsx"
Task: "Add AR/EN strings in src/i18n"
```

---

## Implementation Strategy

### MVP First (P1 stories)

1. Phase 1 Setup → Phase 2 Foundational.
2. US1 (content/legal) → US2 (hero/sliders) → US3 (filters) = the P1 MVP.
3. STOP and validate each P1 story independently; deploy/demo.

### Incremental Delivery

1. Foundation ready → US1 (MVP) → US2 → US3.
2. Add US4 favorites → US5 compare → US6 badges.
3. Add US7 sub-category admin → US8 currency.
4. Each story ships value without breaking prior stories.

---

## Notes

- [P] = different files, no incomplete dependencies.
- Favorites/compare are browser-local (FR-020) — no server collections, no API endpoints.
- Schema changes are additive only (`WebsiteSettings`, `Offer`); `Category.parent` already exists.
- Verify tests fail before implementing; commit after each task or logical group.
- Stop at any checkpoint to validate a story independently.
