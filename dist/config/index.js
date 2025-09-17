"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const config = {
    port: Number(process.env.PORT) || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    database_url: process.env.MONGODB_URL || 'mongodb://localhost:27017/lms-backend',
    redis_url: process.env.REDIS_URL || "",
    jwtAccessSecret: process.env.JWT_ACCESS_SECRET || "your-access-secret-key",
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || "your-refresh-secret-key",
    cloudinary_cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "your-cloud-name",
    cloudinary_api_key: process.env.CLOUDINARY_API_KEY || "your-api-key",
    cloudinary_api_secret: process.env.CLOUDINARY_API_SECRET || "your-api-secret",
};
exports.default = config;
//# sourceMappingURL=index.js.map