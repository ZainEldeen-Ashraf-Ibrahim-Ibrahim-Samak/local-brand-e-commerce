<!--
SYNC IMPACT REPORT
==================
Version change: TEMPLATE (unversioned) → 1.0.0
Bump rationale: Initial ratification — all placeholder tokens replaced with concrete
                principles derived from over-view-plan.md. MAJOR baseline for a new
                project constitution.

Modified principles (placeholder → concrete):
  [PRINCIPLE_1_NAME] → I. Reusable & Modular Component Architecture
  [PRINCIPLE_2_NAME] → II. Internationalization, Theming & Accessibility
  [PRINCIPLE_3_NAME] → III. Security & Customer Data Protection (NON-NEGOTIABLE)
  [PRINCIPLE_4_NAME] → IV. Role-Based Access & Guest-Friendly Commerce
  [PRINCIPLE_5_NAME] → V. Admin-Configurable Platform
  (added)           → VI. Performance & Reliability

Added sections:
  - Technology & Architecture Constraints (was [SECTION_2_NAME])
  - Development Workflow & Quality Gates (was [SECTION_3_NAME])

Removed sections: none

Templates requiring updates:
  ✅ .specify/templates/plan-template.md  — Constitution Check gate aligns (no hard-coded
       principle list to edit; gate references this file generically)
  ✅ .specify/templates/spec-template.md  — no mandatory section conflicts
  ✅ .specify/templates/tasks-template.md — principle-driven task types compatible
  ⚠ README.md / docs/quickstart.md       — not present yet; create when scaffolding begins

Follow-up TODOs: none — RATIFICATION_DATE set to today for this new project.
-->

# Local Brand E-Commerce Constitution

## Core Principles

### I. Reusable & Modular Component Architecture

Every UI element and unit of logic MUST be built as a self-contained, reusable module.
Buttons, inputs, cards (product, offer, order, buyer), modals, and layout primitives MUST
exist once as shared components and be composed everywhere else — duplication of markup or
styling is prohibited. A centralized design-token layer (colors, spacing, typography,
radii) MUST be the single source of truth; raw hard-coded color or size values in feature
code are forbidden. Server and client logic MUST be organized into small, independently
testable units with a clear single responsibility.

**Rationale**: A single-brand storefront grows by adding catalog, promo, and admin
surfaces that all share the same visual language. Reuse keeps the UI consistent, makes
admin-driven theming feasible, and keeps maintenance cost low as features accumulate.

### II. Internationalization, Theming & Accessibility

Every user-facing string MUST be externalized for translation and MUST render correctly in
both Arabic (RTL) and English (LTR). Both dark and light modes MUST be fully supported for
every screen and component — no theme-specific visual breakage is acceptable. The UI MUST
be responsive across desktop, tablet, and mobile breakpoints. Components MUST meet baseline
accessibility expectations (semantic markup, keyboard operability, sufficient contrast in
both themes).

**Rationale**: The audience spans Arabic- and English-speaking users on varied devices.
Bidirectional, multi-theme, responsive support is a launch requirement, not an enhancement,
and retrofitting it later is prohibitively expensive.

### III. Security & Customer Data Protection (NON-NEGOTIABLE)

Customer data and transactions MUST be protected at every layer. Payments MUST flow through
a secure payment gateway; raw card data MUST NOT be stored by the application. Secrets
(database URIs, API keys, SMTP and Cloudinary credentials, gateway keys) MUST be supplied
via environment configuration and MUST NEVER be committed to the repository. All
authenticated and admin actions MUST enforce server-side authorization — client-side role
checks alone are insufficient. Inputs MUST be validated and sanitized on the server before
persistence or use.

**Rationale**: The platform handles money and personal data. A single leak or
authorization bypass causes irreversible trust and legal damage, so security gates are
non-negotiable and override convenience or delivery speed.

### IV. Role-Based Access & Guest-Friendly Commerce

