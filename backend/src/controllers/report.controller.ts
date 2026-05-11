import type { RequestHandler } from "express";

import { authService } from "../services/auth.service";
import { budgetService } from "../services/budget.service";
import { categoryService } from "../services/category.service";
import { reportService } from "../services/report.service";
import { transactionService } from "../services/transaction.service";
import { sendSuccess } from "../utils/api-response";
import type {
  ByCategoryReportQuery,
  DashboardBundleQuery,
  MonthlyTrendReportQuery,
  SummaryReportQuery,
} from "../validators/report.validator";

export const getSummaryReport: RequestHandler = async (req, res, next) => {
  try {
    const query = (res.locals.validatedQuery ?? req.query) as SummaryReportQuery;
    const report = await reportService.getSummary(req.user!.id, query);
    return sendSuccess(res, report, "Summary report fetched successfully");
  } catch (error) {
    next(error);
  }
};

export const getExpenseByCategoryReport: RequestHandler = async (req, res, next) => {
  try {
    const query = (res.locals.validatedQuery ?? req.query) as ByCategoryReportQuery;
    const report = await reportService.getExpenseByCategory(req.user!.id, query);
    return sendSuccess(res, report, "Category expense report fetched successfully");
  } catch (error) {
    next(error);
  }
};

export const getMonthlyTrendReport: RequestHandler = async (req, res, next) => {
  try {
    const query = (res.locals.validatedQuery ?? req.query) as MonthlyTrendReportQuery;
    const report = await reportService.getMonthlyTrend(req.user!.id, query);
    return sendSuccess(res, report, "Monthly trend report fetched successfully");
  } catch (error) {
    next(error);
  }
};

export const getDashboardBundleReport: RequestHandler = async (req, res, next) => {
  try {
    const query = (res.locals.validatedQuery ?? req.query) as DashboardBundleQuery;
    const now = new Date();
    const month = query.month ?? now.getUTCMonth() + 1;
    const year = query.year ?? now.getUTCFullYear();

    const currentUser = await authService.getMe(req.user!.id);
    const categories = await categoryService.listCategories(req.user!.id, {});
    const summary = await reportService.getSummary(req.user!.id, { month, year });
    const expenseByCategory = await reportService.getExpenseByCategory(req.user!.id, {
      month,
      year,
    });
    const monthlyTrend = await reportService.getMonthlyTrend(req.user!.id, {
      month,
      year,
      months: query.months,
    });
    const budgets = await budgetService.listBudgets(req.user!.id, {
      month,
      year,
    });
    const transactions = await transactionService.listTransactions(req.user!.id, {
      month,
      year,
      page: 1,
      limit: 12,
    });

    return sendSuccess(
      res,
      {
        currentUser,
        categories,
        snapshot: {
          filters: {
            month,
            year,
          },
          source: "api",
          summary,
          expenseByCategory,
          monthlyTrend,
          budgets,
          recentTransactions: transactions.items,
        },
      },
      "Dashboard bundle fetched successfully"
    );
  } catch (error) {
    next(error);
  }
};
