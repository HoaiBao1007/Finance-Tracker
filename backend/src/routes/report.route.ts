import { Router } from "express";

import {
  getDashboardBundleReport,
  getExpenseByCategoryReport,
  getMonthlyTrendReport,
  getSummaryReport,
} from "../controllers/report.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  byCategoryReportRequestSchema,
  dashboardBundleRequestSchema,
  monthlyTrendReportRequestSchema,
  summaryReportRequestSchema,
} from "../validators/report.validator";

const reportRouter = Router();

reportRouter.use(requireAuth);

reportRouter.get("/summary", validate(summaryReportRequestSchema), getSummaryReport);
reportRouter.get("/by-category", validate(byCategoryReportRequestSchema), getExpenseByCategoryReport);
reportRouter.get("/monthly-trend", validate(monthlyTrendReportRequestSchema), getMonthlyTrendReport);
reportRouter.get("/dashboard", validate(dashboardBundleRequestSchema), getDashboardBundleReport);

export { reportRouter };
