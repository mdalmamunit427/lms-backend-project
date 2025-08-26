import dotenv from "dotenv";
dotenv.config();
import jwt from "jsonwebtoken";

export const generateAccessToken = (payload: object): string => {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) {
    throw new Error("JWT_ACCESS_SECRET is not defined");
  }
  
  const expiresIn = process.env.ACCESS_TOKEN_EXPIRES_IN || "15m";
  
  return jwt.sign(payload, secret, { expiresIn } as any);
};

export const generateRefreshToken = (payload: object): string => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error("JWT_REFRESH_SECRET is not defined");
  }
  
  const expiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN || "7d";
  
  return jwt.sign(payload, secret, { expiresIn } as any);
};

export const verifyAccessToken = (token: string) => {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET!);
};

export const verifyRefreshToken = (token: string) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET!);
};
