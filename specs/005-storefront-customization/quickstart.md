# Quickstart: Storefront Customization & Shopper Tools

How to validate this feature end-to-end against the spec's acceptance scenarios.

## Prerequisites
- Local stack running (MongoDB, Redis) with seeded catalog, an admin account, and Cloudinary
  configured (same env as prior features).
- Run dev server: `npm run dev`. Tests: `npm test` (Vitest). Lint: `npm run lint`.

## Admin flows (sign in as admin → `/[locale]/admin`)

1. **Content & legal pages** (US1 / FR-001–FR-004)
   - `admin/content`: edit footer text + add/reorder/remove a nav link → save.
   - Edit Privacy and Terms bodies (AR + EN) → save.
   - Verify: storefront footer + nav update on reload; `/[locale]/privacy` and
     `/[locale]/terms` render the new content in both locales. Empty page → "not available".

2. **Hero + sliders** (US2 / FR-005/FR-006/FR-010)
   - `admin/content` → Hero: upload a background image (signed Cloudinary), toggle the CTA on,
     edit heading/subtext → save.
   - Sliders: add one `offer` slide and one `hero` slide; reorder.
   - Verify: home hero shows the full-bleed background with CTA layered over it; the offer and
     hero sliders rotate their own slides; image served optimized (Cloudinary URL).

3. **Currency** (US8 / FR-007/FR-021/SC-006)
   - `admin/content` → Currency: add EGP with a rate, set it active → save.
   - Verify: catalog/product/cart/checkout prices display in EGP using the rate; no
     mixed-currency display; a previously placed order still shows its original amount.

4. **Sub-categories** (US7 / FR-008)
   - `admin/categories`: create a sub-category under an existing category; assign a product.
   - Verify: it nests under its parent; the product appears under that sub-category.

## Shopper flows (storefront, no login required)

5. **Filters** (US3 / FR-011/FR-012/SC-003)
   - On the catalog, apply category + price range + a size; confirm results match and a count
     shows. Select a parent category → includes sub-category products. Force zero matches →
     "no results + reset". Result updates < 1s.

6. **Favorites** (US4 / FR-013/FR-014)
   - Favorite two products from cards/detail; open `/[locale]/favorites` → both listed; toggle
     one off → list updates. Reload → favorites persist (same browser).

7. **Compare** (US5 / FR-015/FR-016)
   - Add products to compare; open `/[locale]/compare` → side-by-side. Add a 4th → blocked with
     "list full — remove one" (max 3).

8. **Count badges** (US6 / FR-017/SC-005)
   - Add items to cart, favorites, compare → each badge shows the count; remove → decrements;
     reload and switch tabs → counts stay accurate; empty → zero/no badge.

## Cross-cutting checks (FR-019 / Principle II / SC-007)
- Verify every new surface in AR/RTL and EN/LTR, and in light and dark mode, across desktop /
  tablet / mobile. No hard-coded colors — shared tokens/components only.

## Authorization checks (FR-009 / Principle III)
- Hit each `PUT/POST/DELETE /api/admin/**` endpoint as a guest (`401`) and as a non-admin
  buyer (`403`). Confirm storefront reflects admin changes within one reload (cache
  invalidation).

## Suggested test entry points
- `tests/integration/content.settings.test.ts`, `currency.conversion.test.ts`,
  `catalog.subcategory-filter.test.ts`, `sliders.placement.test.ts`
- `tests/unit/useFavorites.test.ts`, `useCompare.test.ts`
