// routes/coupon.routes.ts
import express from "express";
import { authorizeRole, isAuthenticated } from "../middlewares/auth";
import { createCoupon, deleteCoupon, getAllCoupons, updateCoupon, validateCoupon } from "../controllers/coupon.controller";


const router = express.Router();

// Educator/Admin Only
router.post("/", isAuthenticated,  authorizeRole("educator"), createCoupon);
router.get("/", isAuthenticated,  authorizeRole("educator"), getAllCoupons);
router.put("/:id", isAuthenticated,  authorizeRole("educator"), updateCoupon);
router.delete("/:id", isAuthenticated,  authorizeRole("educator"), deleteCoupon);

// Public validation API
router.get("/validate", validateCoupon);

export default router;
