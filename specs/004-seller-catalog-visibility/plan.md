# Implementation Plan: Seller Catalog Visibility

**Branch**: `004-seller-catalog-visibility` | **Date**: 2026-06-01 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/004-seller-catalog-visibility/spec.md`

## Summary

Give a seller (buyer role) a **read-only** view of the full **published** catalog inside their seller
dashboard, with their own products marked, while **editing and order access stay strictly own-only**. The
approach reuses the existing seller dashboard, the `Product` ownership model (`ownerUserId`), and existing
server-side role guards. A single owner-agnostic read query (`listAllPublishedProducts(viewerUserId)`)
returns published products with a `mine` flag; the seller products page renders it as a read-only list
beside the existing editable "My products" section. No write paths, no order paths, and no schema change.

## Technical Context

**Language/Version**: TypeScript 5.x on Node.js 20 LTS (unchanged)

**Primary Dependencies**: Next.js 15 (App Router, Server Components), React 19, Mongoose, next-intl,
Tailwind + shared `components/ui`. No new dependencies.

**Storage**: MongoDB. No schema change — reads existing `Product` documents (`status`, `ownerUserId`,
`name`, `basePrice`).

**Testing**: Vitest + MongoDB Memory Server (integration) for the read scope and the own-only write guard;
existing Playwright suite for the dashboard journey if extended.

**Target Platform**: Cloud-hosted Node web app; responsive browsers. Seller dashboard is auth-gated
(buyer role) and rendered per-request.

**Project Type**: Single full-stack Next.js project (web application), extended in place.

**Performance Goals**: The read-only list issues one indexed query (`status: "published"`); acceptable at
current catalog volume. Pagination for very large catalogs is out of scope for v1.

**Constraints**: Visibility MUST NOT grant write access (own-only mutations enforced server-side, 403 on
cross-owner writes); the view exposes only public catalog fields (name, price) — never order/customer
data (Principle III); correct in AR/RTL + EN/LTR and dark/light; reuses shared UI + tokens (Principle I).

**Scale/Scope**: 1 user story (P1); FR-301–FR-307; 1 new read-only service function; 1 modified seller
page (adds a read-only section); 0 schema changes; 0 new write endpoints.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Derived from `.specify/memory/constitution.md` v1.0.0:

| # | Principle | Gate | Status |
|---|-----------|------|--------|
| I | Reusable & Modular Component Architecture | Reuses existing seller-dashboard layout, `Card`/`Badge` primitives and design tokens; the read-only list is a thin server-rendered section — no bespoke components or hard-coded colors | PASS |
| II | i18n, Theming & Accessibility | Product names via `pickLocale` (AR/EN); section labels translatable; correct in RTL/LTR and dark/light; semantic list markup | PASS — localized, themable |
| III | Security & Data Protection (NON-NEGOTIABLE) | Read query returns only published, public catalog fields (name, price, owner-match flag) — no order/buyer/customer data; mutations remain guarded by the existing `ownedProduct()` 403 check; route still `requireUser` + buyer role | PASS — visibility only; no data leak |
| IV | Role-Based Access & Guest-Friendly Commerce | Seller gains *visibility* of the published catalog but NOT control — editing and order access stay own-only, preserving the buyer/admin separation | PASS — role boundary intact |
| V | Admin-Configurable Platform | No operator-config surface affected | PASS — N/A |
| VI | Performance & Reliability | Single indexed `status:"published"` query; no extra blocking work on the request path | PASS |

**Result**: All gates PASS. No violations. Complexity Tracking intentionally empty.

## Project Structure

### Documentation (this feature)

```text
specs/004-seller-catalog-visibility/
├── plan.md              # This file (/speckit-plan output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── seller-catalog.md
├── checklists/
│   └── requirements.md  # Spec quality checklist (validated)
└── tasks.md             # Phase 2 output (/speckit-tasks — NOT created here)
```

### Source Code (repository root) — files added or modified

```text
src/
├── services/
│   └── buyer.service.ts                         # MODIFIED — add listAllPublishedProducts(viewerUserId) → published products + `mine` flag (read-only)
└── app/[locale]/(buyer)/seller/products/page.tsx # MODIFIED — render a read-only "All products" section beside editable "My products"

tests/
└── integration/
    └── seller.catalog-visibility.test.ts        # NEW — read scope (published only, mine flag) + cross-owner write still 403
```

**Structure Decision**: Extend the existing single full-stack Next.js project. The read-only catalog is a
domain-service read (`listAllPublishedProducts`) consumed by the existing seller products server page,
which already loads the editable own-products manager. Keeping the read separate from `listOwnProducts`
preserves the own-only write/edit pathway untouched (Principle III/IV) while adding visibility.

## Complexity Tracking

> No constitution violations — this section is intentionally empty.
