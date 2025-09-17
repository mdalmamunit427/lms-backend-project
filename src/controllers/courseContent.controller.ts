import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import Course, { IChapter, ILecture } from "../models/courses.model";
import { AppError } from "../utils/AppError";
import { invalidateCache } from "../utils/cache";
import { catchAsync } from "../middlewares/catchAsync";
import { ChapterIdParam, CourseIdParam, LectureIdParam } from "../@types/routeParams";
import { withTransaction } from "../utils/withTransaction";


// 🔧 Helper: Find course by ID safely & invalidate cache
const findCourseOrFailAndInvalidate = async (courseId: string, session?: mongoose.ClientSession) => {
  const course = await Course.findById(courseId).session(session || null);
  if (!course) throw new AppError("Course not found", 404);
  const invalidate = async () => {
    await invalidateCache("courses"); 
    await invalidateCache(`course:id=${courseId}`);
  };
  return { course, invalidate };
};

// -------------------------
// 📚 CHAPTER OPERATIONS
// -------------------------

export const addChapter = catchAsync(async (req: Request<CourseIdParam>, res: Response) => {
  await withTransaction(async (session) => {
    const { chapterTitle } = req.body;
    if (!chapterTitle) throw new AppError("Chapter title is required", 400);

    const courseId = req.params.id as string;

    const { course, invalidate } = await findCourseOrFailAndInvalidate(courseId, session);

    const newChapter: IChapter = {
      chapterId: new mongoose.Types.ObjectId().toString(),
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

export const updateChapter = catchAsync(async (req: Request<ChapterIdParam>, res: Response) => {
  await withTransaction(async (session) => {
    const { chapterTitle } = req.body;
    if (!chapterTitle) throw new AppError("Chapter title is required", 400);

    const courseId = req.params.id as string;
    const { course, invalidate } = await findCourseOrFailAndInvalidate(courseId, session);
    const chapter = course.courseContent.find((ch) => ch.chapterId === req.params.chapterId);
    if (!chapter) throw new AppError("Chapter not found", 404);

    chapter.chapterTitle = chapterTitle;
    await course.save({ session });
    await invalidate();

    res.json({ success: true, message: "Chapter updated successfully", course });
  });
});

export const deleteChapter = catchAsync(async (req: Request<ChapterIdParam>, res: Response) => {
  await withTransaction(async (session) => {
    const courseId = req.params.id as string;
    const { course, invalidate } = await findCourseOrFailAndInvalidate(courseId, session);

    const initialLength = course.courseContent.length;
    course.courseContent = course.courseContent.filter(ch => ch.chapterId !== req.params.chapterId);
    if (course.courseContent.length === initialLength) throw new AppError("Chapter not found", 404);

    // Reorder chapters
    course.courseContent.forEach((ch, idx) => (ch.chapterOrder = idx + 1));
    await course.save({ session });
    await invalidate();

    res.json({ success: true, message: "Chapter deleted successfully", course });
  });
});

export const reorderChapters = catchAsync(async (req: Request<CourseIdParam>, res: Response) => {

  console.log("Reorder chapter")
  await withTransaction(async (session) => {
    const { newOrder } = req.body;
    if (!Array.isArray(newOrder)) throw new AppError("newOrder must be an array of chapterIds", 400);

    const courseId = req.params.id as string;
    const { course, invalidate } = await findCourseOrFailAndInvalidate(courseId, session);
    if (newOrder.length !== course.courseContent.length)
      throw new AppError("Invalid reorder list - mismatch in chapters count", 400);

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

export const addLecture = catchAsync(async (req: Request<ChapterIdParam>, res: Response) => {
  await withTransaction(async (session) => {
    const { lectureTitle, lectureDuration, lectureUrl, isPreviewFree } = req.body;
    if (!lectureTitle || !lectureUrl || lectureDuration === undefined) throw new AppError("Lecture title, URL, and duration are required", 400);

    const courseId = req.params.id as string;
    const { course, invalidate } = await findCourseOrFailAndInvalidate(courseId, session);
    const chapter = course.courseContent.find(ch => ch.chapterId === req.params.chapterId);
    if (!chapter) throw new AppError("Chapter not found", 404);

    const newLecture: ILecture = {
      lectureId: new mongoose.Types.ObjectId().toString(),
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

export const updateLecture = catchAsync(async (req: Request<LectureIdParam>, res: Response) => {
  await withTransaction(async (session) => {
    const { lectureTitle, lectureDuration, lectureUrl, isPreviewFree } = req.body;

    const courseId = req.params.id as string;
    const { course, invalidate } = await findCourseOrFailAndInvalidate(courseId, session);
    const chapter = course.courseContent.find(ch => ch.chapterId === req.params.chapterId);
    if (!chapter) throw new AppError("Chapter not found", 404);

    const lecture = chapter.chapterContent.find(l => l.lectureId === req.params.lectureId);
    if (!lecture) throw new AppError("Lecture not found", 404);

    if (lectureTitle !== undefined) lecture.lectureTitle = lectureTitle;
    if (lectureDuration !== undefined) lecture.lectureDuration = lectureDuration;
    if (lectureUrl !== undefined) lecture.lectureUrl = lectureUrl;
    if (isPreviewFree !== undefined) lecture.isPreviewFree = !!isPreviewFree;

    await course.save({ session });
    await invalidate();

    res.json({ success: true, message: "Lecture updated successfully", course });
  });
});

export const deleteLecture = catchAsync(async (req: Request<LectureIdParam>, res: Response) => {
  await withTransaction(async (session) => {
    const courseId = req.params.id as string;
    const { course, invalidate } = await findCourseOrFailAndInvalidate(courseId, session);
    const chapter = course.courseContent.find(ch => ch.chapterId === req.params.chapterId);
    if (!chapter) throw new AppError("Chapter not found", 404);

    const initialLength = chapter.chapterContent.length;
    chapter.chapterContent = chapter.chapterContent.filter(l => l.lectureId !== req.params.lectureId);
    if (chapter.chapterContent.length === initialLength) throw new AppError("Lecture not found", 404);

    chapter.chapterContent.forEach((l, idx) => (l.lectureOrder = idx + 1));

    await course.save({ session });
    await invalidate();

    res.json({ success: true, message: "Lecture deleted successfully", course });
  });
});

export const reorderLectures = catchAsync(async (req: Request<ChapterIdParam>, res: Response) => {
  await withTransaction(async (session) => {
    const { newOrder } = req.body;
    if (!Array.isArray(newOrder)) throw new AppError("newOrder must be an array of lectureIds", 400);

    const courseId = req.params.id as string;
    const { course, invalidate } = await findCourseOrFailAndInvalidate(courseId, session);
    const chapter = course.courseContent.find(ch => ch.chapterId === req.params.chapterId);
    if (!chapter) throw new AppError("Chapter not found", 404);

    if (newOrder.length !== chapter.chapterContent.length)
      throw new AppError("Invalid reorder list - mismatch in lecture count", 400);

    chapter.chapterContent.sort((a, b) => newOrder.indexOf(a.lectureId) - newOrder.indexOf(b.lectureId));
    chapter.chapterContent.forEach((l, idx) => (l.lectureOrder = idx + 1));

    await course.save({ session });
    await invalidate();

    res.json({ success: true, message: "Lectures reordered successfully", course });
  });
});
