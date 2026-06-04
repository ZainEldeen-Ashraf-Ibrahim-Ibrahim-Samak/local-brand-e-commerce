# Phase 0 Research: Storefront Customization & Shopper Tools

All four spec clarifications were resolved in the 2026-06-04 clarification session; no
`NEEDS CLARIFICATION` markers remain. Research below records the design decisions that
reconcile those answers with the existing codebase.

## 1. Currency conversion (FR-021, SC-006)

- **Decision**: Store currency config on the `WebsiteSettings` singleton:
  `currency = { base: "USD", active: "USD", options: [{ code, label{en,ar}, symbol, rate }] }`,
  where `rate` is the multiplier from the **base** currency to that currency (base rate = 1).
  Product prices stay in base-currency minor units (`Product.basePrice` is unchanged).
  Display converts at read time: `displayMinor = round(baseMinor * activeRate)`, formatted by
  an extended `formatMoney(baseMinor, locale, currencyConfig)`.
- **Rationale**: Keeps the source-of-truth price in one currency (no destructive rewrites of
  product data), satisfies "stored, admin-set exchange rate per currency," and matches the
  existing single-currency `formatMoney(currency)` signature with minimal change. Cached via
  the existing `settings` cache; invalidated on admin write.
- **Alternatives considered**: (a) Live FX feed — rejected (clarification chose stored rates;
  adds an external dependency and failure modes, Principle VI risk). (b) Rewriting stored
  prices on currency change — rejected (lossy, breaks historical orders, race-prone).
- **Historical orders**: `Order` already records the agreed totals at purchase; no
  recomputation is applied to existing orders (edge case + FR-021).

## 2. Favorites & compare persistence (FR-013–FR-018, FR-020)

- **Decision**: Implement as client-only React hooks over `localStorage`, mirroring
  `lib/cart/useCart.ts` — `lib/favorites/useFavorites.ts` (keys store product slug + minimal
  card data) and `lib/compare/useCompare.ts` (same, capped at 3). Each writes its key and
  dispatches a custom window event (`lb_fav_change`, `lb_cmp_change`) so badges re-read.
- **Rationale**: The clarification chose browser-local persistence for everyone with no
  cross-device sync; this is exactly the established guest-cart pattern (FR-007), needs no new
  collection or auth coupling, and keeps the security surface limited to admin endpoints.
- **Stale items (edge case, FR-018)**: Lists hold product references; on render the list page
  resolves them against the published catalog and silently omits (or marks unavailable) any
  product that is no longer published, so a deleted/unpublished product never breaks the list.
- **Alternatives considered**: Server-side favorites tied to accounts — rejected by the
  clarification (no cross-device sync required) and would exclude guests.

## 3. Sub-categories (FR-008, FR-011, US7)

- **Decision**: Reuse the existing `Category.parent` self-reference (already in the model).
  Admin gets a nested-category manager; storefront filtering by a parent category includes its
  descendants. `catalog.service.listProducts` gains sub-category resolution: when a category
  slug is selected, resolve its `_id` set (self + children) and match `product.category $in`
  that set; facets expose available sub-categories for the active parent.
- **Rationale**: No schema change for the data model itself; the hierarchy already exists.
  Keeps one canonical `Category` entity (Terminology consistency).
- **Alternatives considered**: A separate `SubCategory` collection — rejected (duplicates the
  existing self-referential model, splits browsing logic).

## 4. Hero background & slider separation (FR-005, FR-006, US2)

- **Decision**: Add `hero` to `WebsiteSettings`: `{ background: mediaRef, heading, subtext,
  cta{label,href}, showHeading, showSubtext, showCta }`. Background uploads use the existing
  signed Cloudinary endpoint (`app/api/admin/media/sign`), consistent with logo handling
  (FR-010). The hero background is rendered **full-bleed across the home hero area** with
  components layered over it (clarification answer). Separate the two sliders by adding
  `placement: "hero" | "offer"` (default `"offer"`) to the `Offer` model; `home.service`
  returns each set independently.
- **Rationale**: Reuses `Offer` (already the slider source) and the proven signed-upload
  media flow; a single discriminator field is the smallest change that distinguishes the hero
  slider from the offer slider.
- **Alternatives considered**: Global site-wide background image — rejected by clarification
  (full-bleed hero area only). A new `HeroSlide` model — rejected (Offer already fits).

## 5. Content & legal pages (FR-001–FR-004)

- **Decision**: `WebsiteSettings` already models `header.navLinks`, `footer`, `aboutPage`,
  `contactPage`, `socialLinks`, `seo`. Add `privacyPage{ body }`, `termsPage{ body }`
  (localized) and an optional `homeSections` config. New storefront routes
  `/[locale]/privacy` and `/[locale]/terms` render these like the existing about/contact
  pages. Empty content renders a safe "not available" state (edge case).
- **Rationale**: Extends the established singleton + cached-read + invalidate-on-write
  pattern; no new model.

## 6. Count badges (FR-017, SC-005)

- **Decision**: A shared `components/ui/CountBadge.tsx` consumes counts from `useCart`,
  `useFavorites`, `useCompare`. Each hook already (or will) emit a change event and listen for
  `storage`, so badges stay accurate across tabs and reloads.
- **Rationale**: One reusable badge (Principle I); reuses the cart's event mechanism.

## 7. Authorization & validation (FR-009, Principle III)

- **Decision**: New admin APIs live under `app/api/admin/**`, reusing the existing admin
  auth guard/middleware and Zod request validation used by current admin settings routes;
  writes call the matching `invalidate*` cache helper.
- **Rationale**: Mirrors existing admin route conventions; keeps server-side authorization
  non-negotiable and consistent.

## Summary of schema deltas

| Model | Change | Type |
|-------|--------|------|
| `WebsiteSettings` | + `privacyPage`, `termsPage`, `hero`, `currency`, `homeSections` | additive |
| `Offer` | + `placement: "hero" \| "offer"` (default `"offer"`) | additive |
| `Category` | none (`parent` already present) | — |
| (favorites/compare) | none — browser localStorage | — |
