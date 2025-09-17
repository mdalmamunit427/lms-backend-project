// controllers/enrollment.controller.ts
import { Request, Response } from "express";

import stripe from "../utils/stripe";
import Course from "../models/courses.model";
import Enrollment from "../models/enrollment.model";
import Coupon from "../models/coupon.model";
import { getCache, invalidateCache, setCache } from "../utils/cache";
import { User } from "../models/user.model";
import CourseProgress from "../models/progress.model";
import { AuthRequest } from "../middlewares/auth";
import { redis } from "../utils/redis";

// export const createCheckoutSession = async (req: Request, res: Response) => {
//   try {
//     const { courseId, studentId, couponCode } = req.body;

//     const course = await Course.findById(courseId);
//     if (!course) return res.status(404).json({ message: "Course not found" });

//     // ✅ Check if student already enrolled
//     const alreadyEnrolled = await Enrollment.findOne({ course: courseId, student: studentId });
//     if (alreadyEnrolled) {
//       return res.status(400).json({ message: "Student is already enrolled in this course" });
//     }

//     // 1️⃣ Start with course price
//     let finalPrice = course.coursePrice;

//     // 2️⃣ Apply course's own discount first
//     if (course.discount && course.discount > 0) {
//       finalPrice -= (finalPrice * course.discount) / 100;
//     }

//     // 3️⃣ Apply coupon discount if provided
//     if (couponCode) {
//       const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
      
//       const couponExpires = coupon?.expiresAt as Date;

//       if (!coupon || couponExpires < new Date()) {
//         return res.status(400).json({ message: "Invalid or expired coupon" });
//       }

//       if (coupon.appliesTo !== "all" && coupon.appliesTo.toString() !== courseId) {
//         return res.status(400).json({ message: "Coupon not valid for this course" });
//       }

//       finalPrice -= (finalPrice * coupon.discountPercent) / 100;

//        // ✅ Increment usageCount (optional)
//       coupon.usageCount += 1;
//       await coupon.save();
//     }

//     // ✅ If course is free or 100% discounted
//     if (finalPrice <= 0) {
//       await Enrollment.create({
//         student: studentId,
//         course: courseId,
//         paymentStatus: "paid",
//         amountPaid: 0,
//       });

//       await Course.findByIdAndUpdate(courseId, {
//         $addToSet: { enrolledStudents: studentId },
//       });

//       return res.status(200).json({
//         success: true,
//         message: "Free enrollment successful",
//       });
//     }

//     // ✅ Paid enrollment - create Stripe session
//     const session = await stripe.checkout.sessions.create({
//       payment_method_types: ["card"],
//       mode: "payment",
//       line_items: [
//         {
//           price_data: {
//             currency: "usd",
//             product_data: { name: course.name },
//             unit_amount: Math.round(finalPrice * 100),
//           },
//           quantity: 1,
//         },
//       ],
//       metadata: {
//         courseId,
//         studentId,
//       },
//       success_url: `${process.env.FRONTEND_URL}/enroll/success?session_id={CHECKOUT_SESSION_ID}`,
//       cancel_url: `${process.env.FRONTEND_URL}/enroll/cancel`,
//     });
//     // open the  session.url and do manual payment using cards
//     console.log("Session id: ", session.id);
//     console.log("Session url: ", session.url)

//     res.status(200).json({ id: session.id, url: session.url });
//   } catch (error) {
//     console.error("Error creating checkout session:", error);
//     res.status(500).json({ message: "Error creating checkout session" });
//   }
// };

