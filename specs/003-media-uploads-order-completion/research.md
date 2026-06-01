# Phase 0 Research: Media Uploads, Homepage Offer Imagery & Incomplete-Order Handling

Technical Context is inherited from `001-ecommerce-platform`; no NEEDS CLARIFICATION remained after
`/speckit-clarify`. Research records the design decisions grounded in the existing codebase.

## R1 — Reusable image upload control (FR-201/203/204/205)

- **Decision**: One client component `components/ui/MediaUploader.tsx`. Flow: (a) POST
  `/api/admin/media/sign` (existing) to get signed params for a folder; (b) upload the file **directly
  from the browser to Cloudinary** (no app byte round-trip); (c) on success, hold the returned
  `{ public_id (cloudinaryId), version, format, bytes }`; (d) emit a `MediaRef` plus localized alt text
  to the parent form. Supports single or multiple (max configurable, default 8), preview thumbnails,
  drag/reorder, and remove. Disables the parent form's submit while an upload is in flight (FR-201 #5).
- **Rationale**: Exactly one uploader satisfies Principle I; direct-to-Cloudinary keeps the app off the
  byte path (Principle VI); the signing endpoint already exists and keeps the secret server-side
  (Principle III).
- **Alternatives considered**: Per-form bespoke uploaders (rejected — duplicates UI, violates Principle
  I); proxying bytes through the Next API (rejected — wastes bandwidth/time, no benefit here).

## R2 — Upload validation: type, size, count (FR-206, SC-207)

- **Decision**: Validate twice. (1) **Client** pre-checks MIME type ∈ {jpeg, png, webp} and size ≤ 5 MB
  before uploading, and enforces ≤ 8 images per product in the form. (2) **Server** re-validates on save:
  a shared `validateUploadMeta({ format, bytes })` in `lib/media/cloudinary.ts` rejects non-allowed
  formats / oversize, and the admin catalog service rejects > 8 images — because a browser-driven upload
  cannot be trusted by the server alone, the persisted `MediaRef` carries `format`/`bytes` that the save
  path checks before writing.
- **Rationale**: Client validation gives instant feedback; server re-validation is the authoritative
  gate (Principle III). Cloudinary's signed-upload `allowed_formats`/`max_bytes` can additionally be set
  on the signature for defense in depth.
- **Alternatives considered**: Trusting client validation only (rejected — bypassable); fetching asset
  metadata from Cloudinary on every save (rejected — extra latency; the upload response already returns
  format/bytes).

## R3 — Asset cleanup on remove / orphan (FR-208)

- **Decision**: Add a signed `destroyAsset(cloudinaryId)` to `lib/media/cloudinary.ts` (server-side,
  uses the API secret). The admin catalog/offer services compute the set of `cloudinaryId`s removed by an
  update (old set minus new set) and call `destroyAsset` immediately for each; failures are caught and
  logged (with the id) for retry, never blocking the save. If a save fails after a browser upload, the
  client calls a remove/cleanup path (or the next save reconciles) so orphans are deleted.
- **Rationale**: Immediate delete (the clarified choice) avoids storage growth without a new tracking
  collection; logging failed deletes preserves eventual cleanup.
- **Alternatives considered**: Deferred sweep with an `orphaned-assets` collection (rejected per
  clarification — more moving parts than needed for current volume).

## R4 — Publish-requires-image gate (FR-201a)

- **Decision**: Enforce in `catalog.admin.service` on create/update: when the resulting `status` is
  `published`, require `images.length ≥ 1`, else throw a 422 with a clear message. `draft`/`unpublished`
  may have zero images. The product PATCH route already flows through the service, so the gate is central.
- **Rationale**: Server-side invariant (Principle III/IV) guarantees no image-less product reaches the
  storefront regardless of UI.
- **Alternatives considered**: UI-only enforcement (rejected — bypassable); requiring an image on every
  product including drafts (rejected — blocks work-in-progress authoring).

## R5 — Homepage offer imagery + no-broken-image guarantee (FR-210/211/212/209)

- **Decision**: Add `ImageWithFallback` (shared) that renders `mediaUrl(ref)` when a `MediaRef` exists,
  else a neutral localized placeholder. `HomeSlider`, `ProductCard`, and category surfaces render through
  it. The home service already returns active offers ordered by `sortOrder`; `OffersManager` gains the
  per-slide image via `MediaUploader`. Slider handles zero slides gracefully (renders nothing / a calm
  empty state).
- **Rationale**: A single fallback wrapper makes "zero broken images" (SC-202) structural, not per-call.
- **Alternatives considered**: `onError` handlers scattered per `<img>` (rejected — easy to miss, not
  reusable).

## R6 — Incomplete-order expiry sweep + idempotency (FR-213/214/215, SC-204/205)

