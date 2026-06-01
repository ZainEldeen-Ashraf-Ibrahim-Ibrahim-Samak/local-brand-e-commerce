// @vitest-environment node

/**
 * Unit tests: order expiry idempotency (T017, FR-013).
 *
 * Spins up an ephemeral in-memory MongoDB; connectDB() reuses the open
 * connection. The inventory service is mocked so no real stock writes happen.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

// ── Mocks ────────────────────────────────────────────────────────────────────
vi.mock("@/services/inventory.service", () => ({
  reserveStock: vi.fn().mockResolvedValue(undefined),
  restoreStock: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/notifications/dispatcher", () => ({
  dispatchOrderNotification: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/notifications/templates", () => ({
  orderStatusMessage: vi.fn().mockReturnValue({ subject: "", message: "" }),
}));

vi.mock("@/lib/config/env", () => ({
  getEnv: () => ({
    ORDER_EXPIRY_MINUTES: 30,
    CRON_SECRET: undefined,
  }),
}));

// ── Imports (after mocks) ─────────────────────────────────────────────────────
import { connectDB } from "@/lib/db/connect";
import { Order } from "@/models/Order";
import { expireStaleOrders, markOrderPaid } from "@/services/order.service";
import { restoreStock } from "@/services/inventory.service";

// ── Helpers ──────────────────────────────────────────────────────────────────
function makeOrderSeed(overrides: Record<string, unknown> = {}) {
  return {
    orderNumber: `LB-TEST-${Date.now()}-${Math.random()}`,
    items: [
      {
        variation: new mongoose.Types.ObjectId(),
        product: new mongoose.Types.ObjectId(),
        productNameSnapshot: { en: "Tee", ar: "تيشيرت" },
        options: {},
        unitPrice: 1000,
        appliedUnitDiscount: 0,
        quantity: 2,
        lineTotal: 2000,
      },
    ],
    customer: { email: "test@example.com", whatsapp: "+966501234567", name: "Test User" },
    shippingAddress: { line1: "1 St", city: "Riyadh", country: "SA" },
    subtotal: 2000,
    discountTotal: 0,
    taxTotal: 0,
    shippingOption: { id: "std", label: { en: "Standard", ar: "عادي" }, cost: 0 },
    grandTotal: 2000,
    status: "pending",
    statusHistory: [{ to: "pending", at: new Date() }],
    payment: { status: "pending" },
    stockRestored: false,
    ...overrides,
  };
}

// ── Tests ────────────────────────────────────────────────────────────────────
describe("order expiry — idempotency", () => {
  let mongod: MongoMemoryServer;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });

  beforeEach(async () => {
    await connectDB();
    await Order.deleteMany({});
    vi.clearAllMocks();
  });

  it("expires a past-due pending order exactly once and restores stock", async () => {
    const pastExpiry = new Date(Date.now() - 1_000); // 1 second ago
    await Order.create(makeOrderSeed({ expiresAt: pastExpiry }));

    const { expired } = await expireStaleOrders();

    expect(expired).toBe(1);
    expect(restoreStock).toHaveBeenCalledTimes(1);

    const order = await Order.findOne({}).lean();
    expect(order?.status).toBe("failed");
    expect(order?.stockRestored).toBe(true);
  });

  it("running the sweep twice does NOT restore stock a second time (idempotency)", async () => {
    const pastExpiry = new Date(Date.now() - 1_000);
    await Order.create(makeOrderSeed({ expiresAt: pastExpiry }));

    await expireStaleOrders(); // first sweep
    vi.clearAllMocks();
    const { expired } = await expireStaleOrders(); // second sweep — should claim nothing

    expect(expired).toBe(0);
    expect(restoreStock).not.toHaveBeenCalled();
  });

  it("does NOT expire a pending order whose expiresAt is in the future", async () => {
    const futureExpiry = new Date(Date.now() + 60 * 60_000); // 1 hour ahead
    await Order.create(makeOrderSeed({ expiresAt: futureExpiry }));

    const { expired } = await expireStaleOrders();

    expect(expired).toBe(0);
    expect(restoreStock).not.toHaveBeenCalled();
  });

  it("a late markOrderPaid (after expiry) marks the order failed and restores stock at most once", async () => {
    const pastExpiry = new Date(Date.now() - 1_000);
    // Order is still 'pending' but its expiresAt has passed (cron hasn't run yet)
    const order = await Order.create(makeOrderSeed({ expiresAt: pastExpiry }));

    await markOrderPaid(String(order._id), "REF-LATE-001");

    expect(restoreStock).toHaveBeenCalledTimes(1);

    const updated = await Order.findById(order._id).lean();
    expect(updated?.status).toBe("failed");
    expect(updated?.stockRestored).toBe(true);
  });

  it("a timely markOrderPaid (before expiry) confirms the order without restoring stock", async () => {
    const futureExpiry = new Date(Date.now() + 60 * 60_000);
    const order = await Order.create(makeOrderSeed({ expiresAt: futureExpiry }));

    await markOrderPaid(String(order._id), "REF-OK-001");

    expect(restoreStock).not.toHaveBeenCalled();

    const updated = await Order.findById(order._id).lean();
    expect(updated?.status).toBe("confirmed");
  });
});
