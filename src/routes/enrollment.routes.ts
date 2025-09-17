// routes/enrollment.routes.ts
import express from "express";
import { createCheckoutSession, getEnrolledCourses } from "../controllers/enrollment.controller";
import { isAuthenticated } from "../middlewares/auth";


const router = express.Router();

router.post("/checkout", isAuthenticated, createCheckoutSession);
router.get("/:studentId",isAuthenticated, getEnrolledCourses);

export default router;
