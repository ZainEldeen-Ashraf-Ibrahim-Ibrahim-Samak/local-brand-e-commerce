// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { Order } from "@/models/Order";
import { getCustomerList, getCustomerDetail } from "@/services/admin/customers.admin.service";

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
  await Order.deleteMany({});
});

describe("customers aggregation logic (T026 / SC-105)", () => {
  it("groups orders by email and computes correct orderCount and totalSpend", async () => {
    // Seed 3 orders for customer A
    await Order.create({
      orderNumber: "LB-CUST-A1",
      items: [],
      customer: { email: "custA@test.com", whatsapp: "+201000000001", name: "Customer A" },
      shippingAddress: { line1: "1 St", city: "Cairo", country: "EG" },
      subtotal: 5000,
      shippingOption: { id: "std", label: { en: "Std", ar: "عادي" }, cost: 0 },
      grandTotal: 5000,
      status: "delivered",
    });

    await Order.create({
      orderNumber: "LB-CUST-A2",
      items: [],
      customer: { email: "custA@test.com", whatsapp: "+201000000001", name: "Customer A" },
      shippingAddress: { line1: "1 St", city: "Cairo", country: "EG" },
      subtotal: 3000,
      shippingOption: { id: "std", label: { en: "Std", ar: "عادي" }, cost: 0 },
      grandTotal: 3000,
      status: "processing",
    });

    // Seed 1 order for customer B
    await Order.create({
      orderNumber: "LB-CUST-B1",
      items: [],
      customer: { email: "custB@test.com", whatsapp: "+201000000002", name: "Customer B" },
      shippingAddress: { line1: "2 St", city: "Cairo", country: "EG" },
      subtotal: 12000,
      shippingOption: { id: "std", label: { en: "Std", ar: "عادي" }, cost: 0 },
      grandTotal: 12000,
      status: "delivered",
    });

    // Run list aggregation
    const listResult = await getCustomerList();
    expect(listResult).toBeDefined();
    expect(listResult.length).toBe(2);

    const recordA = listResult.find((c) => c.email === "custa@test.com"); // aggregated key lowercases
    const recordB = listResult.find((c) => c.email === "custb@test.com");

    expect(recordA).toBeDefined();
    expect(recordA?.orderCount).toBe(2);
    expect(recordA?.totalSpend).toBe(8000); // 5000 + 3000

    expect(recordB).toBeDefined();
    expect(recordB?.orderCount).toBe(1);
    expect(recordB?.totalSpend).toBe(12000);

    // Detail query
    const detailA = await getCustomerDetail("custa@test.com");
    expect(detailA).toBeDefined();
    expect(detailA.customer.email).toBe("custa@test.com");
    expect(detailA.orders.length).toBe(2);
    expect(detailA.orders.map((o) => o.orderNumber)).toContain("LB-CUST-A1");
    expect(detailA.orders.map((o) => o.orderNumber)).toContain("LB-CUST-A2");
  });
});
