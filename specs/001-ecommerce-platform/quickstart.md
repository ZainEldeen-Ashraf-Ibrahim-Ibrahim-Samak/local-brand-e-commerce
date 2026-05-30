# Quickstart: Local Brand E-Commerce Platform

**Feature**: 001-ecommerce-platform | **Stack**: Next.js 15 (App Router) · MongoDB · Redis ·
Cloudinary · SMTP · WhatsApp

## Prerequisites

- Node.js 20 LTS and a package manager (pnpm/npm)
- MongoDB instance (local or Atlas)
- Redis instance (local or managed)
- Cloudinary account (cloud name, API key/secret)
- SMTP credentials (host, port, user, pass)
- WhatsApp Business API credentials
- A payment gateway account (default: Stripe; via the provider-agnostic adapter)

## Environment variables (`.env.local` — never commit)

```bash
MONGODB_URI=
REDIS_URL=
AUTH_SECRET=                 # session signing
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
WHATSAPP_API_TOKEN=
WHATSAPP_PHONE_ID=
PAYMENT_PROVIDER=stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_DEFAULT_LOCALE=ar
```

All secrets are supplied via environment only (Principle III). No secret appears in client code.

## Setup

```bash
pnpm install
pnpm run db:seed       # seeds singletons (WebsiteSettings, ThemeSettings, TaxShippingPolicy),
                       # a first admin (from env), demo categories/products/variations
pnpm run dev           # http://localhost:3000 (default locale /ar or /en)
```

## First-run checklist (maps to user stories)

1. **Guest purchase (US1, P1)**: open `/`, browse a category, filter by size/color/price, open a
   product, pick a variant, add to cart, checkout as guest, complete test payment → order confirmed
   with an order number. *Validates SC-001, SC-003, FR-005–FR-011, FR-034.*
2. **Order tracking + notifications (US2, P1)**: use `/track` with order number + email + WhatsApp →
   see status; confirm a status-change email + WhatsApp message dispatched. *Validates FR-013–FR-015,
   SC-004, SC-005.*
3. **Admin catalog & orders (US3, P2)**: sign in at `/admin`, create a product with two variants +
   images, publish, confirm it appears in storefront; advance an order's status. *Validates FR-018–
   FR-022, FR-036, SC-006.*
4. **Branding & theme (US4, P2)**: in `/admin/settings` and `/admin/theme`, change store name, logo,
   primary color, default language → confirm storefront reflects within 1 min. *Validates FR-026,
   FR-027, SC-007.*
5. **Promotions (US5, P2)**: create a discount and a coupon; as guest, confirm the larger reduction
   wins (no stacking). *Validates FR-023, FR-024, FR-038.*
6. **Tax & shipping (US6, P2)**: set a tax rate and two shipping options; confirm totals at checkout.
   *Validates FR-028, FR-009.*
7. **Buyer role (US7, P3)**: sign in as a buyer at `/seller`, manage only owned products and related
   orders; confirm 403 on others. *Validates FR-029, FR-037.*

## Cross-cutting verification (every screen)

- Toggle **AR (RTL) / EN (LTR)** and **dark / light** — layouts mirror correctly, no broken UI (SC-008).
- Check **desktop / tablet / mobile** breakpoints (FR-032).
- Confirm reusable primitives (`components/ui`) and design tokens drive all colors/spacing — no
  hard-coded values (Principle I).

## Testing

```bash
pnpm run test         # Vitest unit/component (pricing no-stacking, stock, validation, components)
pnpm run test:int     # integration vs MongoDB Memory Server (services/handlers)
pnpm run test:e2e     # Playwright: guest purchase + order tracking + admin smoke
```

Priority tests to confirm before shipping the MVP: concurrent-purchase no-oversell (SC-010),
coupon/discount no-stacking (FR-038), guest-tracking non-enumeration (R5).
