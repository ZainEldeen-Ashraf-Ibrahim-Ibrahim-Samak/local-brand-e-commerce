// @vitest-environment node
/**
 * T003: Integration tests for seller catalog visibility security invariants.
 *
 * Verifies (FR-029 / SC-303 / Constitution Principle IV):
 *   1. `listAllPublishedProducts` returns ONLY published products from ANY owner.
 *   2. drafts/unpublished from other owners are excluded.
 *   3. The `mine` flag is correct — true only for the viewer's own products.
 *   4. A cross-owner product PATCH still returns 403 (guard preserved).
 *   5. `listOwnOrders` is scoped to the caller's owned products (unchanged).
 */

import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

// --- mock cache so service calls don't touch Redis --------------------------
vi.mock("@/lib/cache", () => ({
  cacheInvalidate: vi.fn(async () => {}),
  CacheKeys: {
    products: "cache:products",
    categories: "cache:categories",
    home: "cache:home",
  },
}));

import { listAllPublishedProducts, listOwnOrders, updateOwnProduct } from "@/services/buyer.service";
import { Product } from "@/models/Product";
import { Order } from "@/models/Order";
import { AppError } from "@/lib/http/errors";

let mongod: MongoMemoryServer;

const sellerA = new mongoose.Types.ObjectId().toString();
const sellerB = new mongoose.Types.ObjectId().toString();
const mockCategoryId = new mongoose.Types.ObjectId().toString();

async function makeProduct(
  owner: string,
  status: "draft" | "published" | "unpublished",
  nameSuffix: string,
) {
  return Product.create({
    name: { en: `Product ${nameSuffix}`, ar: `منتج ${nameSuffix}` },
    slug: `product-${nameSuffix}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    category: new mongoose.Types.ObjectId(mockCategoryId),
    basePrice: 1000,
    status,
    ownerUserId: new mongoose.Types.ObjectId(owner),
  });
}

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

describe("seller catalog visibility (T003)", () => {
  describe("listAllPublishedProducts", () => {
    it("returns only published products from any owner — excludes drafts and unpublished (SC-303)", async () => {
      await makeProduct(sellerA, "published", "a-pub");
      await makeProduct(sellerA, "draft", "a-draft");
      await makeProduct(sellerB, "published", "b-pub");
      await makeProduct(sellerB, "unpublished", "b-unpub");

      const results = await listAllPublishedProducts(sellerA);
      // All results must be published
      expect(results.every((p) => p.status === "published")).toBe(true);
      // Both sellers' published products are included
      const names = results.map((p) => (p.name as { en: string }).en);
      expect(names.some((n) => n.includes("a-pub"))).toBe(true);
      expect(names.some((n) => n.includes("b-pub"))).toBe(true);
      // Drafts and unpublished are absent
      expect(names.some((n) => n.includes("draft"))).toBe(false);
      expect(names.some((n) => n.includes("unpub"))).toBe(false);
    });

    it("sets mine=true only for the viewer's own products (FR-029)", async () => {
      const results = await listAllPublishedProducts(sellerA);
      for (const p of results) {
        const nameEn = (p.name as { en: string }).en;
        if (nameEn.includes("a-pub")) {
          expect(p.mine).toBe(true);
        }
        if (nameEn.includes("b-pub")) {
          expect(p.mine).toBe(false);
        }
      }
    });

    it("mine flag flips when called as sellerB", async () => {
      const results = await listAllPublishedProducts(sellerB);
      for (const p of results) {
        const nameEn = (p.name as { en: string }).en;
        if (nameEn.includes("b-pub")) {
          expect(p.mine).toBe(true);
        }
        if (nameEn.includes("a-pub")) {
          expect(p.mine).toBe(false);
        }
      }
    });

    it("returns public fields only — no ownerUserId or customer data exposed (SC-303)", async () => {
      const results = await listAllPublishedProducts(sellerA);
      for (const p of results) {
        expect(Object.keys(p)).toEqual(
          expect.arrayContaining(["id", "slug", "name", "status", "basePrice", "mine"]),
        );
        // No cross-seller-sensitive fields
        expect(p).not.toHaveProperty("ownerUserId");
        expect(p).not.toHaveProperty("customer");
        expect(p).not.toHaveProperty("orders");
      }
    });
  });

  describe("cross-owner write guard (FR-029 / Constitution Principle IV)", () => {
    it("updateOwnProduct throws 403 when sellerA tries to edit sellerB's product", async () => {
      const bProduct = await makeProduct(sellerB, "published", "b-for-patch-test");
      const bId = String(bProduct._id);

      await expect(
        updateOwnProduct(bId, { basePrice: 9999 }, sellerA),
      ).rejects.toBeInstanceOf(AppError);

      // Confirm the 403 code
      try {
        await updateOwnProduct(bId, { basePrice: 9999 }, sellerA);
      } catch (err) {
      expect((err as AppError).status).toBe(403);
      }
    });

    it("updateOwnProduct succeeds when the owner edits their own product", async () => {
      const aProduct = await makeProduct(sellerA, "draft", "a-for-patch-own");
      const aId = String(aProduct._id);
      const updated = await updateOwnProduct(aId, { basePrice: 2500 }, sellerA);
      expect(updated.basePrice).toBe(2500);
    });
  });

  describe("listOwnOrders scope (FR-029)", () => {
    it("returns only orders containing the seller's own products — not cross-seller orders", async () => {
      const aProduct = await makeProduct(sellerA, "published", "a-order-scope");
      const bProduct = await makeProduct(sellerB, "published", "b-order-scope");

    const shippingAddress = { line1: "1 Test St", city: "Cairo", country: "EG" };
    const shippingOption = { id: "std", label: { en: "Standard", ar: "عادي" }, cost: 0 };
    const mockVariationId = new mongoose.Types.ObjectId();

    // Order with sellerA's product
    await Order.create({
      orderNumber: `ORD-A-${Date.now()}`,
      customer: { name: "Alice", email: "alice@test.com", whatsapp: "111" },
      items: [{
        product: aProduct._id,
        variation: mockVariationId,
        sku: "SKU-A",
        name: { en: "P", ar: "م" },
        unitPrice: 100,
        quantity: 1,
        lineTotal: 100,
      }],
      shippingAddress,
      shippingOption,
      status: "pending",
      subtotal: 100,
      tax: 0,
      shippingFee: 0,
      grandTotal: 100,
    });

    // Order with sellerB's product only
    await Order.create({
      orderNumber: `ORD-B-${Date.now()}`,
      customer: { name: "Bob", email: "bob@test.com", whatsapp: "222" },
      items: [{
        product: bProduct._id,
        variation: mockVariationId,
        sku: "SKU-B",
        name: { en: "P2", ar: "م2" },
        unitPrice: 200,
        quantity: 1,
        lineTotal: 200,
      }],
      shippingAddress,
      shippingOption,
      status: "pending",
      subtotal: 200,
      tax: 0,
      shippingFee: 0,
      grandTotal: 200,
    });

      const aOrders = await listOwnOrders(sellerA);
      const aOrderNums = aOrders.map((o) => o.orderNumber);

      // SellerA sees orders with their product
      expect(aOrderNums.some((n) => n.startsWith("ORD-A"))).toBe(true);
      // SellerA must NOT see sellerB's orders
      expect(aOrderNums.some((n) => n.startsWith("ORD-B"))).toBe(false);
    });

    it("returns empty array when the seller has no products", async () => {
      const noProductSeller = new mongoose.Types.ObjectId().toString();
      const orders = await listOwnOrders(noProductSeller);
      expect(orders).toHaveLength(0);
    });
  });
});
