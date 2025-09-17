// controllers/courses.controller.ts
import { Request, Response } from "express";
import cloudinary from "cloudinary";
import { catchAsync } from "../middlewares/catchAsync";
import Course from "../models/courses.model";
import { AppError } from "../utils/AppError";
import { invalidateCache, setCache } from "../utils/cache";
import { AuthRequest } from "../middlewares/auth";


// GET ALL COURSES
export const getAllCourses = catchAsync(async (req: any, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string || "1"));
  const limit = Math.min(100, parseInt(req.query.limit as string || "9"));
  const search = req.query.search as string || "";

  const query: any = { isPublished: true };
  if (search) query.name = { $regex: search, $options: "i" };

  const total = await Course.countDocuments(query);
  const courses = await Course.find(query)
    .select(["-courseContent", "-enrolledStudents"])
    .populate({ path: "educator", select: "-password" })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  if (!courses || courses.length === 0) throw new AppError("No courses found", 404);

  const responseData = {
    success: true,
    courses,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    cached: false,
  };

  if (req.cacheKey) await setCache(req.cacheKey, responseData, 15 * 60);
  res.json(responseData);
});

// GET COURSE BY ID
export const getCourseById = catchAsync(async (req: any, res: Response) => {
  const { id } = req.params;
  if (!id) throw new AppError("Course ID is required", 400);

  const courseDoc = await Course.findById(id)
    .populate({ path: "educator", select: "-password" })
    .lean();

  if (!courseDoc) throw new AppError("Course not found", 404);

  if (Array.isArray(courseDoc.courseContent)) {
    for (const chapter of courseDoc.courseContent) {
      if (!Array.isArray(chapter.chapterContent)) continue;
      for (const lecture of chapter.chapterContent) {
        if (!lecture.isPreviewFree) lecture.lectureUrl = "";
      }
    }
  }

  if (req.cacheKey) await setCache(req.cacheKey, { success: true, courseData: courseDoc, cached: false }, 15 * 60);
  res.json({ success: true, courseData: courseDoc, cached: false });
});

// CREATE COURSE
export const createCourse = catchAsync(async (req: AuthRequest, res: Response) => {
  const { name, description, courseThumbnail, coursePrice, discount, isPublished } = req.body;
  if (!name || !description || !coursePrice) throw new AppError("Name, description, and price are required", 400);
  if (discount && (discount < 0 || discount > 100)) throw new AppError("Discount must be between 0 and 100", 400);

  let uploadedThumbnail;
  if (courseThumbnail) {
    const result = await cloudinary.v2.uploader.upload(courseThumbnail, {
      folder: "course-thumbnails", width: 1920, crop: "scale"
    });
    uploadedThumbnail = { public_id: result.public_id, url: result.secure_url };
  }

  const newCourse = await Course.create({
    name, description, courseThumbnail: uploadedThumbnail,
    coursePrice, discount: discount || 0,
    educator: req.user?._id, isPublished: isPublished || false,
    courseContent: []
  });

  // Invalidate relevant caches
  await invalidateCache("courses");
  await invalidateCache(`course:${newCourse._id}`);

  res.status(201).json({ success: true, message: "Course created successfully", course: newCourse });
});

// UPDATE COURSE
export const updateCourse = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, description, courseThumbnail, coursePrice, discount, isPublished } = req.body;

  const course = await Course.findById(id);
  if (!course) throw new AppError("Course not found", 404);

  if (name) course.name = name;
  if (description) course.description = description;
  if (coursePrice) course.coursePrice = coursePrice;
  if (discount !== undefined) course.discount = discount;
  if (isPublished !== undefined) course.isPublished = isPublished;

  if (courseThumbnail) {
    if (course.courseThumbnail?.public_id)
      await cloudinary.v2.uploader.destroy(course.courseThumbnail.public_id);

    const result = await cloudinary.v2.uploader.upload(courseThumbnail, {
      folder: "course-thumbnails",
      width: 1920,
      crop: "scale",
    });
    course.courseThumbnail = { public_id: result.public_id, url: result.secure_url };
  }

  await course.save();

  // --- Correct cache invalidation ---
  await invalidateCache("courses"); // invalidate all course list caches
  await invalidateCache(`course:id=${id}`); // invalidate single course cache

  res.json({ success: true, message: "Course updated successfully", course });
});

// DELETE COURSE
export const deleteCourse = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const course = await Course.findById(id);
  if (!course) throw new AppError("Course not found", 404);

  if (course.courseThumbnail?.public_id) await cloudinary.v2.uploader.destroy(course.courseThumbnail.public_id);
  await course.deleteOne();

  await invalidateCache("courses"); // invalidate all course list caches
  await invalidateCache(`course:id=${id}`); // invalidate single course cache

  res.json({ success: true, message: "Course deleted successfully" });
});