- **Decision**: Reuse the existing terminal `failed` status (no new enum value). On order create, set
  `expiresAt = now + EXPIRY_WINDOW` (env-configurable, default 30 min) and `stockRestored = false`. Add
  `expireStaleOrders()` to `order.service`: find `{ status:"pending", expiresAt ≤ now }`; for each,
  atomically transition to `failed` **and** restore stock guarded by `stockRestored` — use a conditional
  update `findOneAndUpdate({ _id, status:"pending", stockRestored:false }, { status:"failed",
  stockRestored:true, ... })`; only if that update matched (i.e., this worker won the race) call
  `restoreStock`. This makes restoration at-most-once under concurrent sweeps (FR-215). A thin
  secret-gated route `app/api/cron/expire-orders` invokes it for the host scheduler.
- **Rationale**: Reusing `failed` keeps the `001` lifecycle stable; the conditional-update guard is the
  standard idempotency pattern and is concurrency-safe; the existing `failOrder` already restores stock
  on webhook failure, so logic is shared.
- **Alternatives considered**: New `expired` status (rejected — expands the lifecycle/notifications for no
  user-visible benefit; `failed` + reason suffices); MongoDB TTL index auto-delete (rejected — would
  delete the order record and skip stock restoration).

## R7 — Late payment after expiry reconciliation (FR-216, SC-206)

- **Decision**: `confirmOrder` already early-returns when `status !== "pending"`, so a late webhook on an
  expired/failed order does **not** oversell. Extend it: if a payment confirms for an order that is
  already `failed` via expiry, re-validate current stock; if available, re-reserve and confirm; if not,
  leave failed and flag for refund (record on the order / log) — never force a stockless confirm.
- **Rationale**: Satisfies "never oversell" while handling the rare paid-after-expiry case gracefully.
- **Alternatives considered**: Always refund late payments (rejected — needlessly cancels a sale when
  stock is still available); always confirm (rejected — can oversell).

## R8 — Admin order list completion-state filter (FR-217)

- **Decision**: Extend `GET /api/admin/orders` with a `completion` filter (`incomplete` =
  pending/failed/expired-by-sweep; `confirmed` = confirmed and beyond) mapped to status sets, and surface
  a badge/filter in the admin orders page reusing the existing `statusTone` styling.
- **Rationale**: Operators must separate noise (abandoned) from real orders; reuses existing status UI.

## R9 — Per-variation image + storefront featured-image swap (FR-202a/b, SC-208)

- **Decision**: Reuse `MediaUploader` in **single-image** mode inside `VariationsEditor` for an optional
  one-image-per-variation. The data layer already supports this: `Variation.image` exists and both
  variation routes (`POST /api/admin/products/[id]/variations`, `PATCH /api/admin/variations/[id]`)
  already accept `image: MediaRef`. Gaps to close: (1) `addVariation`/`updateVariation` in
  `catalog.admin.service` re-validate the image via `validateUploadMeta` and call `destroyAsset` on the
  prior `cloudinaryId` when an image is replaced or cleared (FR-208); (2) `catalog.service` exposes the
  variation `image` on `ProductDetailDTO`; (3) the storefront lifts variation selection so the product
  detail gallery shows the selected variation's image as the featured image, falling back to the product
  gallery (index 0) when the variation has none (FR-202b). The variation image is stored separately and
  does **not** count against the product's 8-image cap.
- **Rationale**: One uploader for every surface (Principle I); no schema change; the "pick a color → see
  that color" swap is the standard storefront behavior and is purely client-side over the existing DTO.
- **Alternatives considered**: A per-variation gallery (rejected per clarification — one representative
  image suffices); counting variation images in the product's 8-cap (rejected — they are independent);
  swapping via a server round-trip on selection (rejected — image is already in the DTO, swap is local).

## R10 — Category management authorization (FR-203)

- **Decision**: Category create/rename/set-image/delete remain **admin-only**; buyers never mutate
  categories. This is already enforced — every `/api/admin/categories` and `/api/admin/categories/[id]`
  handler calls `requireRole("admin")` server-side (Principle III/IV). No code change is required; this
  feature only records and preserves the invariant (and must not relax it when wiring the category image).
- **Rationale**: Categories are shared taxonomy; central admin control prevents duplicate/conflicting
  categories across sellers. Server-side role enforcement is authoritative.
- **Alternatives considered**: Letting buyers manage categories like their products (rejected — risks
  taxonomy fragmentation); client-only role hiding (rejected — bypassable, violates Principle III).

## Summary of new/changed surfaces

| Area | New | Modified |
|------|-----|----------|
| Media | `MediaUploader`, `ImageWithFallback`, `destroyAsset`, `validateUploadMeta` | ProductForm, VariationsEditor, CategoryManager, OffersManager, product/variation/category/offer routes+services, HomeSlider/ProductCard |
| Storefront variation swap | — | VariantPicker, product detail page gallery, `catalog.service` ProductDetailDTO (variation `image`) |
| Orders | `expireStaleOrders()`, `/api/cron/expire-orders` | Order model (+expiresAt,+stockRestored), order.service (create/confirm), admin orders route+page |

**Output**: All decisions resolved; no remaining unknowns. Proceed to Phase 1.
