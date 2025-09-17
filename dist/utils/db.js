"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const config_1 = __importDefault(require("../config"));
const MONGODB_URI = config_1.default.database_url;
if (!MONGODB_URI) {
    throw new Error("Please define the MONGODB_URI in your config");
}
// Use a global variable to cache the connection
let cached = global.mongoose;
if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}
const dbConnect = async () => {
    if (cached.conn) {
        return cached.conn; // return cached connection
    }
    if (!cached.promise) {
        cached.promise = mongoose_1.default.connect(MONGODB_URI).then((mongoose) => {
            return mongoose;
        });
    }
    cached.conn = await cached.promise;
    return cached.conn;
};
exports.default = dbConnect;
//# sourceMappingURL=db.js.map