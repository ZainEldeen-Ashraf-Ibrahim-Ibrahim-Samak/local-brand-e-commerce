# Phase 1 Data Model: Storefront Customization & Shopper Tools

All persisted changes are **additive** to existing Mongoose models. Favorites and compare are
**not** persisted server-side (browser localStorage, FR-020). Localized fields use the
existing `{ en: string, ar: string }` shape; media uses the existing `mediaRef`
`{ cloudinaryId, version, alt{en,ar} }`.

## WebsiteSettings (MODIFIED — singleton `main`)

Existing: `storeName`, `logo`, `header{ announcement, navLinks[] }`, `footer{ aboutShort,
columns[] }`, `contactPage`, `aboutPage`, `socialLinks[]`, `seo`.

Added fields:

| Field | Type | Rules / Notes |
|-------|------|---------------|
| `privacyPage.body` | localized | FR-004; empty → storefront shows "not available" |
| `termsPage.body` | localized | FR-004; empty → "not available" |
| `hero.background` | mediaRef | FR-005/FR-010; Cloudinary signed upload; full-bleed render |
| `hero.heading` | localized | Overlay component content |
| `hero.subtext` | localized | Overlay component content |
| `hero.cta` | `{ label: localized, href: string }` | Overlay CTA |
| `hero.showHeading` | boolean (default true) | Component visibility toggle (FR-005) |
| `hero.showSubtext` | boolean (default true) | Component visibility toggle |
| `hero.showCta` | boolean (default true) | Component visibility toggle |
| `currency.base` | string (ISO 4217, default `"USD"`) | Source currency of `Product.basePrice` |
| `currency.active` | string (ISO 4217, default `"USD"`) | Currently displayed currency (FR-007) |
| `currency.options[]` | `[{ code, label: localized, symbol, rate }]` | `rate` = multiplier from base; base entry `rate = 1`; `rate > 0` (FR-021) |
| `homeSections` | array of `{ key, isVisible, sortOrder }` | FR-003; which home blocks show + order |

**Validation**: `currency.active` MUST be one of `currency.options[].code`; each `rate` is a
positive number; `currency.base` entry has `rate === 1`. All writes are admin-only and
Zod-validated at the route, then invalidate the `settings` (+ `home`) cache.

## Offer (MODIFIED)

Existing: `title`, `subtitle`, `image`, `ctaLabel`, `ctaHref`, `isActive`, `sortOrder`,
`startsAt`, `endsAt`.

| Field | Type | Rules / Notes |
|-------|------|---------------|
| `placement` | enum `"hero" \| "offer"` (default `"offer"`, index) | FR-006; separates hero slider from offer slider |

State: a slide is shown when `isActive` and within `[startsAt, endsAt]` (existing logic),
filtered by `placement` for the target slider.

## Category (UNCHANGED — already supports nesting)

`parent: ObjectId | null` already exists. Sub-categories are `Category` docs with a non-null
`parent`. Rules: a sub-category's `parent` MUST reference an existing active category; cycles
are disallowed; `slug` remains globally unique. Used by `catalog.service` to resolve
descendant `_id` sets for filtering (FR-008/FR-011).

## Order (UNCHANGED)

Records agreed totals at purchase. No recomputation on currency change (FR-021 edge case);
historical orders remain in the currency/amounts the buyer agreed to.

## Client-only structures (NOT in MongoDB)

### FavoritesList — `localStorage["lb_fav_v1"]`
Array of `{ productSlug, name{en,ar}, basePrice, image? }`. Add/remove toggles membership;
dispatches `lb_fav_change`. Stale entries omitted on render against the published catalog
(FR-018).

### CompareList — `localStorage["lb_cmp_v1"]`
Same item shape, **max 3** entries (FR-016). Add beyond capacity is blocked and surfaces a
"list full — remove one" message; dispatches `lb_cmp_change`.

### Catalog Filter State — URL/query only
Derived from query params consumed by `catalog.service.listProducts`: `categorySlug`
(parent or sub-category), `minPrice`, `maxPrice`, `size`, `color`, `q`, `sort`, `page`.
No persistence; drives the displayed product set and result count (FR-011/FR-012).

## Entity relationships

```text
WebsiteSettings (singleton) ──1:1── hero / currency / privacyPage / termsPage / homeSections
Category ──self ref (parent)── Category (sub-category)  ──1:N── Product
Offer (placement: hero|offer) ── powers ── HeroSlider / OfferSlider
Product (basePrice in currency.base) ── display-converted via ── currency.active × rate
FavoritesList / CompareList (localStorage) ── reference ── Product (by slug, resolved at read)
```
