# Contract: Storefront API (guest, unauthenticated)

**Base**: `/api/storefront` · **Auth**: none (guest) · **Locale**: via `Accept-Language` or `?locale=ar|en`

All responses JSON. Money in minor units. Errors: `{ error: { code, message } }` with appropriate
HTTP status. List endpoints are cached (Redis) and rate-limited where noted.

## Catalog & discovery (FR-001, FR-002, FR-003, FR-005)

### GET /api/storefront/products
Query: `category`, `q` (search), `size`, `color`, `minPrice`, `maxPrice`, `attr.<key>`, `sort`,
`page`, `pageSize`. Filters combine (AND). Only `published` products returned.
- 200 → `{ items: ProductCardDTO[], page, pageSize, total, facets: { sizes[], colors[], priceRange } }`

### GET /api/storefront/products/:slug
- 200 → `ProductDetailDTO` (incl. variations with per-variant stock/price and availability flag)
- 404 → not found / not published

### GET /api/storefront/categories
- 200 → `{ tree: CategoryNodeDTO[] }`

## Cart (FR-006) — server-validated pricing
Cart may be client-held; these endpoints validate/reprice.

### POST /api/storefront/cart/validate
Body: `{ items: [{ variationId, quantity }] }`
- 200 → `{ items: PricedCartItemDTO[], subtotal, unavailable: [{ variationId, reason }] }`
- Out-of-stock variants returned in `unavailable` and excluded from totals (FR-005).

## Coupons (FR-024, FR-038)

### POST /api/storefront/coupons/apply
Body: `{ code, items: [{ variationId, quantity }] }`
- 200 → `{ valid: true, discountTotal, perLine: [...] }` (no-stacking applied: larger reduction wins)
- 422 → `{ valid: false, reason: 'expired'|'invalid'|'over_limit'|'ineligible' }`

## Checkout & payment (FR-007–FR-012, FR-034)

### POST /api/storefront/checkout/quote
Body: `{ items, couponCode?, shippingOptionId, address }`
- 200 → `{ subtotal, discountTotal, taxTotal, shippingCost, grandTotal, breakdown }` (tax/shipping per
  TaxShippingPolicy; FR-009)

### POST /api/storefront/checkout
Body: `{ items, couponCode?, shippingOptionId, address, customer: { email, whatsapp, name } }`
- 200 → `{ orderId, orderNumber, payment: { provider, sessionUrl|clientSecret } }`
  (creates `pending` order; redirects/initializes gateway — R1)
- 409 → `{ error: { code: 'OUT_OF_STOCK', unavailable: [...] } }` (atomic stock check; FR-034)

### POST /api/storefront/payments/webhook
Gateway callback (signature-verified). On success → order `confirmed`, stock committed, notifications
dispatched (FR-014). On failure → order `failed`, cart preserved (FR-012). Idempotent.

## Order tracking (FR-013, R5) — rate-limited

### POST /api/storefront/orders/track
Body: `{ orderNumber, email, whatsapp }`
- 200 → `OrderTrackingDTO` (status, statusHistory, items, totals) on exact match
- 404 → uniform "not found or details do not match" (no enumeration; non-revealing)

## Content (FR-025, FR-026, FR-027)

### GET /api/storefront/home
- 200 → `{ slider: OfferSlideDTO[], featured: ProductCardDTO[] }`

### GET /api/storefront/settings
- 200 → `{ website: PublicWebsiteSettingsDTO, theme: ThemeSettingsDTO }` (drives header/footer/SEO,
  colors/fonts/layout, default mode & language)
