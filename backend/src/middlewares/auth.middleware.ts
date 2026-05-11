import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";

import { env } from "../config/env";
import { AppError } from "../utils/app-error";

type AuthTokenPayload = {
  sub: string;
  email: string;
  fullName: string;
};

export const requireAuth: RequestHandler = (req, _res, next) => {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader?.startsWith("Bearer ")) {
    next(new AppError("Authentication required", 401, "UNAUTHORIZED"));
    return;
  }

  const token = authorizationHeader.replace("Bearer ", "").trim();

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as AuthTokenPayload;

    req.user = {
      id: decoded.sub,
      email: decoded.email,
      fullName: decoded.fullName,
    };

    next();
  } catch {
    next(new AppError("Invalid or expired token", 401, "INVALID_TOKEN"));
  }
};
