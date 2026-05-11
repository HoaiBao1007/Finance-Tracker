import { type Prisma, TransactionType } from "@prisma/client";

import { prisma } from "../lib/prisma";
import { parsePositiveAmount, serializeAmount } from "../utils/amount";
import { AppError } from "../utils/app-error";
import { getMonthWindow } from "../utils/date";
import type { CreateBudgetBody, ListBudgetsQuery, UpdateBudgetBody } from "../validators/budget.validator";
import { ensureAccessibleCategory } from "./category.service";

const budgetInclude = {
  category: {
    select: {
      id: true,
      name: true,
      type: true,
      isDefault: true,
    },
  },
} satisfies Prisma.BudgetInclude;

type BudgetRecord = Prisma.BudgetGetPayload<{
  include: typeof budgetInclude;
}>;

const buildBudgetProgressKey = (categoryId: string, year: number, month: number) =>
  `${categoryId}:${year}:${month}`;

const buildBudgetProgressMap = async (userId: string, budgets: BudgetRecord[]) => {
  if (budgets.length === 0) {
    return new Map<string, bigint>();
  }

  const categoryIds = Array.from(new Set(budgets.map((budget) => budget.categoryId)));
  const monthWindows = budgets.map((budget) => getMonthWindow(budget.year, budget.month));
  const firstWindow = monthWindows.reduce((earliest, current) =>
    current.start.getTime() < earliest.start.getTime() ? current : earliest
  );
  const lastWindow = monthWindows.reduce((latest, current) =>
    current.endExclusive.getTime() > latest.endExclusive.getTime() ? current : latest
  );

  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      type: TransactionType.expense,
      categoryId: {
        in: categoryIds,
      },
      date: {
        gte: firstWindow.start,
        lt: lastWindow.endExclusive,
      },
    },
    select: {
      categoryId: true,
      amount: true,
      date: true,
    },
  });

  const totalsByBudget = new Map<string, bigint>();

  for (const transaction of transactions) {
    const key = buildBudgetProgressKey(
      transaction.categoryId,
      transaction.date.getUTCFullYear(),
      transaction.date.getUTCMonth() + 1
    );

    totalsByBudget.set(key, (totalsByBudget.get(key) ?? 0n) + transaction.amount);
  }

  return totalsByBudget;
};

const serializeBudget = (budget: BudgetRecord, spentAmount = 0n) => ({
  id: budget.id,
  userId: budget.userId,
  categoryId: budget.categoryId,
  limitAmount: serializeAmount(budget.limitAmount),
  spentAmount: serializeAmount(spentAmount),
  remainingAmount: serializeAmount(budget.limitAmount - spentAmount),
  month: budget.month,
  year: budget.year,
  createdAt: budget.createdAt,
  updatedAt: budget.updatedAt,
  category: budget.category,
});

const serializeBudgetsWithProgress = async (userId: string, budgets: BudgetRecord[]) => {
  const totalsByBudget = await buildBudgetProgressMap(userId, budgets);

  return budgets.map((budget) => {
    const spentAmount = totalsByBudget.get(
      buildBudgetProgressKey(budget.categoryId, budget.year, budget.month)
    ) ?? 0n;

    return serializeBudget(budget, spentAmount);
  });
};

const ensureExpenseCategory = async (userId: string, categoryId: string) => {
  const category = await ensureAccessibleCategory(userId, categoryId);

  if (category.type !== TransactionType.expense) {
    throw new AppError("Budget only supports expense categories", 400, "INVALID_BUDGET_CATEGORY");
  }

  return category;
};

const getOwnedBudget = async (userId: string, budgetId: string) => {
  const budget = await prisma.budget.findFirst({
    where: {
      id: budgetId,
      userId,
    },
    include: budgetInclude,
  });

  if (!budget) {
    throw new AppError("Budget not found", 404, "BUDGET_NOT_FOUND");
  }

  return budget;
};

const ensureUniqueBudget = async (
  userId: string,
  categoryId: string,
  month: number,
  year: number,
  excludeBudgetId?: string
) => {
  const existingBudget = await prisma.budget.findFirst({
    where: {
      userId,
      categoryId,
      month,
      year,
      ...(excludeBudgetId
        ? {
            NOT: {
              id: excludeBudgetId,
            },
          }
        : {}),
    },
    select: {
      id: true,
    },
  });

  if (existingBudget) {
    throw new AppError("Budget already exists for this category and month", 409, "BUDGET_ALREADY_EXISTS");
  }
};

export const budgetService = {
  createBudget: async (userId: string, input: CreateBudgetBody) => {
    await ensureExpenseCategory(userId, input.categoryId);
    await ensureUniqueBudget(userId, input.categoryId, input.month, input.year);

    const budget = await prisma.budget.create({
      data: {
        userId,
        categoryId: input.categoryId,
        limitAmount: parsePositiveAmount(input.limitAmount, "limitAmount"),
        month: input.month,
        year: input.year,
      },
      include: budgetInclude,
    });

    const [serializedBudget] = await serializeBudgetsWithProgress(userId, [budget]);
    return serializedBudget;
  },

  listBudgets: async (userId: string, query: ListBudgetsQuery) => {
    const budgets = await prisma.budget.findMany({
      where: {
        userId,
        ...(query.month !== undefined && query.year !== undefined
          ? {
              month: query.month,
              year: query.year,
            }
          : {}),
      },
      include: budgetInclude,
      orderBy: [{ year: "desc" }, { month: "desc" }, { createdAt: "desc" }],
    });

    return serializeBudgetsWithProgress(userId, budgets);
  },

  updateBudget: async (userId: string, budgetId: string, input: UpdateBudgetBody) => {
    const existingBudget = await getOwnedBudget(userId, budgetId);
    const nextCategoryId = input.categoryId ?? existingBudget.categoryId;
    const nextMonth = input.month ?? existingBudget.month;
    const nextYear = input.year ?? existingBudget.year;

    await ensureExpenseCategory(userId, nextCategoryId);
    await ensureUniqueBudget(userId, nextCategoryId, nextMonth, nextYear, existingBudget.id);

    const updatedBudget = await prisma.budget.update({
      where: {
        id: existingBudget.id,
      },
      data: {
        categoryId: nextCategoryId,
        month: nextMonth,
        year: nextYear,
        ...(input.limitAmount !== undefined
          ? { limitAmount: parsePositiveAmount(input.limitAmount, "limitAmount") }
          : {}),
      },
      include: budgetInclude,
    });

    const [serializedBudget] = await serializeBudgetsWithProgress(userId, [updatedBudget]);
    return serializedBudget;
  },

  deleteBudget: async (userId: string, budgetId: string) => {
    const budget = await getOwnedBudget(userId, budgetId);

    await prisma.budget.delete({
      where: {
        id: budget.id,
      },
    });

    return {
      id: budget.id,
    };
  },
};
