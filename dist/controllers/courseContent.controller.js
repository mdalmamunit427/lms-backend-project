"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reorderLectures = exports.deleteLecture = exports.updateLecture = exports.addLecture = exports.reorderChapters = exports.deleteChapter = exports.updateChapter = exports.addChapter = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const courses_model_1 = __importDefault(require("../models/courses.model"));
const AppError_1 = require("../utils/AppError");
const cache_1 = require("../utils/cache");
const catchAsync_1 = require("../middlewares/catchAsync");
const withTransaction_1 = require("../utils/withTransaction");
// 🔧 Helper: Find course by ID safely & invalidate cache
const findCourseOrFailAndInvalidate = async (courseId, session) => {
    const course = await courses_model_1.default.findById(courseId).session(session || null);
    if (!course)
        throw new AppError_1.AppError("Course not found", 404);
    const invalidate = async () => {
        await (0, cache_1.invalidateCache)("courses");
        await (0, cache_1.invalidateCache)(`course:id=${courseId}`);
    };
    return { course, invalidate };
};
// -------------------------
// 📚 CHAPTER OPERATIONS
// -------------------------
exports.addChapter = (0, catchAsync_1.catchAsync)(async (req, res) => {
    await (0, withTransaction_1.withTransaction)(async (session) => {
        const { chapterTitle } = req.body;
        if (!chapterTitle)
            throw new AppError_1.AppError("Chapter title is required", 400);
        const courseId = req.params.id;
        const { course, invalidate } = await findCourseOrFailAndInvalidate(courseId, session);
        const newChapter = {
            chapterId: new mongoose_1.default.Types.ObjectId().toString(),
            chapterOrder: course.courseContent.length + 1,
            chapterTitle,
            chapterContent: [],
        };
        course.courseContent.push(newChapter);
        await course.save({ session });
        await invalidate();
        res.status(201).json({ success: true, message: "Chapter added successfully", course });
    });
});
exports.updateChapter = (0, catchAsync_1.catchAsync)(async (req, res) => {
    await (0, withTransaction_1.withTransaction)(async (session) => {
        const { chapterTitle } = req.body;
        if (!chapterTitle)
            throw new AppError_1.AppError("Chapter title is required", 400);
        const courseId = req.params.id;
        const { course, invalidate } = await findCourseOrFailAndInvalidate(courseId, session);
        const chapter = course.courseContent.find((ch) => ch.chapterId === req.params.chapterId);
        if (!chapter)
            throw new AppError_1.AppError("Chapter not found", 404);
        chapter.chapterTitle = chapterTitle;
        await course.save({ session });
        await invalidate();
        res.json({ success: true, message: "Chapter updated successfully", course });
    });
});
exports.deleteChapter = (0, catchAsync_1.catchAsync)(async (req, res) => {
    await (0, withTransaction_1.withTransaction)(async (session) => {
        const courseId = req.params.id;
        const { course, invalidate } = await findCourseOrFailAndInvalidate(courseId, session);
        const initialLength = course.courseContent.length;
        course.courseContent = course.courseContent.filter(ch => ch.chapterId !== req.params.chapterId);
        if (course.courseContent.length === initialLength)
            throw new AppError_1.AppError("Chapter not found", 404);
        // Reorder chapters
        course.courseContent.forEach((ch, idx) => (ch.chapterOrder = idx + 1));
        await course.save({ session });
        await invalidate();
        res.json({ success: true, message: "Chapter deleted successfully", course });
    });
});
exports.reorderChapters = (0, catchAsync_1.catchAsync)(async (req, res) => {
    console.log("Reorder chapter");
    await (0, withTransaction_1.withTransaction)(async (session) => {
        const { newOrder } = req.body;
        if (!Array.isArray(newOrder))
            throw new AppError_1.AppError("newOrder must be an array of chapterIds", 400);
        const courseId = req.params.id;
        const { course, invalidate } = await findCourseOrFailAndInvalidate(courseId, session);
        if (newOrder.length !== course.courseContent.length)
            throw new AppError_1.AppError("Invalid reorder list - mismatch in chapters count", 400);
        course.courseContent.sort((a, b) => newOrder.indexOf(a.chapterId) - newOrder.indexOf(b.chapterId));
        course.courseContent.forEach((ch, idx) => (ch.chapterOrder = idx + 1));
        await course.save({ session });
        await invalidate();
        res.json({ success: true, message: "Chapters reordered successfully", course });
    });
});
// -------------------------
// 🎥 LECTURE OPERATIONS
// -------------------------
exports.addLecture = (0, catchAsync_1.catchAsync)(async (req, res) => {
    await (0, withTransaction_1.withTransaction)(async (session) => {
        const { lectureTitle, lectureDuration, lectureUrl, isPreviewFree } = req.body;
        if (!lectureTitle || !lectureUrl || lectureDuration === undefined)
            throw new AppError_1.AppError("Lecture title, URL, and duration are required", 400);
        const courseId = req.params.id;
        const { course, invalidate } = await findCourseOrFailAndInvalidate(courseId, session);
        const chapter = course.courseContent.find(ch => ch.chapterId === req.params.chapterId);
        if (!chapter)
            throw new AppError_1.AppError("Chapter not found", 404);
        const newLecture = {
            lectureId: new mongoose_1.default.Types.ObjectId().toString(),
            lectureTitle,
            lectureDuration,
            lectureUrl,
            isPreviewFree: !!isPreviewFree,
            lectureOrder: chapter.chapterContent.length + 1,
        };
        chapter.chapterContent.push(newLecture);
        await course.save({ session });
        await invalidate();
        res.status(201).json({ success: true, message: "Lecture added successfully", course });
    });
});
exports.updateLecture = (0, catchAsync_1.catchAsync)(async (req, res) => {
    await (0, withTransaction_1.withTransaction)(async (session) => {
        const { lectureTitle, lectureDuration, lectureUrl, isPreviewFree } = req.body;
        const courseId = req.params.id;
        const { course, invalidate } = await findCourseOrFailAndInvalidate(courseId, session);
        const chapter = course.courseContent.find(ch => ch.chapterId === req.params.chapterId);
        if (!chapter)
            throw new AppError_1.AppError("Chapter not found", 404);
        const lecture = chapter.chapterContent.find(l => l.lectureId === req.params.lectureId);
        if (!lecture)
            throw new AppError_1.AppError("Lecture not found", 404);
        if (lectureTitle !== undefined)
            lecture.lectureTitle = lectureTitle;
        if (lectureDuration !== undefined)
            lecture.lectureDuration = lectureDuration;
        if (lectureUrl !== undefined)
            lecture.lectureUrl = lectureUrl;
        if (isPreviewFree !== undefined)
            lecture.isPreviewFree = !!isPreviewFree;
        await course.save({ session });
        await invalidate();
        res.json({ success: true, message: "Lecture updated successfully", course });
    });
});
exports.deleteLecture = (0, catchAsync_1.catchAsync)(async (req, res) => {
    await (0, withTransaction_1.withTransaction)(async (session) => {
        const courseId = req.params.id;
        const { course, invalidate } = await findCourseOrFailAndInvalidate(courseId, session);
        const chapter = course.courseContent.find(ch => ch.chapterId === req.params.chapterId);
        if (!chapter)
            throw new AppError_1.AppError("Chapter not found", 404);
        const initialLength = chapter.chapterContent.length;
        chapter.chapterContent = chapter.chapterContent.filter(l => l.lectureId !== req.params.lectureId);
        if (chapter.chapterContent.length === initialLength)
            throw new AppError_1.AppError("Lecture not found", 404);
        chapter.chapterContent.forEach((l, idx) => (l.lectureOrder = idx + 1));
        await course.save({ session });
        await invalidate();
        res.json({ success: true, message: "Lecture deleted successfully", course });
    });
});
exports.reorderLectures = (0, catchAsync_1.catchAsync)(async (req, res) => {
    await (0, withTransaction_1.withTransaction)(async (session) => {
        const { newOrder } = req.body;
        if (!Array.isArray(newOrder))
            throw new AppError_1.AppError("newOrder must be an array of lectureIds", 400);
        const courseId = req.params.id;
        const { course, invalidate } = await findCourseOrFailAndInvalidate(courseId, session);
        const chapter = course.courseContent.find(ch => ch.chapterId === req.params.chapterId);
        if (!chapter)
            throw new AppError_1.AppError("Chapter not found", 404);
        if (newOrder.length !== chapter.chapterContent.length)
            throw new AppError_1.AppError("Invalid reorder list - mismatch in lecture count", 400);
        chapter.chapterContent.sort((a, b) => newOrder.indexOf(a.lectureId) - newOrder.indexOf(b.lectureId));
        chapter.chapterContent.forEach((l, idx) => (l.lectureOrder = idx + 1));
        await course.save({ session });
        await invalidate();
        res.json({ success: true, message: "Lectures reordered successfully", course });
    });
});
//# sourceMappingURL=courseContent.controller.js.map