// routes/enrollment.routes.ts
import express from "express";
import { createCheckoutSession, getUserEnrollments } from "../controllers/enrollment.controller";
import { isAuthenticated } from "../middlewares/auth";


const router = express.Router();

router.post("/checkout", createCheckoutSession);
router.get("/:studentId",isAuthenticated, getUserEnrollments);

export default router;
