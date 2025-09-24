// controllers/stripeWebhook.controller.ts
import { Stripe } from "stripe";
import Enrollment from "../models/enrollment.model";
import Course from "../models/courses.model";
import { invalidateCache } from "../utils/cache";
import mongoose from "mongoose";
import { redis } from "../utils/redis";
import { sendEmail } from "../utils/email";
import User from "../models/user.model";


export async function handleStripeWebhook(event: Stripe.Event) {
  console.log("🔥 Stripe event received:", event.type);

  if (event.type !== "checkout.session.completed") {
    console.log(`⚠️ Unhandled event type: ${event.type}`);
    return;
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const courseId = session.metadata?.courseId;
  const studentId = session.metadata?.studentId;
  const amountPaid = (session.amount_total ?? 0) / 100;

  if (!courseId || !studentId) return console.error("⚠ Missing courseId or studentId in metadata");

  const dbSession = await mongoose.startSession();
  dbSession.startTransaction();

  try {
    // Idempotent enrollment
    await Enrollment.findOneAndUpdate(
      { student: studentId, course: courseId },
      {
        $set: {
          student: studentId,
          course: courseId,
          paymentStatus: "paid",
          amountPaid,
          stripeSessionId: session.id,
        },
      },
      { upsert: true, new: true, session: dbSession }
    );

    // Add student to course's enrolled list
    const course = await Course.findByIdAndUpdate(courseId,  { $inc: { enrollmentCount: 1 } }, { session: dbSession });

    await dbSession.commitTransaction();
    dbSession.endSession();

    // Invalidate caches asynchronously
    await invalidateCache("courses"); // invalidates all cached courses
    await invalidateCache(`course:id=${courseId}`); // invalidate single course cache
    await redis.del(studentId);

    const student = await User.findById(studentId);

    // Send the confirmation email
    if (student && course) {
      await sendEmail(
        student.email,
        'Enrollment Confirmed!',
        'enrollment',
        {
          studentName: student.name,
          courseTitle: course.title,
          dashboardUrl: process.env.FRONTEND_URL + '/dashboard',
        },
      );
    }

    console.log(`✅ Enrollment processed for student ${studentId} in course ${courseId}`);
  } catch (err: any) {
    await dbSession.abortTransaction();
    dbSession.endSession();
    console.error("❌ Failed to process checkout.session.completed:", err.message);
  }
}

