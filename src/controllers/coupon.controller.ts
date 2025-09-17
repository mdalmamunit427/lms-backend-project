// controllers/coupon.controller.ts
import { Request, Response, NextFunction } from "express";
import Coupon from "../models/coupon.model";
import { AppError } from "../utils/AppError";
import { catchAsync } from "../middlewares/catchAsync";

// Create Coupon
export const createCoupon = catchAsync(async (req: Request, res: Response) => {
  const { code, discountPercent, appliesTo, expiresAt, usageLimit } = req.body;

  if (!code || !discountPercent) {
    throw new AppError("Coupon code and discount percent are required", 400);
  }

  const coupon = await Coupon.create({
    code,
    discountPercent,
    appliesTo: appliesTo || "all",
    expiresAt,
    usageLimit,
  });

  res.status(201).json({ success: true, coupon });
});

// Get All Coupons
export const getAllCoupons = catchAsync(async (req: Request, res: Response) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 });
  res.json({ success: true, coupons });
});

// Update Coupon
export const updateCoupon = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const coupon = await Coupon.findByIdAndUpdate(id, req.body, { new: true });

  if (!coupon) throw new AppError("Coupon not found", 404);

  res.json({ success: true, coupon });
});

// Delete Coupon
export const deleteCoupon = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const coupon = await Coupon.findByIdAndDelete(id);

  if (!coupon) throw new AppError("Coupon not found", 404);

  res.json({ success: true, message: "Coupon deleted" });
});

// Validate Coupon
export const validateCoupon = catchAsync(async (req: Request, res: Response) => {
  const { code, courseId } = req.query;
  if (!code) throw new AppError("Coupon code is required", 400);

  const coupon = await Coupon.findOne({ code: (code as string).toUpperCase(), isActive: true });

  if (!coupon) throw new AppError("Invalid or inactive coupon", 400);
  if (coupon.expiresAt && new Date() > coupon.expiresAt) throw new AppError("Coupon expired", 400);
  if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit)
    throw new AppError("Coupon usage limit reached", 400);

  if (coupon.appliesTo !== "all" && coupon.appliesTo !== courseId) {
    throw new AppError("Coupon is not valid for this course", 400);
  }

  res.json({ success: true, discountPercent: coupon.discountPercent });
});
