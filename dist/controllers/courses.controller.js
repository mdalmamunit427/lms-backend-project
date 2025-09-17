"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCourse = exports.updateCourse = exports.createCourse = exports.getCourseById = exports.getAllCourses = void 0;
const cloudinary_1 = __importDefault(require("cloudinary"));
const catchAsync_1 = require("../middlewares/catchAsync");
const courses_model_1 = __importDefault(require("../models/courses.model"));
const AppError_1 = require("../utils/AppError");
const cache_1 = require("../utils/cache");
// GET ALL COURSES
exports.getAllCourses = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page || "1"));
    const limit = Math.min(100, parseInt(req.query.limit || "9"));
    const search = req.query.search || "";
    const query = { isPublished: true };
    if (search)
        query.name = { $regex: search, $options: "i" };
    const total = await courses_model_1.default.countDocuments(query);
    const courses = await courses_model_1.default.find(query)
        .select(["-courseContent", "-enrolledStudents"])
        .populate({ path: "educator", select: "-password" })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();
    if (!courses || courses.length === 0)
        throw new AppError_1.AppError("No courses found", 404);
    const responseData = {
        success: true,
        courses,
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        cached: false,
    };
    if (req.cacheKey)
        await (0, cache_1.setCache)(req.cacheKey, responseData, 15 * 60);
    res.json(responseData);
});
// GET COURSE BY ID
exports.getCourseById = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { id } = req.params;
    if (!id)
        throw new AppError_1.AppError("Course ID is required", 400);
    const courseDoc = await courses_model_1.default.findById(id)
        .populate({ path: "educator", select: "-password" })
        .lean();
    if (!courseDoc)
        throw new AppError_1.AppError("Course not found", 404);
    if (Array.isArray(courseDoc.courseContent)) {
        for (const chapter of courseDoc.courseContent) {
            if (!Array.isArray(chapter.chapterContent))
                continue;
            for (const lecture of chapter.chapterContent) {
                if (!lecture.isPreviewFree)
                    lecture.lectureUrl = "";
            }
        }
    }
    if (req.cacheKey)
        await (0, cache_1.setCache)(req.cacheKey, { success: true, courseData: courseDoc, cached: false }, 15 * 60);
    res.json({ success: true, courseData: courseDoc, cached: false });
});
// CREATE COURSE
exports.createCourse = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { name, description, courseThumbnail, coursePrice, discount, isPublished } = req.body;
    if (!name || !description || !coursePrice)
        throw new AppError_1.AppError("Name, description, and price are required", 400);
    if (discount && (discount < 0 || discount > 100))
        throw new AppError_1.AppError("Discount must be between 0 and 100", 400);
    let uploadedThumbnail;
    if (courseThumbnail) {
        const result = await cloudinary_1.default.v2.uploader.upload(courseThumbnail, {
            folder: "course-thumbnails", width: 1920, crop: "scale"
        });
        uploadedThumbnail = { public_id: result.public_id, url: result.secure_url };
    }
    const newCourse = await courses_model_1.default.create({
        name, description, courseThumbnail: uploadedThumbnail,
        coursePrice, discount: discount || 0,
        educator: req.user?._id, isPublished: isPublished || false,
        courseContent: []
    });
    // Invalidate relevant caches
    await (0, cache_1.invalidateCache)("courses");
    await (0, cache_1.invalidateCache)(`course:${newCourse._id}`);
    res.status(201).json({ success: true, message: "Course created successfully", course: newCourse });
});
// UPDATE COURSE
exports.updateCourse = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { id } = req.params;
    const { name, description, courseThumbnail, coursePrice, discount, isPublished } = req.body;
    const course = await courses_model_1.default.findById(id);
    if (!course)
        throw new AppError_1.AppError("Course not found", 404);
    if (name)
        course.name = name;
    if (description)
        course.description = description;
    if (coursePrice)
        course.coursePrice = coursePrice;
    if (discount !== undefined)
        course.discount = discount;
    if (isPublished !== undefined)
        course.isPublished = isPublished;
    if (courseThumbnail) {
        if (course.courseThumbnail?.public_id)
            await cloudinary_1.default.v2.uploader.destroy(course.courseThumbnail.public_id);
        const result = await cloudinary_1.default.v2.uploader.upload(courseThumbnail, {
            folder: "course-thumbnails",
            width: 1920,
            crop: "scale",
        });
        course.courseThumbnail = { public_id: result.public_id, url: result.secure_url };
    }
    await course.save();
    // --- Correct cache invalidation ---
    await (0, cache_1.invalidateCache)("courses"); // invalidate all course list caches
    await (0, cache_1.invalidateCache)(`course:id=${id}`); // invalidate single course cache
    res.json({ success: true, message: "Course updated successfully", course });
});
// DELETE COURSE
exports.deleteCourse = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { id } = req.params;
    const course = await courses_model_1.default.findById(id);
    if (!course)
        throw new AppError_1.AppError("Course not found", 404);
    if (course.courseThumbnail?.public_id)
        await cloudinary_1.default.v2.uploader.destroy(course.courseThumbnail.public_id);
    await course.deleteOne();
    await (0, cache_1.invalidateCache)("courses"); // invalidate all course list caches
    await (0, cache_1.invalidateCache)(`course:id=${id}`); // invalidate single course cache
    res.json({ success: true, message: "Course deleted successfully" });
});
//# sourceMappingURL=courses.controller.js.map