import { connectDB } from "@/lib/db/connect";
import { Coupon, type CouponDoc } from "@/models/Coupon";
import { Discount, type DiscountDoc } from "@/models/Discount";
import { cacheInvalidate, CacheKeys } from "@/lib/cache";
import { Errors } from "@/lib/http/errors";
import type { LocalizedText } from "@/lib/shared/types";

/** Admin CRUD for coupons + discounts (spec FR-023/FR-025). */

/** Discounts affect public catalog prices, so invalidate those read caches too (feature 005). */
async function invalidatePromotionsAndCatalog(): Promise<void> {
  await Promise.all([
    cacheInvalidate(CacheKeys.promotions),
    cacheInvalidate(CacheKeys.products),
    cacheInvalidate("cache:product:*"),
    cacheInvalidate(CacheKeys.home),
  ]);
}

// ---- Coupons --------------------------------------------------------------

export type CouponInput = {
  code: string;
  type: "percentage" | "fixed";
  value: number;
  minSubtotal?: number;
  startsAt?: string | null;
  endsAt?: string | null;
  usageLimit?: number;
  isActive?: boolean;
};

export async function listCoupons(): Promise<Array<CouponDoc & { _id: unknown }>> {
  await connectDB();
  return (await Coupon.find().sort({ createdAt: -1 }).lean()) as Array<CouponDoc & { _id: unknown }>;
}

export async function createCoupon(input: CouponInput): Promise<CouponDoc> {
  await connectDB();
  const coupon = await Coupon.create({
    code: input.code.toUpperCase().trim(),
    type: input.type,
    value: input.value,
    minSubtotal: input.minSubtotal ?? 0,
    startsAt: input.startsAt ? new Date(input.startsAt) : undefined,
    endsAt: input.endsAt ? new Date(input.endsAt) : undefined,
    usageLimit: input.usageLimit ?? 0,
    isActive: input.isActive ?? true,
  });
  await cacheInvalidate(CacheKeys.promotions);
  return coupon.toObject();
}

export async function updateCoupon(id: string, patch: Partial<CouponInput>): Promise<CouponDoc> {
  await connectDB();
  const coupon = await Coupon.findById(id);
  if (!coupon) throw Errors.notFound("Coupon");
  if (patch.code) coupon.code = patch.code.toUpperCase().trim();
  if (patch.type) coupon.type = patch.type;
  if (patch.value != null) coupon.value = patch.value;
  if (patch.minSubtotal != null) coupon.minSubtotal = patch.minSubtotal;
  if (patch.usageLimit != null) coupon.usageLimit = patch.usageLimit;
  if (patch.isActive != null) coupon.isActive = patch.isActive;
  if (patch.startsAt !== undefined) coupon.startsAt = (patch.startsAt ? new Date(patch.startsAt) : undefined) as never;
  if (patch.endsAt !== undefined) coupon.endsAt = (patch.endsAt ? new Date(patch.endsAt) : undefined) as never;
  await coupon.save();
  await cacheInvalidate(CacheKeys.promotions);
  return coupon.toObject();
}

export async function deleteCoupon(id: string): Promise<void> {
  await connectDB();
  const coupon = await Coupon.findByIdAndDelete(id);
  if (!coupon) throw Errors.notFound("Coupon");
  await cacheInvalidate(CacheKeys.promotions);
}

// ---- Discounts ------------------------------------------------------------

export type DiscountInput = {
  name: LocalizedText;
  type: "percentage" | "fixed";
  value: number;
  scope?: "all" | "category" | "product";
  categoryIds?: string[];
  productIds?: string[];
  startsAt?: string | null;
  endsAt?: string | null;
  isActive?: boolean;
};

export async function listDiscounts(): Promise<Array<DiscountDoc & { _id: unknown }>> {
  await connectDB();
  return (await Discount.find().sort({ createdAt: -1 }).lean()) as Array<DiscountDoc & { _id: unknown }>;
}

export async function createDiscount(input: DiscountInput): Promise<DiscountDoc> {
  await connectDB();
  const discount = await Discount.create({
    name: input.name,
    type: input.type,
    value: input.value,
    scope: input.scope ?? "all",
    categoryIds: input.categoryIds ?? [],
    productIds: input.productIds ?? [],
    startsAt: input.startsAt ? new Date(input.startsAt) : undefined,
    endsAt: input.endsAt ? new Date(input.endsAt) : undefined,
    isActive: input.isActive ?? true,
  });
  await invalidatePromotionsAndCatalog();
  return discount.toObject();
}

export async function updateDiscount(id: string, patch: Partial<DiscountInput>): Promise<DiscountDoc> {
  await connectDB();
  const discount = await Discount.findById(id);
  if (!discount) throw Errors.notFound("Discount");
  if (patch.name) discount.name = patch.name as never;
  if (patch.type) discount.type = patch.type;
  if (patch.value != null) discount.value = patch.value;
  if (patch.scope) discount.scope = patch.scope;
  if (patch.categoryIds) discount.categoryIds = patch.categoryIds as never;
  if (patch.productIds) discount.productIds = patch.productIds as never;
  if (patch.isActive != null) discount.isActive = patch.isActive;
  if (patch.startsAt !== undefined)
    discount.startsAt = (patch.startsAt ? new Date(patch.startsAt) : undefined) as never;
  if (patch.endsAt !== undefined) discount.endsAt = (patch.endsAt ? new Date(patch.endsAt) : undefined) as never;
  await discount.save();
  await invalidatePromotionsAndCatalog();
  return discount.toObject();
}

export async function deleteDiscount(id: string): Promise<void> {
  await connectDB();
  const discount = await Discount.findByIdAndDelete(id);
  if (!discount) throw Errors.notFound("Discount");
  await invalidatePromotionsAndCatalog();
}
