import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/auth";
import { catchAsync } from "../middlewares/catchAsync";
import { AppError } from "../utils/AppError";
import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { sendActivationEmail } from "../utils/email";
import { User, IUser } from "../models/user.model";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../utils/token";
import { redis } from "../utils/redis";
import { setAuthCookies, setAccessTokenCookie } from "../utils/cookie";
import cloudinary from "cloudinary";


export const registerUser = catchAsync(async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) throw new AppError("Email already in use", 400);

  const activationCode = crypto.randomBytes(3).toString("hex"); // 6 hex chars

  //  user data + activationCode (expires in 10 mins)
  const user = {
    name,
    email,
    password, 
    activationCode,
  }
  const token = jwt.sign(
    user,
    process.env.JWT_ACCESS_SECRET!,
    { expiresIn: "10m" }
  );

  try {
    // Send activation code to user's email
    await sendActivationEmail(email, activationCode);
  } catch (error) {
    console.error('Failed to send activation email:', error);
    throw new AppError("Failed to send activation email. Please try again later.", 500);
  }

  res.status(200).json({
    success: true,
    message: "Check your email to activate your account.",
    token,
  });
});

export const activateUser = catchAsync(async (req: Request, res: Response) => {
  const { token, activationCode } = req.body;

  if (!token) throw new AppError("Token missing", 400);

  let decoded: any;
  try {
    decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!);
  } catch {
    throw new AppError("Token expired or invalid", 401);
  }

  const { name, email, password, activationCode: originalCode } = decoded;

  if (activationCode !== originalCode) {
    throw new AppError("Invalid activation code", 400);
  }

  const userExists = await User.findOne({ email });
  if (userExists) throw new AppError("User already exists", 400);

  const newUser = await User.create({
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

export const loginUser = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    throw new AppError("Email and password are required", 400);
  }

  const user = await User.findOne({ email });

  if (!user) throw new AppError("Invalid credentials", 401);

  if (!user.isVerified) throw new AppError("Email not verified", 403);

  if (!password || !user.password) {
    throw new AppError("Invalid credentials", 401);
  }

  const isMatch = await bcrypt.compare(password, user.password);
 
  if (!isMatch) throw new AppError("Invalid credentials", 401);

  const accessToken = generateAccessToken({ id: user._id, role: user.role });
  const refreshToken = generateRefreshToken({ id: user._id });

  setAuthCookies(res, accessToken, refreshToken);

  const userWithoutPassword = { ...user.toObject(), password: undefined };
  await redis.set(user._id.toString(), JSON.stringify(userWithoutPassword), "EX", 15 * 60);

  res.status(200).json({ success: true, message: "Login successful" });
});

export const refreshAccessToken = catchAsync(async (req: Request, res: Response) => {
  const token = req.cookies.refreshToken;
  if (!token) throw new AppError("Refresh token missing", 401);

  let decoded: any;
  try {
    decoded = verifyRefreshToken(token);
  } catch {
    throw new AppError("Invalid refresh token", 401);
  }

  let user: any = await redis.get(decoded.id);
  if (!user) {
    user = await User.findById(decoded.id);
    if (user) {
      const userWithoutPassword = { ...user.toObject(), password: undefined };
      await redis.set(decoded.id, JSON.stringify(userWithoutPassword), "EX", 15 * 60);
    }
  } else {
    user = JSON.parse(user);
  }

  if (!user) throw new AppError("User not found", 404);

  const accessToken = generateAccessToken({ id: user._id, role: user.role });

  // Update Redis cache with fresh user data
  const userWithoutPassword = { ...user, password: undefined };
  await redis.set(user._id.toString(), JSON.stringify(userWithoutPassword), "EX", 15 * 60);


  setAccessTokenCookie(res, accessToken);

  res.status(200).json({ success: true, message: "Access token refreshed" });
});

export const logoutUser = catchAsync(async (req: AuthRequest, res: Response) => {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  await redis.del(req.user!._id as string);
  res.status(200).json({ success: true, message: "Logged out successfully" });
});

// get user info by id
export const getUserById = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.user?._id as string;
  let user: IUser | null = null;
  
  const cachedUser = await redis.get(userId);
  if (cachedUser) {
    user = JSON.parse(cachedUser);
  } else {
    user = await User.findById(userId).select("-password");
    if (user) {
      await redis.set(userId, JSON.stringify(user), "EX", 15 * 60);
    }
  }

  if (!user) throw new AppError("User not found", 404);
  res.status(200).json({ success: true, user });
});

// social auth
export const socialAuth = catchAsync(async (req: Request, res: Response) => {
  const { email, name, avatar } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    const newUser = await User.create({ email, name, avatar });
    const accessToken = generateAccessToken({ id: newUser._id, role: newUser.role });
    const refreshToken = generateRefreshToken({ id: newUser._id });
    setAuthCookies(res, accessToken, refreshToken);
    res.status(200).json({ success: true, message: "User created successfully", user: newUser});
  } else {
    const accessToken = generateAccessToken({ id: user._id, role: user.role });
    const refreshToken = generateRefreshToken({ id: user._id });
    setAuthCookies(res, accessToken, refreshToken);
    const userWithoutPassword = { ...user.toObject(), password: undefined };
    await redis.set(user._id.toString(), JSON.stringify(userWithoutPassword), "EX", 15 * 60);
    res.status(200).json({ success: true, message: "User login successful", user });
  }
});

// update Profile
export const updateProfile = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.user?._id as string;

  const user = await User.findByIdAndUpdate(userId, {...req.body}, { new: true });
  if (!user) throw new AppError("User not found", 404);

  const userWithoutPassword = { ...user.toObject(), password: undefined };
  await redis.set(user._id.toString(), JSON.stringify(userWithoutPassword), "EX", 15 * 60);
  res.status(200).json({ success: true, message: "Profile updated successfully", user });
});

// reset password
export const resetPassword = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.user?._id as string;
  const { password, newPassword } = req.body;
  
  const user = await User.findById(userId);
  if (!user) throw new AppError("User not found", 404);
  
  if (!user.password) throw new AppError("Can't reset password for this account type", 400);
  
  // Verify old password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new AppError("Invalid current password", 400);
  }
  
  // Hash the new password before storing
  const saltRounds = 10;
  const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
  
  // Update user with hashed password
  const updatedUser = await User.findByIdAndUpdate(
    userId, 
    { password: hashedNewPassword }, 
    { new: true }
  ).select("-password");
  
  if (!updatedUser) {
    throw new AppError("User not found", 404);
  }

  // update redis cache
  await redis.set(userId, JSON.stringify(updatedUser), "EX", 15 * 60);

  res.status(200).json({ 
    success: true, 
    message: "Password updated successfully", 
    user: updatedUser 
  });
});

// update profile picture
export const updateProfilePicture = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.user?._id as string;
  const { avatar } = req.body;

  if(!avatar) throw new AppError("Avatar is required", 400);

  const user = await User.findById(userId).select("-password");
  if(!user) throw new AppError("User not found", 404);

  // Delete old avatar if it exists
  if(user?.avatar?.public_id) {
    await cloudinary.v2.uploader.destroy(user.avatar.public_id);
  }

  // Upload new avatar
  const result = await cloudinary.v2.uploader.upload(avatar, {
    folder: "avatars",
    width: 150,
  });
  
  user.avatar = {
    public_id: result.public_id,
    url: result.secure_url,
  };

  await user.save();
  await redis.set(userId, JSON.stringify(user), "EX", 15 * 60);

  res.status(200).json({ success: true, message: "Profile picture updated successfully", user });
});