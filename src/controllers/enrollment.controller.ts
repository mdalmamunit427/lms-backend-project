// controllers/enrollment.controller.ts
import { Request, Response } from "express";

import stripe from "../utils/stripe";
import Course from "../models/courses.model";
import Enrollment from "../models/enrollment.model";
import Coupon from "../models/coupon.model";

export const createCheckoutSession = async (req: Request, res: Response) => {
  try {
    const { courseId, studentId, couponCode } = req.body;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    // ✅ Check if student already enrolled
    const alreadyEnrolled = await Enrollment.findOne({ course: courseId, student: studentId });
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
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
      
      const couponExpires = coupon?.expiresAt as Date;

      if (!coupon || couponExpires < new Date()) {
        return res.status(400).json({ message: "Invalid or expired coupon" });
      }

      if (coupon.appliesTo !== "all" && coupon.appliesTo.toString() !== courseId) {
        return res.status(400).json({ message: "Coupon not valid for this course" });
      }

      finalPrice -= (finalPrice * coupon.discountPercent) / 100;

       // ✅ Increment usageCount (optional)
      coupon.usageCount += 1;
      await coupon.save();
    }

    // ✅ If course is free or 100% discounted
    if (finalPrice <= 0) {
      await Enrollment.create({
        student: studentId,
        course: courseId,
        paymentStatus: "paid",
        amountPaid: 0,
      });

      await Course.findByIdAndUpdate(courseId, {
        $addToSet: { enrolledStudents: studentId },
      });

      return res.status(200).json({
        success: true,
        message: "Free enrollment successful",
      });
    }

    // ✅ Paid enrollment - create Stripe session
    const session = await stripe.checkout.sessions.create({
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
    console.log("Session url: ", session.url)

    res.status(200).json({ id: session.id, url: session.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    res.status(500).json({ message: "Error creating checkout session" });
  }
};


export const getUserEnrollments = async (req: Request, res: Response) => {
  try {
    const studentId = req.params.studentId;

    const enrollments = await Enrollment.find({ student: studentId })
      .populate({
        path: "course",
        select: "name description courseThumbnail coursePrice discount educator", 
        // ✅ No courseContent or enrolledStudents to reduce payload
      })
      .lean();

    res.status(200).json({
      success: true,
      enrollments,
    });
  } catch (error) {
    console.error("Error fetching enrollments:", error);
    res.status(500).json({ message: "Error fetching enrollments" });
  }
};
