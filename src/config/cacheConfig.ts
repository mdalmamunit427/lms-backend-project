export const CACHE_PREFIX = process.env.NODE_ENV === "production" ? "lms:prod:" : "lms:dev:";
export const DEFAULT_TTL = 15 * 60; // 15 minutes