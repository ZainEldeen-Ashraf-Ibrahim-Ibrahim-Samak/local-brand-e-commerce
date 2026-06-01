# Implementation Plan: Media Uploads Everywhere, Homepage Offer Imagery & Incomplete-Order Handling

**Branch**: `003-media-uploads-order-completion` | **Date**: 2026-06-01 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/003-media-uploads-order-completion/spec.md`

## Summary

A gap-closure feature on the shipped `001-ecommerce-platform`. It (1) adds a reusable image-upload
control and wires it into the admin product, per-variation, category, and homepage-offer forms — backed
by the existing secure Cloudinary signing endpoint — with type/size limits, ordering, a publish gate (a
product needs ≥1 image to publish), and immediate cleanup of removed/orphaned assets; (2) makes the
homepage slider render active offer slides with their images (and a placeholder fallback); and (3)
resolves incomplete orders via a scheduled background sweep that expires unpaid pending orders past a
window and restores their reserved stock idempotently, with late-payment reconciliation that never
oversells. A variation MAY carry one optional image that becomes the storefront featured image when that
variation is selected (falling back to the product gallery). Category management stays admin-only.

Technical approach: extend the existing Next.js App Router project in place. The data models already
carry image fields (`Product.images[]`, `Variation.image`, `Category.image`, `Offer.image`) and the
order lifecycle already has a terminal `failed` status with stock restoration on `failOrder` — so most
work is UI, validation, a Cloudinary delete helper, a storefront variation-image swap, and a scheduled
expiry sweep. The variation routes already accept an `image`; the gaps are the per-variation uploader
UI, server-side validate/cleanup, and the selection-driven featured-image swap. No new third-party
dependency is introduced.

## Technical Context

**Language/Version**: TypeScript 5.x on Node.js 20 LTS (unchanged from `001`)

**Primary Dependencies**: Next.js 15 (App Router, Server Components + Route Handlers), React 19,
Tailwind CSS 3.x, Mongoose, Cloudinary SDK (existing `signUpload`/`mediaUrl`; add a signed
`destroyAsset`), Zod, next-intl, next-themes. No new dependencies.

**Storage**: MongoDB. Schema changes are additive and small: `Order.expiresAt` + `Order.stockRestored`.
Image fields already exist on Product/Variation/Category/Offer (`Variation.image` is a single optional
`MediaRef`, stored separately from the product gallery — no schema change for variation media).
Cloudinary stores the hosted assets.

**Testing**: Vitest + React Testing Library (unit/component), MongoDB Memory Server (integration),
Playwright (e2e). Targeted tests for the correctness-critical paths: idempotent order expiry + stock
restoration (no double restore, no oversell on late payment), publish-requires-image gate, and upload
metadata validation (type/size/count).

**Target Platform**: Cloud-hosted Node web app behind a CDN; responsive browsers. The expiry sweep is
triggered by the host's scheduler (e.g., a platform cron hitting a protected route) or an equivalent
recurring trigger.

**Performance Goals**: Admin sees uploaded image previews immediately (direct browser→Cloudinary upload,
no app round-trip for bytes); storefront images served via existing `f_auto,q_auto,w_*` transforms;
abandoned stock freed within the expiry window plus one sweep interval (SC-205).

**Constraints**: Cloudinary credentials never reach the browser (signed uploads only); the sweep route
is protected by a shared secret (Principle III); expiry/restoration idempotent under concurrency
(FR-215); a paid-after-expiry order must not oversell (FR-216); new UI reuses `components/ui` + tokens,
correct in AR/RTL + EN/LTR and dark/light, responsive.

**Scale/Scope**: 3 user stories (all P1); FR-201–FR-217 (incl. FR-202a/b variation media, FR-203
admin-only categories); 1 new reusable component (MediaUploader); small edits to 4 admin surfaces
(product, variation editor, category, offers) + their service/route validation; storefront
variation-image swap (VariantPicker + product detail gallery + catalog DTO); 1 Cloudinary delete helper;
order expiry sweep + 2 additive Order fields; homepage/card placeholder fallbacks.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Derived from `.specify/memory/constitution.md` v1.0.0:

| # | Principle | Gate | Status |
|---|-----------|------|--------|
| I | Reusable & Modular Component Architecture | A single shared `MediaUploader` (in `components/ui`) is reused by every admin form; placeholder is a shared component; no bespoke uploaders or hard-coded colors/sizes | PASS — one uploader, reused; tokens only |
| II | i18n, Theming & Accessibility | Uploader labels/errors via next-intl AR/EN; alt text per image (localized) for screen readers; correct in RTL/LTR and dark/light; responsive previews | PASS — localized copy + localized image alt |
| III | Security & Data Protection (NON-NEGOTIABLE) | Uploads use the server-signed Cloudinary flow (secret stays server-side); upload-meta re-validated server-side before persisting; delete uses a signed server call; expiry-sweep route gated by a shared secret; admin-only mutations via `requireRole` | PASS — signed upload/delete; secret-gated cron; server validation |
| IV | Role-Based Access & Guest-Friendly Commerce | Product/variation image management restricted to admin (and buyer for own products); category management is admin-only (FR-203) — already enforced by `requireRole("admin")` on every category route; order expiry is system-driven and never blocks guests | PASS — role guards unchanged; categories admin-only; sweep is backend |
| V | Admin-Configurable Platform | Product/category/offer imagery is operator-managed via admin UI; expiry window treated as configuration | PASS — images set in admin forms; window via env/config |
| VI | Performance & Reliability | Direct browser→Cloudinary upload (no app byte round-trip); optimized delivery transforms reused; idempotent, concurrency-safe expiry sweep; failed asset deletes logged for retry | PASS — existing transforms; idempotent sweep; logged retries |

**Result**: All gates PASS. No violations to justify. Complexity Tracking intentionally empty.

## Project Structure

### Documentation (this feature)

```text
specs/003-media-uploads-order-completion/
├── plan.md              # This file (/speckit-plan output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── media-api.md
│   └── order-expiry.md
├── checklists/
│   └── requirements.md  # Spec quality checklist (validated)
└── tasks.md             # Phase 2 output (/speckit-tasks — NOT created here)
```

### Source Code (repository root) — files added or modified

```text
src/
├── components/
│   ├── ui/
│   │   ├── MediaUploader.tsx            # NEW — reusable: sign → upload → validate → preview → reorder/remove
│   │   └── ImageWithFallback.tsx        # NEW — shared placeholder wrapper (FR-209/212)
│   ├── admin/catalog/
│   │   ├── ProductForm.tsx              # MODIFIED — embed MediaUploader (multi, ordered) + publish-gate UX
│   │   ├── VariationsEditor.tsx         # MODIFIED — single image per variation via MediaUploader (FR-202a)
│   │   └── CategoryManager.tsx          # MODIFIED — single category image via MediaUploader (admin-only, FR-203)
│   ├── admin/offers/OffersManager.tsx   # MODIFIED — per-slide image via MediaUploader
│   └── product/VariantPicker.tsx        # MODIFIED — selecting a variation swaps the featured image (FR-202b)
├── lib/media/
│   └── cloudinary.ts                    # MODIFIED — add `destroyAsset()` (signed) + `validateUploadMeta()`
├── models/
│   └── Order.ts                         # MODIFIED — add `expiresAt`, `stockRestored` (additive)
├── services/
│   ├── admin/catalog.admin.service.ts   # MODIFIED — publish gate; delete removed/replaced assets (product, variation, category); validate variation image
│   ├── catalog.service.ts               # MODIFIED — expose variation `image` on ProductDetailDTO for the storefront swap
│   └── order.service.ts                 # MODIFIED — set expiresAt on create; `expireStaleOrders()` sweep; late-payment reconcile
├── app/
│   ├── api/
│   │   ├── admin/
│   │   │   ├── products/[id]/route.ts   # MODIFIED — accept images on PATCH; enforce publish gate
│   │   │   ├── categories/route.ts (+[id]) # MODIFIED — accept category image
│   │   │   ├── offers/route.ts (+[id])  # MODIFIED — accept slide image; cleanup on remove
│   │   │   └── orders/route.ts          # MODIFIED — filter by completion state (incomplete vs confirmed)
│   │   └── cron/expire-orders/route.ts  # NEW — secret-gated trigger calling expireStaleOrders()
│   ├── [locale]/(admin)/admin/orders/page.tsx # MODIFIED — completion-state filter/badges
│   └── [locale]/(storefront)/products/[slug]/page.tsx # MODIFIED — gallery + VariantPicker share selection for featured-image swap (FR-202b)
├── components/storefront/HomeSlider.tsx # MODIFIED — render via ImageWithFallback; handle zero slides
└── messages/{ar,en}.json                # MODIFIED — uploader + order-state keys

