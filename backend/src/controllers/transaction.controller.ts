import type { RequestHandler } from "express";

import { transactionService } from "../services/transaction.service";
import { sendSuccess } from "../utils/api-response";
import type {
  CreateTransactionBody,
  ListTransactionsQuery,
  TransactionParams,
  UpdateTransactionBody,
} from "../validators/transaction.validator";

export const createTransaction: RequestHandler = async (req, res, next) => {
  try {
    const transaction = await transactionService.createTransaction(
      req.user!.id,
      req.body as CreateTransactionBody
    );

    return sendSuccess(res, transaction, "Transaction created successfully", 201);
  } catch (error) {
    next(error);
  }
};

export const listTransactions: RequestHandler = async (req, res, next) => {
  try {
    const query = (res.locals.validatedQuery ?? req.query) as ListTransactionsQuery;
    const result = await transactionService.listTransactions(
      req.user!.id,
      query
    );

    return sendSuccess(res, result.items, "Transactions fetched successfully", 200, result.meta);
  } catch (error) {
    next(error);
  }
};

export const getTransactionById: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params as TransactionParams;
    const transaction = await transactionService.getTransactionById(req.user!.id, id);
    return sendSuccess(res, transaction, "Transaction fetched successfully");
  } catch (error) {
    next(error);
  }
};

export const updateTransaction: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params as TransactionParams;
    const transaction = await transactionService.updateTransaction(
      req.user!.id,
      id,
      req.body as UpdateTransactionBody
    );

    return sendSuccess(res, transaction, "Transaction updated successfully");
  } catch (error) {
    next(error);
  }
};

export const deleteTransaction: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params as TransactionParams;
    const result = await transactionService.deleteTransaction(req.user!.id, id);
    return sendSuccess(res, result, "Transaction deleted successfully");
  } catch (error) {
    next(error);
  }
};
