"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateCoupon = exports.deleteCoupon = exports.updateCoupon = exports.getAllCoupons = exports.createCoupon = void 0;
const coupon_model_1 = __importDefault(require("../models/coupon.model"));
const AppError_1 = require("../utils/AppError");
const catchAsync_1 = require("../middlewares/catchAsync");
// Create Coupon
exports.createCoupon = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { code, discountPercent, appliesTo, expiresAt, usageLimit } = req.body;
    if (!code || !discountPercent) {
        throw new AppError_1.AppError("Coupon code and discount percent are required", 400);
    }
    const coupon = await coupon_model_1.default.create({
        code,
        discountPercent,
        appliesTo: appliesTo || "all",
        expiresAt,
        usageLimit,
    });
    res.status(201).json({ success: true, coupon });
});
// Get All Coupons
exports.getAllCoupons = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const coupons = await coupon_model_1.default.find().sort({ createdAt: -1 });
    res.json({ success: true, coupons });
});
// Update Coupon
exports.updateCoupon = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { id } = req.params;
    const coupon = await coupon_model_1.default.findByIdAndUpdate(id, req.body, { new: true });
    if (!coupon)
        throw new AppError_1.AppError("Coupon not found", 404);
    res.json({ success: true, coupon });
});
// Delete Coupon
exports.deleteCoupon = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { id } = req.params;
    const coupon = await coupon_model_1.default.findByIdAndDelete(id);
    if (!coupon)
        throw new AppError_1.AppError("Coupon not found", 404);
    res.json({ success: true, message: "Coupon deleted" });
});
// Validate Coupon
exports.validateCoupon = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { code, courseId } = req.query;
    if (!code)
        throw new AppError_1.AppError("Coupon code is required", 400);
    const coupon = await coupon_model_1.default.findOne({ code: code.toUpperCase(), isActive: true });
    if (!coupon)
        throw new AppError_1.AppError("Invalid or inactive coupon", 400);
    if (coupon.expiresAt && new Date() > coupon.expiresAt)
        throw new AppError_1.AppError("Coupon expired", 400);
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit)
        throw new AppError_1.AppError("Coupon usage limit reached", 400);
    if (coupon.appliesTo !== "all" && coupon.appliesTo !== courseId) {
        throw new AppError_1.AppError("Coupon is not valid for this course", 400);
    }
    res.json({ success: true, discountPercent: coupon.discountPercent });
});
//# sourceMappingURL=coupon.controller.js.map