"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserEnrollments = exports.createCheckoutSession = void 0;
const stripe_1 = __importDefault(require("../utils/stripe"));
const courses_model_1 = __importDefault(require("../models/courses.model"));
const enrollment_model_1 = __importDefault(require("../models/enrollment.model"));
const coupon_model_1 = __importDefault(require("../models/coupon.model"));
const createCheckoutSession = async (req, res) => {
    try {
        const { courseId, studentId, couponCode } = req.body;
        const course = await courses_model_1.default.findById(courseId);
        if (!course)
            return res.status(404).json({ message: "Course not found" });
        // ✅ Check if student already enrolled
        const alreadyEnrolled = await enrollment_model_1.default.findOne({ course: courseId, student: studentId });
        if (alreadyEnrolled) {
            return res.status(400).json({ message: "Student is already enrolled in this course" });
        }
        // 1️⃣ Start with course price
        let finalPrice = course.coursePrice;
        // 2️⃣ Apply course's own discount first
        if (course.discount && course.discount > 0) {
            finalPrice -= (finalPrice * course.discount) / 100;
        }
        // 3️⃣ Apply coupon discount if provided
        if (couponCode) {
            const coupon = await coupon_model_1.default.findOne({ code: couponCode.toUpperCase() });
            const couponExpires = coupon?.expiresAt;
            if (!coupon || couponExpires < new Date()) {
                return res.status(400).json({ message: "Invalid or expired coupon" });
            }
            if (coupon.appliesTo && coupon.appliesTo.toString() !== courseId) {
                return res.status(400).json({ message: "Coupon not valid for this course" });
            }
            finalPrice -= (finalPrice * coupon.discountPercent) / 100;
        }
        // ✅ If course is free or 100% discounted
        if (finalPrice <= 0) {
            await enrollment_model_1.default.create({
                student: studentId,
                course: courseId,
                paymentStatus: "paid",
                amountPaid: 0,
            });
            await courses_model_1.default.findByIdAndUpdate(courseId, {
                $addToSet: { enrolledStudents: studentId },
            });
            return res.status(200).json({
                success: true,
                message: "Free enrollment successful",
            });
        }
        // ✅ Paid enrollment - create Stripe session
        const session = await stripe_1.default.checkout.sessions.create({
            payment_method_types: ["card"],
            mode: "payment",
            line_items: [
                {
                    price_data: {
                        currency: "usd",
                        product_data: { name: course.name },
                        unit_amount: Math.round(finalPrice * 100),
                    },
                    quantity: 1,
                },
            ],
            metadata: {
                courseId,
                studentId,
            },
            success_url: `${process.env.FRONTEND_URL}/enroll/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL}/enroll/cancel`,
        });
        // open the  session.url and do manual payment using cards
        console.log("Session id: ", session.id);
        console.log("Session url: ", session.url);
        res.status(200).json({ id: session.id, url: session.url });
    }
    catch (error) {
        console.error("Error creating checkout session:", error);
        res.status(500).json({ message: "Error creating checkout session" });
    }
};
exports.createCheckoutSession = createCheckoutSession;
const getUserEnrollments = async (req, res) => {
    try {
        const studentId = req.params.studentId;
        const enrollments = await enrollment_model_1.default.find({ student: studentId })
            .populate("course")
            .lean();
        res.status(200).json(enrollments);
    }
    catch (error) {
        console.error("Error fetching enrollments:", error);
        res.status(500).json({ message: "Error fetching enrollments" });
    }
};
exports.getUserEnrollments = getUserEnrollments;
//# sourceMappingURL=enrollment.controller.js.map