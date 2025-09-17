// middlewares/cacheMiddleware.ts
import { Request, Response, NextFunction } from "express";
import { generateCacheKey } from "../utils/cacheKey";
import { getCache } from "../utils/cache";


interface CacheMiddlewareOptions {
  /**
   * If set, the middleware will use this route param as the cache key.
   * Example: param = "id" => req.params.id
   */
  param?: string;

  /**
   * Set to true for list routes to include query params in the cache key.
   */
  isList?: boolean;
}

export const cacheMiddleware = (baseKey: string, options: CacheMiddlewareOptions = {}) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const params: Record<string, string | number> = {};

      // --- Single entity route: use route param ---
      if (options.param) {
        const value = req.params[options.param];
        if (value !== undefined && value !== null && value !== "") {
          params[options.param] = value;
        }
      }

      // --- List route: use query params ---
      if (options.isList) {
        for (const [key, value] of Object.entries(req.query)) {
          if (value !== undefined && value !== null && value !== "") {
            params[key] = Array.isArray(value) ? value.join(",") : String(value);
          }
        }
      }

      // Generate cache key
      const cacheKey = generateCacheKey(baseKey, params);

      // Try to fetch from cache
      const cached = await getCache(cacheKey);
      if (cached) {
        return res.json({ ...cached, cached: true });
      }

      // Pass cacheKey to controller for storing after DB query
      (req as any).cacheKey = cacheKey;

      next();
    } catch (error) {
      console.error("Cache middleware error:", error);
      next();
    }
  };
};
