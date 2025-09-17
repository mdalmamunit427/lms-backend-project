"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// routes/enrollment.routes.ts
const express_1 = __importDefault(require("express"));
const enrollment_controller_1 = require("../controllers/enrollment.controller");
const router = express_1.default.Router();
router.post("/checkout", enrollment_controller_1.createCheckoutSession);
router.get("/:studentId", enrollment_controller_1.getUserEnrollments);
exports.default = router;
//# sourceMappingURL=enrollment.routes.js.map