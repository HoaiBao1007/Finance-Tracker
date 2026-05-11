import type { RequestHandler } from "express";

import { budgetService } from "../services/budget.service";
import { sendSuccess } from "../utils/api-response";
import type { BudgetParams, CreateBudgetBody, ListBudgetsQuery, UpdateBudgetBody } from "../validators/budget.validator";

export const createBudget: RequestHandler = async (req, res, next) => {
  try {
    const budget = await budgetService.createBudget(req.user!.id, req.body as CreateBudgetBody);
    return sendSuccess(res, budget, "Budget created successfully", 201);
  } catch (error) {
    next(error);
  }
};

export const listBudgets: RequestHandler = async (req, res, next) => {
  try {
    const query = (res.locals.validatedQuery ?? req.query) as ListBudgetsQuery;
    const budgets = await budgetService.listBudgets(req.user!.id, query);
    return sendSuccess(res, budgets, "Budgets fetched successfully");
  } catch (error) {
    next(error);
  }
};

export const updateBudget: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params as BudgetParams;
    const budget = await budgetService.updateBudget(req.user!.id, id, req.body as UpdateBudgetBody);
    return sendSuccess(res, budget, "Budget updated successfully");
  } catch (error) {
    next(error);
  }
};

export const deleteBudget: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params as BudgetParams;
    const result = await budgetService.deleteBudget(req.user!.id, id);
    return sendSuccess(res, result, "Budget deleted successfully");
  } catch (error) {
    next(error);
  }
};
