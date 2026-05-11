import { Router } from "express";

import {
  createTransaction,
  deleteTransaction,
  getTransactionById,
  listTransactions,
  updateTransaction,
} from "../controllers/transaction.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  createTransactionRequestSchema,
  getTransactionRequestSchema,
  listTransactionsRequestSchema,
  updateTransactionRequestSchema,
} from "../validators/transaction.validator";

const transactionRouter = Router();

transactionRouter.use(requireAuth);

transactionRouter.get("/", validate(listTransactionsRequestSchema), listTransactions);
transactionRouter.post("/", validate(createTransactionRequestSchema), createTransaction);
transactionRouter.get("/:id", validate(getTransactionRequestSchema), getTransactionById);
transactionRouter.patch("/:id", validate(updateTransactionRequestSchema), updateTransaction);
transactionRouter.delete("/:id", validate(getTransactionRequestSchema), deleteTransaction);

export { transactionRouter };
