"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const globalError_1 = require("./middlewares/globalError");
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.CLIENT_URL,
    credentials: true,
}));
// routes
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const courses_routes_1 = __importDefault(require("./routes/courses.routes"));
const enrollment_routes_1 = __importDefault(require("./routes/enrollment.routes"));
const stripeWebhook_routes_1 = __importDefault(require("./routes/stripeWebhook.routes"));
const coupon_routes_1 = __importDefault(require("./routes/coupon.routes"));
app.use("/api/v1/courses", courses_routes_1.default);
app.use("/api/v1/user", user_routes_1.default);
app.use("/api/v1/enrollment", enrollment_routes_1.default);
app.use("/api/v1/stripe/webhook", stripeWebhook_routes_1.default);
app.use("/api/v1/coupon", coupon_routes_1.default);
app.use(globalError_1.globalErrorHandler);
app.get("/", (_req, res) => {
    res.send("LMS Backend Server is Running...");
});
exports.default = app;
//# sourceMappingURL=app.js.map