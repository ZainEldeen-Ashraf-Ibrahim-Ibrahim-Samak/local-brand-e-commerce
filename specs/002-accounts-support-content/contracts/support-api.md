# Contract: Customer Support & Customer Records API

## Storefront (guest-open)

### POST /api/storefront/support

Submit a support inquiry (FR-107). No auth. Rate-limited per IP+email (FR-108).

**Body**:
```json
{ "name": "Lina", "email": "lina@example.com", "whatsapp": "+201234567890",
  "orderNumber": "ORD-1041", "subject": "Wrong size", "message": "I received the wrong size." }
```
`whatsapp`, `orderNumber`, `subject` optional; `name`, `email`, `message` required.

**202**: `{ "ok": true, "message": "received" }` — uniform acknowledgement regardless of whether the
`orderNumber` exists (non-enumeration, FR-112). Triggers a non-blocking admin-alert email (FR-122).
**429** — rate limit exceeded: `{ "error": { "code": "rate_limited", "message": "Too many requests" } }`
**422** — validation failure (missing required field, message too short).

## Admin (require `requireRole("admin")`)

### GET /api/admin/support

Support inbox listing (FR-109/111). Query: `status?=new|in_progress|resolved`, `q?` (email/subject),
`page?`, `pageSize?`. Sorted by `createdAt` desc.

**200**:
```json
{ "items": [
    { "id": "sq1", "name": "Lina", "email": "lina@example.com", "whatsapp": "+20...",
      "orderNumber": "ORD-1041", "subject": "Wrong size", "message": "...",
      "status": "new", "createdAt": "2026-06-01T11:00:00Z", "handledByUserId": null }
  ], "page": 1, "pageSize": 20, "total": 1 }
```
`sourceIp` is never returned.

### PATCH /api/admin/support/:id

Advance status (FR-109/110). **Body**: `{ "status": "in_progress" | "resolved" }`.

**200** — updated inquiry; `handledByUserId` set on first action; `statusHistory` appended (who/when).
**404** — no such inquiry.
**422** — invalid status value.

## Admin — Customer Records (read-only aggregation)

### GET /api/admin/customers

Customers aggregated from orders, grouped by email (FR-113/114). Query: `q?` (email/name/whatsapp),
`page?`, `pageSize?`, `sort?=spend|recent`.

**200**:
```json
{ "items": [
    { "email": "lina@example.com", "name": "Lina", "whatsapp": "+20...",
      "orderCount": 3, "totalSpend": 45900, "lastOrderAt": "2026-05-28T09:00:00Z" }
  ], "page": 1, "pageSize": 20, "total": 1 }
```
`totalSpend` is in minor units and equals the exact sum of the customer's order totals (SC-105).

### GET /api/admin/customers/:email

One customer's detail + order history (FR-115). `:email` is URL-encoded.

**200**:
```json
{ "email": "lina@example.com", "name": "Lina", "whatsapp": "+20...",
  "orderCount": 3, "totalSpend": 45900,
  "orders": [
    { "orderNumber": "ORD-1041", "status": "delivered", "total": 15300, "createdAt": "2026-05-28T09:00:00Z" }
  ] }
```
**404** — no orders for that email.

Customer records are strictly read-only and MUST NOT affect checkout (FR-116) — there are no POST/PATCH/
DELETE verbs here.
