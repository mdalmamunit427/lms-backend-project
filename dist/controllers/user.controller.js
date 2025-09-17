"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfilePicture = exports.resetPassword = exports.updateProfile = exports.socialAuth = exports.getUserById = exports.logoutUser = exports.refreshAccessToken = exports.loginUser = exports.activateUser = exports.registerUser = void 0;
const catchAsync_1 = require("../middlewares/catchAsync");
const AppError_1 = require("../utils/AppError");
const bcrypt_1 = __importDefault(require("bcrypt"));
const crypto_1 = __importDefault(require("crypto"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const email_1 = require("../utils/email");
const user_model_1 = require("../models/user.model");
const token_1 = require("../utils/token");
const redis_1 = require("../utils/redis");
const cookie_1 = require("../utils/cookie");
const cloudinary_1 = __importDefault(require("cloudinary"));
exports.registerUser = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { name, email, password } = req.body;
    const existingUser = await user_model_1.User.findOne({ email });
    if (existingUser)
        throw new AppError_1.AppError("Email already in use", 400);
    const activationCode = crypto_1.default.randomBytes(3).toString("hex"); // 6 hex chars
    //  user data + activationCode (expires in 10 mins)
    const user = {
        name,
        email,
        password,
        activationCode,
    };
    const token = jsonwebtoken_1.default.sign(user, process.env.JWT_ACCESS_SECRET, { expiresIn: "10m" });
    try {
        // Send activation code to user's email
        await (0, email_1.sendActivationEmail)(email, activationCode);
    }
    catch (error) {
        console.error('Failed to send activation email:', error);
        throw new AppError_1.AppError("Failed to send activation email. Please try again later.", 500);
    }
    res.status(200).json({
        success: true,
        message: "Check your email to activate your account.",
        token,
    });
});
exports.activateUser = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { token, activationCode } = req.body;
    if (!token)
        throw new AppError_1.AppError("Token missing", 400);
    let decoded;
    try {
        decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_ACCESS_SECRET);
    }
    catch {
        throw new AppError_1.AppError("Token expired or invalid", 401);
    }
    const { name, email, password, activationCode: originalCode } = decoded;
    if (activationCode !== originalCode) {
        throw new AppError_1.AppError("Invalid activation code", 400);
    }
    const userExists = await user_model_1.User.findOne({ email });
    if (userExists)
        throw new AppError_1.AppError("User already exists", 400);
    const newUser = await user_model_1.User.create({
        name,
        email,
        password,
        isVerified: true,
        role: "user",
    });
    res.status(201).json({
        success: true,
        newUser,
        message: "Account activated and user saved successfully.",
    });
});
exports.loginUser = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { email, password } = req.body;
    // Validate input
    if (!email || !password) {
        throw new AppError_1.AppError("Email and password are required", 400);
    }
    const user = await user_model_1.User.findOne({ email });
    if (!user)
        throw new AppError_1.AppError("Invalid credentials", 401);
    if (!user.isVerified)
        throw new AppError_1.AppError("Email not verified", 403);
    if (!password || !user.password) {
        throw new AppError_1.AppError("Invalid credentials", 401);
    }
    const isMatch = await bcrypt_1.default.compare(password, user.password);
    if (!isMatch)
        throw new AppError_1.AppError("Invalid credentials", 401);
    const accessToken = (0, token_1.generateAccessToken)({ id: user._id, role: user.role });
    const refreshToken = (0, token_1.generateRefreshToken)({ id: user._id });
    (0, cookie_1.setAuthCookies)(res, accessToken, refreshToken);
    const userWithoutPassword = { ...user.toObject(), password: undefined };
    await redis_1.redis.set(user._id.toString(), JSON.stringify(userWithoutPassword), "EX", 15 * 60);
    res.status(200).json({ success: true, message: "Login successful" });
});
exports.refreshAccessToken = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const token = req.cookies.refreshToken;
    if (!token)
        throw new AppError_1.AppError("Refresh token missing", 401);
    let decoded;
    try {
        decoded = (0, token_1.verifyRefreshToken)(token);
    }
    catch {
        throw new AppError_1.AppError("Invalid refresh token", 401);
    }
    let user = await redis_1.redis.get(decoded.id);
    if (!user) {
        user = await user_model_1.User.findById(decoded.id);
        if (user) {
            const userWithoutPassword = { ...user.toObject(), password: undefined };
            await redis_1.redis.set(decoded.id, JSON.stringify(userWithoutPassword), "EX", 15 * 60);
        }
    }
    else {
        user = JSON.parse(user);
    }
    if (!user)
        throw new AppError_1.AppError("User not found", 404);
    const accessToken = (0, token_1.generateAccessToken)({ id: user._id, role: user.role });
    // Update Redis cache with fresh user data
    const userWithoutPassword = { ...user, password: undefined };
    await redis_1.redis.set(user._id.toString(), JSON.stringify(userWithoutPassword), "EX", 15 * 60);
    (0, cookie_1.setAccessTokenCookie)(res, accessToken);
    res.status(200).json({ success: true, message: "Access token refreshed" });
});
exports.logoutUser = (0, catchAsync_1.catchAsync)(async (req, res) => {
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    await redis_1.redis.del(req.user._id);
    res.status(200).json({ success: true, message: "Logged out successfully" });
});
// get user info by id
exports.getUserById = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const userId = req.user?._id;
    let user = null;
    const cachedUser = await redis_1.redis.get(userId);
    if (cachedUser) {
        user = JSON.parse(cachedUser);
    }
    else {
        user = await user_model_1.User.findById(userId).select("-password");
        if (user) {
            await redis_1.redis.set(userId, JSON.stringify(user), "EX", 15 * 60);
        }
    }
    if (!user)
        throw new AppError_1.AppError("User not found", 404);
    res.status(200).json({ success: true, user });
});
// social auth
exports.socialAuth = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { email, name, avatar } = req.body;
    const user = await user_model_1.User.findOne({ email });
    if (!user) {
        const newUser = await user_model_1.User.create({ email, name, avatar });
        const accessToken = (0, token_1.generateAccessToken)({ id: newUser._id, role: newUser.role });
        const refreshToken = (0, token_1.generateRefreshToken)({ id: newUser._id });
        (0, cookie_1.setAuthCookies)(res, accessToken, refreshToken);
        res.status(200).json({ success: true, message: "User created successfully", user: newUser });
    }
    else {
        const accessToken = (0, token_1.generateAccessToken)({ id: user._id, role: user.role });
        const refreshToken = (0, token_1.generateRefreshToken)({ id: user._id });
        (0, cookie_1.setAuthCookies)(res, accessToken, refreshToken);
        const userWithoutPassword = { ...user.toObject(), password: undefined };
        await redis_1.redis.set(user._id.toString(), JSON.stringify(userWithoutPassword), "EX", 15 * 60);
        res.status(200).json({ success: true, message: "User login successful", user });
    }
});
// update Profile
exports.updateProfile = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const userId = req.user?._id;
    const user = await user_model_1.User.findByIdAndUpdate(userId, { ...req.body }, { new: true });
    if (!user)
        throw new AppError_1.AppError("User not found", 404);
    const userWithoutPassword = { ...user.toObject(), password: undefined };
    await redis_1.redis.set(user._id.toString(), JSON.stringify(userWithoutPassword), "EX", 15 * 60);
    res.status(200).json({ success: true, message: "Profile updated successfully", user });
});
// reset password
exports.resetPassword = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const userId = req.user?._id;
    const { password, newPassword } = req.body;
    const user = await user_model_1.User.findById(userId);
    if (!user)
        throw new AppError_1.AppError("User not found", 404);
    if (!user.password)
        throw new AppError_1.AppError("Can't reset password for this account type", 400);
    // Verify old password
    const isMatch = await bcrypt_1.default.compare(password, user.password);
    if (!isMatch) {
        throw new AppError_1.AppError("Invalid current password", 400);
    }
    // Hash the new password before storing
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt_1.default.hash(newPassword, saltRounds);
    // Update user with hashed password
    const updatedUser = await user_model_1.User.findByIdAndUpdate(userId, { password: hashedNewPassword }, { new: true }).select("-password");
    if (!updatedUser) {
        throw new AppError_1.AppError("User not found", 404);
    }
    // update redis cache
    await redis_1.redis.set(userId, JSON.stringify(updatedUser), "EX", 15 * 60);
    res.status(200).json({
        success: true,
        message: "Password updated successfully",
        user: updatedUser
    });
});
// update profile picture
exports.updateProfilePicture = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const userId = req.user?._id;
    const { avatar } = req.body;
    if (!avatar)
        throw new AppError_1.AppError("Avatar is required", 400);
    const user = await user_model_1.User.findById(userId).select("-password");
    if (!user)
        throw new AppError_1.AppError("User not found", 404);
    // Delete old avatar if it exists
    if (user?.avatar?.public_id) {
        await cloudinary_1.default.v2.uploader.destroy(user.avatar.public_id);
    }
    // Upload new avatar
    const result = await cloudinary_1.default.v2.uploader.upload(avatar, {
        folder: "avatars",
        width: 150,
    });
    user.avatar = {
        public_id: result.public_id,
        url: result.secure_url,
    };
    await user.save();
    await redis_1.redis.set(userId, JSON.stringify(user), "EX", 15 * 60);
    res.status(200).json({ success: true, message: "Profile picture updated successfully", user });
});
//# sourceMappingURL=user.controller.js.map