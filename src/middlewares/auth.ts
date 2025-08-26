import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "../utils/AppError";
import { IUser } from "../models/user.model";
import { redis } from "../utils/redis";

export interface AuthRequest extends Request {
  user?: IUser;
}

export const isAuthenticated = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.cookies.accessToken;
  if (!token) return next(new AppError("Access token missing", 401));

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as { id: string };
    const userData = await redis.get(decoded.id);
    if (!userData) return next(new AppError("User not found", 401));
    
    const user = JSON.parse(userData) as IUser;
    if (!user) return next(new AppError("User not found", 401));

    req.user = user;
    next();
  } catch {
    return next(new AppError("Token expired or invalid", 401));
  }
};


export const authorizeRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError("Not authorized", 403));
    }
    next();
  };
};
