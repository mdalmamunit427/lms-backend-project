"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// routes/courses.routes.ts
const express_1 = __importDefault(require("express"));
const cacheMiddleware_1 = require("../middlewares/cacheMiddleware");
const auth_1 = require("../middlewares/auth");
const courses_controller_1 = require("../controllers/courses.controller");
const courseContent_routes_1 = __importDefault(require("./courseContent.routes"));
const router = express_1.default.Router();
// ---------------- GET ----------------
// List courses with cache
router.get("/", (0, cacheMiddleware_1.cacheMiddleware)("courses", { isList: true }), courses_controller_1.getAllCourses);
// Get single course by ID with cache
router.get("/:id", (0, cacheMiddleware_1.cacheMiddleware)("course", { param: "id" }), courses_controller_1.getCourseById);
// ---------------- POST/PUT/DELETE ----------------
// Authenticated & Role protected
router.post("/", auth_1.isAuthenticated, (0, auth_1.authorizeRole)("educator"), courses_controller_1.createCourse);
router.put("/:id", auth_1.isAuthenticated, (0, auth_1.authorizeRole)("educator"), courses_controller_1.updateCourse);
router.delete("/:id", auth_1.isAuthenticated, (0, auth_1.authorizeRole)("educator"), courses_controller_1.deleteCourse);
router.use("/:id/content", courseContent_routes_1.default);
exports.default = router;
//# sourceMappingURL=courses.routes.js.map