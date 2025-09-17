// controllers/courseProgress.controller.ts
import { Request, Response } from "express";
import CourseProgress from "../models/progress.model";
import { getCache, invalidateCache, setCache } from "../utils/cache";
import { catchAsync } from "../middlewares/catchAsync";
import Enrollment from "../models/enrollment.model";
import Course from "../models/courses.model";

// Mark lecture as completed
export const markLectureCompleted = catchAsync(async (req: Request, res: Response) => {
  const { userId, courseId, lectureId } = req.body;

  if (!userId || !courseId || !lectureId) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  // ✅ Check enrollment
  const enrollment = await Enrollment.findOne({ student: userId, course: courseId });
  if (!enrollment) {
    return res.status(403).json({ success: false, message: "User is not enrolled in this course" });
  }

  // ✅ Validate lectureId exists in course content
  const course = await Course.findById(courseId).lean();
  if (!course) {
    return res.status(404).json({ success: false, message: "Course not found" });
  }

  const allLectureIds = course.courseContent.flatMap(chapter => 
    chapter.chapterContent.map(lecture => lecture.lectureId)
  );

  if (!allLectureIds.includes(lectureId)) {
    return res.status(400).json({ success: false, message: "Invalid lectureId" });
  }

  const cacheKey = `user:${userId}:courseProgress:${courseId}`;

  // 1️⃣ Check Redis cache first
  let progress = await getCache(cacheKey);

  if (!progress) {
    progress = await CourseProgress.findOne({ userId, courseId }).lean() || {
      userId,
      courseId,
      lectureCompleted: []
    };
  }

  // 2️⃣ Add lecture if not completed
  if (!progress.lectureCompleted.includes(lectureId)) {
    progress.lectureCompleted.push(lectureId);

    // 3️⃣ Save to Redis immediately
    await setCache(cacheKey, progress, 60 * 60); // 1 hour TTL

    // 4️⃣ Persist to MongoDB asynchronously
    CourseProgress.findOneAndUpdate(
      { userId, courseId },
      { $set: { lectureCompleted: progress.lectureCompleted } },
      { upsert: true }
    ).exec();
  }

  // 5️⃣ Invalidate enrolled courses cache
  await invalidateCache(`user:${userId}:enrolledCourses`);

  res.json({ success: true, message: "Lecture marked as completed", progress });
});

// Get course progress
export const getCourseProgress = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { courseId } = req.params;

    const progress = await CourseProgress.findOne({ userId, courseId }).lean();

    res.status(200).json({ success: true, progress: progress || { lectureCompleted: [] } });
  } catch (err: any) {
    console.error("Error fetching course progress:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
