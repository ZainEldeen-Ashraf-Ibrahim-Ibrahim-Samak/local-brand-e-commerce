# Implementation Plan: Admin Accounts, Customer Records, Support Inbox & Storefront Content Pages

**Branch**: `002-accounts-support-content` | **Date**: 2026-06-01 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/002-accounts-support-content/spec.md`

## Summary

A gap-closure feature on top of the shipped `001-ecommerce-platform`. It adds the four capabilities
the overview plan requires but that have no interface yet: (1) admin provisioning and management of
buyer/admin **staff accounts** (temp-password *and* email-invite credential flows, soft-deactivate
only); (2) a **customer support** path — a public Contact-page inquiry form, an admin support inbox
with status workflow, and an admin email alert on each new inquiry; (3) read-only **customer records**
aggregated from existing orders; and (4) public **About** and **Contact** storefront pages that render
already-stored Website Settings content with working header/footer navigation.

Technical approach: extend the existing Next.js App Router project in place. Reuse the current
`User` model (add invite-token fields), Auth.js config, server-side role guards, `Order` data,
`WebsiteSettings` content, the shared `components/ui` primitives, design tokens, next-intl catalogs,
and the SMTP transport. Add two new collections (`SupportInquiry`; invite fields on `User`), three new
service modules, new admin + storefront route handlers under the established `app/api` and `app/[locale]`
trees, and new pages that compose existing primitives. No new third-party dependency is introduced.

## Technical Context

**Language/Version**: TypeScript 5.x on Node.js 20 LTS (unchanged from `001`)

**Primary Dependencies**: Next.js 15 (App Router, Server Components + Route Handlers), React 19,
Tailwind CSS 3.x, Mongoose, ioredis (rate-limiting for inquiry submissions), next-intl (AR/EN + RTL),
next-themes, Nodemailer (SMTP — admin invite + inquiry-alert email), Zod (validation), Auth.js/NextAuth
(credentials sessions). No new dependencies.

**Storage**: MongoDB (new `SupportInquiry` collection; invite-token fields added to `User`; customer
records are computed via aggregation over the existing `Order` collection — no new persistence). Redis
for inquiry-submission rate limiting. Cloudinary unchanged.

**Testing**: Vitest + React Testing Library (unit/component), MongoDB Memory Server (integration),
Playwright (e2e). Targeted tests for the correctness-critical paths: last-active-admin protection,
email-uniqueness on account creation, inquiry rate-limiting + non-enumeration, and customer-spend
aggregation correctness.

**Target Platform**: Cloud-hosted Node web app behind a CDN; responsive desktop/tablet/mobile browsers.

**Project Type**: Web application (single full-stack Next.js project — same as `001`).

**Performance Goals**: Inquiry submitted → confirmation < 1s and inbox visibility < 1 min (SC-103);
customer lookup → full order history < 30s (SC-104). About/Contact pages reuse Redis-cached settings.

**Constraints**: All new privileged actions enforced server-side (admin-only); accounts never
hard-deleted; last active admin cannot be deactivated; inquiry handling must not reveal whether a
referenced order exists (non-enumeration, consistent with `001` tracking); secrets remain env-only;
new pages correct in AR/RTL + EN/LTR and dark/light, fully responsive, reusing shared components.

**Scale/Scope**: 4 user stories; FR-101–FR-122; 3 new/affected entities (User invite fields,
SupportInquiry, computed Customer Record); admin + guest surfaces. Assume low write volume for
accounts/inquiries; customer aggregation bounded by existing order volume (~tens of thousands).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Derived from `.specify/memory/constitution.md` v1.0.0:

| # | Principle | Gate | Status |
|---|-----------|------|--------|
| I | Reusable & Modular Component Architecture | New admin tables/forms and About/Contact pages compose existing `components/ui` primitives + design tokens; no bespoke buttons/inputs or hard-coded colors/sizes | PASS — reuse Button/Input/Select/Card/Badge/Modal/Table; tokens only |
| II | i18n, Theming & Accessibility | All new copy via next-intl AR/EN; About/Contact + admin screens correct in RTL/LTR and dark/light; responsive; semantic + keyboard-operable forms | PASS — message catalog additions; logical properties; labeled controls |
| III | Security & Data Protection (NON-NEGOTIABLE) | Account mgmt + support inbox + customer records are admin-only, enforced server-side; Zod validation on all inputs; invite tokens hashed + expiring; passwords bcrypt-hashed; non-enumeration on inquiry order refs; secrets env-only | PASS — `requireRole("admin")` on every handler; hashed invite tokens; uniform inquiry responses |
| IV | Role-Based Access & Guest-Friendly Commerce | No public sign-up for staff roles; guests submit inquiries without an account; customer records are read-only and never gate checkout | PASS — provisioning is admin-only; Contact form is guest-open + rate-limited |
| V | Admin-Configurable Platform | About/Contact content sourced from existing admin-editable WebsiteSettings; no hard-coded content | PASS — pages render `aboutPage`/`contactPage`/`socialLinks` from settings |
| VI | Performance & Reliability | About/Contact reuse Redis-cached settings read; inquiry-alert email uses bounded retry and never blocks the submitter's response; customer aggregation is read-only | PASS — cached settings; fire-and-forget admin alert; indexed aggregation |

**Result**: All gates PASS. No violations to justify. Complexity Tracking intentionally empty.

## Project Structure

### Documentation (this feature)

```text
specs/002-accounts-support-content/
├── plan.md              # This file (/speckit-plan output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (API contracts)
│   ├── admin-accounts-api.md
│   ├── support-api.md
│   └── storefront-content.md
├── checklists/
│   └── requirements.md  # Spec quality checklist (from /speckit-specify, validated)
└── tasks.md             # Phase 2 output (/speckit-tasks — NOT created here)
```

### Source Code (repository root) — files added or modified by this feature

```text
src/
├── app/
│   ├── [locale]/
│   │   ├── (storefront)/
│   │   │   ├── about/page.tsx              # NEW — renders WebsiteSettings.aboutPage (FR-117)
│   │   │   └── contact/page.tsx            # NEW — contact details + inquiry form (FR-118)
│   │   └── (admin)/admin/
│   │       ├── accounts/page.tsx           # NEW — staff account management UI (US1)
│   │       ├── support/page.tsx            # NEW — support inbox UI (US2)
│   │       └── customers/                  # NEW — customer records list + [email] detail (US3)
│   │           ├── page.tsx
│   │           └── [email]/page.tsx
│   └── api/
│       ├── admin/
│       │   ├── accounts/route.ts           # NEW — GET list, POST create (FR-101/103/105)
│       │   ├── accounts/[id]/route.ts      # NEW — PATCH edit/role/(de)activate (FR-102/104/106)
│       │   ├── support/route.ts            # NEW — GET inbox list (FR-109/111)
│       │   ├── support/[id]/route.ts       # NEW — PATCH status (FR-109/110)
│       │   └── customers/route.ts          # NEW — GET aggregated customers (FR-113/114)
│       │       └── [email]/route.ts        # NEW — GET one customer's orders (FR-115)
│       ├── auth/
│       │   └── invite/route.ts             # NEW — POST accept invite + set password (FR-101b)
│       └── storefront/
│           └── support/route.ts            # NEW — POST guest inquiry, rate-limited (FR-107/108/112/122)
├── components/admin/
│   ├── accounts/AccountManager.tsx         # NEW — reuses ui primitives
│   ├── support/SupportInbox.tsx            # NEW
│   └── customers/CustomerTable.tsx         # NEW
├── components/storefront/
│   └── ContactForm.tsx                     # NEW — guest inquiry form (client)
├── lib/notifications/
│   └── email.ts                            # NEW — generic sendAdminEmail/sendUserEmail helper
│                                           #       (extract SMTP transport from dispatcher.ts)
├── lib/auth/
│   └── invite.ts                           # NEW — invite-token generate/hash/verify helpers
├── models/
│   ├── User.ts                             # MODIFIED — add inviteTokenHash, inviteExpiresAt, status fields
│   └── SupportInquiry.ts                   # NEW
├── services/
│   ├── admin/accounts.admin.service.ts     # NEW — create/edit/(de)activate, last-admin guard, invite
│   ├── admin/customers.admin.service.ts    # NEW — order aggregation by email
│   └── support.service.ts                  # NEW — submit (rate-limited) + inbox status workflow
└── messages/{ar,en}.json                   # MODIFIED — new keys for accounts/support/about/contact

tests/
├── unit/
│   ├── accounts.last-admin.test.ts         # NEW — last-active-admin cannot be deactivated (FR-104)
│   └── customers.aggregation.test.ts       # NEW — spend totals match underlying orders (SC-105)
├── integration/
│   ├── accounts.create.test.ts             # NEW — email-uniqueness + admin-only (FR-103/105)
│   └── support.submit.test.ts              # NEW — rate-limit + non-enumeration (FR-108/112)
└── e2e/
    └── accounts-support.spec.ts            # NEW — admin creates buyer → buyer signs in; guest inquiry → inbox
```

**Structure Decision**: Extend the existing single full-stack Next.js project in place (the same
structure ratified in `001`). New admin surfaces live under `app/[locale]/(admin)/admin/` and their
APIs under `app/api/admin/`; the guest Contact/About pages live under `app/[locale]/(storefront)/` with
the inquiry endpoint under `app/api/storefront/support/`. Cross-cutting helpers (generic email,
invite-token) are isolated under `lib/`. Customer records are a read-only aggregation service over the
existing `Order` collection — deliberately no new stored customer entity.

## Complexity Tracking

> No constitution violations — this section is intentionally empty.
