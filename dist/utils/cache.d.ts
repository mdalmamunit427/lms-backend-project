export declare const namespacedKey: (key: string) => string;
export declare function setCache(key: string, value: any, ttlSeconds?: number): Promise<void>;
export declare function getCache<T = any>(key: string): Promise<T | null>;
export declare function invalidateCache(pattern: string): Promise<number>;
//# sourceMappingURL=cache.d.ts.map