The system MUST support three access tiers: **admin** (full control of products, orders,
buyers, content, and site configuration), **buyer** (manage their own listed products and
orders), and **guest** (browse and purchase without an account). Authorization boundaries
between these tiers MUST be enforced server-side. Guests MUST be able to complete a purchase
and later track orders using email, WhatsApp number, and order number — registration MUST
NOT be required to buy or to view products. Order-status notifications MUST be sent
automatically via email and WhatsApp.

**Rationale**: Lowering the barrier to purchase maximizes conversion, while clear role
separation keeps administrative and seller capabilities safely contained.

### V. Admin-Configurable Platform

Content and presentation that an operator may reasonably want to change MUST be editable
from the admin dashboard without code changes. This includes: website settings (name, logo,
header/footer content, contact and about pages, social links, SEO description/keywords),
homepage slider offers, discounts and coupons, tax, shipping and delivery options, and
theme configuration (primary/secondary colors, font family and size, layout, default
theme mode, and default language). Product variations (size, color, and other attributes)
MUST be admin-manageable, and customers MUST be able to filter the catalog by those
attributes.

**Rationale**: The business must adapt branding, promotions, and policy without engineering
involvement. Treating configuration as data — not hard-coded constants — is what makes the
storefront operable by non-developers.

### VI. Performance & Reliability

Frequently read and slow-to-compute data MUST be cached (Redis) with explicit invalidation
on the writes that affect it. Images MUST be served through the configured image host
(Cloudinary) with appropriately sized, optimized assets rather than raw uploads. Pages and
API responses MUST avoid unnecessary blocking work on the request path. The deployment
target MUST support horizontal scaling so traffic spikes (e.g., promotions) degrade
gracefully rather than failing.

**Rationale**: Storefront conversion is sensitive to latency, and promotional events
produce bursty load. Caching, optimized media, and scalable hosting protect both revenue
and user experience.

## Technology & Architecture Constraints

The platform is built on a fixed core stack; substitutions require an amendment:

- **Framework**: Next.js (frontend and backend / API routes).
- **Styling**: Tailwind CSS, driven by shared design tokens (Principle I).
- **Database**: MongoDB.
- **Caching**: Redis.
- **Media**: Cloudinary for image hosting and transformation.
- **Email**: SMTP for transactional and notification email.
- **Messaging**: WhatsApp notifications integration.
- **Hosting**: A cloud platform supporting scalability (e.g., AWS or Heroku).

Configuration-driven design is mandatory: website settings, theming, and commerce policies
(tax, shipping, offers, coupons) are stored as data and read at runtime, never hard-coded.
All third-party credentials are injected via environment variables.

## Development Workflow & Quality Gates

- **Constitution Check**: Every `plan.md` MUST pass the Constitution Check gate before
  Phase 0. Any violation MUST be recorded in the plan's Complexity Tracking table with a
  justification and the rejected simpler alternative; unjustified violations block the plan.
- **Reuse-first review**: Code review MUST reject new bespoke buttons, inputs, cards, or
  hard-coded colors/sizes when a shared component or token already exists or should.
- **i18n & theme review**: New UI MUST be verified in both AR/RTL and EN/LTR and in both
  dark and light modes before merge.
- **Security review**: Any change touching auth, payments, admin actions, or secrets MUST
  receive explicit security review and confirm server-side authorization and input
  validation.
- **Configurability review**: New operator-facing content or policy MUST be exposed through
  admin configuration rather than hard-coded, unless an exception is justified in the plan.

## Governance

This constitution supersedes other development practices for this project. When guidance
conflicts, the constitution wins.

- **Amendments**: Proposed changes MUST be documented (what changes and why), reviewed, and
  include a migration note when they affect existing code or data. Amendments take effect
  only when merged into this file.
- **Versioning policy**: This document follows semantic versioning. MAJOR = backward-
  incompatible principle removal or redefinition; MINOR = a new principle/section or
  materially expanded guidance; PATCH = clarifications and non-semantic wording fixes.
- **Compliance review**: All plans, PRs, and reviews MUST verify compliance with the
  principles above. Complexity that violates a principle MUST be justified in writing or
  removed. Reviewers are expected to cite the specific principle when requesting changes.

**Version**: 1.0.0 | **Ratified**: 2026-05-30 | **Last Amended**: 2026-05-30
