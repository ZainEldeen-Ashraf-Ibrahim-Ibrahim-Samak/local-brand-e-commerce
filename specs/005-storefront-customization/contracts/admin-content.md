# Contract: Admin Content, Hero, Sliders, Currency & Sub-Categories

All endpoints are **admin-only**: server-side authorization (existing admin guard) + Zod
validation. Mutations invalidate the relevant cache (`settings`/`home`/`categories`). All
text fields are localized `{ en, ar }`. Non-admin → `403`. Invalid body → `400` with field
errors. Reuse existing `POST /api/admin/media/sign` for Cloudinary uploads (hero background,
slide images) — no new upload endpoint.

## Content & settings

### PUT /api/admin/content
Update header, footer, nav links, home sections, and the About/Contact/Privacy/Terms pages.

Request (partial, any subset):
```json
{
  "header": { "announcement": {"en":"","ar":""}, "navLinks": [{"label":{"en":"","ar":""},"href":"/shop"}] },
  "footer": { "aboutShort": {"en":"","ar":""}, "columns": [{"title":{"en":"","ar":""},"links":[{"label":{"en":"","ar":""},"href":"/"}]}] },
  "aboutPage": { "body": {"en":"","ar":""} },
  "contactPage": { "body": {"en":"","ar":""}, "email":"", "phone":"", "whatsapp":"", "address":"" },
  "privacyPage": { "body": {"en":"","ar":""} },
  "termsPage": { "body": {"en":"","ar":""} },
  "homeSections": [{ "key":"featured", "isVisible": true, "sortOrder": 0 }]
}
```
Response `200`: the updated settings document. (FR-001–FR-004)

### PUT /api/admin/content/hero
```json
{
  "background": { "cloudinaryId":"...", "version":"...", "alt": {"en":"","ar":""} },
  "heading": {"en":"","ar":""}, "subtext": {"en":"","ar":""},
  "cta": { "label": {"en":"","ar":""}, "href": "/shop" },
  "showHeading": true, "showSubtext": true, "showCta": true
}
```
Response `200`: updated hero config. Background MUST reference a Cloudinary asset (FR-005/FR-010).

### PUT /api/admin/currency
```json
{
  "base": "USD",
  "active": "EGP",
  "options": [
    { "code":"USD", "label":{"en":"US Dollar","ar":"دولار"}, "symbol":"$", "rate":1 },
    { "code":"EGP", "label":{"en":"Egyptian Pound","ar":"جنيه"}, "symbol":"E£", "rate":48.5 }
  ]
}
```
Rules: `active` ∈ `options[].code`; every `rate > 0`; the `base` entry has `rate === 1`.
Response `200`: updated currency config. `422` if `active` not in options or a rate ≤ 0. (FR-007/FR-021)

## Sliders (placement-aware)

### GET /api/admin/sliders?placement=hero|offer
Response `200`: ordered slides for the placement.

### POST /api/admin/sliders
```json
{ "placement":"offer", "title":{"en":"","ar":""}, "subtitle":{"en":"","ar":""},
  "image":{"cloudinaryId":"...","version":"..."}, "ctaLabel":{"en":"","ar":""},
  "ctaHref":"/shop", "isActive":true, "sortOrder":0, "startsAt":null, "endsAt":null }
```
Response `201`: created slide. (FR-006)

### PUT /api/admin/sliders/{id} · DELETE /api/admin/sliders/{id}
Update (incl. reorder via `sortOrder`) or remove a slide. `200` / `204`. `404` if missing.

## Sub-categories

### GET /api/admin/categories
Response `200`: full category tree (parents + sub-categories via `parent`).

### POST /api/admin/categories
```json
{ "name":{"en":"","ar":""}, "slug":"mens-shoes", "parent":"<categoryId|null>",
  "image":{"cloudinaryId":"...","version":"..."}, "isActive":true, "sortOrder":0 }
```
Rules: `slug` unique; `parent` (if set) MUST exist and not create a cycle.
Response `201`. `409` on duplicate slug, `422` on invalid/cyclic parent. (FR-008)

### PUT /api/admin/categories/{id} · DELETE /api/admin/categories/{id}
Update or remove. Deleting a category with sub-categories or assigned products is rejected
(`409`) unless reassigned/empty. (FR-008)

## Authorization (applies to all above)
- Missing/invalid session → `401`.
- Authenticated non-admin → `403`.
- All successful writes invalidate the matching cache so storefront reflects changes within
  one reload (SC-001). (FR-009, Principle III/VI)
