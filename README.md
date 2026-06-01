# Local Brand E-Commerce Platform

A bilingual (AR/EN, RTL-aware), themeable e-commerce platform for a single local brand.
Guests can browse, search, filter, buy, and track orders without an account. Admins manage
the catalog, inventory, orders, branding, theme, promotions, and tax/shipping. Internal
"buyer" sellers manage only their own products and related orders.

Built with **Next.js 15** (App Router, TypeScript), **MongoDB/Mongoose**, **Redis** (Upstash),
**Cloudinary**, **SMTP + WhatsApp** notifications, **Tailwind**, **next-intl**, **next-themes**,
and **Auth.js**.

## Architecture

- `src/app/[locale]/(storefront)` — public storefront (home, catalog, product, cart, checkout, track)
- `src/app/[locale]/(admin)/admin` — admin console (dashboard, products, categories, orders,
  offers, promotions, settings, theme, tax & shipping)
- `src/app/[locale]/(buyer)/seller` — internal seller console (own products + related orders)
- `src/app/api/storefront` — public APIs · `src/app/api/admin` — admin APIs · `src/app/api/buyer` — buyer APIs
- `src/services` — domain services (catalog, order, inventory, tracking, promotions, settings, admin/*, buyer)
- `src/lib` — cross-cutting infra (db, cache, auth, pricing, payments, notifications, media, design-tokens)
- `src/models` — Mongoose models · `src/components` — reusable UI + feature components
- `specs/001-ecommerce-platform` — spec, plan, data model, contracts, tasks

### Key design rules (constitution)

- **Reusable UI only** (`src/components/ui`) — no hard-coded colors/sizes; everything flows
  through design tokens → CSS variables (admin-configurable theme).
- **Bilingual content** is stored as `{ en, ar }`; locale + `dir` are set at the layout root.
- **Secrets are server-only**; every privileged API re-checks the session role (defense in depth).
- **Caching** is cache-aside via Redis with prefix invalidation on writes.
- **Money** is integer minor units everywhere; pricing is a pure, unit-tested resolver.
- **No oversell**: stock is reserved with an atomic conditional decrement; coupons never stack
  with discounts (the single largest reduction wins).

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in values (see below)
npm run db:seed              # admin user + singletons + demo catalog
npm run dev                  # http://localhost:3000  → redirects to /ar
```

### Required environment

See `.env.example` for the full list. Minimum to boot: `MONGODB_URI`, `AUTH_SECRET`,
`UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`. Optional integrations (Cloudinary,
SMTP, WhatsApp, Stripe) degrade gracefully when unset — features log and skip rather than crash.

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run lint` | ESLint (Next.js config) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Unit + integration (Vitest, MongoDB Memory Server) |
| `npm run test:e2e` | Playwright E2E (needs a running, seeded server) |
| `npm run db:seed` | Seed admin + singletons + demo data |

## Testing

Targeted tests cover the correctness-critical paths:

- `tests/integration/inventory.oversell.test.ts` — concurrent last-unit purchase yields exactly one success.
- `tests/unit/pricing.base.test.ts` — subtotal + tax + shipping.
- `tests/unit/pricing.nostacking.test.ts` — coupon never stacks with a discount (larger wins).
- `tests/integration/tracking.enumeration.test.ts` — order tracking is non-enumerable + rate-limited.

E2E happy paths live in `tests/e2e`. Set `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD` to run the
authenticated admin smoke test.

## Health

`GET /api/health` reports MongoDB + Redis readiness (200 healthy / 503 degraded) for uptime checks.
