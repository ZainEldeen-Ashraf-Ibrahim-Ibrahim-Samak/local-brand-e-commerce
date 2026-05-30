# Phase 1 Data Model: Local Brand E-Commerce Platform

**Feature**: 001-ecommerce-platform | **Date**: 2026-05-30 | **Store**: MongoDB (Mongoose)

Conventions: every collection has `_id`, `createdAt`, `updatedAt`. Money is stored in **minor units
(integer)** with a single store currency. Localized text fields use `{ en: string, ar: string }`.
All write inputs are validated with Zod before persistence (Principle III).

---

## 1. Category

Organizes products for browsing (FR-001).

| Field | Type | Rules |
|-------|------|-------|
| name | LocalizedText | required |
| slug | string | required, unique, URL-safe |
| parent | ObjectId → Category | optional (self-reference for hierarchy) |
| image | MediaRef | optional |
| isActive | boolean | default true |
| sortOrder | number | default 0 |

Relationships: a Category has many Products; may have a parent Category.

## 2. Product

A sellable item for the single brand (FR-001, FR-004).

| Field | Type | Rules |
|-------|------|-------|
| name | LocalizedText | required |
| slug | string | required, unique |
| description | LocalizedText | required |
| category | ObjectId → Category | required |
| basePrice | int (minor units) | required, ≥ 0 |
| images | MediaRef[] | ≥ 1 required |
| attributes | AttributeDef[] | defines variant axes (e.g., size, color) |
| status | enum(`draft`,`published`,`unpublished`) | default `draft` |
| ownerUserId | ObjectId → User | required (managing buyer/admin per FR-029) |
| seo | { title?: LocalizedText, keywords?: string[] } | optional |

Relationships: a Product has many Variations; belongs to a Category; owned by a User.
Validation: only `published` products are visible/purchasable in the storefront (FR-018).

**AttributeDef** (embedded): `{ key: 'size'|'color'|string, label: LocalizedText, values: string[] }`

**MediaRef** (embedded): `{ cloudinaryId: string, version: string, alt?: LocalizedText }`

## 3. Variation (Product Variant / Option)

A specific purchasable configuration with its own stock and price (FR-004, FR-005).

| Field | Type | Rules |
|-------|------|-------|
| product | ObjectId → Product | required |
| sku | string | required, unique |
| options | { [attrKey]: string } | e.g., `{ size: 'M', color: 'red' }`; must match Product.attributes |
| priceOverride | int (minor units) | optional; falls back to Product.basePrice |
| stock | int | required, ≥ 0 |
| image | MediaRef | optional |
| isActive | boolean | default true |

Validation: `stock` decremented only via atomic conditional update (R3). `options` keys MUST be a
subset of the parent Product's `attributes` keys with allowed values.

## 4. Inventory (modeled on Variation.stock)

Stock is the `stock` field on Variation; no separate collection. A **StockLedger** (optional, v1) may
record adjustments: `{ variation, delta, reason: 'sale'|'admin-adjust'|'cancel-restock', orderId? }`.

## 5. User (Account)

Authenticated admin or buyer (FR-016, FR-017, FR-037). Guests are NOT users.

| Field | Type | Rules |
|-------|------|-------|
| email | string | required, unique, lowercased |
| passwordHash | string | required (argon2/bcrypt); never returned |
| role | enum(`admin`,`buyer`) | required |
| name | string | required |
| isActive | boolean | default true |
| createdByUserId | ObjectId → User | required for buyer/admin (admin-only provisioning) |

Validation: account creation restricted to admins (FR-037). Buyer access scoped to owned Products
and related Orders (FR-029).

## 6. Cart

Transient guest selection (FR-006). Stored client-side and/or as a short-TTL server doc keyed by an
anonymous cart token; never requires login.

| Field | Type | Rules |
|-------|------|-------|
| token | string | anonymous, unique |
| items | CartItem[] | |
| updatedAt | date | TTL index (e.g., 30 days) |

**CartItem** (embedded): `{ variation: ObjectId, quantity: int ≥ 1, unitPriceSnapshot: int }`.
Snapshot is advisory; authoritative pricing is recomputed at checkout (R4).

## 7. Order

A confirmed purchase (FR-007–FR-013, FR-036).

| Field | Type | Rules |
|-------|------|-------|
| orderNumber | string | required, unique, non-sequential (ULID-based) |
| items | OrderLine[] | ≥ 1 required (snapshotted) |
| customer | { email, whatsapp, name, ... } | required (guest contact) |
| shippingAddress | Address | required |
| subtotal | int | required |
| discountTotal | int | ≥ 0 |
| appliedCouponCode | string | optional |
| taxTotal | int | ≥ 0 |
| shippingOption | { id, label: LocalizedText, cost: int } | required |
| grandTotal | int | required = subtotal − discountTotal + taxTotal + shippingCost |
| status | OrderStatus | default `pending` |
| statusHistory | StatusChange[] | append-only |
| payment | { provider, sessionId, status, reference } | no card data stored |

**OrderLine** (embedded): `{ variation, productNameSnapshot: LocalizedText, options, unitPrice,
appliedUnitDiscount, quantity, lineTotal }`.

**StatusChange** (embedded): `{ from: OrderStatus, to: OrderStatus, at: date, byUserId?, note? }`.

