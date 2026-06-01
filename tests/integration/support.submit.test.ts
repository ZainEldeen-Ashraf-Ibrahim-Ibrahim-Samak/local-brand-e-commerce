// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

// Mock rateLimit helper from cache
const rateLimitMock = vi.fn().mockResolvedValue(true);
vi.mock("@/lib/cache", () => ({
  rateLimit: (...args: any[]) => rateLimitMock(...args),
}));

// Mock the email notification dispatcher so it doesn't fail
vi.mock("@/lib/notifications/email", () => ({
  sendAdminEmail: vi.fn().mockResolvedValue(undefined),
}));

import { User } from "@/models/User";
import { Order } from "@/models/Order";
import { SupportInquiry } from "@/models/SupportInquiry";
import { submitInquiry } from "@/services/support.service";

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
  await SupportInquiry.deleteMany({});
  await Order.deleteMany({});
  rateLimitMock.mockReset().mockResolvedValue(true);
});

describe("support inquiry submission integration (T017)", () => {
  it("successfully submits inquiry and stores it in database", async () => {
    const result = await submitInquiry({
      name: "John Doe",
      email: "john@example.com",
      whatsapp: "+201234567890",
      subject: "Shipping Delay",
      message: "My order hasn't arrived yet.",
      ip: "127.0.0.1",
    });

    expect(result).toEqual({ success: true });

    // Check database
    const inquiry = await SupportInquiry.findOne({ email: "john@example.com" });
    expect(inquiry).toBeDefined();
    expect(inquiry?.name).toBe("John Doe");
    expect(inquiry?.subject).toBe("Shipping Delay");
    expect(inquiry?.message).toBe("My order hasn't arrived yet.");
    expect(inquiry?.status).toBe("new");
  });

  it("yields identical success response regardless of order number existence (non-enumeration)", async () => {
    // Seed an order
    const existingOrder = await Order.create({
      orderNumber: "LB-EXISTING-123",
      items: [],
      customer: { email: "john@example.com", whatsapp: "+201234567890", name: "John" },
      shippingAddress: { line1: "1 St", city: "Cairo", country: "EG" },
      subtotal: 100,
      taxTotal: 0,
      shippingOption: { id: "std", label: { en: "Std", ar: "عادي" }, cost: 0 },
      grandTotal: 100,
      status: "pending",
    });

    // Inquiry with existing order
    const resultExisting = await submitInquiry({
      name: "John Doe",
      email: "john@example.com",
      orderNumber: "LB-EXISTING-123",
      message: "Order issue.",
      ip: "127.0.0.1",
    });
    expect(resultExisting).toEqual({ success: true });

    // Inquiry with non-existent order
    const resultNonExistent = await submitInquiry({
      name: "John Doe",
      email: "john@example.com",
      orderNumber: "LB-NON-EXISTENT-999",
      message: "Order issue.",
      ip: "127.0.0.1",
    });
    expect(resultNonExistent).toEqual({ success: true });

    // Verify both are stored in DB
    const count = await SupportInquiry.countDocuments({ email: "john@example.com" });
    expect(count).toBe(2);
  });

  it("throws rate limit error when limit is exceeded", async () => {
    // Mock rateLimit to fail
    rateLimitMock.mockResolvedValue(false);

    await expect(
      submitInquiry({
        name: "John Doe",
        email: "john@example.com",
        message: "Spam message",
        ip: "127.0.0.1",
      })
    ).rejects.toThrow("Rate limit exceeded");
  });
});
