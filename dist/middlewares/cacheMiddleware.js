"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheMiddleware = void 0;
const cacheKey_1 = require("../utils/cacheKey");
const cache_1 = require("../utils/cache");
const cacheMiddleware = (baseKey, options = {}) => {
    return async (req, res, next) => {
        try {
            const params = {};
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
            const cacheKey = (0, cacheKey_1.generateCacheKey)(baseKey, params);
            // Try to fetch from cache
            const cached = await (0, cache_1.getCache)(cacheKey);
            if (cached) {
                return res.json({ ...cached, cached: true });
            }
            // Pass cacheKey to controller for storing after DB query
            req.cacheKey = cacheKey;
            next();
        }
        catch (error) {
            console.error("Cache middleware error:", error);
            next();
        }
    };
};
exports.cacheMiddleware = cacheMiddleware;
//# sourceMappingURL=cacheMiddleware.js.map