# Implementation Plan: Local Brand E-Commerce Platform

**Branch**: `001-ecommerce-platform` | **Date**: 2026-05-30 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-ecommerce-platform/spec.md`

## Summary

A single-brand online store with a guest-friendly storefront (browse, search, attribute filtering,
cart, secure checkout with no required account), automated order tracking and email + WhatsApp
notifications, and a comprehensive admin dashboard controlling catalog, inventory, orders,
promotions (offers/discounts/coupons), branding/theming, and store policies (tax/shipping). A buyer
role acts as an internal seller for the single brand. The experience is bilingual (Arabic RTL /
English LTR), supports dark and light themes, and is fully responsive.

Technical approach: a single Next.js (App Router) full-stack application using server-side route
handlers for the API, MongoDB for persistence, Redis for caching and stock/coupon concurrency
control, Cloudinary for optimized media, SMTP for email, and a WhatsApp messaging integration for
notifications. A shared component library plus a runtime-driven design-token layer makes the UI
reusable and admin-themeable. All sensitive configuration (theme, settings, tax/shipping, promotions)
is stored as data and editable from the admin dashboard.

## Technical Context

**Language/Version**: TypeScript 5.x on Node.js 20 LTS

**Primary Dependencies**: Next.js 15 (App Router, Server Components + Route Handlers), React 19,
Tailwind CSS 3.x, Mongoose (MongoDB ODM), ioredis (Redis client), next-intl (i18n AR/EN + RTL),
next-themes (dark/light), Cloudinary SDK, Nodemailer (SMTP), Zod (validation), Auth.js/NextAuth
(credentials-based sessions for admin/buyer)

**Storage**: MongoDB (primary datastore); Redis (caching, session/rate-limit support, atomic stock
and coupon-usage counters); Cloudinary (image storage and transformation)

**Testing**: Vitest + React Testing Library (unit/component), Playwright (end-to-end critical
journeys), MongoDB Memory Server (integration tests against an ephemeral DB)

**Target Platform**: Cloud-hosted web application (Node runtime) behind a CDN; responsive browser
clients on desktop, tablet, and mobile

**Project Type**: Web application (single full-stack Next.js project)

**Performance Goals**: Catalog search results perceived <1s (SC-002); pages usable within 3s under
10x promotional spike (SC-009); storefront content cached in Redis with explicit invalidation on
writes

**Constraints**: Guest checkout with no required account; no overselling under concurrency (SC-010);
secrets only via environment variables; AR/RTL + EN/LTR and dark/light correct on every screen
(SC-008); sensitive payment data never stored by the app (handled by the gateway)

**Scale/Scope**: Single brand catalog (assume up to ~5k products / ~20k variants for v1); 7
prioritized user stories; ~38 functional requirements; 13 key entities; admin + buyer + guest roles

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Derived from `.specify/memory/constitution.md` v1.0.0:

| # | Principle | Gate | Status |
|---|-----------|------|--------|
| I | Reusable & Modular Component Architecture | Shared component library (Button, Input, Card variants, Modal, layout primitives) + single design-token source; no hard-coded colors/sizes in feature code | PASS — see Project Structure (`components/ui`, `lib/design-tokens`) |
| II | i18n, Theming & Accessibility | All copy externalized via next-intl; AR/RTL + EN/LTR; dark/light via next-themes; responsive; semantic, keyboard-operable, sufficient contrast | PASS — token-driven theming + i18n message catalogs |
| III | Security & Data Protection (NON-NEGOTIABLE) | Payments via gateway (no card storage); secrets in env; server-side authorization on every privileged action; Zod input validation | PASS — gateway redirect/SDK, Auth.js sessions, server-side guards |
| IV | Role-Based Access & Guest-Friendly Commerce | admin/buyer/guest tiers enforced server-side; guest checkout + tracking; auto email + WhatsApp notifications | PASS — middleware + per-handler role checks; guest order tracking by email+WhatsApp+order# |
| V | Admin-Configurable Platform | Website settings, theme, slider, promotions, tax/shipping, product variations stored as data and admin-editable | PASS — WebsiteSettings, ThemeSettings, TaxShippingPolicy, Coupon/Discount/Offer collections |
| VI | Performance & Reliability | Redis caching with explicit invalidation; Cloudinary optimized media; horizontally scalable hosting | PASS — cache layer in `lib/cache`; Cloudinary transforms; stateless app servers |

**Result**: All gates PASS. No violations to justify. No entries required in Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/001-ecommerce-platform/
├── plan.md              # This file (/speckit-plan output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (API contracts)
│   ├── storefront-api.md
│   ├── admin-api.md
│   └── auth-api.md
├── checklists/
│   └── requirements.md  # Spec quality checklist (from /speckit-specify)
└── tasks.md             # Phase 2 output (/speckit-tasks — NOT created here)
```

### Source Code (repository root)

```text
src/
├── app/                         # Next.js App Router
│   ├── [locale]/                # AR/EN locale segment (next-intl)
│   │   ├── (storefront)/        # Guest-facing routes (home, catalog, product, cart, checkout, track)
│   │   ├── (admin)/admin/       # Admin dashboard routes
│   │   └── (buyer)/seller/      # Buyer (internal seller) routes
│   └── api/                     # Route handlers (REST endpoints)
│       ├── storefront/          # catalog, cart, checkout, orders/track, coupons
│       ├── admin/               # products, orders, settings, theme, promotions, tax-shipping, users
│       ├── buyer/               # own products + related orders
│       └── auth/                # login/session (admin + buyer)
├── components/
│   ├── ui/                      # Reusable primitives: Button, Input, Card, Modal, Select, Badge...
│   ├── product/                 # ProductCard, VariantPicker, FilterPanel
│   ├── checkout/                # CartSummary, CheckoutForm
│   └── admin/                   # Dashboard widgets, settings forms, theme editor
├── lib/
│   ├── db/                      # Mongoose connection + helpers
│   ├── cache/                   # Redis client + cache-aside + invalidation helpers
│   ├── design-tokens/           # Token schema + runtime theme resolution
│   ├── i18n/                    # next-intl config + message loading
│   ├── auth/                    # Auth.js config + server-side role guards
│   ├── payments/                # Payment gateway adapter (provider-agnostic interface)
│   ├── notifications/           # Email (SMTP) + WhatsApp dispatch with retry
│   ├── media/                   # Cloudinary upload/transform helpers
│   └── pricing/                 # Discount/coupon resolution (no-stacking rule)
├── models/                      # Mongoose schemas (Product, Variation, Category, Order, ...)
├── services/                    # Domain services (catalog, orders, promotions, settings, inventory)
└── messages/                    # i18n catalogs: ar.json, en.json

tests/
├── unit/                        # Component + pure-logic tests (Vitest + RTL)
├── integration/                 # Service/API tests (MongoDB Memory Server)
└── e2e/                         # Playwright critical journeys (guest purchase, tracking, admin)
```

**Structure Decision**: Single full-stack Next.js project (the constitution fixes Next.js for both
frontend and backend). The `app/` tree separates guest storefront, admin, and buyer surfaces under a
locale segment for AR/EN routing. Reusable primitives live in `components/ui` and consume the
`lib/design-tokens` layer (Principle I). Cross-cutting concerns (cache, auth, payments,
notifications, pricing) are isolated under `lib/` so they are independently testable.

## Complexity Tracking

> No constitution violations — this section is intentionally empty.
