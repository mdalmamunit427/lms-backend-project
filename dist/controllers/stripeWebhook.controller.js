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
            // ✅ Create or update enrollment
            await enrollment_model_1.default.findOneAndUpdate({ student: studentId, course: courseId }, { paymentStatus: "paid", amountPaid }, { upsert: true, new: true });
            // ✅ Optionally update enrolled students list in Course
            await courses_model_1.default.findByIdAndUpdate(courseId, {
                $addToSet: { enrolledStudents: studentId },
            });
            // ✅ Invalidate cache
            await (0, cache_1.invalidateCache)("courses");
            await (0, cache_1.invalidateCache)(`course:${courseId}`);
            console.log(`✅ Enrollment successful for course ${courseId}`);
            break;
        }
        default:
            console.log(`Unhandled event type: ${event.type}`);
    }
}
//# sourceMappingURL=stripeWebhook.controller.js.map