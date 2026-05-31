import { connectDB } from "@/lib/db/connect";
import { cacheAside, cacheInvalidate, CacheKeys } from "@/lib/cache";
import { WebsiteSettings, type WebsiteSettingsDoc } from "@/models/WebsiteSettings";
import { ThemeSettings, type ThemeSettingsDoc } from "@/models/ThemeSettings";
import { TaxShippingPolicy, type TaxShippingPolicyDoc } from "@/models/TaxShippingPolicy";

/**
 * Read-through access to the admin-configured singletons (Principle V). Storefront
 * reads are cached; admin writes call the invalidate* helpers so changes appear fast
 * (SC-007). Each getter lazily creates the default singleton if absent.
 */
// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
async function getOrCreate<T>(model: { findOne: Function; create: Function }, defaults: object): Promise<T> {
  const existing = await model.findOne({ singleton: "main" }).lean();
  if (existing) return existing as T;
  return (await model.create({ singleton: "main", ...defaults })).toObject() as T;
}

export async function getWebsiteSettings(): Promise<WebsiteSettingsDoc> {
  return cacheAside(CacheKeys.settings, 300, async () => {
    await connectDB();
    return getOrCreate<WebsiteSettingsDoc>(WebsiteSettings, {});
  });
}

export async function getThemeSettings(): Promise<ThemeSettingsDoc> {
  return cacheAside(CacheKeys.theme, 300, async () => {
    await connectDB();
    return getOrCreate<ThemeSettingsDoc>(ThemeSettings, {});
  });
}

export async function getTaxShippingPolicy(): Promise<TaxShippingPolicyDoc> {
  await connectDB();
  return getOrCreate<TaxShippingPolicyDoc>(TaxShippingPolicy, {});
}

export async function invalidateSettings(): Promise<void> {
  await cacheInvalidate(CacheKeys.settings);
  await cacheInvalidate(CacheKeys.home);
}

export async function invalidateTheme(): Promise<void> {
  await cacheInvalidate(CacheKeys.theme);
}
