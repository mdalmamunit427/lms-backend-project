// controllers/stripeWebhook.controller.ts
import { Stripe } from "stripe";
import Enrollment from "../models/enrollment.model";
import Course from "../models/courses.model";
import { invalidateCache } from "../utils/cache";


export async function handleStripeWebhook(event: Stripe.Event) {
  console.log("🔥 Stripe event received:", event.type);

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;

      const courseId = session.metadata?.courseId;
      const studentId = session.metadata?.studentId;
      const amountPaid = (session.amount_total ?? 0) / 100;

      if (!courseId || !studentId) {
        console.error("⚠ Missing courseId or studentId in metadata");
        return;
      }

      try {
        // ✅ Create or update enrollment (idempotent)
        const enrollment = await Enrollment.findOneAndUpdate(
          { student: studentId, course: courseId },
          {
            $set: {
              student: studentId,
              course: courseId,
              paymentStatus: "paid",
              amountPaid,
              stripeSessionId: session.id, // optional: store session ID for reference
            },
          },
          { upsert: true, new: true }
        );

        // ✅ Add student to course enrolled list
        await Course.findByIdAndUpdate(courseId, {
          $addToSet: { enrolledStudents: studentId },
        });

        // ✅ Invalidate caches
        await invalidateCache("courses");
        await invalidateCache(`course:${courseId}`);

        console.log(`✅ Enrollment successful for student ${studentId} in course ${courseId}`);
        console.log(`💰 Amount Paid: $${amountPaid}`);
        console.log(`🆔 Stripe Session: ${session.id}`);
      } catch (err: any) {
        console.error("❌ Failed to process checkout.session.completed:", err.message);
      }

      break;
    }

    default:
      console.log(`⚠️ Unhandled event type: ${event.type}`);
  }
}
