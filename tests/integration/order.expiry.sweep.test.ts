// @vitest-environment node

/**
 * Integration test: order expiry sweep (T018, FR-013).
 *
 * Tests the full sweep lifecycle against an ephemeral MongoDB:
 *  - pending orders past expiresAt → failed + stock restored
 *  - pending orders with future expiresAt → untouched
 *  - concurrent / double sweep → stock restored exactly once
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { Order } from "@/models/Order";
import { Variation } from "@/models/Variation";
import { Product } from "@/models/Product";
import { Category } from "@/models/Category";
import { expireStaleOrders } from "@/services/order.service";

// ── Mock inventory so we can assert restoreStock calls independently ──────────
const restoreStockCalls: unknown[][] = [];
vi.mock("@/services/inventory.service", () => ({
  reserveStock: vi.fn().mockResolvedValue(undefined),
  restoreStock: vi.fn().mockImplementation(async (items: unknown[]) => {
    restoreStockCalls.push(items);
  }),
}));

vi.mock("@/lib/notifications/dispatcher", () => ({
  dispatchOrderNotification: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/notifications/templates", () => ({
  orderStatusMessage: vi.fn().mockReturnValue({ subject: "", message: "" }),
}));

vi.mock("@/lib/config/env", () => ({
  getEnv: () => ({ ORDER_EXPIRY_MINUTES: 30, CRON_SECRET: undefined }),
}));

// ── Helpers ──────────────────────────────────────────────────────────────────
let mongod: MongoMemoryServer;
let variationId: mongoose.Types.ObjectId;
let productId: mongoose.Types.ObjectId;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  const cat = await Category.create({ slug: "cat-exp", name: { en: "Cat", ar: "تصنيف" } });
  const prod = await Product.create({
    slug: "prod-exp",
    name: { en: "Shirt", ar: "قميص" },
    description: { en: "d", ar: "d" },
    category: cat._id,
    basePrice: 500,
    images: [{ cloudinaryId: "x", version: "1" }],
    status: "published",
    ownerUserId: new mongoose.Types.ObjectId(),
  });
  productId = prod._id as mongoose.Types.ObjectId;
  const v = await Variation.create({ product: productId, sku: "SKU-EXP-1", stock: 10, options: {} });
  variationId = v._id as mongoose.Types.ObjectId;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  await Order.deleteMany({});
  restoreStockCalls.length = 0;
  vi.clearAllMocks();
});

function orderSeed(overrides: Record<string, unknown> = {}) {
  return {
    orderNumber: `LB-EXP-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    items: [
      {
        variation: variationId,
        product: productId,
        productNameSnapshot: { en: "Shirt", ar: "قميص" },
        options: {},
        unitPrice: 500,
        appliedUnitDiscount: 0,
        quantity: 1,
        lineTotal: 500,
      },
    ],
    customer: { email: "buyer@test.com", whatsapp: "+966500000000", name: "Buyer" },
    shippingAddress: { line1: "1 Main St", city: "Riyadh", country: "SA" },
    subtotal: 500,
    discountTotal: 0,
    taxTotal: 0,
    shippingOption: { id: "std", label: { en: "Std", ar: "عادي" }, cost: 0 },
    grandTotal: 500,
    status: "pending",
    statusHistory: [{ to: "pending", at: new Date() }],
    payment: { status: "pending" },
    stockRestored: false,
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────
describe("order.expiry.sweep (T018)", () => {
  it("transitions expired pending orders to failed and restores stock", async () => {
    const pastExpiry = new Date(Date.now() - 1_000);
    await Order.create(orderSeed({ expiresAt: pastExpiry }));

    const { expired } = await expireStaleOrders();

    expect(expired).toBe(1);

    const order = await Order.findOne({}).lean();
    expect(order?.status).toBe("failed");
    expect(order?.stockRestored).toBe(true);
    expect(order?.statusHistory?.at(-1)?.note).toBe("auto-expired");
  });

  it("leaves future-expiry pending orders untouched", async () => {
    const futureExpiry = new Date(Date.now() + 60 * 60_000);
    await Order.create(orderSeed({ expiresAt: futureExpiry }));

    const { expired } = await expireStaleOrders();

    expect(expired).toBe(0);

    const order = await Order.findOne({}).lean();
    expect(order?.status).toBe("pending");
    expect(order?.stockRestored).toBe(false);
  });

  it("handles a mix: expires only past-due orders", async () => {
    const past = new Date(Date.now() - 1_000);
    const future = new Date(Date.now() + 60 * 60_000);

    await Order.insertMany([
      orderSeed({ orderNumber: `LB-EXP-PAST-${Date.now()}`, expiresAt: past }),
      orderSeed({ orderNumber: `LB-EXP-FUTURE-${Date.now()}`, expiresAt: future }),
    ]);

    const { expired } = await expireStaleOrders();

    expect(expired).toBe(1);

    const [pastOrder, futureOrder] = await Promise.all([
      Order.findOne({ expiresAt: past }).lean(),
      Order.findOne({ expiresAt: future }).lean(),
    ]);
    expect(pastOrder?.status).toBe("failed");
    expect(futureOrder?.status).toBe("pending");
  });

  it("double-sweep never restores stock more than once per order", async () => {
    const past = new Date(Date.now() - 1_000);
    await Order.create(orderSeed({ expiresAt: past }));

    const { expired: first } = await expireStaleOrders();
    const { expired: second } = await expireStaleOrders();

    expect(first).toBe(1);
    expect(second).toBe(0);
    // restoreStock should only have been called once total
    const { restoreStock } = await import("@/services/inventory.service");
    expect((restoreStock as ReturnType<typeof vi.fn>).mock.calls.length).toBe(1);
  });
});