tests/
├── unit/
│   ├── media.validate.test.ts           # NEW — type/size/count validation (FR-206/SC-207)
│   └── order.expiry.idempotent.test.ts  # NEW — restore once; no oversell on late payment (FR-215/216, SC-206)
├── integration/
│   ├── product.publish-gate.test.ts     # NEW — cannot publish without an image (FR-201a)
│   └── order.expiry.sweep.test.ts       # NEW — sweep expires + restores stock (FR-213/214, SC-204)
└── e2e/
    └── media-and-offers.spec.ts         # NEW — upload product image → shows on storefront; offer slide shows on home
```

**Structure Decision**: Extend the existing single full-stack Next.js project in place (same structure
as `001`). The new `MediaUploader` lives in `components/ui` so all admin forms share exactly one uploader
(Principle I); a shared `ImageWithFallback` guarantees no broken images. The same `MediaUploader`, in single-image mode, is reused
in the `VariationsEditor` so per-variation imagery needs no bespoke control. The storefront
featured-image swap (FR-202b) is achieved by lifting variation selection so the product detail gallery
shows the selected variation's image when present and falls back to the product gallery otherwise. Order
expiry is a domain-service function (`expireStaleOrders`) invoked by a thin, secret-gated
`app/api/cron/expire-orders` route so the host scheduler can drive it without coupling business logic to
the trigger.

## Complexity Tracking

> No constitution violations — this section is intentionally empty.
