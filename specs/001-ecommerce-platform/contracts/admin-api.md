# Contract: Admin & Buyer API (authenticated)

**Base**: `/api/admin` (role `admin`) and `/api/buyer` (role `buyer`)
**Auth**: server session (Auth.js); every handler re-checks role server-side (Principle III/IV).
Unauthorized → 401; wrong role / not owner → 403.

Common: JSON; Zod-validated bodies; money in minor units; localized fields as `{ en, ar }`.

## Catalog management (admin) (FR-018, FR-019)

| Method & Path | Purpose | Success |
|---------------|---------|---------|
| POST /api/admin/products | Create product (+attributes) | 201 ProductDTO |
| PATCH /api/admin/products/:id | Edit product / status (draft↔published↔unpublished) | 200 |
| DELETE /api/admin/products/:id | Delete product | 204 |
| POST /api/admin/products/:id/variations | Add variation | 201 |
| PATCH /api/admin/variations/:id | Edit variant (price/options/image) | 200 |
| PATCH /api/admin/variations/:id/stock | Adjust stock (logged) | 200 |
| POST /api/admin/categories | Create category | 201 |
| PATCH/DELETE /api/admin/categories/:id | Edit/remove | 200/204 |
| POST /api/admin/media/sign | Get signed Cloudinary upload params | 200 |

Writes invalidate related storefront caches and revalidate affected pages (R8).

## Orders (admin) (FR-020, FR-021, FR-036)

| Method & Path | Purpose | Success |
|---------------|---------|---------|
| GET /api/admin/orders | List/filter orders | 200 |
| GET /api/admin/orders/:id | Order detail + history | 200 |
| PATCH /api/admin/orders/:id/status | Transition status (validated against lifecycle) | 200 → triggers notification (FR-014) |
| GET /api/admin/dashboard | Sales + inventory summary | 200 |

Invalid status transition → 422 with allowed targets.

## Customers / users (admin) (FR-022, FR-037)

| Method & Path | Purpose | Success |
|---------------|---------|---------|
| GET /api/admin/users | List buyers/admins | 200 |
| POST /api/admin/users | Create/invite buyer or admin (admin-only provisioning) | 201 |
| PATCH /api/admin/users/:id | Activate/deactivate, edit role | 200 |
| GET /api/admin/customers | Guest customers derived from orders | 200 |

## Promotions (admin) (FR-023, FR-024, FR-025)

| Method & Path | Purpose |
|---------------|---------|
| CRUD /api/admin/coupons | Manage coupons (code, type, value, window, usageLimit, eligibility) |
| CRUD /api/admin/discounts | Manage product/category discounts |
| CRUD /api/admin/offers | Manage homepage slider slides (incl. reorder) |

## Settings, theme & policies (admin) (FR-026, FR-027, FR-028)

| Method & Path | Purpose |
|---------------|---------|
| GET/PUT /api/admin/settings | Website settings (name, logo, header/footer, contact, about, social, SEO) |
| GET/PUT /api/admin/theme | Theme (colors, fonts, layout, default mode, default language) → reflected within 1 min (SC-007) |
| GET/PUT /api/admin/tax-shipping | Tax rule + shipping options/costs |

Singleton PUTs invalidate the public `/settings` cache immediately.

## Buyer (internal seller) scope (FR-029)

| Method & Path | Purpose | Rule |
|---------------|---------|------|
| GET/POST/PATCH /api/buyer/products | Manage own products only | `ownerUserId == session.user.id`; else 403 |
| GET /api/buyer/orders | View orders containing the buyer's products | filtered to owned products |

Buyers cannot access other buyers' products or unrelated orders, nor any admin-only endpoint.
