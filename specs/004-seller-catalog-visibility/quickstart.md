# Quickstart: Seller Catalog Visibility

Extends the running platform. No new configuration, dependencies, or schema changes.

## Validate the user story

### US1 — Seller browses the full published catalog read-only

1. Ensure two seller (buyer) accounts exist, each owning at least one **published** product (use the admin
   accounts UI to provision sellers if needed).
2. Sign in as **Seller A** → land on `/{locale}/seller` → open **My products** (`/seller/products`).
3. Confirm the **My products** section lists only Seller A's products and still has create / publish /
   unpublish controls (unchanged).
4. Confirm the **All products** section lists **both** Seller A's and Seller B's published products
   (name + price), and only Seller A's rows show the **"Mine"** badge.
5. Confirm **no** edit / publish / remove controls appear for Seller B's products in the All products list.
6. Set one of Seller B's products to **draft/unpublished** (as admin or Seller B) → reload Seller A's page
   → that product no longer appears in All products (only published are visible).
7. Negative check (own-only writes): as Seller A, attempt to PATCH Seller B's product directly:
   `curl -X PATCH http://localhost:3000/api/buyer/products/<sellerB_product_id> -H "Content-Type: application/json" -d '{"status":"unpublished"}'`
   → **403** (visibility never grants write access).
8. Confirm Seller A's orders view still shows only orders containing Seller A's products (no Seller B
   orders/customers).

## Tests

```bash
npm run test    # unit + integration (Vitest, MongoDB Memory Server)
```

Critical-path test to confirm green:
- `tests/integration/seller.catalog-visibility.test.ts` — published-only cross-owner read with correct
  `mine` flag; other sellers' drafts excluded; cross-owner write still returns 403; order scope unchanged.

## i18n / theming check

- Verify the **All products** section and "Mine" badge render correctly in AR/RTL and EN/LTR, and in dark
  and light modes (Constitution Principle II).
