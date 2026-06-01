---
description: "Task list for Media Uploads Everywhere, Homepage Offer Imagery & Incomplete-Order Handling"
---

# Tasks: Media Uploads Everywhere, Homepage Offer Imagery & Incomplete-Order Handling

**Input**: Design documents from `specs/003-media-uploads-order-completion/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Targeted tests are included ONLY for the correctness-critical paths the plan committed to
(image upload validation, publish-requires-image gate, idempotent order expiry + stock restoration, and
no-oversell on late payment). Other tasks are implementation-focused.

**Context**: This feature extends the shipped `001-ecommerce-platform` in place. Image fields already
exist on `Product.images[]`, `Category.image`, and `Offer.image`; the order lifecycle already has a
terminal `failed` status with stock restoration on `failOrder`. Reuses the existing `signUpload`/
`mediaUrl` Cloudinary helpers, `requireRole("admin")` guards, `components/ui` primitives + design tokens,
next-intl catalogs, and the `001` status-change notification. No new dependency is introduced.

**Verified field paths**: order customer email/name/WhatsApp under `order.customer.{email,name,whatsapp}`;
order total is top-level `order.grandTotal`; statuses come from `ORDER_STATUSES` (terminal `failed` is
reused for expiry — no new enum value).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1–US3 (user-story tasks only)
- All paths are relative to the repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Config and copy additions shared by all stories

- [ ] T001 [P] Add i18n message keys for the image uploader, image placeholders, and order completion states in `src/messages/en.json` and `src/messages/ar.json`
- [ ] T002 [P] Add `ORDER_EXPIRY_MINUTES` (default 30) and `CRON_SECRET` to the env loader in `src/lib/config/env.ts` and document them in `.env.example`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared media building blocks required by US1 and US2

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T003 Add `destroyAsset(cloudinaryId)` (signed, server-side delete) and `validateUploadMeta({ format, bytes })` (JPEG/PNG/WebP, ≤5 MB) to `src/lib/media/cloudinary.ts`
- [ ] T004 [P] Build the reusable `MediaUploader` (sign via `/api/admin/media/sign` → direct browser upload → client type/size/count validation → preview, reorder, remove → emits ordered `MediaRef[]` + localized alt; disables parent submit while uploading) in `src/components/ui/MediaUploader.tsx`
- [ ] T005 [P] Build the shared `ImageWithFallback` wrapper (renders `mediaUrl(ref)` or a neutral localized placeholder — no broken images) in `src/components/ui/ImageWithFallback.tsx`

**Checkpoint**: Foundation ready — user stories can now begin.

---

## Phase 3: User Story 1 - Admin attaches images to products, categories, and offers (Priority: P1) 🎯 MVP

**Goal**: Admins (and buyers for their own products) upload, preview, reorder, and remove images for
products and category thumbnails; uploads are validated; a product needs ≥1 image to publish; removed
assets are deleted from the host.

**Independent Test**: Create a product, upload two images, fail to publish with none then succeed with
one, and confirm both images appear in order on the storefront; set a category image and see it in catalog.

### Critical-path tests for US1 (write first; must fail before implementation)

- [ ] T006 [P] [US1] Unit test: `validateUploadMeta` rejects non-JPEG/PNG/WebP and >5 MB, and the service rejects >8 images (FR-206/SC-207) in `tests/unit/media.validate.test.ts`
- [ ] T007 [P] [US1] Integration test: a product cannot be published without at least one image; draft can (FR-201a) in `tests/integration/product.publish-gate.test.ts`

### Implementation for US1

- [ ] T008 [US1] In `src/services/admin/catalog.admin.service.ts`: enforce the publish-requires-image gate (status `published` ⇒ `images.length ≥ 1`, else 422), cap images at 8, validate each via `validateUploadMeta`, and on update delete any removed/replaced `cloudinaryId` via `destroyAsset` (failures logged for retry)
- [ ] T009 [P] [US1] Accept `images: MediaRef[]` on `POST /api/admin/products` and `PATCH /api/admin/products/[id]` (route already flows through the service gate) in `src/app/api/admin/products/route.ts` and `src/app/api/admin/products/[id]/route.ts`
- [ ] T010 [P] [US1] Accept `image: MediaRef | null` (with prior-asset cleanup) on `POST /api/admin/categories` and `PATCH /api/admin/categories/[id]` in `src/app/api/admin/categories/route.ts` and `src/app/api/admin/categories/[id]/route.ts`
- [ ] T011 [US1] Embed `MediaUploader` (multiple, ordered) into the product form and add publish-gate UX (block publish without an image) in `src/components/admin/catalog/ProductForm.tsx`
- [ ] T012 [P] [US1] Add a single-image `MediaUploader` to category management in `src/components/admin/catalog/CategoryManager.tsx`
- [ ] T013 [P] [US1] Render product/category images through `ImageWithFallback` on the storefront in `src/components/product/ProductCard.tsx` (and the product detail/category surfaces)

**Checkpoint**: US1 functional — products and categories carry operator-managed imagery (MVP).

---

## Phase 4: User Story 2 - Homepage offer slides with images (Priority: P1)

**Goal**: Admins add homepage slider/offer slides each with an image; the storefront homepage shows
active slides in order with their images (and a fallback when an image is missing).

**Independent Test**: Create two active offer slides with images and CTAs, order them, and confirm both
images appear in order on the homepage with working CTAs; deactivate one and confirm it disappears.

### Implementation for US2

- [ ] T014 [US2] Accept `image: MediaRef | null` per slide (with prior-asset cleanup on replace/delete via `destroyAsset`) on `POST/PATCH /api/admin/offers` and `DELETE /api/admin/offers/[id]` in `src/app/api/admin/offers/route.ts` and `src/app/api/admin/offers/[id]/route.ts`
- [ ] T015 [US2] Add a per-slide single-image `MediaUploader` to the offers/slider manager in `src/components/admin/offers/OffersManager.tsx`
- [ ] T016 [US2] Render slides via `ImageWithFallback` and handle the zero-slides empty state in `src/components/storefront/HomeSlider.tsx`

**Checkpoint**: US1 + US2 functional — catalog and homepage promotional imagery both work.

---

## Phase 5: User Story 3 - Incomplete orders are resolved and stock released (Priority: P1)

**Goal**: A scheduled sweep marks unpaid pending orders past their expiry window as failed and restores
their reserved stock idempotently; late payments never oversell; the admin order list distinguishes
incomplete from confirmed orders.

**Independent Test**: Start a checkout reserving the last unit but never pay; after the window, trigger
the sweep and confirm the order is failed, the unit is purchasable again, and a second sweep does not
double-restore.

### Critical-path tests for US3 (write first; must fail before implementation)

- [ ] T017 [P] [US3] Unit test: expiry restores stock at most once, and a late payment on an expired order does not oversell (FR-215/FR-216, SC-206) in `tests/unit/order.expiry.idempotent.test.ts`
- [ ] T018 [P] [US3] Integration test: the sweep transitions `pending`→`failed` past `expiresAt` and restores stock (FR-213/FR-214, SC-204) in `tests/integration/order.expiry.sweep.test.ts`

### Implementation for US3

- [ ] T019 [US3] Add additive `expiresAt` (indexed) and `stockRestored` (default false) fields to the Order schema in `src/models/Order.ts`
- [ ] T020 [US3] In `src/services/order.service.ts`: set `expiresAt = createdAt + ORDER_EXPIRY_MINUTES` and `stockRestored=false` on pending-order creation; implement `expireStaleOrders()` using an atomic `findOneAndUpdate({ _id, status:"pending", stockRestored:false }, …→failed, stockRestored:true)` claim that calls `restoreStock` only when matched and dispatches the status notification; extend `confirmOrder` to reconcile a late payment on an expired order (re-validate stock → re-reserve+confirm if available, else stay failed and flag refund)
- [ ] T021 [US3] Implement the secret-gated `POST /api/cron/expire-orders` (Bearer `CRON_SECRET`; 401 otherwise) calling `expireStaleOrders()` and returning a `{scanned,expired,stockRestored}` summary in `src/app/api/cron/expire-orders/route.ts`
- [ ] T022 [P] [US3] Add a `completion=incomplete|confirmed` filter (mapped to status sets) to `GET /api/admin/orders` in `src/app/api/admin/orders/route.ts`
- [ ] T023 [US3] Add a completion-state filter and incomplete/confirmed badges (reusing `statusTone`) to the admin orders page in `src/app/[locale]/(admin)/admin/orders/page.tsx`

**Checkpoint**: Abandoned orders self-resolve and free stock; admins can separate incomplete from confirmed.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation across the new surfaces

- [ ] T024 [P] E2E test: upload a product image → it shows on the storefront; create an offer slide → it shows on the homepage (Playwright) in `tests/e2e/media-and-offers.spec.ts`
- [ ] T025 [P] Verify the uploader, admin forms, and homepage slider in AR/RTL + EN/LTR, dark/light, and responsive layouts (Principle II); confirm zero broken images across product/category/home surfaces (SC-202)
- [ ] T026 Run `npm run typecheck` and `npm run lint`, then execute `quickstart.md` validation end to end (including the `ORDER_EXPIRY_MINUTES=1` sweep walkthrough)

---

## Dependencies & Execution Order

### Phase dependencies

- **Setup (Phase 1)**: no dependencies — start immediately
- **Foundational (Phase 2)**: depends on Setup — `MediaUploader` (T004) and `ImageWithFallback` (T005)
  BLOCK US1 and US2; `destroyAsset`/`validateUploadMeta` (T003) block US1/US2 service work
- **User Stories (Phases 3–5)**: all depend on Foundational
  - US1 (P1) and US2 (P1) both consume the shared uploader/fallback; US2's `OffersManager` (T015) and
    `HomeSlider` (T016) need T004/T005
  - US3 (P1) is independent of media work — depends only on existing order/inventory code + Foundational
    setup (env vars from T002)
- **Polish (Phase 6)**: depends on the user stories being complete

### Within each story

- Critical-path tests (T006/T007, T017/T018) written before their implementation
- Service gate before routes/UI (T008 before T009/T011); model before service (T019 before T020)
- Order route + page completion filter (T022 before/with T023)

### Parallel opportunities

- Setup: T001 ∥ T002
- Foundational: T004 ∥ T005 (T003 can run alongside)
- US1: T006 ∥ T007 (tests); after T008 → T009 ∥ T010; T012 ∥ T013 (different files); T011 after T004
- US2: T014 ∥ (T015 after T004); T016 after T005
- US3: T017 ∥ T018 (tests); T022 ∥ (T019→T020→T021 chain)
- Polish: T024 ∥ T025

---

## Parallel Execution Examples

### Foundational

```text
T003 cloudinary destroy/validate · T004 MediaUploader · T005 ImageWithFallback
```

### User Story 1

```text
# Tests first:
T006 media validation · T007 publish-gate
# After the service gate (T008):
T009 product routes · T010 category routes · T012 CategoryManager · T013 ProductCard fallback
```

---

## Implementation Strategy

### MVP first

1. Phase 1 Setup → Phase 2 Foundational (uploader + fallback + cloudinary helpers)
2. Phase 3 (US1 image management) → **STOP & VALIDATE**: products/categories carry images, publish gate works
3. Phase 4 (US2 homepage offers) → homepage shows offer imagery → **promotional surface restored**

### Incremental delivery

- Add US3 (incomplete-order handling) → abandoned stock is freed, admin list de-noised
- Phase 6 polish (e2e, i18n/theme/responsive + zero-broken-image audit, quickstart) before shipping

US3 is independent of US1/US2 and may be delivered in parallel by a second developer.

---

## Notes

- [P] = different files, no dependencies
- Exactly one shared `MediaUploader` and one `ImageWithFallback` — no per-form uploaders, no hard-coded colors/sizes (Principle I)
- All image mutations and the orders endpoints re-check `requireRole("admin")` server-side; the cron route is gated by `CRON_SECRET`, not a session (Principle III)
- Cloudinary credentials never reach the browser (signed upload); uploads re-validated server-side before persisting
- Order expiry reuses the existing `failed` status; restoration is at-most-once via the `stockRestored` guard (FR-215)
- Verify the four critical-path tests pass before shipping (upload validation, publish gate, expiry idempotency, expiry sweep)
- Commit after each task or logical group
