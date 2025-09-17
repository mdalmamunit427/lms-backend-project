"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const user_controller_1 = require("../controllers/user.controller");
const auth_1 = require("../middlewares/auth");
const router = express_1.default.Router();
router.post("/register", user_controller_1.registerUser);
router.post("/activate-user", user_controller_1.activateUser);
router.post("/login", user_controller_1.loginUser);
router.post("/refresh-token", user_controller_1.refreshAccessToken);
router.post("/logout", auth_1.isAuthenticated, user_controller_1.logoutUser);
router.get("/me", auth_1.isAuthenticated, user_controller_1.getUserById);
router.post("/social-auth", user_controller_1.socialAuth);
router.put("/update-profile", auth_1.isAuthenticated, user_controller_1.updateProfile);
router.put("/reset-password", auth_1.isAuthenticated, user_controller_1.resetPassword);
router.put("/update-profile-picture", auth_1.isAuthenticated, user_controller_1.updateProfilePicture);
// Admin-only example route
// router.get("/admin-only", isAuthenticated, authorizeRole("admin"), (req: AuthRequest, res) => {
//   res.json({ message: "Welcome Admin!" });
// });
exports.default = router;
//# sourceMappingURL=user.routes.js.map