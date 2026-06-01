import { connectDB } from "@/lib/db/connect";
import { Product, type ProductDoc } from "@/models/Product";
import { Variation, type VariationDoc } from "@/models/Variation";
import { Category, type CategoryDoc } from "@/models/Category";
import { cacheAside, CacheKeys } from "@/lib/cache";
import type { FilterQuery } from "mongoose";

/**
 * Catalog read service (spec FR-001/FR-002/FR-003). Only `published` products are
 * exposed. Listings are cached (Principle VI); attribute filters resolve through
 * the variation collection.
 */
export type CatalogQuery = {
  categorySlug?: string;
  q?: string;
  size?: string;
  color?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: "newest" | "price-asc" | "price-desc";
  page?: number;
  pageSize?: number;
};

export type ProductCardDTO = {
  id: string;
  slug: string;
  name: { en: string; ar: string };
  basePrice: number;
  image?: { cloudinaryId: string; version: string };
};

export type CatalogResult = {
  items: ProductCardDTO[];
  page: number;
  pageSize: number;
  total: number;
  facets: { sizes: string[]; colors: string[]; priceRange: { min: number; max: number } };
};

function toCard(p: ProductDoc & { _id: unknown }): ProductCardDTO {
  return {
    id: String(p._id),
    slug: p.slug,
    name: p.name as { en: string; ar: string },
    basePrice: p.basePrice,
    image: p.images?.[0] ? { cloudinaryId: p.images[0].cloudinaryId, version: p.images[0].version } : undefined,
  };
}

export async function listProducts(query: CatalogQuery): Promise<CatalogResult> {
  await connectDB();
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(48, Math.max(1, query.pageSize ?? 12));

  const filter: FilterQuery<ProductDoc> = { status: "published" };

  if (query.categorySlug) {
    const cat = await Category.findOne({ slug: query.categorySlug, isActive: true }).lean();
    if (cat) filter.category = cat._id;
    else return { items: [], page, pageSize, total: 0, facets: { sizes: [], colors: [], priceRange: { min: 0, max: 0 } } };
  }
  if (query.q) filter.$text = { $search: query.q };
  if (query.minPrice != null || query.maxPrice != null) {
    filter.basePrice = {};
    if (query.minPrice != null) filter.basePrice.$gte = query.minPrice;
    if (query.maxPrice != null) filter.basePrice.$lte = query.maxPrice;
  }

  // Attribute filters (size/color) resolve via variations → product ids.
  if (query.size || query.color) {
    const vFilter: FilterQuery<VariationDoc> = { isActive: true };
    if (query.size) vFilter["options.size"] = query.size;
    if (query.color) vFilter["options.color"] = query.color;
    const productIds = await Variation.find(vFilter).distinct("product");
    filter._id = { $in: productIds };
  }

  const sortMap = {
    newest: { createdAt: -1 as const },
    "price-asc": { basePrice: 1 as const },
    "price-desc": { basePrice: -1 as const },
  };
  const sort = sortMap[query.sort ?? "newest"];

  const [docs, total, facets] = await Promise.all([
    Product.find(filter).sort(sort).skip((page - 1) * pageSize).limit(pageSize).lean(),
    Product.countDocuments(filter),
    computeFacets(filter),
  ]);

  return { items: docs.map((d) => toCard(d as ProductDoc & { _id: unknown })), page, pageSize, total, facets };
}

async function computeFacets(filter: FilterQuery<ProductDoc>): Promise<CatalogResult["facets"]> {
  const productIds = await Product.find(filter).distinct("_id");
  const [sizes, colors, priceAgg] = await Promise.all([
    Variation.find({ product: { $in: productIds }, isActive: true }).distinct("options.size"),
    Variation.find({ product: { $in: productIds }, isActive: true }).distinct("options.color"),
    Product.aggregate<{ min: number; max: number }>([
      { $match: filter },
      { $group: { _id: null, min: { $min: "$basePrice" }, max: { $max: "$basePrice" } } },
    ]),
  ]);
  return {
    sizes: (sizes as string[]).filter(Boolean).sort(),
    colors: (colors as string[]).filter(Boolean).sort(),
    priceRange: { min: priceAgg[0]?.min ?? 0, max: priceAgg[0]?.max ?? 0 },
  };
}

export type ProductDetailDTO = ProductCardDTO & {
  description: { en: string; ar: string };
  category: { name: { en: string; ar: string }; slug: string } | null;
  images: { cloudinaryId: string; version: string }[];
  attributes: { key: string; label: { en: string; ar: string }; values: string[] }[];
  variations: {
    id: string;
    sku: string;
    options: Record<string, string>;
    price: number;
    inStock: boolean;
    stock: number;
    /** Optional per-variation featured image (FR-202b). Null when not set. */
    image?: { cloudinaryId: string; version: string } | null;
  }[];
};

export async function getProductBySlug(slug: string): Promise<ProductDetailDTO | null> {
  return cacheAside(CacheKeys.product(slug), 120, async () => {
    await connectDB();
    const p = await Product.findOne({ slug, status: "published" }).lean();
    if (!p) return null;
    const [variations, category] = await Promise.all([
      Variation.find({ product: p._id, isActive: true }).lean(),
      p.category ? Category.findById(p.category).lean() : Promise.resolve(null),
    ]);
    const card = toCard(p as ProductDoc & { _id: unknown });
    return {
      ...card,
      description: p.description as { en: string; ar: string },
      category: category
        ? { name: category.name as { en: string; ar: string }, slug: category.slug }
        : null,
      images: (p.images ?? []).map((i) => ({ cloudinaryId: i.cloudinaryId, version: i.version })),
      attributes: (p.attributes ?? []).map((a) => ({
        key: a.key,
        label: a.label as { en: string; ar: string },
        values: a.values ?? [],
      })),
      variations: variations.map((v) => {
        const img = v.image as ({ cloudinaryId?: string | null; version?: string | null } | null | undefined);
        return {
          id: String(v._id),
          sku: v.sku,
          options: (v.options ?? {}) as Record<string, string>,
          price: v.priceOverride ?? p.basePrice,
          inStock: v.stock > 0,
          stock: v.stock,
          image:
            img?.cloudinaryId && img?.version
              ? { cloudinaryId: img.cloudinaryId, version: img.version }
              : null,
        };
      }),
    };
  });
}

export type StoreCategory = {
  id: string;
  slug: string;
  name: { en: string; ar: string };
  parent: string | null;
  image?: { cloudinaryId: string; version: string } | null;
};

export async function listCategoryTree(): Promise<StoreCategory[]> {
  return cacheAside(CacheKeys.categories, 300, async () => {
    await connectDB();
    const cats = await Category.find({ isActive: true }).sort({ sortOrder: 1 }).lean();
    return cats.map((c: CategoryDoc & { _id: unknown }) => {
      const img = c.image;
      return {
        id: String(c._id),
        slug: c.slug,
        name: c.name as { en: string; ar: string },
        parent: c.parent ? String(c.parent) : null,
        image:
          img?.cloudinaryId && img?.version
            ? { cloudinaryId: img.cloudinaryId, version: img.version }
            : null,
      };
    });
  });
}
