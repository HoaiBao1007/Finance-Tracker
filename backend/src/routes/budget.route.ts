import { Router } from "express";

import { createBudget, deleteBudget, listBudgets, updateBudget } from "../controllers/budget.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  createBudgetRequestSchema,
  deleteBudgetRequestSchema,
  listBudgetsRequestSchema,
  updateBudgetRequestSchema,
} from "../validators/budget.validator";

const budgetRouter = Router();

budgetRouter.use(requireAuth);

budgetRouter.get("/", validate(listBudgetsRequestSchema), listBudgets);
budgetRouter.post("/", validate(createBudgetRequestSchema), createBudget);
budgetRouter.patch("/:id", validate(updateBudgetRequestSchema), updateBudget);
budgetRouter.delete("/:id", validate(deleteBudgetRequestSchema), deleteBudget);

export { budgetRouter };
