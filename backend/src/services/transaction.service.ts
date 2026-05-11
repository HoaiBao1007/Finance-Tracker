import { type Prisma } from "@prisma/client";

import { prisma } from "../lib/prisma";
import { parsePositiveAmount, serializeAmount } from "../utils/amount";
import { AppError } from "../utils/app-error";
import { buildDateFilter } from "../utils/date";
import { buildPaginationMeta, normalizePagination } from "../utils/pagination";
import {
  type CreateTransactionBody,
  type ListTransactionsQuery,
  type UpdateTransactionBody,
} from "../validators/transaction.validator";
import { ensureAccessibleCategory } from "./category.service";

const transactionInclude = {
  category: {
    select: {
      id: true,
      name: true,
      type: true,
      isDefault: true,
    },
  },
} satisfies Prisma.TransactionInclude;

type TransactionRecord = Prisma.TransactionGetPayload<{
  include: typeof transactionInclude;
}>;

const normalizeOptionalNote = (value?: string) => {
  if (value === undefined) {
    return undefined;
  }

  const normalizedValue = value.trim();
  return normalizedValue.length > 0 ? normalizedValue : null;
};

const serializeTransaction = (transaction: TransactionRecord) => ({
  id: transaction.id,
  userId: transaction.userId,
  categoryId: transaction.categoryId,
  amount: serializeAmount(transaction.amount),
  type: transaction.type,
  date: transaction.date,
  note: transaction.note,
  createdAt: transaction.createdAt,
  updatedAt: transaction.updatedAt,
  category: transaction.category,
});

const getOwnedTransaction = async (userId: string, transactionId: string) => {
  const transaction = await prisma.transaction.findFirst({
    where: {
      id: transactionId,
      userId,
    },
    include: transactionInclude,
  });

  if (!transaction) {
    throw new AppError("Transaction not found", 404, "TRANSACTION_NOT_FOUND");
  }

  return transaction;
};

export const transactionService = {
  createTransaction: async (userId: string, input: CreateTransactionBody) => {
    await ensureAccessibleCategory(userId, input.categoryId, input.type);

    const transaction = await prisma.transaction.create({
      data: {
        userId,
        categoryId: input.categoryId,
        amount: parsePositiveAmount(input.amount),
        type: input.type,
        date: input.date,
        note: normalizeOptionalNote(input.note),
      },
      include: transactionInclude,
    });

    return serializeTransaction(transaction);
  },

  listTransactions: async (userId: string, query: ListTransactionsQuery) => {
    if (query.categoryId) {
      await ensureAccessibleCategory(userId, query.categoryId);
    }

    const pagination = normalizePagination({
      page: query.page,
      limit: query.limit,
    });

    const where: Prisma.TransactionWhereInput = {
      userId,
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.type ? { type: query.type } : {}),
      ...(buildDateFilter(query) ? { date: buildDateFilter(query) } : {}),
    };

    const transactions = await prisma.transaction.findMany({
      where,
      include: transactionInclude,
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      skip: pagination.skip,
      take: pagination.take,
    });

    const total = await prisma.transaction.count({ where });

    return {
      items: transactions.map(serializeTransaction),
      meta: buildPaginationMeta(total, pagination.page, pagination.limit),
    };
  },

  getTransactionById: async (userId: string, transactionId: string) => {
    const transaction = await getOwnedTransaction(userId, transactionId);
    return serializeTransaction(transaction);
  },

  updateTransaction: async (userId: string, transactionId: string, input: UpdateTransactionBody) => {
    const existingTransaction = await getOwnedTransaction(userId, transactionId);
    const nextType = input.type ?? existingTransaction.type;
    const nextCategoryId = input.categoryId ?? existingTransaction.categoryId;

    await ensureAccessibleCategory(userId, nextCategoryId, nextType);

    const updatedTransaction = await prisma.transaction.update({
      where: {
        id: existingTransaction.id,
      },
      data: {
        categoryId: nextCategoryId,
        type: nextType,
        ...(input.amount !== undefined ? { amount: parsePositiveAmount(input.amount) } : {}),
        ...(input.date !== undefined ? { date: input.date } : {}),
        ...(input.note !== undefined ? { note: normalizeOptionalNote(input.note) } : {}),
      },
      include: transactionInclude,
    });

    return serializeTransaction(updatedTransaction);
  },

  deleteTransaction: async (userId: string, transactionId: string) => {
    const transaction = await getOwnedTransaction(userId, transactionId);

    await prisma.transaction.delete({
      where: {
        id: transaction.id,
      },
    });

    return {
      id: transaction.id,
    };
  },
};
