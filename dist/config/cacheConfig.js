"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_TTL = exports.CACHE_PREFIX = void 0;
exports.CACHE_PREFIX = process.env.NODE_ENV === "production" ? "lms:prod:" : "lms:dev:";
exports.DEFAULT_TTL = 15 * 60; // 15 minutes
//# sourceMappingURL=cacheConfig.js.map