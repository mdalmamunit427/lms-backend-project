// models/enrollment.model.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IEnrollment extends Document {
  student: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  paymentStatus: "pending" | "paid";
  amountPaid: number;
  createdAt: Date;
}

const enrollmentSchema = new Schema<IEnrollment>(
  {
    student: { type: Schema.Types.ObjectId, ref: "User", required: true },
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    paymentStatus: { type: String, enum: ["pending", "paid"], default: "pending" },
    amountPaid: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Enrollment = mongoose.model<IEnrollment>("Enrollment", enrollmentSchema);
export default Enrollment;
