// utils/cache.ts

import { CACHE_PREFIX, DEFAULT_TTL } from "../config/cacheConfig";
import { redis } from "./redis";


export const namespacedKey = (key: string) => `${CACHE_PREFIX}${key}`;

export async function setCache(key: string, value: any, ttlSeconds = DEFAULT_TTL) {
  await redis.set(namespacedKey(key), JSON.stringify(value), "EX", ttlSeconds);
}

export async function getCache<T = any>(key: string): Promise<T | null> {
  const data = await redis.get(namespacedKey(key));
  return data ? JSON.parse(data) : null;
}

// Pattern-based invalidation
export async function invalidateCache(pattern: string): Promise<number> {
  let cursor = "0";
  let deletedCount = 0;

  do {
    const [nextCursor, keys] = await redis.scan(cursor, "MATCH", namespacedKey(`${pattern}*`), "COUNT", 100);
    if (keys.length > 0) {
      const result = await redis.del(...keys);
      deletedCount += result;
    }
    cursor = nextCursor;
  } while (cursor !== "0");

  // console.log(`Cache invalidated: ${pattern}* → Deleted ${deletedCount} keys`);
  return deletedCount;
}
