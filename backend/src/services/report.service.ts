import { TransactionType, type Prisma } from "@prisma/client";

import { pool, prisma } from "../lib/prisma";
import { formatMonthKey, getMonthWindow, resolveDateRange } from "../utils/date";
import { serializeAmount } from "../utils/amount";
import type {
  ByCategoryReportQuery,
  MonthlyTrendReportQuery,
  SummaryReportQuery,
} from "../validators/report.validator";

const sumBigInts = (values: bigint[]) => values.reduce((sum, value) => sum + value, 0n);

const buildPeriod = (from: Date, to: Date) => ({
  from: from.toISOString(),
  to: to.toISOString(),
});

type SummaryTransaction = {
  amount: bigint;
  type: TransactionType;
};

const getSummaryTotals = (transactions: SummaryTransaction[]) => {
  const income = sumBigInts(
    transactions.filter((transaction) => transaction.type === TransactionType.income).map((transaction) => transaction.amount)
  );
  const expense = sumBigInts(
    transactions.filter((transaction) => transaction.type === TransactionType.expense).map((transaction) => transaction.amount)
  );

  return {
    totalIncome: serializeAmount(income),
    totalExpense: serializeAmount(expense),
    balance: serializeAmount(income - expense),
  };
};

export const reportService = {
  getSummary: async (userId: string, query: SummaryReportQuery) => {
    const range = resolveDateRange(query, "current-month");

    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: range.filter,
      },
      select: {
        amount: true,
        type: true,
      },
    });

    return {
      period: buildPeriod(range.from, range.to),
      ...getSummaryTotals(transactions),
    };
  },

  getExpenseByCategory: async (userId: string, query: ByCategoryReportQuery) => {
    const range = resolveDateRange(query, "current-month");

    const filters = ['t."userId" = $1', 't."type" = $2'];
    const params: Array<string | Date> = [userId, TransactionType.expense];

    if (range.filter.gte) {
      params.push(range.filter.gte);
      filters.push(`t."date" >= $${params.length}`);
    }

    if (range.filter.lt) {
      params.push(range.filter.lt);
      filters.push(`t."date" < $${params.length}`);
    }

    if (range.filter.lte) {
      params.push(range.filter.lte);
      filters.push(`t."date" <= $${params.length}`);
    }

    const result = await pool.query<{
      categoryId: string;
      categoryName: string;
      amount: string;
    }>(
      `
        SELECT
          t."categoryId" AS "categoryId",
          COALESCE(c."name", t."categoryId") AS "categoryName",
          SUM(t."amount")::text AS "amount"
        FROM "Transaction" t
        LEFT JOIN "Category" c ON c."id" = t."categoryId"
        WHERE ${filters.join(" AND ")}
        GROUP BY t."categoryId", c."name"
        ORDER BY SUM(t."amount") DESC, "categoryName" ASC
      `,
      params,
    );

    const categories = result.rows.map((row) => ({
      categoryId: row.categoryId,
      categoryName: row.categoryName,
      amount: serializeAmount(BigInt(row.amount)),
    }));

    const totalExpense = serializeAmount(sumBigInts(result.rows.map((row) => BigInt(row.amount))));

    return {
      period: buildPeriod(range.from, range.to),
      totalExpense,
      categories,
    };
  },

  getMonthlyTrend: async (userId: string, query: MonthlyTrendReportQuery) => {
    const monthsToInclude = query.months ?? 6;
    const now = new Date();
    const anchorYear = query.year ?? now.getUTCFullYear();
    const anchorMonth = query.month ?? now.getUTCMonth() + 1;

    const monthWindows = Array.from({ length: monthsToInclude }, (_value, index) => {
      const offset = monthsToInclude - index - 1;
      const anchorDate = new Date(Date.UTC(anchorYear, anchorMonth - 1 - offset, 1));

      return {
        year: anchorDate.getUTCFullYear(),
        month: anchorDate.getUTCMonth() + 1,
        ...getMonthWindow(anchorDate.getUTCFullYear(), anchorDate.getUTCMonth() + 1),
      };
    });

    const firstWindow = monthWindows[0];
    const lastWindow = monthWindows[monthWindows.length - 1];

    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: firstWindow.start,
          lt: lastWindow.endExclusive,
        },
      },
      select: {
        amount: true,
        type: true,
        date: true,
      },
    });

    const buckets = new Map<
      string,
      {
        income: bigint;
        expense: bigint;
      }
    >();

    for (const window of monthWindows) {
      buckets.set(formatMonthKey(window.year, window.month), {
        income: 0n,
        expense: 0n,
      });
    }

    for (const transaction of transactions) {
      const year = transaction.date.getUTCFullYear();
      const month = transaction.date.getUTCMonth() + 1;
      const key = formatMonthKey(year, month);
      const bucket = buckets.get(key);

      if (!bucket) {
        continue;
      }

      if (transaction.type === TransactionType.income) {
        bucket.income += transaction.amount;
      } else {
        bucket.expense += transaction.amount;
      }
    }

    const months = monthWindows.map((window) => {
      const key = formatMonthKey(window.year, window.month);
      const bucket = buckets.get(key)!;

      return {
        key,
        label: key,
        year: window.year,
        month: window.month,
        income: serializeAmount(bucket.income),
        expense: serializeAmount(bucket.expense),
        balance: serializeAmount(bucket.income - bucket.expense),
      };
    });

    return {
      period: buildPeriod(firstWindow.start, lastWindow.endInclusive),
      months,
    };
  },
};
