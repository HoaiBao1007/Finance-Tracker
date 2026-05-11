import type { RequestHandler } from "express";
import type { ZodType } from "zod";

type RequestSchema = ZodType<{
  body?: unknown;
  params?: unknown;
  query?: unknown;
}>;

export const validate = (schema: RequestSchema): RequestHandler => {
  return (req, res, next) => {
    const parsed = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (!parsed.success) {
      next(parsed.error);
      return;
    }

    if (parsed.data.body !== undefined) {
      req.body = parsed.data.body;
    }

    if (parsed.data.params !== undefined) {
      req.params = parsed.data.params as typeof req.params;
    }

    if (parsed.data.query !== undefined) {
      res.locals.validatedQuery = parsed.data.query;
    }

    next();
  };
};
