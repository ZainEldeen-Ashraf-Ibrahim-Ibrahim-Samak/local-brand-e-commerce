# Contract: Media Upload, Validation & Cleanup

Reuses the existing `POST /api/admin/media/sign` and the catalog/offer admin endpoints. This contract
specifies the additions and the rules image-bearing payloads must satisfy.

## POST /api/admin/media/sign  (existing — reused)

Admin-only. Returns signed Cloudinary params for a direct browser upload. The signature MAY additionally
constrain `allowed_formats` (jpg,png,webp) and `max_bytes` (5 MB) for defense in depth.

**200**: `{ timestamp, signature, apiKey, cloudName, folder }`

## Browser → Cloudinary (direct upload)

The `MediaUploader` uploads the file to Cloudinary using the signed params, then keeps the response
fields it needs to build a `MediaRef` and validate:
```json
{ "public_id": "products/abc123", "version": "1717...", "format": "webp", "bytes": 184320 }
```
→ `MediaRef = { cloudinaryId: public_id, version, alt: { en, ar } }` (plus `format`,`bytes` passed to the
save call for server re-validation).

## MediaRef validation (server-side, applied by catalog/offer save paths)

A persisted image MUST satisfy (else **422**, nothing saved — FR-206/SC-207):
- `format ∈ { jpg, jpeg, png, webp }`
- `bytes ≤ 5 * 1024 * 1024`
- per product: resulting `images.length ≤ 8`

Helper: `validateUploadMeta({ format, bytes })` in `lib/media/cloudinary.ts`.

## Image-bearing admin payloads (additions to existing endpoints)

### Products — `POST /api/admin/products`, `PATCH /api/admin/products/[id]`
- Accept `images: MediaRef[]` (ordered; index 0 = primary).
- **Publish gate (FR-201a)**: if `status` resolves to `published`, require `images.length ≥ 1` →
  **422** `{ "error": { "code": "image_required", "message": "Publish requires at least one image" } }`.
- On update, any image present before and absent after is deleted from Cloudinary immediately (FR-208).

### Categories — `POST /api/admin/categories`, `PATCH /api/admin/categories/[id]`
- Accept `image: MediaRef | null`. Replacing or clearing it deletes the prior asset.

### Offers — `POST /api/admin/offers`, `PATCH /api/admin/offers/[id]`, `DELETE /api/admin/offers/[id]`
- Accept `image: MediaRef | null` per slide. Deleting a slide or replacing its image deletes the prior
  asset.

## Cleanup helper

`destroyAsset(cloudinaryId)` — signed, server-side, uses the API secret. Called for each removed
`cloudinaryId`; failures are caught and logged (with the id) for retry and never block the save (FR-208).

## Storefront rendering

- `ImageWithFallback` renders `mediaUrl(ref)` (existing `f_auto,q_auto,w_*` transform) when a ref exists,
  else a neutral localized placeholder — guaranteeing zero broken images (FR-209/212, SC-202).
- Homepage slider shows active offers in `sortOrder`, each via `ImageWithFallback`; zero slides renders a
  calm empty state (FR-210/211/212).