### OrderStatus lifecycle (FR-036)

```text
pending → confirmed → processing → shipped → delivered
pending|confirmed|processing → cancelled (terminal)
pending|confirmed → failed (terminal, e.g., payment failure)
delivered → returned → refunded   (post-fulfillment, admin-set)
delivered → refunded              (refund without physical return)
```

Allowed values: `pending`, `confirmed`, `processing`, `shipped`, `delivered`, `cancelled`,
`failed`, `returned`, `refunded`. Every transition appends to `statusHistory` and triggers a
customer notification (FR-014). Transitions MUST be validated against the lifecycle above.

**Address** (embedded): `{ line1, line2?, city, region?, postalCode?, country, phone }`.

## 8. Coupon

Code-based promotion redeemed at checkout (FR-023, FR-024, FR-038).

| Field | Type | Rules |
|-------|------|-------|
| code | string | required, unique, case-insensitive |
| type | enum(`percent`,`fixed`) | required |
| value | int | percent (1–100) or fixed minor units |
| startsAt / endsAt | date | validity window |
| usageLimit | int | optional total redemptions cap |
| usageCount | int | default 0 (atomic increment on redemption) |
| eligibility | { productIds?, categoryIds?, minSubtotal? } | optional targeting |
| isActive | boolean | default true |

Validation: at checkout, reject if inactive, outside window, over `usageLimit`, or cart ineligible.
Never stacks with an active Discount on the same item (FR-038, R4).

## 9. Discount

Automatic price reduction on products/categories (FR-023, FR-024).

| Field | Type | Rules |
|-------|------|-------|
| name | LocalizedText | required |
| type | enum(`percent`,`fixed`) | required |
| value | int | as above |
| target | { productIds?, categoryIds? } | required (at least one) |
| startsAt / endsAt | date | validity window |
| isActive | boolean | default true |

Validation: applied automatically to eligible items; the larger of (best discount) vs (coupon) wins.

## 10. Offer / HomepageSliderSlide

Promotional banner in the homepage slider (FR-025).

| Field | Type | Rules |
|-------|------|-------|
| title | LocalizedText | required |
| image | MediaRef | required |
| linkUrl | string | optional (to category/product/page) |
| sortOrder | int | default 0 |
| isActive | boolean | default true |
| startsAt / endsAt | date | optional scheduling |

## 11. WebsiteSettings (singleton)

Store identity and content (FR-026). Exactly one active document.

| Field | Type |
|-------|------|
| storeName | LocalizedText |
| logo | MediaRef |
| header | { announcement?: LocalizedText, navLinks: [...] } |
| footer | { aboutShort?: LocalizedText, columns: [...] } |
| contactPage | LocalizedRichText + { email, phone, whatsapp, address } |
| aboutPage | LocalizedRichText |
| socialLinks | { platform, url }[] |
| seo | { description: LocalizedText, keywords: string[] } |

## 12. ThemeSettings (singleton)

Admin-driven theming (FR-027, R7). Exactly one active document.

| Field | Type | Rules |
|-------|------|-------|
| primaryColor / secondaryColor | string (hex) | required |
| fontFamily | string | required |
| baseFontSize | int (px) | required |
| layout | enum(...) | named layout preset |
| defaultMode | enum(`light`,`dark`) | required |
| defaultLanguage | enum(`ar`,`en`) | required |
| palette | { light: TokenMap, dark: TokenMap } | derived token sets |

## 13. TaxShippingPolicy (singleton)

Checkout policy configuration (FR-028).

| Field | Type | Rules |
|-------|------|-------|
| tax | { rate: int (basis points), inclusive: boolean, label: LocalizedText } | required |
| shippingOptions | ShippingOption[] | ≥ 1 |

**ShippingOption** (embedded): `{ id, label: LocalizedText, cost: int, estimatedDays?, isActive }`.

## 14. NotificationLog (operational)

Audit/retry for FR-014/FR-015.

| Field | Type |
|-------|------|
| orderId | ObjectId → Order |
| channel | enum(`email`,`whatsapp`) |
| event | string (e.g., `status:shipped`) |
| status | enum(`queued`,`sent`,`failed`) |
| attempts | int |
| lastError | string? |

---

## Entity relationship overview

```text
Category 1───* Product 1───* Variation
User (admin|buyer) 1───* Product (ownerUserId)
Order *───* Variation (via OrderLine snapshots)   Order *──1 Coupon (optional)
Discount *──* {Product|Category}                  Offer (standalone)
Singletons: WebsiteSettings, ThemeSettings, TaxShippingPolicy
Operational: NotificationLog, StockLedger(optional), Cart(transient)
```

## Validation & integrity rules (cross-cutting)

- Stock never negative; decrement via atomic conditional update inside an order transaction (R3, SC-010).
- Pricing computed server-side; coupon/discount no-stacking enforced in `lib/pricing` (FR-038).
- Only `published` products purchasable; out-of-stock variants cannot be added to cart (FR-005).
- Order number unique and non-sequential; guest tracking requires order# + email + whatsapp (R5).
- Privileged accounts (admin/buyer) created only by admins (FR-037).
- All localized content provides both `en` and `ar`; missing translation falls back to default language.
