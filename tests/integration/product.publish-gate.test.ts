// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

// Mock Cache/Redis
vi.mock("@/lib/cache", () => ({
  cacheInvalidate: vi.fn(async () => {}),
  CacheKeys: {
    products: "cache:products",
    categories: "cache:categories",
    home: "cache:home",
  },
}));

import { createProduct, updateProduct } from "@/services/admin/catalog.admin.service";
import { Product } from "@/models/Product";
import { AppError } from "@/lib/http/errors";

let mongod: MongoMemoryServer;
const mockOwnerId = new mongoose.Types.ObjectId().toString();
const mockCategoryId = new mongoose.Types.ObjectId().toString();

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

describe("product publish gate integration (T007)", () => {
  it("allows creating a product in draft status with no images", async () => {
    const product = await createProduct(
      {
        name: { en: "Draft Product", ar: "منتج مسودة" },
        category: mockCategoryId,
        basePrice: 1000,
        status: "draft",
        images: [],
      },
      mockOwnerId
    );

    expect(product.status).toBe("draft");
    expect(product.images).toHaveLength(0);
  });

  it("fails to create a published product with no images", async () => {
    await expect(
      createProduct(
        {
          name: { en: "Published Product No Images", ar: "منتج منشور بدون صور" },
          category: mockCategoryId,
          basePrice: 1000,
          status: "published",
          images: [],
        },
        mockOwnerId
      )
    ).rejects.toThrowError(/Publish requires at least one image/);
  });

  it("allows creating a published product with at least one image", async () => {
    const product = await createProduct(
      {
        name: { en: "Published Product With Images", ar: "منتج منشور بصور" },
        category: mockCategoryId,
        basePrice: 1500,
        status: "published",
        images: [{ cloudinaryId: "prod1", version: "1.0", alt: { en: "Test", ar: "تجربة" } }],
      },
      mockOwnerId
    );

    expect(product.status).toBe("published");
    expect(product.images).toHaveLength(1);
  });

  it("fails to update a draft to published status if it has no images", async () => {
    const draft = await createProduct(
      {
        name: { en: "Draft to Publish", ar: "مسودة للنشر" },
        category: mockCategoryId,
        basePrice: 1200,
        status: "draft",
        images: [],
      },
      mockOwnerId
    ) as unknown as { _id: mongoose.Types.ObjectId; status: string; images: unknown[] };

    await expect(
      updateProduct(String(draft._id), { status: "published" })
    ).rejects.toThrowError(/Publish requires at least one image/);
  });

  it("allows updating a draft to published status if it has images", async () => {
    const draft = await createProduct(
      {
        name: { en: "Draft to Publish With Image", ar: "مسودة للنشر بصورة" },
        category: mockCategoryId,
        basePrice: 1200,
        status: "draft",
        images: [{ cloudinaryId: "prod2", version: "1.0", alt: { en: "Test", ar: "تجربة" } }],
      },
      mockOwnerId
    ) as unknown as { _id: mongoose.Types.ObjectId; status: string; images: unknown[] };

    const updated = await updateProduct(String(draft._id), { status: "published" });
    expect(updated.status).toBe("published");
  });
});
