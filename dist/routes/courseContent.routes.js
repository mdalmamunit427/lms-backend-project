"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
// routes/courseContent.routes.ts
const express_1 = require("express");
const courseContentController = __importStar(require("../controllers/courseContent.controller"));
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)({ mergeParams: true });
router.use(auth_1.isAuthenticated, (0, auth_1.authorizeRole)("educator"));
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
// ---------------------------- */ //
// Add a lecture to a chapter
router.post("/chapters/:chapterId/lectures", courseContentController.addLecture);
// Update a lecture
router.put("/chapters/:chapterId/lectures/:lectureId", courseContentController.updateLecture);
// // Delete a lecture
router.delete("/chapters/:chapterId/lectures/:lectureId", courseContentController.deleteLecture);
// Reorder lectures within a chapter
router.patch("/chapters/:chapterId/lectures/reorder", courseContentController.reorderLectures);
exports.default = router;
//# sourceMappingURL=courseContent.routes.js.map