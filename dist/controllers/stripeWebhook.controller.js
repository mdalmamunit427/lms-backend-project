"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleStripeWebhook = handleStripeWebhook;
const enrollment_model_1 = __importDefault(require("../models/enrollment.model"));
const courses_model_1 = __importDefault(require("../models/courses.model"));
const cache_1 = require("../utils/cache");
async function handleStripeWebhook(event) {
    console.log("🔥 Stripe event received:", event.type);
    switch (event.type) {
        case "checkout.session.completed": {
            const session = event.data.object;
            const courseId = session.metadata?.courseId;
            const studentId = session.metadata?.studentId;
            const amountPaid = (session.amount_total ?? 0) / 100;
            if (!courseId || !studentId) {
                console.error("⚠ Missing courseId or studentId in metadata");
                return;
            }
            try {
                // ✅ Create or update enrollment (idempotent)
                const enrollment = await enrollment_model_1.default.findOneAndUpdate({ student: studentId, course: courseId }, {
                    $set: {
                        student: studentId,
                        course: courseId,
                        paymentStatus: "paid",
                        amountPaid,
                        stripeSessionId: session.id, // optional: store session ID for reference
                    },
                }, { upsert: true, new: true });
                // ✅ Add student to course enrolled list
                await courses_model_1.default.findByIdAndUpdate(courseId, {
                    $addToSet: { enrolledStudents: studentId },
                });
                // ✅ Invalidate caches
                await (0, cache_1.invalidateCache)("courses");
                await (0, cache_1.invalidateCache)(`course:${courseId}`);
                console.log(`✅ Enrollment successful for student ${studentId} in course ${courseId}`);
                console.log(`💰 Amount Paid: $${amountPaid}`);
                console.log(`🆔 Stripe Session: ${session.id}`);
            }
            catch (err) {
                console.error("❌ Failed to process checkout.session.completed:", err.message);
            }
            break;
        }
        default:
            console.log(`⚠️ Unhandled event type: ${event.type}`);
    }
}
//# sourceMappingURL=stripeWebhook.controller.js.map