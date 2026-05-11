import { Router } from "express";

import { authRouter } from "./auth.route";
import { budgetRouter } from "./budget.route";
import { categoryRouter } from "./category.route";
import { reportRouter } from "./report.route";
import { transactionRouter } from "./transaction.route";
import { sendSuccess } from "../utils/api-response";

const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/categories", categoryRouter);
apiRouter.use("/transactions", transactionRouter);
apiRouter.use("/budgets", budgetRouter);
apiRouter.use("/reports", reportRouter);

apiRouter.get("/health", (_req, res) => {
  return sendSuccess(
    res,
    {
      status: "ok",
      timestamp: new Date().toISOString(),
    },
    "Finance Tracker API is healthy"
  );
});

apiRouter.get("/meta/response-format", (_req, res) => {
  return sendSuccess(
    res,
    {
      success: true,
      message: "Human-readable status message",
      data: {
        example: "payload",
      },
      meta: {
        page: 1,
        limit: 10,
        total: 0,
      },
    },
    "Standard API response format"
  );
});

export { apiRouter };
