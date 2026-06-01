import { connectDB } from "@/lib/db/connect";
import { Product, type ProductDoc } from "@/models/Product";
import { Variation, type VariationDoc } from "@/models/Variation";
import { Category, type CategoryDoc } from "@/models/Category";
import { cacheInvalidate, CacheKeys } from "@/lib/cache";
import { Errors, AppError } from "@/lib/http/errors";
import { logger } from "@/lib/observability/logger";
import { slugify } from "@/lib/shared/slug";
import type { LocalizedText, MediaRef } from "@/lib/shared/types";
import { validateUploadMeta, destroyAsset } from "@/lib/media/cloudinary";
import type { FilterQuery } from "mongoose";

/**
 * Admin catalog management service (spec FR-018/FR-019). Owns all writes to
 * products / variations / categories, then invalidates the storefront read caches
 * (Constitution Principle VI / research R8) so changes appear quickly.
 */
export type ProductStatus = "draft" | "published" | "unpublished";

export type ProductAttributeInput = { key: string; label: LocalizedText; values: string[] };

export type ProductInput = {
  name: LocalizedText;
  slug?: string;
  description?: LocalizedText;
  category: string;
  basePrice: number;
  images?: MediaRef[];
  attributes?: ProductAttributeInput[];
  status?: ProductStatus;
  seo?: { title?: LocalizedText; keywords?: string[] };
};

export type VariationInput = {
  sku: string;
  options?: Record<string, string>;
  priceOverride?: number;
  stock?: number;
  image?: MediaRef;
  isActive?: boolean;
};

export type CategoryInput = {
  name: LocalizedText;
  slug?: string;
  parent?: string | null;
  /** null means "remove the existing image" */
  image?: MediaRef | null;
  isActive?: boolean;
  sortOrder?: number;
};

/** Invalidate every storefront read cache touched by a catalog write. */
async function invalidateCatalogCache(): Promise<void> {
  await Promise.all([
    cacheInvalidate("cache:product:*"),
    cacheInvalidate(CacheKeys.products),
    cacheInvalidate(CacheKeys.categories),
    cacheInvalidate(CacheKeys.home),
  ]);
}

async function uniqueProductSlug(base: string): Promise<string> {
  const root = slugify(base);
  let candidate = root;
  let n = 1;
  while (await Product.exists({ slug: candidate })) candidate = `${root}-${n++}`;
  return candidate;
}

async function uniqueCategorySlug(base: string): Promise<string> {
  const root = slugify(base);
  let candidate = root;
  let n = 1;
  while (await Category.exists({ slug: candidate })) candidate = `${root}-${n++}`;
  return candidate;
}

// ---- Products -------------------------------------------------------------

export async function createProduct(input: ProductInput, ownerUserId: string): Promise<ProductDoc> {
  await connectDB();
  const status = input.status || "draft";
  const images = input.images || [];

  if (status === "published" && images.length === 0) {
    throw new AppError("image_required", "Publish requires at least one image", 422);
  }

  if (images.length > 8) {
    throw new AppError("VALIDATION", "You can upload up to 8 images", 422);
  }

  for (const img of images) {
    const rawImg = img as MediaRef & { format?: string; bytes?: number };
    if (rawImg.format || rawImg.bytes !== undefined) {
      if (!validateUploadMeta({ format: rawImg.format, bytes: rawImg.bytes })) {
        throw new AppError("VALIDATION", "Invalid image format or size", 422);
      }
    }
  }

  const slug = await uniqueProductSlug(input.slug || input.name.en || input.name.ar);
  const product = await Product.create({
    name: input.name,
    slug,
    description: input.description ?? { en: "", ar: "" },
    category: input.category,
    basePrice: input.basePrice,
    images: images,
    attributes: input.attributes ?? [],
    status: status,
    ownerUserId,
    seo: input.seo ?? {},
  });
  await invalidateCatalogCache();
  return product.toObject();
}

