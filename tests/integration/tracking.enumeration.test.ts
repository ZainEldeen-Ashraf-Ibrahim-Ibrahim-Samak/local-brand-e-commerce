// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

// Stub Redis-backed rate limiter so the test does not require a Redis server.
vi.mock("@/lib/cache", () => ({ rateLimit: vi.fn(async () => true) }));

import { Order } from "@/models/Order";
import { trackOrder } from "@/services/tracking.service";
import { AppError } from "@/lib/http/errors";

/**
 * T051 / R5: tracking must require an EXACT order#+email+whatsapp match and return
 * a uniform not-found (404) on any mismatch — no enumeration / detail probing.
 */
let mongod: MongoMemoryServer;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  await Order.create({
    orderNumber: "LB-TEST-1",
    items: [
      {
        variation: new mongoose.Types.ObjectId(),
        product: new mongoose.Types.ObjectId(),
        productNameSnapshot: { en: "Tee", ar: "تي" },
        options: { size: "M" },
        unitPrice: 4500,
        quantity: 1,
        lineTotal: 4500,
      },
    ],
    customer: { email: "buyer@example.com", whatsapp: "+201234567890", name: "Buyer" },
    shippingAddress: { line1: "1 St", city: "Cairo", country: "EG" },
    subtotal: 4500,
    taxTotal: 630,
    shippingOption: { id: "standard", label: { en: "Standard", ar: "عادي" }, cost: 3000 },
    grandTotal: 8130,
    status: "shipped",
    statusHistory: [{ to: "shipped", at: new Date() }],
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

describe("order tracking non-enumeration (T051)", () => {
  it("returns the order on an exact match", async () => {
    const dto = await trackOrder({
      orderNumber: "LB-TEST-1",
      email: "buyer@example.com",
      whatsapp: "+201234567890",
    });
    expect(dto.status).toBe("shipped");
    expect(dto.totals.grandTotal).toBe(8130);
  });

  it("rejects a correct order number with the wrong email (uniform 404)", async () => {
    await expect(
      trackOrder({ orderNumber: "LB-TEST-1", email: "wrong@example.com", whatsapp: "+201234567890" }),
    ).rejects.toMatchObject({ status: 404 });
  });

  it("rejects a correct order number with the wrong whatsapp (uniform 404)", async () => {
    await expect(
      trackOrder({ orderNumber: "LB-TEST-1", email: "buyer@example.com", whatsapp: "+200000000000" }),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("rejects an unknown order number (uniform 404)", async () => {
    await expect(
      trackOrder({ orderNumber: "LB-DOES-NOT-EXIST", email: "buyer@example.com", whatsapp: "+201234567890" }),
    ).rejects.toMatchObject({ status: 404 });
  });
});
