# Contract: Admin Accounts & Invite API

All `/api/admin/accounts*` endpoints require an authenticated **admin** session (server-side
`requireRole("admin")`); non-admin/unauthenticated → 403/401. Validation via Zod. Errors use the
shared typed error envelope from `001` (`lib/http/errors`).

## GET /api/admin/accounts

List staff accounts. Query: `role?=admin|buyer`, `status?=active|inactive|pending`, `q?` (name/email),
`page?`, `pageSize?`.

**200**:
```json
{
  "items": [
    { "id": "u1", "email": "sara@brand.com", "name": "Sara", "role": "buyer",
      "status": "active", "createdAt": "2026-06-01T10:00:00Z", "createdByUserId": "admin1" }
  ],
  "page": 1, "pageSize": 20, "total": 3
}
```
`status` is derived: `pending` (invite outstanding), `active`, or `inactive`. `passwordHash` and invite
fields are NEVER returned.

## POST /api/admin/accounts

Create a buyer or admin account (FR-101). One of two credential methods.

**Body**:
```json
{ "email": "sara@brand.com", "name": "Sara", "role": "buyer",
  "method": "temp_password", "password": "Initial#123" }
```
or
```json
{ "email": "sara@brand.com", "name": "Sara", "role": "buyer", "method": "invite" }
```

**201** (temp_password): `{ "id": "u2", "email": "...", "role": "buyer", "status": "active" }`
**201** (invite): `{ "id": "u2", "email": "...", "role": "buyer", "status": "pending" }` — an invite
email with an accept link is dispatched (non-blocking).

**409** — email already exists (FR-103): `{ "error": { "code": "conflict", "message": "Email already in use" } }`
**422** — validation (weak/missing password for temp_password, bad role, etc.).

## PATCH /api/admin/accounts/:id

Edit name/role, or (de)activate (FR-102/104/106). Soft only — no DELETE verb exists.

**Body** (any subset): `{ "name?": "...", "role?": "admin|buyer", "isActive?": true|false }`

**200** — updated account summary.
**422** — would deactivate or demote the **last active admin** (FR-104):
```json
{ "error": { "code": "last_admin", "message": "Cannot remove the last active admin" } }
```
**404** — no such account.

Every successful change appends an audit entry (who/when) — FR-106.

## POST /api/auth/invite  *(public, token-gated)*

Accept an emailed invite and set a password (FR-101b). No session required; the token is the credential.

**Body**: `{ "token": "<plaintext-invite-token>", "password": "ChosenPass#1" }`

**200**: `{ "ok": true }` — account activated; invite fields cleared; user may now sign in.
**400/410** — token invalid or expired (uniform message; does not reveal which account).
**422** — password fails policy.

## Notes

- Invite tokens are random, stored only as a SHA-256 hash with a 72h expiry; the plaintext exists only
  in the emailed link.
- Deactivated users fail the next server-side `requireUser` (session checks `isActive`).
- No endpoint ever returns password or invite-token material.