export async function updateProduct(
  id: string,
  patch: Partial<ProductInput>,
): Promise<ProductDoc> {
  await connectDB();
  const product = await Product.findById(id);
  if (!product) throw Errors.notFound("Product");

  const images = patch.images !== undefined ? patch.images : product.images;
  const status = patch.status !== undefined ? patch.status : product.status;

  if (status === "published" && images.length === 0) {
    throw new AppError("image_required", "Publish requires at least one image", 422);
  }

  if (images.length > 8) {
    throw new AppError("VALIDATION", "You can upload up to 8 images", 422);
  }

  if (patch.images) {
    for (const img of patch.images) {
      const rawImg = img as MediaRef & { format?: string; bytes?: number };
      if (rawImg.format || rawImg.bytes !== undefined) {
        if (!validateUploadMeta({ format: rawImg.format, bytes: rawImg.bytes })) {
          throw new AppError("VALIDATION", "Invalid image format or size", 422);
        }
      }
    }
  }

  if (patch.images) {
    const oldIds = product.images.map((img: { cloudinaryId: string }) => img.cloudinaryId);
    const newIds = patch.images.map((img: { cloudinaryId: string }) => img.cloudinaryId);
    const removedIds = oldIds.filter((oid) => !newIds.includes(oid));
    for (const rId of removedIds) {
      destroyAsset(rId).then((success) => {
        if (!success) {
          logger.error(`[Cloudinary Retry] Failed to delete asset: ${rId}`);
        }
      });
    }
  }

  if (patch.name) product.name = patch.name as never;
  if (patch.description) product.description = patch.description as never;
  if (patch.category) product.category = patch.category as never;
  if (patch.basePrice != null) product.basePrice = patch.basePrice;
  if (patch.images) product.images = patch.images as never;
  if (patch.attributes) product.attributes = patch.attributes as never;
  if (patch.seo) product.seo = patch.seo as never;
  if (patch.status) product.status = patch.status;
  if (patch.slug) product.slug = await uniqueProductSlug(patch.slug);
  await product.save();
  await invalidateCatalogCache();
  return product.toObject();
}

export async function deleteProduct(id: string): Promise<void> {
  await connectDB();
  const product = await Product.findById(id);
  if (!product) throw Errors.notFound("Product");

  for (const img of product.images) {
    destroyAsset(img.cloudinaryId).then((success) => {
      if (!success) {
        logger.error(`[Cloudinary Retry] Failed to delete asset: ${img.cloudinaryId}`);
      }
    });
  }

  await Product.findByIdAndDelete(id);
  await Variation.deleteMany({ product: id });
  await invalidateCatalogCache();
}

export type AdminProductQuery = {
  status?: ProductStatus;
  q?: string;
  category?: string;
  page?: number;
  pageSize?: number;
};

