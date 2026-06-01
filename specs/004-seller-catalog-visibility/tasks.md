---
description: "Task list for Seller Catalog Visibility"
---

# Tasks: Seller Catalog Visibility

**Input**: Design documents from `specs/004-seller-catalog-visibility/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: One integration test is included because the feature carries security-critical invariants
(no cross-seller editing, no cross-seller order/customer-data exposure, others' drafts hidden). Other
tasks are implementation/verification-focused.

**Context**: Visibility-only extension of the existing seller (buyer) dashboard. No schema change, no new
dependency, no new write endpoint. Reuses the `Product` ownership model (`ownerUserId`), shared
`components/ui` + tokens, `pickLocale`, and the existing own-only write guard (`ownedProduct` → 403) and
order scope (`listOwnOrders`). Several tasks are already implemented and marked `[X]`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1 (user-story tasks only)
- All paths are relative to the repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: No new configuration, dependencies, or migrations are required for this feature.

- [X] T001 Confirm no new env/config or dependency is needed (read-only view over existing `Product` data) — recorded in `specs/004-seller-catalog-visibility/plan.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The read-only catalog query that the dashboard view depends on

**⚠️ CRITICAL**: US1 cannot render until this read exists

- [X] T002 Add `listAllPublishedProducts(viewerUserId)` returning published products from any owner as `{ id, slug, name, status, basePrice, mine }` (public fields only; `mine = ownerUserId === viewerUserId`) in `src/services/buyer.service.ts`

**Checkpoint**: Read available — US1 can render.

---

## Phase 3: User Story 1 - Seller browses the full published catalog read-only (Priority: P1) 🎯 MVP

**Goal**: A seller sees a read-only list of all published products (any owner) on their dashboard, own
items marked "Mine", with no edit controls for others' products; editing and orders stay own-only.

**Independent Test**: Sign in as Seller A (owns 1 product) while Seller B owns another published product;
the seller products page shows both in the read-only "All products" list, only A's marked "Mine", no edit
controls on B's row; a draft owned by B does not appear; a direct PATCH to B's product returns 403.

### Critical-path test for US1 (write first; must fail before implementation)

- [ ] T003 [P] [US1] Integration test: `listAllPublishedProducts` returns only `published` products across owners with a correct `mine` flag and excludes other owners' drafts/unpublished; and a cross-owner product PATCH still returns 403; and seller order scope (`listOwnOrders`) is unchanged — in `tests/integration/seller.catalog-visibility.test.ts`

### Implementation for US1

- [X] T004 [US1] Render a read-only "All products" section (name + price, "Mine" badge on owned rows, neutral empty state, no edit/publish/remove controls) beside the editable "My products" section in `src/app/[locale]/(buyer)/seller/products/page.tsx`
- [X] T005 [US1] Preserve own-only writes and order scope: confirm product mutations remain guarded by `ownedProduct()` (403 cross-owner) and order reads remain `listOwnOrders(ownerUserId)` — no changes that broaden access in `src/services/buyer.service.ts`

**Checkpoint**: US1 functional — sellers have catalog visibility without gaining control (MVP).

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Final validation across the new surface

- [ ] T006 [P] Verify the "All products" section and "Mine" badge in AR/RTL + EN/LTR and dark/light, responsive layouts (Principle II); confirm only public fields (name/price) are shown — no order/customer data (SC-303)
- [ ] T007 Run `npm run typecheck` and `npm run test`, then execute `specs/004-seller-catalog-visibility/quickstart.md` validation end to end (two-seller walkthrough incl. the 403 cross-owner write check and the draft-hidden check)

---

## Dependencies & Execution Order

### Phase dependencies

- **Setup (Phase 1)**: none — trivial confirmation only
- **Foundational (Phase 2)**: T002 BLOCKS US1 rendering
- **User Story 1 (Phase 3)**: depends on T002; T003 (test) is independent of T004/T005 and can be written first
- **Polish (Phase 4)**: depends on US1 being complete

### Within the story

- T003 (test) written first per the critical-path convention; T004 (UI) consumes T002; T005 is a
  guard-confirmation (no code change expected)

### Parallel opportunities

- US1: T003 ∥ T004 (different files: test vs. page)
- Polish: T006 ∥ T007

---

## Implementation Strategy

### MVP first

1. Phase 2 Foundational (read query T002) → Phase 3 US1 (read-only section T004 + guard confirm T005) →
   **STOP & VALIDATE**: sellers see the full published catalog read-only, own items marked, no extra control.

### Incremental delivery

- Add the critical-path test (T003) and the polish pass (T006/T007) before shipping to lock the
  security invariants (no cross-seller editing, no order/customer-data exposure, others' drafts hidden).

---

## Notes

- [P] = different files, no dependencies
- Visibility-only: editing and order access remain own-only (Constitution Principle IV / III preserved)
- The read returns public catalog fields only (name, price, `mine`) — never order, buyer, or customer data
- T002/T004/T005 are already implemented (marked `[X]`); T003/T006/T007 remain to lock and validate
- Commit after each task or logical group
