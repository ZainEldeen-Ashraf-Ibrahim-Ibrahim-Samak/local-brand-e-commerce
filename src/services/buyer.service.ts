import { connectDB } from "@/lib/db/connect";
import { Product, type ProductDoc } from "@/models/Product";
import { Order, type OrderDoc } from "@/models/Order";
import { cacheInvalidate, CacheKeys } from "@/lib/cache";
import { Errors } from "@/lib/http/errors";
import { slugify } from "@/lib/shared/slug";
import type { LocalizedText, MediaRef } from "@/lib/shared/types";

/**
 * Buyer (internal seller) service (spec FR-029). Every read/write is scoped to the
 * caller's `ownerUserId` — a buyer can only see and mutate products they own, and
 * only orders that contain those products. Cross-owner access throws 403.
 */
export type BuyerProductInput = {
  name: LocalizedText;
  slug?: string;
  description?: LocalizedText;
  category: string;
  basePrice: number;
  images?: MediaRef[];
  status?: "draft" | "published" | "unpublished";
};

async function invalidateCatalogCache(): Promise<void> {
  await Promise.all([
    cacheInvalidate("cache:product:*"),
    cacheInvalidate(CacheKeys.products),
    cacheInvalidate(CacheKeys.home),
  ]);
}

async function uniqueSlug(base: string): Promise<string> {
  const root = slugify(base);
  let candidate = root;
  let n = 1;
  while (await Product.exists({ slug: candidate })) candidate = `${root}-${n++}`;
  return candidate;
}

/** Load a product the buyer owns or throw (404 if missing, 403 if owned by another). */
async function ownedProduct(id: string, ownerUserId: string) {
  const product = await Product.findById(id);
  if (!product) throw Errors.notFound("Product");
  if (String(product.ownerUserId) !== ownerUserId) throw Errors.forbidden();
  return product;
}

export async function listOwnProducts(ownerUserId: string): Promise<
  Array<{ id: string; slug: string; name: LocalizedText; status: string; basePrice: number }>
> {
  await connectDB();
  const docs = await Product.find({ ownerUserId }).sort({ createdAt: -1 }).lean();
  return docs.map((d: ProductDoc & { _id: unknown }) => ({
    id: String(d._id),
    slug: d.slug,
    name: d.name as LocalizedText,
    status: d.status,
    basePrice: d.basePrice,
  }));
}

/**
 * Read-only catalog view for a seller: every published product from any owner,
 * with a `mine` flag so the UI can mark the seller's own. Editing remains
 * own-only (FR-029 / Constitution Principle IV) — this grants visibility, not
 * control, and exposes only public catalog data (no cross-seller orders).
 */
export async function listAllPublishedProducts(viewerUserId: string): Promise<
  Array<{ id: string; slug: string; name: LocalizedText; status: string; basePrice: number; mine: boolean }>
> {
  await connectDB();
  const docs = await Product.find({ status: "published" }).sort({ createdAt: -1 }).lean();
  return docs.map((d: ProductDoc & { _id: unknown; ownerUserId: unknown }) => ({
    id: String(d._id),
    slug: d.slug,
    name: d.name as LocalizedText,
    status: d.status,
    basePrice: d.basePrice,
    mine: String(d.ownerUserId) === viewerUserId,
  }));
}

export async function createOwnProduct(input: BuyerProductInput, ownerUserId: string): Promise<ProductDoc> {
  await connectDB();
  const slug = await uniqueSlug(input.slug || input.name.en || input.name.ar);
  const product = await Product.create({
    name: input.name,
    slug,
    description: input.description ?? { en: "", ar: "" },
    category: input.category,
    basePrice: input.basePrice,
    images: input.images ?? [],
    status: input.status ?? "draft",
    ownerUserId,
  });
  await invalidateCatalogCache();
  return product.toObject();
}

export async function updateOwnProduct(
  id: string,
  patch: Partial<BuyerProductInput>,
  ownerUserId: string,
): Promise<ProductDoc> {
  await connectDB();
  const product = await ownedProduct(id, ownerUserId);
  if (patch.name) product.name = patch.name as never;
  if (patch.description) product.description = patch.description as never;
  if (patch.category) product.category = patch.category as never;
  if (patch.basePrice != null) product.basePrice = patch.basePrice;
  if (patch.images) product.images = patch.images as never;
  if (patch.status) product.status = patch.status;
  if (patch.slug) product.slug = await uniqueSlug(patch.slug);
  await product.save();
  await invalidateCatalogCache();
  return product.toObject();
}

/** Orders that contain at least one product owned by this buyer (FR-029). */
export async function listOwnOrders(ownerUserId: string): Promise<
  Array<{ id: string; orderNumber: string; status: string; grandTotal: number; createdAt: Date }>
> {
  await connectDB();
  const ownedIds = await Product.find({ ownerUserId }).distinct("_id");
  if (ownedIds.length === 0) return [];
  const orders = await Order.find({ "items.product": { $in: ownedIds } })
    .sort({ createdAt: -1 })
    .lean();
  return (orders as Array<OrderDoc & { _id: unknown }>).map((o) => ({
    id: String(o._id),
    orderNumber: o.orderNumber,
    status: o.status,
    grandTotal: o.grandTotal,
    createdAt: o.createdAt as Date,
  }));
}
