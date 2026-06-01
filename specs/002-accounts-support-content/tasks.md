---
description: "Task list for Admin Accounts, Customer Records, Support Inbox & Storefront Content Pages"
---

# Tasks: Admin Accounts, Customer Records, Support Inbox & Storefront Content Pages

**Input**: Design documents from `specs/002-accounts-support-content/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Targeted tests are included ONLY for the correctness-critical paths the plan committed to
(last-active-admin protection, account email-uniqueness, inquiry rate-limiting + non-enumeration,
customer-spend aggregation). Other tasks are implementation-focused.

**Context**: This feature extends the shipped `001-ecommerce-platform` in place. It reuses the existing
`User` model, Auth.js config, server-side role guards (`requireRole("admin")`), `Order` data,
`WebsiteSettings` content, `components/ui` primitives, design tokens, next-intl catalogs, and SMTP
transport. No new dependency is introduced.

**Order field paths (verified against `src/models/Order.ts`)**: customer email/name/WhatsApp live under
`order.customer.{email,name,whatsapp}` and the order total is the top-level `order.grandTotal` (both in
integer minor units). Use these exact paths in the customer aggregation (US3).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1–US4 (user-story tasks only)
- All paths are relative to the repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Tooling/config additions shared by all stories

- [X] T001 [P] Add i18n message keys for accounts, support, about, and contact surfaces in `src/messages/en.json` and `src/messages/ar.json`
- [X] T002 [P] Add optional `SUPPORT_ALERT_EMAIL` env fallback (admin-alert recipient) to the env loader in `src/lib/config/env.ts` and `.env.example`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared infrastructure required by more than one user story

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T003 Extract a reusable SMTP email helper exposing `sendEmail(to, subject, text)` and `sendAdminEmail(subject, text)` into `src/lib/notifications/email.ts`, and refactor `src/lib/notifications/dispatcher.ts` to consume it (no behavior change for order notifications). Used by US1 invites and US2 admin alerts.

**Checkpoint**: Foundation ready — user stories can now begin.

---

## Phase 3: User Story 1 - Admin provisions and manages staff accounts (Priority: P1) 🎯 MVP

**Goal**: An admin can create (temp-password OR email-invite), edit, deactivate, and re-activate buyer
and admin accounts; the last active admin can never be removed; no public sign-up for privileged roles.

**Independent Test**: Sign in as admin, create a buyer (temp password), confirm that buyer can sign in
and reach `/seller`, then deactivate them and confirm sign-in is rejected; confirm the only admin cannot
be deactivated.

### Critical-path tests for US1 (write first; must fail before implementation)

- [X] T004 [P] [US1] Unit test: the last active admin cannot be deactivated or demoted (FR-104) in `tests/unit/accounts.last-admin.test.ts`
- [X] T005 [P] [US1] Integration test: account creation rejects duplicate email and is admin-only (FR-103/FR-105) in `tests/integration/accounts.create.test.ts`

### Implementation for US1

- [X] T006 [US1] Add invite fields (`inviteTokenHash` select:false, `inviteExpiresAt`, `invitedAt`) and the pending/active/inactive state model to the User schema in `src/models/User.ts`
- [X] T007 [P] [US1] Implement invite-token helpers (random token generate, SHA-256 hash, verify, expiry check) in `src/lib/auth/invite.ts`
- [X] T008 [US1] Implement admin accounts service (create via temp-password or invite, edit name/role, (de)activate, last-active-admin guard, audit who/when) in `src/services/admin/accounts.admin.service.ts` (depends on T003, T006, T007)
- [X] T009 [US1] Enforce account status at sign-in/session: reject inactive or invite-pending users in `src/lib/auth/config.ts` and `src/lib/auth/guards.ts` (deactivated users fail the next server-side check)
- [X] T010 [P] [US1] Implement `GET` (list/filter, derived status) + `POST` (create) `/api/admin/accounts` in `src/app/api/admin/accounts/route.ts` (admin-only, Zod, never returns secrets)
- [X] T011 [P] [US1] Implement `PATCH /api/admin/accounts/[id]` (edit/role/(de)activate; 422 on last-admin) in `src/app/api/admin/accounts/[id]/route.ts`
- [X] T012 [US1] Implement `POST /api/auth/invite` (accept invite: verify token+expiry, set password, activate, clear invite fields; uniform invalid/expired response) in `src/app/api/auth/invite/route.ts`
- [X] T013 [P] [US1] Build AccountManager UI (list, create form with method toggle, role/status controls) reusing `components/ui` primitives in `src/components/admin/accounts/AccountManager.tsx`
- [X] T014 [US1] Build admin accounts page in `src/app/[locale]/(admin)/admin/accounts/page.tsx`
- [X] T015 [US1] Build the public invite-accept page (token from query, set-password form posting to `/api/auth/invite`) in `src/app/[locale]/accept-invite/page.tsx`
- [X] T016 [US1] Add an "Accounts" link to admin navigation in `src/components/admin/AdminNav.tsx`

**Checkpoint**: US1 fully functional — admin can provision and manage staff accounts (MVP).

---

## Phase 4: User Story 2 - Customer submits a support inquiry and admin handles it (Priority: P1)

**Goal**: A guest submits an inquiry from the Contact page (rate-limited, non-enumerating); it lands in
an admin support inbox with a status workflow; each new inquiry emails the admin.

**Independent Test**: As a guest, submit an inquiry and see a confirmation; as admin, open the inbox,
see it newest-first, and advance new → in_progress → resolved.

### Critical-path test for US2

- [X] T017 [P] [US2] Integration test: inquiry submission is rate-limited and never reveals whether a referenced order exists (FR-108/FR-112) in `tests/integration/support.submit.test.ts`

### Implementation for US2

- [X] T018 [P] [US2] Create SupportInquiry model (name, email, whatsapp?, orderNumber? verbatim, subject?, message, status enum, handledByUserId, statusHistory, sourceIp select:false; indexes `{status,createdAt:-1}` and `{email}`) in `src/models/SupportInquiry.ts`
- [X] T019 [US2] Implement support service (guest submit with Redis IP+email rate limit, store inquiry, fire non-blocking admin-alert email via `sendAdminEmail`, uniform acknowledgement; admin status transitions appending statusHistory) in `src/services/support.service.ts` (depends on T003, T018)
- [X] T020 [P] [US2] Implement `POST /api/storefront/support` (guest-open, Zod, 202 uniform ack, 429 on rate limit) in `src/app/api/storefront/support/route.ts`
- [X] T021 [P] [US2] Implement `GET /api/admin/support` (inbox list, filters) and `PATCH /api/admin/support/[id]` (status) in `src/app/api/admin/support/route.ts` and `src/app/api/admin/support/[id]/route.ts` (admin-only)
- [X] T022 [P] [US2] Build ContactForm client component (fields + client/server-validated submit, success/429/422 handling) reusing `components/ui` in `src/components/storefront/ContactForm.tsx`
- [X] T023 [P] [US2] Build SupportInbox UI (list newest-first, status controls) in `src/components/admin/support/SupportInbox.tsx`
- [X] T024 [US2] Build admin support page in `src/app/[locale]/(admin)/admin/support/page.tsx`
- [X] T025 [US2] Add a "Support" link to admin navigation in `src/components/admin/AdminNav.tsx`

**Checkpoint**: US1 + US2 independently functional — staff accounts and customer support both work.

---

## Phase 5: User Story 3 - Admin views customer records (Priority: P2)

**Goal**: An admin sees customers aggregated from orders (grouped by email) with order count, total
spend, and full order history — strictly read-only, no checkout impact.

**Independent Test**: Seed several guest orders sharing one email; as admin, open customer records and
confirm the customer appears once with correct order count and total spend, linking to their orders.

### Critical-path test for US3

- [X] T026 [P] [US3] Unit test: aggregated `totalSpend` equals the exact sum of a customer's underlying order `grandTotal`s (SC-105) in `tests/unit/customers.aggregation.test.ts`

### Implementation for US3

- [X] T027 [US3] Implement customers service: MongoDB aggregation over `Order` grouped by `customer.email` (name/whatsapp from latest order, `orderCount`, `totalSpend` = sum of `grandTotal`, `lastOrderAt`), search by email/name/whatsapp, pagination, plus a per-email detail query — read-only in `src/services/admin/customers.admin.service.ts`
- [X] T028 [P] [US3] Implement `GET /api/admin/customers` (aggregated list, search, sort) in `src/app/api/admin/customers/route.ts` (admin-only)
- [X] T029 [P] [US3] Implement `GET /api/admin/customers/[email]` (one customer + order history; URL-encoded email) in `src/app/api/admin/customers/[email]/route.ts`
- [X] T030 [P] [US3] Build CustomerTable UI (list, search box) reusing `components/ui` in `src/components/admin/customers/CustomerTable.tsx`
- [X] T031 [US3] Build admin customers list + detail pages in `src/app/[locale]/(admin)/admin/customers/page.tsx` and `src/app/[locale]/(admin)/admin/customers/[email]/page.tsx` (detail links to existing admin order detail)
- [X] T032 [US3] Add a "Customers" link to admin navigation in `src/components/admin/AdminNav.tsx`

**Checkpoint**: Admin can review customers and their order history.

---

## Phase 6: User Story 4 - Shopper reads the About and Contact pages (Priority: P2)

**Goal**: Public About and Contact pages render admin-configured WebsiteSettings content (with empty-
state fallbacks) and the Contact page hosts the US2 inquiry form; header/footer link to both.

**Independent Test**: With About/Contact content set, visit each page as a guest in AR and EN, dark and
light, on a narrow viewport, and confirm correct rendering and working navigation.

### Implementation for US4

- [X] T033 [P] [US4] Build the About page (reads cached `WebsiteSettings.aboutPage.body`; localized; empty-state fallback) in `src/app/[locale]/(storefront)/about/page.tsx`
- [X] T034 [US4] Build the Contact page (renders `contactPage.{body,email,phone,whatsapp,address}` + `socialLinks`; embeds the ContactForm from T022; empty-state fallback) in `src/app/[locale]/(storefront)/contact/page.tsx` (depends on T022)
- [X] T035 [US4] Add working About/Contact navigation links (locale-aware, keyboard-focusable) to `src/components/storefront/SiteHeader.tsx` and `src/components/storefront/SiteFooter.tsx`

**Checkpoint**: Public content pages live with working navigation.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final validation across the new surfaces

- [X] T036 [P] E2E test: admin creates a buyer → buyer signs in; guest submits an inquiry → it appears in the admin inbox (Playwright) in `tests/e2e/accounts-support.spec.ts`
- [X] T037 [P] Verify AR/RTL + EN/LTR, dark/light, and responsive layout on all new admin and storefront pages (Principle II); fix any logical-property or contrast issues
- [X] T038 Run `npm run typecheck` and `npm run lint`, then execute `quickstart.md` validation end to end

---

## Dependencies & Execution Order

### Phase dependencies

- **Setup (Phase 1)**: no dependencies — start immediately
- **Foundational (Phase 2 / T003)**: depends on Setup — BLOCKS US1 (invite email) and US2 (admin alert)
- **User Stories (Phases 3–6)**: all depend on Foundational
  - US1 (P1) and US2 (P1) are the MVP and are independent of each other
  - US3 (P2) depends only on existing `Order` data + Foundational
  - US4 (P2): the About page is independent; the **Contact page (T034) reuses the ContactForm (T022)**
    from US2 — build US2 (or at least T022) before T034
- **Polish (Phase 7)**: depends on the targeted user stories being complete

### Within each story

- Critical-path tests (T004/T005, T017, T026) written before their implementation
- Models → services → endpoints → UI
- `AdminNav.tsx` edits (T016, T025, T032) touch the same file — run them sequentially, not in parallel

### Parallel opportunities

- Setup: T001 ∥ T002
- US1: T004 ∥ T005 (tests); T007 ∥ (T006); T010 ∥ T011 ∥ T013 once the service exists
- US2: T020 ∥ T021 ∥ T022 ∥ T023 once model+service exist
- US3: T028 ∥ T029 ∥ T030 once the service exists
- US4: T033 ∥ (T034 after T022)
- Polish: T036 ∥ T037

---

## Parallel Execution Examples

### User Story 1

```text
# Tests first (parallel):
T004 last-admin guard · T005 create email-uniqueness
# After service (T008) lands, endpoints + UI in parallel:
T010 accounts list/create · T011 account patch · T013 AccountManager
```

### User Story 2

```text
# After model (T018) + service (T019):
T020 storefront support · T021 admin support · T022 ContactForm · T023 SupportInbox
```

---

## Implementation Strategy

### MVP first

1. Phase 1 Setup → Phase 2 Foundational (T003 email helper)
2. Phase 3 (US1 staff accounts) → **STOP & VALIDATE**: admin provisions a working buyer account
3. Phase 4 (US2 support) → guest support path + admin inbox → **MVP complete (both P1 stories)**

### Incremental delivery

- Add US3 (customer records) → admins can review customers
- Add US4 (About/Contact pages) → public content + navigation complete
- Phase 7 polish (e2e, i18n/theme/responsive audit, quickstart) before shipping

---

## Notes

- [P] = different files, no dependencies
- Every privileged endpoint re-checks `requireRole("admin")` server-side (Principle III/IV)
- New UI composes `components/ui` primitives + design tokens only — no hard-coded colors/sizes (Principle I)
- Verify the four critical-path tests pass before shipping (last-admin, email-uniqueness, inquiry
  rate-limit/non-enumeration, customer aggregation)
- Customer records are strictly read-only and MUST NOT affect checkout (FR-116)
- Accounts are soft-deactivated, never hard-deleted (FR-102)
- Commit after each task or logical group
