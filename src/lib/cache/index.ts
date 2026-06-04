import { Redis } from "ioredis";
import { getEnv } from "@/lib/config/env";
import { logger } from "@/lib/observability/logger";

/**
 * Redis client (singleton) + cache-aside helpers with tag-style key prefixes.
 * Writes invalidate by prefix so storefront reads never serve stale catalog,
 * pricing, or settings (Constitution Principle VI).
 *
 * The client is configured to degrade gracefully: if Redis is unreachable the
 * commands fail fast (offline queue disabled) and an `error` listener swallows
 * the connection error so a cache outage never crashes page rendering — callers
 * fall back to computing the value directly.
 */
const globalForRedis = globalThis as unknown as { _redis?: Redis };

export function getRedis(): Redis {
  if (!globalForRedis._redis) {
    const env = getEnv();
    const client = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      retryStrategy: (times) => Math.min(times * 200, 2000),
    });
    // Without an error listener ioredis emits an *unhandled* error event that can
    // crash the server render. Log and continue so the cache simply no-ops.
    client.on("error", (err: Error) => {
      logger.warn("Redis connection error (cache disabled until reconnect)", { err: err.message });
    });
    globalForRedis._redis = client;
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
  taxShipping: "cache:tax-shipping",
  home: "cache:home",
  promotions: "cache:promotions",
} as const;

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const data = await getRedis().get(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export async function cacheSet<T>(key: string, value: T, ttlSeconds = 300): Promise<void> {
  try {
    await getRedis().set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch {
    // Cache write failed (e.g. Redis down) — non-fatal; reads recompute.
  }
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
  try {
    const redis = getRedis();
    if (keyOrPrefix.endsWith("*")) {
      const keys = await redis.keys(keyOrPrefix);
      if (keys.length) await redis.del(...keys);
      return;
    }
    await redis.del(keyOrPrefix);
  } catch {
    // Invalidation failed (e.g. Redis down) — non-fatal; entries expire via TTL.
  }
}

/** Simple fixed-window rate limiter (used for tracking + auth). Returns true if allowed. */
export async function rateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  try {
    const redis = getRedis();
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, windowSeconds);
    return count <= limit;
  } catch {
    // Redis unavailable — fail open so the limiter never locks users out on an outage.
    return true;
  }
}
