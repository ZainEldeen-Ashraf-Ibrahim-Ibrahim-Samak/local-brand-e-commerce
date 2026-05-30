# Contract: Auth API (admin & buyer)

**Base**: `/api/auth` (Auth.js handlers) · **Guests never authenticate** (FR-016).

## Sessions

| Method & Path | Purpose | Notes |
|---------------|---------|-------|
| POST /api/auth/callback/credentials | Sign in with email + password | Verifies argon2/bcrypt hash; issues server session cookie |
| POST /api/auth/signout | Sign out | Clears session |
| GET /api/auth/session | Current session | `{ user: { id, name, role } }` or `null` |

## Rules

- **No public registration** for `admin` or `buyer` roles. Account creation is admin-only via
  `POST /api/admin/users` (FR-037). There is no self-service signup endpoint.
- Passwords stored only as a strong hash; never returned by any endpoint (Principle III).
- Sessions are server-side; role is read from the session, never trusted from the client.
- Authorization is enforced in middleware for route groups **and** re-checked in each API handler
  (defense in depth, FR-017).
- Failed logins are rate-limited (Redis) to deter brute force.

## Authorization matrix

| Surface | guest | buyer | admin |
|---------|:-----:|:-----:|:-----:|
| Browse / search / product detail | ✅ | ✅ | ✅ |
| Cart / checkout / track order | ✅ | ✅ | ✅ |
| Manage OWN products + related orders | ❌ | ✅ | ✅ |
| Manage ALL products/orders/customers | ❌ | ❌ | ✅ |
| Promotions, settings, theme, tax/shipping | ❌ | ❌ | ✅ |
| Create/invite accounts | ❌ | ❌ | ✅ |
