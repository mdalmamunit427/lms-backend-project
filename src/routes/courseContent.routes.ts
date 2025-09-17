// routes/courseContent.routes.ts
import { Router } from "express";
import * as courseContentController from "../controllers/courseContent.controller";
import { authorizeRole, isAuthenticated } from "../middlewares/auth";

const router = Router({ mergeParams: true });
router.use(isAuthenticated, authorizeRole("educator"));

// ----------------------------
// 📚 CHAPTER ROUTES
// ----------------------------

// Add a new chapter
router.post("/", courseContentController.addChapter);

// Update an existing chapter
router.put("/:chapterId", courseContentController.updateChapter);

// Delete a chapter
router.delete("/chapters/:chapterId", courseContentController.deleteChapter);

// Reorder chapters
router.patch("/chapters/reorder", courseContentController.reorderChapters);

/* ----------------------------
 🎥 LECTURE ROUTES (Nested under chapter)
// ---------------------------- *///

// Add a lecture to a chapter
router.post("/chapters/:chapterId/lectures", courseContentController.addLecture);

// Update a lecture
router.put("/chapters/:chapterId/lectures/:lectureId", courseContentController.updateLecture);

// // Delete a lecture
router.delete("/chapters/:chapterId/lectures/:lectureId", courseContentController.deleteLecture);

// Reorder lectures within a chapter
router.patch("/chapters/:chapterId/lectures/reorder", courseContentController.reorderLectures);

export default router;