export async function listAdminProducts(query: AdminProductQuery): Promise<{
  items: Array<{
    id: string;
    slug: string;
    name: LocalizedText;
    status: string;
    basePrice: number;
    category: string;
    variationCount: number;
    firstImage: { cloudinaryId: string; version: string } | null;
  }>;
  page: number;
  pageSize: number;
  total: number;
}> {
  await connectDB();
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
  const filter: FilterQuery<ProductDoc> = {};
  if (query.status) filter.status = query.status;
  if (query.category) filter.category = query.category;
  if (query.q) filter.$text = { $search: query.q };

  const [docs, total] = await Promise.all([
    Product.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    Product.countDocuments(filter),
  ]);

  const ids = docs.map((d) => d._id);
  const counts = await Variation.aggregate<{ _id: unknown; count: number }>([
    { $match: { product: { $in: ids } } },
    { $group: { _id: "$product", count: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((c) => [String(c._id), c.count]));

  return {
    items: docs.map((d) => {
      const rawImg = d.images?.[0] as { cloudinaryId?: string | null; version?: string | null } | undefined;
      return {
        id: String(d._id),
        slug: d.slug,
        name: d.name as LocalizedText,
        status: d.status,
        basePrice: d.basePrice,
        category: String(d.category),
        variationCount: countMap.get(String(d._id)) ?? 0,
        firstImage:
          rawImg?.cloudinaryId && rawImg?.version
            ? { cloudinaryId: rawImg.cloudinaryId, version: rawImg.version }
            : null,
      };
    }),
    page,
    pageSize,
    total,
  };
}

export async function getAdminProduct(id: string): Promise<{
  product: ProductDoc & { _id: unknown };
  variations: Array<VariationDoc & { _id: unknown }>;
} | null> {
  await connectDB();
  const product = await Product.findById(id).lean();
  if (!product) return null;
  const variations = await Variation.find({ product: id }).sort({ createdAt: 1 }).lean();
  return {
    product: product as ProductDoc & { _id: unknown },
    variations: variations as Array<VariationDoc & { _id: unknown }>,
  };
}

// ---- Variations -----------------------------------------------------------

export async function addVariation(productId: string, input: VariationInput): Promise<VariationDoc> {
  await connectDB();
  const product = await Product.findById(productId);
  if (!product) throw Errors.notFound("Product");

  // T029: validate optional variation image (FR-202a / SC-207)
  if (input.image) {
    const raw = input.image as MediaRef & { format?: string; bytes?: number };
    if (raw.format || raw.bytes !== undefined) {
      if (!validateUploadMeta({ format: raw.format, bytes: raw.bytes })) {
        throw new AppError("VALIDATION", "Invalid variation image format or size", 422);
      }
    }
  }

  const variation = await Variation.create({
    product: productId,
    sku: input.sku,
    options: input.options ?? {},
    priceOverride: input.priceOverride,
    stock: input.stock ?? 0,
    image: input.image,
    isActive: input.isActive ?? true,
  });
  await invalidateCatalogCache();
  return variation.toObject();
}

export async function updateVariation(
  id: string,
  patch: Partial<VariationInput>,
): Promise<VariationDoc> {
  await connectDB();
  const variation = await Variation.findById(id);
  if (!variation) throw Errors.notFound("Variation");

  // T029: validate new image and destroy the prior asset on replace/clear (FR-202a/FR-208)
  if (patch.image !== undefined) {
    const newImg = patch.image;
    // Validate incoming image if format/bytes are provided
    if (newImg) {
      const raw = newImg as MediaRef & { format?: string; bytes?: number };
      if (raw.format || raw.bytes !== undefined) {
        if (!validateUploadMeta({ format: raw.format, bytes: raw.bytes })) {
          throw new AppError("VALIDATION", "Invalid variation image format or size", 422);
        }
      }
    }
    // Destroy the prior asset if it differs from the incoming one (or is being cleared)
    const oldId = (variation.image as (MediaRef & { cloudinaryId?: string }) | undefined)?.cloudinaryId;
    const newId = newImg?.cloudinaryId;
    if (oldId && oldId !== newId) {
      destroyAsset(oldId).then((success) => {
        if (!success) logger.error(`[Cloudinary Retry] Failed to delete variation asset: ${oldId}`);
      });
    }
  }

  if (patch.sku) variation.sku = patch.sku;
  if (patch.options) variation.options = patch.options as never;
  if (patch.priceOverride != null) variation.priceOverride = patch.priceOverride;
  if (patch.stock != null) variation.stock = patch.stock;
  if (patch.image !== undefined) variation.image = (patch.image ?? null) as never;
  if (patch.isActive != null) variation.isActive = patch.isActive;
  await variation.save();
  await invalidateCatalogCache();
  return variation.toObject();
}

/** Adjust stock by delta or set an absolute value; the change is logged (FR-019). */
export async function adjustStock(
  id: string,
  change: { delta?: number; set?: number; reason?: string },
  byUserId: string,
): Promise<VariationDoc> {
  await connectDB();
  const variation = await Variation.findById(id);
  if (!variation) throw Errors.notFound("Variation");
  const before = variation.stock;
  const next = change.set != null ? change.set : before + (change.delta ?? 0);
  if (next < 0) throw Errors.validation({ message: "Stock cannot be negative" });
  variation.stock = next;
  await variation.save();
  await invalidateCatalogCache();
  logger.info("Stock adjusted", {
    variationId: id,
    sku: variation.sku,
    before,
    after: next,
    byUserId,
    reason: change.reason,
  });
  return variation.toObject();
}

// ---- Categories -----------------------------------------------------------

export async function listAdminCategories(): Promise<
  Array<{ id: string; slug: string; name: LocalizedText; parent: string | null; isActive: boolean; sortOrder: number; image?: { cloudinaryId: string; version: string; alt?: { en: string; ar: string } } | null }>
> {
  await connectDB();
  const cats = await Category.find().sort({ sortOrder: 1 }).lean();
  return cats.map((c: CategoryDoc & { _id: unknown }) => {
    const img = c.image;
    return {
      id: String(c._id),
      slug: c.slug,
      name: c.name as LocalizedText,
      parent: c.parent ? String(c.parent) : null,
      isActive: c.isActive,
      sortOrder: c.sortOrder,
      image:
        img?.cloudinaryId && img?.version
          ? {
              cloudinaryId: img.cloudinaryId,
              version: img.version,
              alt: img.alt
                ? { en: img.alt.en ?? "", ar: img.alt.ar ?? "" }
                : undefined,
            }
          : null,
    };
  });
}

export async function createCategory(input: CategoryInput): Promise<CategoryDoc> {
  await connectDB();
  const slug = await uniqueCategorySlug(input.slug || input.name.en || input.name.ar);
  const category = await Category.create({
    name: input.name,
    slug,
    parent: input.parent ?? null,
    image: input.image,
    isActive: input.isActive ?? true,
    sortOrder: input.sortOrder ?? 0,
  });
  await invalidateCatalogCache();
  return category.toObject();
}

export async function updateCategory(id: string, patch: Partial<CategoryInput>): Promise<CategoryDoc> {
  await connectDB();
  const category = await Category.findById(id);
  if (!category) throw Errors.notFound("Category");

  if (patch.image !== undefined) {
    const oldId = category.image?.cloudinaryId;
    const newId = patch.image?.cloudinaryId;
    if (oldId && oldId !== newId) {
      destroyAsset(oldId).then((success) => {
        if (!success) {
          logger.error(`[Cloudinary Retry] Failed to delete asset: ${oldId}`);
        }
      });
    }
  }

  if (patch.name) category.name = patch.name as never;
  if (patch.parent !== undefined) category.parent = (patch.parent ?? null) as never;
  if (patch.image !== undefined) category.image = patch.image as never;
  if (patch.isActive != null) category.isActive = patch.isActive;
  if (patch.sortOrder != null) category.sortOrder = patch.sortOrder;
  if (patch.slug) category.slug = await uniqueCategorySlug(patch.slug);
  await category.save();
  await invalidateCatalogCache();
  return category.toObject();
}

export async function deleteCategory(id: string): Promise<void> {
  await connectDB();
  const inUse = await Product.exists({ category: id });
  if (inUse) throw Errors.validation({ message: "Category is in use by one or more products" });
  
  const category = await Category.findById(id);
  if (!category) throw Errors.notFound("Category");

  if (category.image?.cloudinaryId) {
    destroyAsset(category.image.cloudinaryId).then((success) => {
      if (!success) {
        logger.error(`[Cloudinary Retry] Failed to delete asset: ${category.image!.cloudinaryId}`);
      }
    });
  }

  await Category.findByIdAndDelete(id);
  await invalidateCatalogCache();
}
