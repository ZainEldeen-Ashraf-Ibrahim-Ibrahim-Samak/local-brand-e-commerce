# Contract: Seller Catalog Visibility

This feature adds a server-side read used by the seller dashboard. It introduces no new write endpoint and
changes no existing endpoint's authorization.

## Service: `listAllPublishedProducts(viewerUserId: string)`

Location: `src/services/buyer.service.ts`.

**Returns**: `Array<{ id: string; slug: string; name: { en: string; ar: string }; status: string;
basePrice: number; mine: boolean }>`

- Includes **only** `status === "published"` products, from **any** owner.
- `mine === true` when the product's `ownerUserId` equals `viewerUserId`.
- MUST NOT include any order, buyer, customer, or non-public field.

## Page consumption (read-only)

`src/app/[locale]/(buyer)/seller/products/page.tsx` (buyer-gated server page):

- Renders an "All products" read-only section listing the result (name + price), with a "Mine" badge on
  owned rows.
- MUST NOT render create/edit/publish/unpublish/delete controls for any row in this section.
- The existing "My products" section (`BuyerProductManager`) remains the only place with mutation
  controls and stays own-scoped.

## Unchanged authorization (must remain true)

- **Product writes** (`POST/PATCH /api/buyer/products[...]` → `createOwnProduct`/`updateOwnProduct`):
  ownership-guarded; cross-owner mutation returns **403** via `ownedProduct()`.
- **Order reads** (seller): `listOwnOrders(ownerUserId)` only — orders containing the seller's own
  products. No endpoint added or widened to expose other sellers' orders/customers.

## Acceptance mapping

| Requirement | Contract guarantee |
|-------------|--------------------|
| FR-301/302 | `listAllPublishedProducts` returns published products with public fields only |
| FR-303 | `mine` flag → "Mine" badge on owned rows |
| FR-304 | read-only section renders no mutation controls |
| FR-305 | query filters `status: "published"`; others' drafts excluded |
| FR-306 | `ownedProduct()` 403 guard unchanged |
| FR-307 | `listOwnOrders` order scope unchanged |
