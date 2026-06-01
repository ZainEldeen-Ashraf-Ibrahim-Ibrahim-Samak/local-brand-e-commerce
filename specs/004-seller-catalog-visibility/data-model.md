# Phase 1 Data Model: Seller Catalog Visibility

No schema changes. This feature adds a read-only projection over the existing `Product` collection.

## Product (existing — read-only projection)

Existing fields used: `name` (localized), `slug`, `basePrice` (integer minor units), `status`
(`draft` | `published` | `unpublished`), `ownerUserId`.

**Read projection for the seller catalog view** (`listAllPublishedProducts(viewerUserId)`):

| Field | Source | Notes |
|-------|--------|-------|
| `id` | `_id` | stringified |
| `slug` | `slug` | |
| `name` | `name` | localized `{ en, ar }`; rendered via `pickLocale` |
| `status` | `status` | always `published` for this view (filtered) |
| `basePrice` | `basePrice` | integer minor units; formatted with `formatMoney` |
| `mine` | derived | `true` when `String(ownerUserId) === viewerUserId` |

**Query rule**: `Product.find({ status: "published" })`, any owner. No order, buyer, or customer fields are
read or returned (Principle III).

## Authorization invariants (unchanged — enforced server-side)

- **Read scope**: only `published` products are visible cross-owner; other owners' `draft`/`unpublished`
  products are excluded (FR-305). A seller's own non-published products remain visible only via their own
  `listOwnProducts` ("My products").
- **Write scope**: product mutations require ownership — `ownedProduct(id, ownerUserId)` throws **403** on
  cross-owner access (FR-306). Unchanged by this feature.
- **Order scope**: `listOwnOrders(ownerUserId)` returns only orders containing the seller's own products
  (FR-307). Unchanged by this feature.

## Entity relationships

```text
Seller (buyer account)
  ├─ owns ──> Product[] (editable, any status)            # "My products" (listOwnProducts)
  ├─ sees ──> Product[] where status=published (read-only) # "All products" (listAllPublishedProducts, mine flag)
  └─ sees ──> Order[] containing own products (read-only)  # listOwnOrders (unchanged, own-scoped)
```
