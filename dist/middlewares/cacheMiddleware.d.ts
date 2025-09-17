import { Request, Response, NextFunction } from "express";
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
export declare const cacheMiddleware: (baseKey: string, options?: CacheMiddlewareOptions) => (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export {};
//# sourceMappingURL=cacheMiddleware.d.ts.map