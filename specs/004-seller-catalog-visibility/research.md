# Phase 0 Research: Seller Catalog Visibility

Technical Context is inherited from the shipped platform; no NEEDS CLARIFICATION remained after spec
authoring. Research records the design decisions grounded in the existing codebase.

## R1 — Read-only catalog query for sellers (FR-301/302/305)

- **Decision**: Add `listAllPublishedProducts(viewerUserId)` to `src/services/buyer.service.ts`. It queries
  `Product.find({ status: "published" })` across all owners and maps each to a minimal, public-only shape
  `{ id, slug, name, status, basePrice, mine }` where `mine = String(ownerUserId) === viewerUserId`. It
  returns no order, buyer, or customer fields.
- **Rationale**: A single owner-agnostic read keeps the new capability isolated from the own-scoped
  write/edit functions (`listOwnProducts`, `ownedProduct`, `updateOwnProduct`), so visibility cannot leak
  into control (Principle III/IV). Filtering to `published` ensures other sellers' drafts stay private.
- **Alternatives considered**: Broadening `listOwnProducts` to optionally include others (rejected —
  entangles the own-only path and risks accidentally exposing edit affordances); reusing the storefront
  `listProducts` facet pipeline (rejected — heavier than needed and shaped for public filtering, not the
  dashboard list + `mine` flag).

## R2 — Surfacing the list without write affordances (FR-303/304)

- **Decision**: Render the read-only list as a server-rendered section on the existing seller products
  page (`(buyer)/seller/products/page.tsx`), using shared `Card`/`Badge` and `pickLocale`. The seller's
  own items get a "Mine" badge; no row exposes edit/publish/remove controls. The editable
  `BuyerProductManager` ("My products") is unchanged and remains the only place with mutation controls.
- **Rationale**: Server rendering needs no client interactivity (it is read-only), reuses tokens/primitives
  (Principle I), and is correct in RTL/LTR + dark/light (Principle II). Separating "My products"
  (editable) from "All products" (read-only) makes the capability boundary obvious to the user and the
  reviewer.
- **Alternatives considered**: A client component with its own fetch (rejected — unnecessary; data is
  available server-side and read-only); merging both lists into one table with conditional controls
  (rejected — easy to accidentally render an edit control for a non-owned row).

## R3 — Preserving own-only writes and order scope (FR-306/307)

- **Decision**: No change to any write path or order query. Product mutations continue through
  `ownedProduct(id, ownerUserId)` which throws 403 on cross-owner access; `listOwnOrders(ownerUserId)`
  remains the only seller order read and is untouched.
- **Rationale**: The feature is visibility-only. Leaving the guards and order scope exactly as-is
  guarantees SC-303 (no cross-seller editing or order/customer-data exposure) by construction.
- **Alternatives considered**: Adding an "all orders" view for sellers (rejected — explicit out-of-scope;
  would expose other sellers' customer data and require a Principle IV constitution amendment).

## Summary of new/changed surfaces

| Area | New | Modified |
|------|-----|----------|
| Service | `listAllPublishedProducts(viewerUserId)` | — |
| UI | — | `(buyer)/seller/products/page.tsx` (read-only "All products" section) |
| Tests | `seller.catalog-visibility.test.ts` | — |

**Output**: All decisions resolved; no remaining unknowns. Proceed to Phase 1.
