// controllers/stripeWebhook.controller.ts
import { Stripe } from "stripe";
import Enrollment from "../models/enrollment.model";
import Course from "../models/courses.model";
import { invalidateCache } from "../utils/cache";

export async function handleStripeWebhook(event: Stripe.Event) {
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

      // ✅ Create or update enrollment
      await Enrollment.findOneAndUpdate(
        { student: studentId, course: courseId },
        { paymentStatus: "paid", amountPaid },
        { upsert: true, new: true }
      );

      // ✅ Optionally update enrolled students list in Course
      await Course.findByIdAndUpdate(courseId, {
        $addToSet: { enrolledStudents: studentId },
      });

      // ✅ Invalidate cache
      await invalidateCache("courses");
      await invalidateCache(`course:${courseId}`);

      console.log(`✅ Enrollment successful for course ${courseId}`);
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
}
