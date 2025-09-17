"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeRole = exports.isAuthenticated = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const AppError_1 = require("../utils/AppError");
const redis_1 = require("../utils/redis");
const isAuthenticated = async (req, res, next) => {
    const token = req.cookies.accessToken;
    if (!token)
        return next(new AppError_1.AppError("Access token missing", 401));
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_ACCESS_SECRET);
        const userData = await redis_1.redis.get(decoded.id);
        if (!userData)
            return next(new AppError_1.AppError("User not found", 401));
        const user = JSON.parse(userData);
        if (!user)
            return next(new AppError_1.AppError("User not found", 401));
        req.user = user;
        next();
    }
    catch {
        return next(new AppError_1.AppError("Token expired or invalid", 401));
    }
};
exports.isAuthenticated = isAuthenticated;
const authorizeRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return next(new AppError_1.AppError("Not authorized", 403));
        }
        next();
    };
};
exports.authorizeRole = authorizeRole;
//# sourceMappingURL=auth.js.map