import { Redis } from "@upstash/redis";
import { getEnv } from "@/lib/config/env";

/**
 * Redis client (singleton) + cache-aside helpers with tag-style key prefixes.
 * Writes invalidate by prefix so storefront reads never serve stale catalog,
 * pricing, or settings (Constitution Principle VI).
 */
const globalForRedis = globalThis as unknown as { _redis?: Redis };

export function getRedis(): Redis {
  if (!globalForRedis._redis) {
    const env = getEnv();
    globalForRedis._redis = new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return globalForRedis._redis;
}

/** Cache key namespaces (prefixes) used for targeted invalidation. */
export const CacheKeys = {
  products: "cache:products",
  product: (slug: string) => `cache:product:${slug}`,
  categories: "cache:categories",
  settings: "cache:settings",
  theme: "cache:theme",
  home: "cache:home",
  promotions: "cache:promotions",
} as const;

export async function cacheGet<T>(key: string): Promise<T | null> {
  const data = await getRedis().get<T>(key);
  return data ?? null;
}

export async function cacheSet<T>(key: string, value: T, ttlSeconds = 300): Promise<void> {
  await getRedis().set(key, value, { ex: ttlSeconds });
}

/** Cache-aside: return cached value or compute, store, and return it. */
export async function cacheAside<T>(key: string, ttlSeconds: number, compute: () => Promise<T>): Promise<T> {
  const hit = await cacheGet<T>(key);
  if (hit !== null) return hit;
  const value = await compute();
  await cacheSet(key, value, ttlSeconds);
  return value;
}

/** Invalidate one exact key or all keys matching a prefix (e.g. on writes). */
export async function cacheInvalidate(keyOrPrefix: string): Promise<void> {
  const redis = getRedis();
  if (keyOrPrefix.endsWith("*")) {
    const keys = await redis.keys(keyOrPrefix);
    if (keys.length) await redis.del(...keys);
    return;
  }
  await redis.del(keyOrPrefix);
}

/** Simple fixed-window rate limiter (used for tracking + auth). Returns true if allowed. */
export async function rateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  const redis = getRedis();
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, windowSeconds);
  return count <= limit;
}
