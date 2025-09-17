"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setAccessTokenCookie = exports.setAuthCookies = void 0;
const setAuthCookies = (res, accessToken, refreshToken) => {
    // Set access token cookie (15 minutes)
    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 15 * 60 * 1000, // 15 minutes
    });
    // Set refresh token cookie (7 days)
    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
};
exports.setAuthCookies = setAuthCookies;
const setAccessTokenCookie = (res, accessToken) => {
    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 15 * 60 * 1000, // 15 minutes
    });
};
exports.setAccessTokenCookie = setAccessTokenCookie;
//# sourceMappingURL=cookie.js.map