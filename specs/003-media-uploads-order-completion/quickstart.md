# Quickstart: Media Uploads, Homepage Offer Imagery & Incomplete-Order Handling

Extends the running `001-ecommerce-platform`. Reuses existing MongoDB, Redis, Cloudinary, and SMTP
configuration. New configuration:

- `ORDER_EXPIRY_MINUTES` (optional, default 30) — pending-order expiry window.
- `CRON_SECRET` (required to enable the expiry route) — shared secret for `/api/cron/expire-orders`.

Ensure Cloudinary env vars from `001` are set (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`,
`CLOUDINARY_API_SECRET`); without them, image upload is disabled.

## Validate each user story

### US1 — Image management
1. Sign in as admin → `/{locale}/admin/products/new`.
2. Upload two images; confirm previews appear, reorder them, and remove one; confirm progress disables
   submit until uploads finish.
3. Try to publish with **no** image → blocked with a clear message (FR-201a). Add an image → publish
   succeeds; both images appear on the storefront product page in order, first as the thumbnail (SC-201).
4. Set a category image in the category manager → it shows wherever the category appears.
5. Upload a `.gif`/`.bmp` or a >5 MB file → rejected with a clear message; nothing saved (SC-207).
6. Remove an image and save → confirm the Cloudinary asset is deleted (check logs/host).

### US2 — Homepage offer imagery
1. As admin → `/{locale}/admin/offers`; create two active slides, each with an uploaded image + CTA.
2. Order them; visit the homepage as a guest in `ar` and `en` → both images show in order, each CTA
   links correctly (SC-203).
3. Deactivate one → it disappears from the homepage. Remove a slide's image → homepage shows a
   placeholder, not a broken image (SC-202).

### US3 — Incomplete-order handling
1. Set `ORDER_EXPIRY_MINUTES=1` for testing. Start a checkout reserving the last unit of an item but
   never pay.
2. Wait past the window, then trigger the sweep:
   `curl -X POST -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/expire-orders`
   → response shows `expired ≥ 1`.
3. Confirm the order is now `failed` and the unit is purchasable again (SC-204/205).
4. Re-run the sweep → the same order is **not** restored again (idempotent; SC-206).
5. In `/{locale}/admin/orders`, filter `completion=incomplete` → the expired order is distinguished from
   confirmed orders (FR-217).
6. (Late payment) Simulate a paid webhook for the expired order with stock now unavailable → it is **not**
   confirmed (no oversell); with stock available → it reconciles to confirmed.

## Tests

```bash
npm run test            # unit + integration (Vitest, MongoDB Memory Server)
npm run test:e2e        # Playwright: media + offers journey
```

Critical-path tests to confirm green before shipping:
- `tests/unit/media.validate.test.ts` — type/size/count validation (FR-206/SC-207).
- `tests/unit/order.expiry.idempotent.test.ts` — restore once; no oversell on late payment (FR-215/216).
- `tests/integration/product.publish-gate.test.ts` — cannot publish without an image (FR-201a).
- `tests/integration/order.expiry.sweep.test.ts` — sweep expires + restores stock (FR-213/214/SC-204).
