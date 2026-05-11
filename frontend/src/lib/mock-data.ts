import { formatMonthLabel } from "@/lib/format";
import type {
  Budget,
  CategoryExpense,
  DashboardFilters,
  DashboardSnapshot,
  Transaction,
} from "@/types/finance";

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function toMoneyString(value: number): string {
  return Math.round(value).toString();
}

function isoDate(year: number, month: number, day: number, hour = 9): string {
  return new Date(Date.UTC(year, month - 1, day, hour, 0, 0)).toISOString();
}

function endOfMonthIso(year: number, month: number): string {
  return new Date(Date.UTC(year, month, 0, 23, 59, 59, 999)).toISOString();
}

function shiftMonth(year: number, month: number, offset: number) {
  const date = new Date(Date.UTC(year, month - 1 + offset, 1));

  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
  };
}

function buildExpenseCategories(seed: number): CategoryExpense[] {
  const templates = [
    { id: "cat-food", name: "Ăn uống", base: 1700000 },
    { id: "cat-bills", name: "Hóa đơn", base: 2200000 },
    { id: "cat-travel", name: "Di chuyển", base: 900000 },
    { id: "cat-fun", name: "Giải trí", base: 750000 },
  ];

  return templates.map((template, index) => {
    const amount = template.base + (seed % 5) * 110000 + index * 85000;

    return {
      categoryId: template.id,
      categoryName: template.name,
      amount: toMoneyString(amount),
    };
  });
}

function buildTrendData(year: number, month: number, seed: number) {
  return Array.from({ length: 6 }, (_, index) => {
    const current = shiftMonth(year, month, index - 5);
    const income = 14800000 + (seed + index) * 160000;
    const expense = 6200000 + ((seed + index * 2) % 6) * 250000;

    return {
      key: `${current.year}-${String(current.month).padStart(2, "0")}`,
      label: formatMonthLabel(current.year, current.month),
      year: current.year,
      month: current.month,
      income: toMoneyString(income),
      expense: toMoneyString(expense),
      balance: toMoneyString(income - expense),
    };
  });
}

function buildTransactions(
  year: number,
  month: number,
  categories: CategoryExpense[],
): Transaction[] {
  const expenseReferences = categories.map((item) => ({
    id: item.categoryId,
    name: item.categoryName,
    type: "expense" as const,
    isDefault: true,
  }));

  const incomeReference = {
    id: "cat-salary",
    name: "Lương",
    type: "income" as const,
    isDefault: true,
  };

  return [
    {
      id: "txn-salary",
      userId: "demo-user",
      categoryId: incomeReference.id,
      amount: "18000000",
      type: "income",
      date: isoDate(year, month, 1, 8),
      note: "Lương tháng",
      createdAt: isoDate(year, month, 1, 8),
      updatedAt: isoDate(year, month, 1, 8),
      category: incomeReference,
    },
    {
      id: "txn-bills",
      userId: "demo-user",
      categoryId: expenseReferences[1].id,
      amount: toMoneyString(Number(categories[1].amount) / 2),
      type: "expense",
      date: isoDate(year, month, 4),
      note: "Thanh toán điện nước",
      createdAt: isoDate(year, month, 4),
      updatedAt: isoDate(year, month, 4),
      category: expenseReferences[1],
    },
    {
      id: "txn-food",
      userId: "demo-user",
      categoryId: expenseReferences[0].id,
      amount: toMoneyString(Number(categories[0].amount) / 3),
      type: "expense",
      date: isoDate(year, month, 8),
      note: "Ăn trưa cùng team",
      createdAt: isoDate(year, month, 8),
      updatedAt: isoDate(year, month, 8),
      category: expenseReferences[0],
    },
    {
      id: "txn-travel",
      userId: "demo-user",
      categoryId: expenseReferences[2].id,
      amount: toMoneyString(Number(categories[2].amount) / 2),
      type: "expense",
      date: isoDate(year, month, 16),
      note: "Đổ xăng đầu tuần",
      createdAt: isoDate(year, month, 16),
      updatedAt: isoDate(year, month, 16),
      category: expenseReferences[2],
    },
    {
      id: "txn-fun",
      userId: "demo-user",
      categoryId: expenseReferences[3].id,
      amount: toMoneyString(Number(categories[3].amount) / 2),
      type: "expense",
      date: isoDate(year, month, 22),
      note: "Xem phim cuối tuần",
      createdAt: isoDate(year, month, 22),
      updatedAt: isoDate(year, month, 22),
      category: expenseReferences[3],
    },
  ];
}

function buildBudgets(
  year: number,
  month: number,
  categories: CategoryExpense[],
): Budget[] {
  const offsets = [-180000, 120000, 700000];

  return categories.slice(0, 3).map((category, index) => {
    const spentAmount = Number(category.amount);
    const limitAmount = spentAmount + offsets[index];

    return {
      id: `budget-${category.categoryId}`,
      userId: "demo-user",
      categoryId: category.categoryId,
      limitAmount: toMoneyString(limitAmount),
      spentAmount: toMoneyString(spentAmount),
      remainingAmount: toMoneyString(limitAmount - spentAmount),
      month,
      year,
      createdAt: isoDate(year, month, 1 + index),
      updatedAt: isoDate(year, month, 10 + index),
      category: {
        id: category.categoryId,
        name: category.categoryName,
        type: "expense",
        isDefault: true,
      },
    };
  });
}

export function buildMockDashboardSnapshot(
  input: Partial<DashboardFilters>,
): DashboardSnapshot {
  const now = new Date();
  const month = clamp(input.month ?? now.getUTCMonth() + 1, 1, 12);
  const year = clamp(input.year ?? now.getUTCFullYear(), 2024, 2035);
  const seed = (year - 2024) * 12 + month;
  const categories = buildExpenseCategories(seed);
  const totalExpense = categories.reduce(
    (sum, category) => sum + Number(category.amount),
    0,
  );
  const totalIncome = totalExpense + 9100000 + (seed % 4) * 420000;
  const trendMonths = buildTrendData(year, month, seed);

  return {
    filters: {
      month,
      year,
    },
    source: "mock",
    summary: {
      period: {
        from: isoDate(year, month, 1, 0),
        to: endOfMonthIso(year, month),
      },
      totalIncome: toMoneyString(totalIncome),
      totalExpense: toMoneyString(totalExpense),
      balance: toMoneyString(totalIncome - totalExpense),
    },
    expenseByCategory: {
      period: {
        from: isoDate(year, month, 1, 0),
        to: endOfMonthIso(year, month),
      },
      totalExpense: toMoneyString(totalExpense),
      categories,
    },
    monthlyTrend: {
      period: {
        from: isoDate(trendMonths[0].year, trendMonths[0].month, 1, 0),
        to: endOfMonthIso(
          trendMonths[trendMonths.length - 1].year,
          trendMonths[trendMonths.length - 1].month,
        ),
      },
      months: trendMonths,
    },
    budgets: buildBudgets(year, month, categories),
    recentTransactions: buildTransactions(year, month, categories),
  };
}