# Implementation Plan: Storefront Customization & Shopper Tools

**Branch**: `005-storefront-customization` | **Date**: 2026-06-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/005-storefront-customization/spec.md`

## Summary

Extend the existing single full-stack Next.js platform with two clusters of capability:
(1) **admin-configurable storefront content** — header/footer/nav, home page sections, the
About/Contact/Privacy/Terms pages, the hero section (with a Cloudinary-hosted full-bleed
background and toggleable overlay components), and the hero/offer sliders; plus
**site currency** with admin-set per-currency exchange rates and **sub-categories**; and
(2) **shopper tools** — catalog filters (category, sub-category, price, attributes),
browser-local **favorites** and **compare** (max 3), and live count **badges** for cart,
favorites, and compare.

The plan reuses what already exists: the `WebsiteSettings` singleton (header/footer/nav/
about/contact already modeled) extended with privacy/terms/hero/currency/home-section
config; the `Category` model (which **already supports `parent`** — sub-categories need
admin/storefront surfacing, not a new model); the `Offer` model (powers sliders) extended
with a `placement` discriminator to separate the hero slider from the offer slider; the
`catalog.service` filter pipeline (extended for sub-category descendants); `formatMoney`
(already currency-parameterized) plus a small conversion helper; and the `useCart`
localStorage pattern (mirrored by `useFavorites`/`useCompare`). Favorites and compare are
client-only per FR-020, so no new collections are introduced for them.

## Technical Context

**Language/Version**: TypeScript 5.x on Node.js 20 LTS (unchanged)

**Primary Dependencies**: Next.js 15 (App Router, Server + Client Components), React 19,
Mongoose, next-intl (AR/EN, RTL), next-themes, Tailwind + shared `components/ui`, Cloudinary
(existing signed-upload flow at `app/api/admin/media/sign`), Redis (`lib/cache`), Zod
(route validation). No new runtime dependencies.

**Storage**: MongoDB. Schema deltas are additive only: extend `WebsiteSettings`
(privacy/terms pages, `hero`, `currency`, `homeSections`); extend `Offer` (`placement`);
`Category.parent` already exists. Favorites/compare are **not** persisted server-side
(browser localStorage per FR-020).

**Testing**: Vitest + MongoDB Memory Server for service/integration (settings writes +
cache invalidation, sub-category filtering, currency conversion, slider placement scope,
admin authorization); component/unit tests for the favorites/compare hooks and badge
counts; existing Playwright journeys extended where practical.

**Target Platform**: Cloud-hosted Node web app; responsive browsers. Admin routes are
auth-gated (admin role) and enforced server-side; storefront is guest-friendly.

**Project Type**: Single full-stack Next.js project (web application), extended in place.

**Performance Goals**: Storefront content/hero/slider/currency reads come from the cached
settings/home singletons (Redis, cache-aside) and are invalidated on admin write so changes
appear within ~1 reload (SC-001). Filtered catalog queries stay on indexed fields and the
existing facet pipeline; results render within 1s (SC-003). Favorites/compare/badge updates
are local and instant (SC-004/SC-005).

**Constraints**: Admin-config is data, not code (Principle V); all admin writes enforce
server-side authorization + Zod validation (Principle III); images go through Cloudinary as
optimized assets (Principle VI, FR-010); every new surface works in AR/RTL + EN/LTR and
dark/light and is responsive (Principle II, FR-019); reuse shared components + design tokens,
no bespoke buttons/inputs or hard-coded colors (Principle I).

**Scale/Scope**: 8 user stories (3×P1, 4×P2, 1×P3); FR-001–FR-021. Additive schema changes
to 2 models (`WebsiteSettings`, `Offer`); 0 new persisted collections for shopper tools;
~4 new/extended services; ~5 admin API route groups; ~2 storefront routes (privacy, terms);
2 client hooks (favorites, compare) + badge wiring.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Derived from `.specify/memory/constitution.md` v1.0.0:

| # | Principle | Gate | Status |
|---|-----------|------|--------|
| I | Reusable & Modular Component Architecture | Reuses `components/ui` primitives (`Card`, `Input`, `Select`, `Modal`, `Badge`), design tokens, and the existing admin form/manager patterns; favorites/compare/badges are thin shared components; no duplicated markup or hard-coded colors | PASS |
| II | i18n, Theming & Accessibility | All new content (privacy/terms/hero/filters/favorites/compare/badges) localized AR/EN via existing `localized` fields + next-intl; verified RTL/LTR and dark/light; semantic, keyboard-operable controls (FR-019) | PASS |
| III | Security & Data Protection (NON-NEGOTIABLE) | All content/slider/currency/sub-category writes go through admin-role routes with server-side authorization + Zod validation; Cloudinary uploads use the existing signed-upload endpoint; no secrets in code; favorites/compare hold only public product references | PASS |
| IV | Role-Based Access & Guest-Friendly Commerce | Only admins edit config; guests retain full browse/buy and now get favorites/compare without an account (browser-local, FR-020) | PASS |
| V | Admin-Configurable Platform | Header/footer/nav/home/about/contact/privacy/terms/hero/sliders/currency(+rates)/sub-categories all become admin-editable data read at runtime — directly fulfills Principle V | PASS |
| VI | Performance & Reliability | Settings/home reads cached via `cacheAside`, invalidated on write; hero/slider images served optimized through Cloudinary; filters use indexed fields + existing facet pipeline; no extra blocking work on the request path | PASS |

**Result**: All gates PASS. No violations. Complexity Tracking intentionally empty.

## Project Structure

### Documentation (this feature)

```text
specs/005-storefront-customization/
├── plan.md              # This file (/speckit-plan output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── admin-content.md      # content/hero/sliders/currency/sub-category admin APIs
│   └── storefront-read.md    # filters + privacy/terms + currency-aware reads
├── checklists/
│   └── requirements.md  # Spec quality checklist (validated)
└── tasks.md             # Phase 2 output (/speckit-tasks — NOT created here)
```

### Source Code (repository root) — files added or modified

```text
src/
├── models/
│   ├── WebsiteSettings.ts        # MODIFIED — add privacyPage, termsPage, hero{ background, heading, subtext, cta, showHeading/showSubtext/showCta }, currency{ base, active, options:[{code,label,rate,symbol}] }, homeSections
│   ├── Offer.ts                  # MODIFIED — add placement: "hero" | "offer" (default "offer")
│   └── Category.ts               # UNCHANGED — `parent` already supports sub-categories
├── services/
│   ├── settings.service.ts       # MODIFIED — expose hero/currency/pages in cached reads
│   ├── admin/settings.admin.service.ts # MODIFIED — accept new settings fields; invalidate settings+home
│   ├── home.service.ts           # MODIFIED — split slides by placement; include hero config
│   ├── catalog.service.ts        # MODIFIED — sub-category descendant filter; expose sub-cats in facets
│   └── currency.service.ts       # NEW — resolve active currency + convert minor units by stored rate
├── lib/
│   ├── format.ts                 # MODIFIED — currency-aware formatting via active currency + rate
│   ├── favorites/useFavorites.ts # NEW — localStorage hook (mirror of useCart) + lb_fav_change event
│   └── compare/useCompare.ts     # NEW — localStorage hook, max 3, full-list guard + lb_cmp_change event
├── components/
│   ├── ui/CountBadge.tsx         # NEW — shared numeric badge (cart/favorites/compare)
│   ├── storefront/FilterPanel.tsx        # NEW/EXTENDED — category, sub-category, price, size, color filters
│   ├── storefront/FavoriteButton.tsx     # NEW — toggle + active state
│   ├── storefront/CompareButton.tsx      # NEW — toggle + full guard
│   ├── storefront/HeroSection.tsx        # NEW/EXTENDED — full-bleed bg + toggleable overlay components
│   ├── admin/content/ContentManager.tsx  # NEW — header/footer/nav/home/about/contact/privacy/terms editor
│   ├── admin/content/HeroEditor.tsx      # NEW — bg upload (signed) + component visibility/content
│   ├── admin/content/SliderManager.tsx   # NEW — hero/offer slides CRUD + reorder (placement-aware)
│   ├── admin/content/CurrencyForm.tsx    # NEW — active currency + per-currency rates
│   └── admin/catalog/SubCategoryManager.tsx # NEW — nested category CRUD + product assignment
└── app/[locale]/
    ├── (storefront)/privacy/page.tsx     # NEW — renders admin-managed privacy content
    ├── (storefront)/terms/page.tsx       # NEW — renders admin-managed terms content
    ├── (storefront)/favorites/page.tsx   # NEW — favorites list
    ├── (storefront)/compare/page.tsx     # NEW — side-by-side compare view
    ├── (admin)/admin/content/page.tsx    # NEW — content/hero/slider/currency admin
    └── (admin)/admin/categories/page.tsx # NEW — sub-category management
        # API: app/api/admin/content, .../sliders, .../currency, .../categories (+ [id]); reuse .../media/sign

tests/
├── integration/
│   ├── content.settings.test.ts          # NEW — content/hero/currency writes + cache invalidation + admin authz
│   ├── catalog.subcategory-filter.test.ts# NEW — sub-category descendant filtering + facets
│   ├── currency.conversion.test.ts       # NEW — rate-based conversion + historical-order amounts preserved
│   └── sliders.placement.test.ts         # NEW — hero vs offer placement scoping
└── unit/
    ├── useFavorites.test.ts              # NEW — add/remove/persist + count event
    └── useCompare.test.ts                # NEW — max-3 guard + count event
```

**Structure Decision**: Extend the existing single full-stack Next.js project. Admin
configuration remains data on the `WebsiteSettings`/`Offer`/`Category` singletons+collections
read through the cached `settings`/`home`/`catalog` services and invalidated on write
(Principle V/VI). Shopper favorites/compare follow the established `useCart` localStorage
pattern (guest-friendly, FR-020) rather than introducing server collections, keeping the
write surface — and the security surface — limited to admin config endpoints.

## Complexity Tracking

> No constitution violations — this section is intentionally empty.
