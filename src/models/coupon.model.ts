// models/coupon.model.ts
import mongoose, { Schema, Document } from "mongoose";

export interface ICoupon extends Document {
  code: string;
  discountPercent: number;
  appliesTo: "all" | string; // "all" = all courses, otherwise courseId
  expiresAt?: Date;
  isActive: boolean;
  usageLimit?: number; // optional: total times coupon can be used
  usageCount: number;
}

const couponSchema = new Schema<ICoupon>(
  {
    code: { type: String, required: true, unique: true, uppercase: true },
    discountPercent: { type: Number, required: true, min: 1, max: 100 },
    appliesTo: { type: String, required: true, default: "all" },
    expiresAt: { type: Date },
    isActive: { type: Boolean, default: true },
    usageLimit: { type: Number },
    usageCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Coupon = mongoose.model<ICoupon>("Coupon", couponSchema)

export default Coupon;
