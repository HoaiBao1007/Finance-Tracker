import { formatMoney, moneyToBigInt } from "@/lib/format";
import type { Budget } from "@/types/finance";

export type BudgetHealthTone = "healthy" | "warning" | "exceeded";

export type BudgetHealthStatus = {
  tone: BudgetHealthTone;
  label: string;
  caption: string;
  progress: number;
  remaining: bigint;
  spent: bigint;
  limit: bigint;
};

type BudgetHealthEntry = {
  budget: Budget;
  status: BudgetHealthStatus;
};

const zero = BigInt(0);

export function getBudgetStatus(budget: Budget): BudgetHealthStatus {
  const limit = moneyToBigInt(budget.limitAmount);
  const spent = moneyToBigInt(budget.spentAmount);
  const remaining = moneyToBigInt(budget.remainingAmount);
  const progress = limit > zero ? Number((spent * BigInt(10000)) / limit) / 100 : 0;

  if (remaining < zero) {
    return {
      tone: "exceeded",
      label: "Đã vượt",
      caption: `Vượt ${formatMoney(remaining * BigInt(-1))}`,
      progress: Math.max(progress, 100),
      remaining,
      spent,
      limit,
    };
  }

  if (progress >= 85) {
    return {
      tone: "warning",
      label: "Sắp chạm",
      caption: `Còn ${formatMoney(remaining)}`,
      progress,
      remaining,
      spent,
      limit,
    };
  }

  return {
    tone: "healthy",
    label: "An toàn",
    caption: `Còn ${formatMoney(remaining)}`,
    progress,
    remaining,
    spent,
    limit,
  };
}

export function getBudgetHealthOverview(budgets: Budget[]) {
  const entries = budgets.map((budget) => ({
    budget,
    status: getBudgetStatus(budget),
  }));

  const exceeded = entries
    .filter((entry) => entry.status.tone === "exceeded")
    .sort((left, right) => (left.status.remaining < right.status.remaining ? -1 : 1));
  const warning = entries
    .filter((entry) => entry.status.tone === "warning")
    .sort((left, right) => right.status.progress - left.status.progress);
  const healthy = entries.filter((entry) => entry.status.tone === "healthy");

  const totalOverBudget = exceeded.reduce(
    (sum, entry) => sum + entry.status.remaining * BigInt(-1),
    zero,
  );
  const totalRemaining = healthy.reduce((sum, entry) => sum + entry.status.remaining, zero);
  const highlighted = exceeded.length > 0 ? exceeded.slice(0, 2) : warning.slice(0, 2);

  return {
    entries,
    exceededCount: exceeded.length,
    warningCount: warning.length,
    healthyCount: healthy.length,
    totalOverBudget,
    totalRemaining,
    highlighted,
  };
}

export function formatHighlightedBudgetNames(entries: BudgetHealthEntry[]) {
  return entries.map((entry) => entry.budget.category.name).join(", ");
}