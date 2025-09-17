"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// routes/coupon.routes.ts
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middlewares/auth");
const coupon_controller_1 = require("../controllers/coupon.controller");
const router = express_1.default.Router();
// Educator/Admin Only
router.post("/", auth_1.isAuthenticated, (0, auth_1.authorizeRole)("educator"), coupon_controller_1.createCoupon);
router.get("/", auth_1.isAuthenticated, (0, auth_1.authorizeRole)("educator"), coupon_controller_1.getAllCoupons);
router.put("/:id", auth_1.isAuthenticated, (0, auth_1.authorizeRole)("educator"), coupon_controller_1.updateCoupon);
router.delete("/:id", auth_1.isAuthenticated, (0, auth_1.authorizeRole)("educator"), coupon_controller_1.deleteCoupon);
// Public validation API
router.get("/validate", coupon_controller_1.validateCoupon);
exports.default = router;
//# sourceMappingURL=coupon.routes.js.map