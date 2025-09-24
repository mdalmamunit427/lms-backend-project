import mongoose, { Schema, Document } from 'mongoose';

export interface IEnrollment extends Document {
  student: mongoose.Schema.Types.ObjectId; // Corrected: Use 'student'
  course: mongoose.Schema.Types.ObjectId;
  coupon?: mongoose.Schema.Types.ObjectId;
  enrollmentDate: Date;
  amountPaid: number;
  paymentStatus: 'paid' | 'free';
  stripeSessionId?: string;
}

const EnrollmentSchema: Schema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    coupon: { type: Schema.Types.ObjectId, ref: 'Coupon' },
    enrollmentDate: { type: Date, default: Date.now },
    amountPaid: { type: Number, required: true },
    paymentStatus: { type: String, enum: ['paid', 'free'], required: true },
    stripeSessionId: { type: String },
  },
  { timestamps: true }
);

// Corrected: The index is now on 'student' to match the schema
EnrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

const Enrollment = mongoose.model<IEnrollment>('Enrollment', EnrollmentSchema);
export default Enrollment;