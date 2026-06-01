# Contract: Incomplete-Order Expiry & Reconciliation

## POST /api/cron/expire-orders  (NEW — secret-gated)

Triggered by the host scheduler. Not a user endpoint. Authorized by a shared secret, NOT a user session.

**Auth**: header `Authorization: Bearer <CRON_SECRET>` (or `x-cron-secret`). Missing/invalid → **401**.
**Behavior**: calls `expireStaleOrders()` and returns a summary.

**200**:
```json
{ "scanned": 12, "expired": 3, "stockRestored": 3 }
```
Idempotent: running twice in quick succession restores stock for each order at most once (FR-215).

## Service: `expireStaleOrders()` (in `order.service`)

For each order matching `{ status: "pending", expiresAt ≤ now }`:
1. Atomic claim + transition (concurrency-safe, at-most-once):
   `findOneAndUpdate({ _id, status:"pending", stockRestored:false }, { $set:{ status:"failed",
   stockRestored:true }, $push:{ statusHistory:{ from:"pending", to:"failed", at:now, note:"expired" } } })`.
2. Only if the update **matched** (this worker won), call `restoreStock(order.items)` and dispatch the
   customer notification (reusing `001` status-change notification).

Guarantees:
- **FR-213/214**: expired orders are marked failed and their stock restored.
- **FR-215**: the `stockRestored:false` condition ensures restoration happens once even under concurrent
  sweeps or retries.

## Order creation (modified)

On creating a pending order: set `expiresAt = createdAt + ORDER_EXPIRY_MINUTES` (env, default 30) and
`stockRestored = false`. No change to pricing/stock-reservation behavior from `001`.

## Payment confirmation (modified — `confirmOrder`)

- If order is still `pending` and within window → confirm normally (existing behavior); it is never
  expired afterward because confirmed orders are excluded from the sweep (FR-216).
- If a payment confirms for an order already `failed` via expiry (late payment) → **reconcile** without
  overselling (FR-216, SC-206):
  - re-validate current stock for the order's items;
  - if all available → re-reserve and transition to `confirmed`;
  - if not available → leave `failed`, record a refund-needed flag/log; do **not** confirm.

## Admin order list (modified)

### GET /api/admin/orders?completion=incomplete|confirmed
- `incomplete` → status ∈ {`pending`,`failed`}; `confirmed` → status ∈ {`confirmed`,`processing`,
  `shipped`,`delivered`,`returned`,`refunded`} (FR-217).
- Response shape unchanged from `001` plus the existing fields; the admin orders page renders a
  completion filter and a badge distinguishing incomplete from confirmed orders (reusing `statusTone`).
