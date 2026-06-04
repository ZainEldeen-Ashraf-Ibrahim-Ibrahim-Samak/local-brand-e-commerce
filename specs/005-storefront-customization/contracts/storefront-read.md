# Contract: Storefront Reads — Filters, Currency, Legal Pages

Public, guest-friendly reads. No auth required. Currency-sensitive prices are converted at
read time using the active currency + stored rate. Favorites/compare are **client-only**
(localStorage) and have **no** server endpoints.

## Catalog filtering (extended)

### GET /api/storefront/products
Query params (all optional): `category` (parent or sub-category slug), `minPrice`,
`maxPrice`, `size`, `color`, `q`, `sort` (`newest|price-asc|price-desc`), `page`, `pageSize`.

Behavior:
- Selecting a parent `category` includes products in that category **and its
  sub-categories** (descendant resolution). Selecting a sub-category restricts to it. (FR-011)
- Response includes `facets` with available `sizes`, `colors`, `priceRange`, and
  `subCategories` for the active parent, plus `total` matching count. (FR-011/FR-012)
- Zero matches → `items: []`, `total: 0` (storefront renders a "no results + reset" state).

Response `200`:
```json
{
  "items": [{ "id":"", "slug":"", "name":{"en":"","ar":""}, "basePrice":12000, "image":{"cloudinaryId":"","version":""} }],
  "page": 1, "pageSize": 12, "total": 42,
  "facets": {
    "sizes": ["S","M","L"], "colors": ["black"],
    "priceRange": { "min": 5000, "max": 30000 },
    "subCategories": [{ "slug":"mens-shoes", "name":{"en":"","ar":""} }]
  },
  "currency": { "active":"EGP", "symbol":"E£", "rate":48.5 }
}
```
`basePrice` stays in base-currency minor units; the client formats display via
`formatMoney(basePrice, locale, currency)` which applies `rate`. (FR-021/SC-006)

## Currency-aware display

`formatMoney(baseMinor, locale, currencyConfig)` returns `baseMinor/100 * rate` formatted in
the active currency's symbol/locale. All storefront price surfaces (catalog, product, cart,
checkout) read the active currency from the cached settings so display is consistent and never
mixed-currency. (FR-007/FR-021/SC-006)

## Legal / informational pages

### GET /[locale]/privacy · GET /[locale]/terms
Server-rendered from `WebsiteSettings.privacyPage.body` / `termsPage.body` in the active
locale. Empty content → a safe "content not available" state rather than a broken page
(edge case). About/Contact continue to use their existing routes. (FR-004)

## Home (extended)

### GET /api/storefront/home
Response includes hero config (`background`, visible components) and **two** slide sets split
by `placement` (`heroSlides`, `offerSlides`), plus featured products. (FR-005/FR-006)

## Not exposed (by design)
- No favorites/compare endpoints — these are browser-local per FR-020.
- No client-writable currency/content endpoints — admin-only (see admin-content.md).
