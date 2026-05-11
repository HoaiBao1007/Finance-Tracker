import {
  formatHighlightedBudgetNames,
  getBudgetHealthOverview,
} from "@/lib/budget";
import { formatMoney } from "@/lib/format";
import type { Budget } from "@/types/finance";

type BudgetHealthBannerProps = {
  budgets: Budget[];
  periodLabel: string;
};

export function BudgetHealthBanner({ budgets, periodLabel }: BudgetHealthBannerProps) {
  if (budgets.length === 0) {
    return null;
  }

  const overview = getBudgetHealthOverview(budgets);
  const highlightedNames = formatHighlightedBudgetNames(overview.highlighted);

  if (overview.exceededCount > 0) {
    return (
      <section className="panel rounded-[30px] border border-rose-200 bg-rose-50/90 p-5 text-rose-950">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="eyebrow text-rose-700">Budget alert</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              {overview.exceededCount} ngân sách đã vượt mức trong {periodLabel}
            </h2>
            <p className="mt-3 text-sm leading-6 text-rose-900/80">
              Tổng vượt {formatMoney(overview.totalOverBudget)}.
              {highlightedNames ? ` Ưu tiên rà lại ${highlightedNames}.` : ""}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-white/70 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.2em] text-rose-700">Vượt mức</p>
              <p className="mt-2 text-2xl font-semibold">{overview.exceededCount}</p>
            </div>
            <div className="rounded-2xl bg-white/70 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.2em] text-rose-700">Tổng vượt</p>
              <p className="mt-2 text-2xl font-semibold">{formatMoney(overview.totalOverBudget)}</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (overview.warningCount > 0) {
    return (
      <section className="panel rounded-[30px] border border-amber-200 bg-amber-50/90 p-5 text-amber-950">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="eyebrow text-amber-700">Budget watch</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              {overview.warningCount} ngân sách đang sát ngưỡng trong {periodLabel}
            </h2>
            <p className="mt-3 text-sm leading-6 text-amber-900/80">
              {highlightedNames
                ? `${highlightedNames} đang còn rất ít dư địa, nên theo dõi trước khi phát sinh giao dịch mới.`
                : "Có ngân sách đang tiến sát hạn mức của kỳ hiện tại."}
            </p>
          </div>
          <div className="rounded-2xl bg-white/70 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.2em] text-amber-700">Sát ngưỡng</p>
            <p className="mt-2 text-2xl font-semibold">{overview.warningCount}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="panel rounded-[30px] border border-emerald-200 bg-emerald-50/90 p-5 text-emerald-950">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="eyebrow text-emerald-700">Budget health</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            Ngân sách đang trong vùng an toàn cho {periodLabel}
          </h2>
          <p className="mt-3 text-sm leading-6 text-emerald-900/80">
            Còn dư tổng cộng {formatMoney(overview.totalRemaining)} trên {overview.healthyCount} danh mục đã đặt ngân sách.
          </p>
        </div>
        <div className="rounded-2xl bg-white/70 px-4 py-4">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-700">An toàn</p>
          <p className="mt-2 text-2xl font-semibold">{overview.healthyCount}</p>
        </div>
      </div>
    </section>
  );
}