export const createCheckoutSession = async (req: AuthRequest, res: Response) => {
  try {
    const { courseId, couponCode } = req.body;
    const studentId = req.user?._id as string;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    // Check if student already enrolled
    const alreadyEnrolled = await Enrollment.findOne({ course: courseId, student: studentId });
    if (alreadyEnrolled) {
      return res.status(400).json({ message: "Student is already enrolled in this course" });
    }

    // Start with course price
    let finalPrice = course.coursePrice;

    // Apply course discount first
    if (course.discount && course.discount > 0) {
      finalPrice -= (finalPrice * course.discount) / 100;
    }

    // Apply coupon if exists
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
      const now = new Date();

      if (!coupon || (coupon.expiresAt && coupon.expiresAt < now)) {
        return res.status(400).json({ message: "Invalid or expired coupon" });
      }

      if (coupon.appliesTo !== "all" && coupon.appliesTo.toString() !== courseId) {
        return res.status(400).json({ message: "Coupon not valid for this course" });
      }

      finalPrice -= (finalPrice * coupon.discountPercent) / 100;

      // Increment usage count
      coupon.usageCount += 1;
      await coupon.save();
    }

    // Free enrollment
    if (finalPrice <= 0) {
      await Enrollment.create({
        student: studentId,
        course: courseId,
        paymentStatus: "paid",
        amountPaid: 0,
      });

      await Course.findByIdAndUpdate(courseId, { $addToSet: { enrolledStudents: studentId } });
      await User.findByIdAndUpdate(studentId, { $addToSet: { courses: courseId } })

      // Invalidate caches
      await invalidateCache("courses"); // invalidates all cached courses
      await invalidateCache(`course:id=${courseId}`); // invalidate single course cache
      await redis.del(studentId);

      return res.status(200).json({ success: true, message: "Free enrollment successful" });
    }

    // Paid enrollment – create Stripe session
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
      metadata: { courseId, studentId },
      success_url: `${process.env.FRONTEND_URL}/enroll/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/enroll/cancel`,
    });

    res.status(200).json({ id: session.id, url: session.url });
  } catch (error: any) {
    console.error("Error creating checkout session:", error);
    res.status(500).json({ message: "Error creating checkout session" });
  }
};


export const getEnrolledCourses = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id; // or req.auth.userId if using auth middleware
    const cacheKey = `user:${userId}:enrolledCourses`;

    // 1️⃣ Check Redis cache first
    const cachedData = await getCache(cacheKey);
    if (cachedData) return res.json({ success: true, ...cachedData, cached: true });

    // 2️⃣ Fetch enrolled courses
    const user = await User.findById(userId).populate("courses").lean();
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const enrolledCourses = user.courses || [];

    // 3️⃣ Calculate progress for each course
    const coursesWithProgress = await Promise.all(
      enrolledCourses.map(async (course: any) => {
        const progressData = await CourseProgress.findOne({
          userId,
          courseId: course._id,
        }).lean();

        const totalLectures = course.courseContent.reduce(
          (sum: number, chapter: any) => sum + (chapter.chapterContent?.length || 0),
          0
        );

        const completedLectures = progressData?.lectureCompleted?.length || 0;

        return {
          ...course,
          progress: {
            lectureCompleted: progressData?.lectureCompleted || [],
            totalLectures,
            completedLectures,
            completionPercentage: totalLectures
              ? Math.round((completedLectures * 100) / totalLectures)
              : 0,
            rewardPoints: completedLectures * 5,
            updatedAt: progressData?.updatedAt || course.createdAt,
          },
        };
      })
    );

    // 4️⃣ Sort courses by recent progress
    const sortedCourses = coursesWithProgress.sort((a, b) => {
      const aUpdated = a.progress.updatedAt || a.createdAt;
      const bUpdated = b.progress.updatedAt || b.createdAt;
      return new Date(bUpdated).getTime() - new Date(aUpdated).getTime();
    });

    // 5️⃣ Calculate total stats
    const totalCoursesCompleted = sortedCourses.filter(
      (course) => course.progress.completedLectures === course.progress.totalLectures
    ).length;

    const totalRewardPoints = sortedCourses.reduce(
      (sum, course) => sum + (course.progress.rewardPoints || 0),
      0
    );

    const responseData = {
      enrolledCourses: sortedCourses,
      totalCoursesCompleted,
      totalRewardPoints,
    };

    // 6️⃣ Cache the result for 5 minutes (300s)
    await setCache(cacheKey, responseData, 300);

    res.json({ success: true, ...responseData, cached: false });
  } catch (err: any) {
    console.error("Error fetching enrolled courses:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};