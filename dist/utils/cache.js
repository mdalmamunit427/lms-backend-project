"use strict";
// utils/cache.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.namespacedKey = void 0;
exports.setCache = setCache;
exports.getCache = getCache;
exports.invalidateCache = invalidateCache;
const cacheConfig_1 = require("../config/cacheConfig");
const redis_1 = require("./redis");
const namespacedKey = (key) => `${cacheConfig_1.CACHE_PREFIX}${key}`;
exports.namespacedKey = namespacedKey;
async function setCache(key, value, ttlSeconds = cacheConfig_1.DEFAULT_TTL) {
    await redis_1.redis.set((0, exports.namespacedKey)(key), JSON.stringify(value), "EX", ttlSeconds);
}
async function getCache(key) {
    const data = await redis_1.redis.get((0, exports.namespacedKey)(key));
    return data ? JSON.parse(data) : null;
}
// Pattern-based invalidation
async function invalidateCache(pattern) {
    let cursor = "0";
    let deletedCount = 0;
    do {
        const [nextCursor, keys] = await redis_1.redis.scan(cursor, "MATCH", (0, exports.namespacedKey)(`${pattern}*`), "COUNT", 100);
        if (keys.length > 0) {
            const result = await redis_1.redis.del(...keys);
            deletedCount += result;
        }
        cursor = nextCursor;
    } while (cursor !== "0");
    console.log(`Cache invalidated: ${pattern}* → Deleted ${deletedCount} keys`);
    return deletedCount;
}
//# sourceMappingURL=cache.js.map