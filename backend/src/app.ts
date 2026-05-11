import "dotenv/config";

import cors from "cors";
import express from "express";

import { env } from "./config/env";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware";
import { apiRouter } from "./routes";
import { sendSuccess } from "./utils/api-response";

export const createApp = () => {
  const app = express();

  app.use(
    cors({
      origin: env.CLIENT_ORIGIN === "*" ? true : env.CLIENT_ORIGIN,
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get("/", (_req, res) => {
    return sendSuccess(
      res,
      {
        name: "Personal Finance Tracker API",
        version: "1.0.0",
        documentationHint: "Use /api/v1/health and /api/v1/meta/response-format while the feature modules are being added.",
      },
      "Backend scaffold is ready"
    );
  });

  app.use("/api/v1", apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
