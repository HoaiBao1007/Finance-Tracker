import type { RequestHandler } from "express";

import { authService } from "../services/auth.service";
import { AppError } from "../utils/app-error";
import { sendSuccess } from "../utils/api-response";

export const register: RequestHandler = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    return sendSuccess(res, result, "Register successful", 201);
  } catch (error) {
    next(error);
  }
};

export const login: RequestHandler = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    return sendSuccess(res, result, "Login successful");
  } catch (error) {
    next(error);
  }
};

export const me: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401, "UNAUTHORIZED");
    }

    const result = await authService.getMe(req.user.id);
    return sendSuccess(res, result, "Current user fetched successfully");
  } catch (error) {
    next(error);
  }
};

export const updateProfile: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401, "UNAUTHORIZED");
    }

    const result = await authService.updateProfile(req.user.id, req.body);
    return sendSuccess(res, result, "Profile updated successfully");
  } catch (error) {
    next(error);
  }
};

export const changePassword: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401, "UNAUTHORIZED");
    }

    const result = await authService.changePassword(req.user.id, req.body);
    return sendSuccess(res, result, "Password changed successfully");
  } catch (error) {
    next(error);
  }
};

export const forgotPassword: RequestHandler = async (req, res, next) => {
  try {
    const result = await authService.createPasswordReset(req.body);
    return sendSuccess(res, result, "If the account exists, a password reset OTP has been emailed");
  } catch (error) {
    next(error);
  }
};

export const resetPassword: RequestHandler = async (req, res, next) => {
  try {
    const result = await authService.resetPassword(req.body);
    return sendSuccess(res, result, "Password reset successfully");
  } catch (error) {
    next(error);
  }
};
