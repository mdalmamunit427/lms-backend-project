// routes/courses.routes.ts
import express from "express";
import { cacheMiddleware } from "../middlewares/cacheMiddleware";
import { authorizeRole, isAuthenticated } from "../middlewares/auth";
import { createCourse, deleteCourse, getAllCourses, getCourseById, updateCourse } from "../controllers/courses.controller";
import courseContentRoutes from "./courseContent.routes"

const router = express.Router();

// ---------------- GET ----------------
// List courses with cache
router.get("/", cacheMiddleware("courses", { isList: true }), getAllCourses);

// Get single course by ID with cache
router.get("/:id", cacheMiddleware("course", { param: "id" }), getCourseById);

// ---------------- POST/PUT/DELETE ----------------
// Authenticated & Role protected
router.post("/", isAuthenticated, authorizeRole("educator"), createCourse);
router.put("/:id", isAuthenticated, authorizeRole("educator"), updateCourse);
router.delete("/:id", isAuthenticated, authorizeRole("educator"), deleteCourse);

router.use("/:id/content", courseContentRoutes)

export default router;
