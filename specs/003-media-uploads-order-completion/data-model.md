# Phase 1 Data Model: Media Uploads & Incomplete-Order Handling

Builds on `001-ecommerce-platform`. Image fields already exist on the catalog models; the only schema
changes are two additive fields on `Order`. Money is in integer minor units (unchanged).

## MediaRef (existing shape — reused) 

Already defined on the catalog models:
`{ cloudinaryId: string, version: string, alt: { en: string, ar: string } }`.

- **Product.images**: `MediaRef[]` (required `cloudinaryId`/`version`) — ordered; index 0 is primary
  (FR-202). Max 8 (FR-201, enforced in service).
- **Variation.image**: single `MediaRef` (optional) (FR-202a) — already on the schema
  (`{ cloudinaryId, version, alt }`). Stored independently of `Product.images` and does **not** count
  against the 8-image product cap. Used as the storefront featured image when the variation is selected,
  with fallback to the product gallery (FR-202b).
- **Category.image**: single `MediaRef` (optional) (FR-203). Category mutations are admin-only.
- **Offer.image**: single `MediaRef` (optional; fallback if missing) (FR-204/212).

**Validation rules added by this feature** (enforced server-side, no schema change):
- Persisted images MUST be JPEG/PNG/WebP and were ≤ 5 MB at upload time (FR-206) — checked via
  `validateUploadMeta({ format, bytes })` carried from the upload response. Applies to product, variation,
  category, and offer images alike.
- A Product with `status = "published"` MUST have `images.length ≥ 1` (FR-201a). A variation image is
  optional and never gates publishing.
- On update, any `cloudinaryId` present before but absent after MUST be deleted from the host
  immediately (FR-208) — including a variation image that is replaced or cleared.
- Category and `Variation` mutating endpoints MUST enforce server-side `requireRole("admin")` (FR-203;
  Principle IV).

## Order (MODIFIED) — `src/models/Order.ts`

Existing fields unchanged (orderNumber, items, customer{email,whatsapp,name}, shippingAddress,
subtotal/discountTotal/taxTotal/shippingOption/grandTotal, status ∈ ORDER_STATUSES, statusHistory,
payment, timestamps).

**Added fields**:

| Field | Type | Rules |
|-------|------|-------|
| `expiresAt` | Date (indexed) | Set on creation of a `pending` order to `createdAt + EXPIRY_WINDOW` (env default 30 min). The sweep targets `status:"pending", expiresAt ≤ now`. Cleared/ignored once not pending. |
| `stockRestored` | Boolean (default false) | Guards one-time stock restoration (FR-215). Set true atomically in the same conditional update that transitions an order to `failed`. |

**Status usage** (no enum change): incomplete-order expiry reuses the existing terminal `failed` status
(`pending → failed` is already a valid transition). "Incomplete" for admin filtering = {`pending`,
`failed`}; "confirmed" = {`confirmed`,`processing`,`shipped`,`delivered`,`returned`,`refunded`}.

**State transitions relevant here**:
- `pending → confirmed` — payment paid before `expiresAt` (existing `confirmOrder`).
- `pending → failed` — (a) webhook failure (existing `failOrder`), or (b) **sweep** when `expiresAt ≤ now`
  (new `expireStaleOrders`). Both restore stock exactly once via the `stockRestored` guard.
- `failed (expired) + late payment` — reconcile: re-validate stock; if available re-reserve + confirm,
  else stay failed and flag for refund (FR-216). Never confirm without available stock.

**Idempotency invariant**: stock for an order is restored at most once. Implemented as
`findOneAndUpdate({ _id, status:"pending", stockRestored:false }, { $set:{ status:"failed",
stockRestored:true }, $push:{ statusHistory } })`; `restoreStock` is called only when this update matched.

## Configuration

| Key | Purpose | Default |
|-----|---------|---------|
| `ORDER_EXPIRY_MINUTES` (env) | Pending-order expiry window | 30 |
| `CRON_SECRET` (env) | Shared secret guarding `/api/cron/expire-orders` | required to enable the route |
| Upload limits (constants) | max 8 images/product, 5 MB/file, formats jpeg/png/webp | fixed (FR-206) |

## Entity relationships

```text
Product.images[] ──┐
Variation.image ──┤
Category.image  ──┼── MediaRef → Cloudinary asset (deleted via destroyAsset on removal)
Offer.image     ──┘
Variation.image ──(selected on storefront)──> featured image; fallback → Product.images[0]
Order(pending, expiresAt) ──sweep──> Order(failed, stockRestored=true) ──> restoreStock(items)
Order.items[].variation ──restoreStock──> Variation.stock (returned to inventory)
```
