import type { Response } from "express";

type ResponseMeta = Record<string, unknown>;

export type ApiSuccessResponse<T> = {
  success: true;
  message: string;
  data: T;
  meta?: ResponseMeta;
};

export type ApiErrorResponse = {
  success: false;
  message: string;
  errors?: unknown;
};

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message = "Success",
  statusCode = 200,
  meta?: ResponseMeta
) => {
  const payload: ApiSuccessResponse<T> = {
    success: true,
    message,
    data,
  };

  if (meta) {
    payload.meta = meta;
  }

  return res.status(statusCode).json(payload);
};

export const sendError = (
  res: Response,
  message = "Internal server error",
  statusCode = 500,
  errors?: unknown
) => {
  const payload: ApiErrorResponse = {
    success: false,
    message,
  };

  if (errors) {
    payload.errors = errors;
  }

  return res.status(statusCode).json(payload);
};
