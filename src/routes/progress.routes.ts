// routes/courseProgress.routes.ts
import { Router } from "express";
import { getCourseProgress, markLectureCompleted } from "../controllers/progress.controller";

const router = Router();

// Mark a lecture as completed
router.post("/complete", markLectureCompleted);

// Get course progress for a user
router.get("/:courseId/user/:userId", getCourseProgress);

export default router;
