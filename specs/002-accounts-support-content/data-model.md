# Phase 1 Data Model: Accounts, Support, Customer Records & Content Pages

Builds on `001-ecommerce-platform`. Two persistence changes (User invite fields, new SupportInquiry)
plus one computed (non-stored) aggregation. All money is stored as integer minor units, consistent
with `001`.

## 1. User (MODIFIED) — `src/models/User.ts`

Existing fields (unchanged): `email` (unique, lowercased, indexed), `passwordHash` (select:false),
`role` (`admin` | `buyer`), `name`, `isActive` (default true), `createdByUserId`, timestamps.

**Added fields** (all optional, for the email-invite flow — FR-101b):

| Field | Type | Rules |
|-------|------|-------|
| `inviteTokenHash` | String (select:false) | SHA-256 hash of the invite token; present only while an invite is pending |
| `inviteExpiresAt` | Date | Invite expiry (default now + 72h); past = invite invalid |
| `invitedAt` | Date | When the invite was issued |

**State model**:
- **pending** — created via invite: `isActive=false`, `inviteTokenHash` set, `passwordHash` a random
  unusable placeholder until accepted.
- **active** — `isActive=true`, no invite fields (temp-password create lands here directly).
- **inactive** — `isActive=false`, no invite fields (deactivated by admin; soft only, never deleted).

**Validation / invariants**:
- `email` unique across all accounts (FR-103); create rejects duplicates with a clear message.
- An account MUST NOT be deactivated, nor have its role changed away from `admin`, if it is the **last
  active admin** (FR-104) — service-level guard, returns 422.
- Accounts are never hard-deleted (FR-102).
- Accepting an invite (`POST /api/auth/invite`): token must match the stored hash and be unexpired;
  on success set `passwordHash`, `isActive=true`, and clear all invite fields.

## 2. SupportInquiry (NEW) — `src/models/SupportInquiry.ts`

A customer-submitted support message (FR-107).

| Field | Type | Rules |
|-------|------|-------|
| `name` | String | required, trimmed |
| `email` | String | required, lowercased, indexed |
| `whatsapp` | String | optional |
| `orderNumber` | String | optional; stored verbatim, **never** validated against Order to avoid enumeration (FR-112) |
| `subject` | String | optional, trimmed |
| `message` | String | required (min length enforced via Zod) |
| `status` | String enum | `new` \| `in_progress` \| `resolved`; default `new` |
| `handledByUserId` | ObjectId → User | set when an admin first actions it (FR-110) |
| `statusHistory` | `[{ status, at, byUserId }]` | appended on each status change (FR-110) |
| `sourceIp` | String (select:false) | for rate-limit auditing only; not shown in inbox |
| timestamps | createdAt / updatedAt | inbox sorts by `createdAt` desc (FR-109) |

**Indexes**: `{ status, createdAt: -1 }` (inbox listing), `{ email: 1 }` (search/grouping).

**State transitions** (admin-driven, FR-109): `new → in_progress → resolved`. Re-opening
(`resolved → in_progress`) is allowed; every change appends to `statusHistory` with the acting admin.

**Lifecycle rules**:
- Creation is open to guests but **rate-limited** (Redis fixed window keyed by IP+email, FR-108).
- Creation triggers a non-blocking admin-alert email (FR-122).
- All read/status-change operations are admin-only, server-enforced (FR-111).

## 3. Customer Record (COMPUTED — not stored) — `customers.admin.service`

A read-only aggregation over the existing `Order` collection, keyed by lowercased checkout email
(FR-113–116). No collection, no writes.

**Projected shape (list)**:

| Field | Source |
|-------|--------|
| `email` | `Order.contact.email` (group key, lowercased) |
| `name` | latest order's contact name |
| `whatsapp` | latest order's contact WhatsApp |
| `orderCount` | count of that email's orders |
| `totalSpend` | sum of order `totals.grandTotal` (minor units) |
| `lastOrderAt` | max `createdAt` |

**Detail shape**: the above plus the full list of that email's orders (orderNumber, status, total,
createdAt) linking to each existing admin order detail page.

**Rules**:
- Search filters by email / name / whatsapp (case-insensitive regex), paginated (FR-114).
- `totalSpend` MUST equal the exact sum of the customer's underlying order totals (SC-105).
- Strictly read-only; MUST NOT alter or gate checkout in any way (FR-116).

> Note: field paths (`contact.email`, `totals.grandTotal`) are validated against the actual `Order`
> schema during implementation; adjust to the real names if they differ.

## 4. Website Settings — About/Contact content (REUSE, unchanged) — `src/models/WebsiteSettings.ts`

Already provides everything the new pages render (no schema change):
- `aboutPage.body` (localized) → About page (FR-117).
- `contactPage.{body,email,phone,whatsapp,address}` (+ `socialLinks[]`) → Contact page (FR-118).
- `contactPage.email` also serves as the default admin-alert recipient (FR-122), with an env fallback.

## Entity relationships

```text
User (admin) --creates/invites--> User (buyer|admin)        [createdByUserId, invite fields]
User (admin) --handles--> SupportInquiry                    [handledByUserId, statusHistory.byUserId]
Order (existing) --aggregated by email--> Customer Record    [computed, read-only]
WebsiteSettings (existing singleton) --rendered by--> About/Contact pages
SupportInquiry.email/orderNumber --loose reference--> (no FK; non-enumeration)
```
