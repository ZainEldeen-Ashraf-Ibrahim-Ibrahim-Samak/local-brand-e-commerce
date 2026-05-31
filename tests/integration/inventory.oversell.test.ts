// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { Variation } from "@/models/Variation";
import { Product } from "@/models/Product";
import { Category } from "@/models/Category";
import { User } from "@/models/User";
import { reserveStock } from "@/services/inventory.service";

/**
 * T034 / SC-010: concurrent purchase of the last units must never oversell.
 * Runs against an ephemeral MongoDB (mongodb-memory-server).
 */
let mongod: MongoMemoryServer;
let variationId: string;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

async function seedVariationWithStock(stock: number) {
  const owner = await User.create({ email: `o${Date.now()}@x.com`, passwordHash: "x", role: "admin", name: "O" });
  const cat = await Category.create({ slug: `c-${Date.now()}`, name: { en: "C", ar: "C" } });
  const product = await Product.create({
    slug: `p-${Date.now()}`,
    name: { en: "P", ar: "P" },
    description: { en: "d", ar: "d" },
    category: cat._id,
    basePrice: 1000,
    images: [{ cloudinaryId: "x", version: "1" }],
    status: "published",
    ownerUserId: owner._id,
  });
  const v = await Variation.create({ product: product._id, sku: `s-${Date.now()}`, stock, options: { size: "M" } });
  return String(v._id);
}

describe("inventory oversell prevention (T034)", () => {
  it("allows exactly one of two concurrent buyers to claim the last unit", async () => {
    variationId = await seedVariationWithStock(1);

    const results = await Promise.allSettled([
      reserveStock([{ variationId, quantity: 1 }]),
      reserveStock([{ variationId, quantity: 1 }]),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled").length;
    const rejected = results.filter((r) => r.status === "rejected").length;
    expect(fulfilled).toBe(1);
    expect(rejected).toBe(1);

    const after = await Variation.findById(variationId).lean();
    expect(after?.stock).toBe(0);
    expect(after?.stock).toBeGreaterThanOrEqual(0);
  });

  it("never drives stock negative under many concurrent reservations", async () => {
    const id = await seedVariationWithStock(5);
    const attempts = Array.from({ length: 20 }, () => reserveStock([{ variationId: id, quantity: 1 }]));
    const results = await Promise.allSettled(attempts);

    const fulfilled = results.filter((r) => r.status === "fulfilled").length;
    expect(fulfilled).toBe(5);

    const after = await Variation.findById(id).lean();
    expect(after?.stock).toBe(0);
  });
});
