import type { ErrorRequestHandler, RequestHandler } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

import { sendError } from "../utils/api-response";
import { AppError } from "../utils/app-error";

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(new AppError(`Route ${req.method} ${req.originalUrl} not found`, 404, "NOT_FOUND"));
};

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    return sendError(res, "Validation failed", 400, error.flatten());
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return sendError(res, "Resource already exists", 409, error.meta);
    }

    if (error.code === "P2003") {
      return sendError(res, "Invalid related resource", 400, error.meta);
    }

    if (error.code === "P2025") {
      return sendError(res, "Resource not found", 404, error.meta);
    }
  }

  if (error instanceof AppError) {
    return sendError(res, error.message, error.statusCode, error.details ?? { code: error.code });
  }

  console.error(error);
  return sendError(res, "Internal server error", 500);
};
