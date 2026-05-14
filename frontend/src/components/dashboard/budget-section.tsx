import { AppState } from "@/components/ui/app-state";
import { getBudgetHealthOverview, getBudgetStatus } from "@/lib/budget";
import { formatDate, formatMoney, moneyToBigInt } from "@/lib/format";
import type { Budget } from "@/types/finance";

type BudgetSectionProps = {
  budgets: Budget[];
  canManage: boolean;
  periodLabel: string;
  deletingBudgetId?: string | null;
  onCreate?: () => void;
  onEdit?: (budget: Budget) => void;
  onDelete?: (budget: Budget) => void;
};

export function BudgetSection({
  budgets,
  canManage,
  periodLabel,
  deletingBudgetId,
  onCreate,
  onEdit,
  onDelete,
}: BudgetSectionProps) {
  const stats = getBudgetHealthOverview(budgets);

  return (
    <section className="rounded-[34px] border border-slate-200/90 bg-white p-6 shadow-[0_24px_72px_rgba(15,23,42,0.07)] sm:p-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Budget planning</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-[2rem]">
            Ngân sách theo danh mục
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Theo dõi hạn mức, phần đã dùng và vùng cảnh báo cho từng nhóm chi tiêu trong kỳ hiện tại.
          </p>
        </div>
        <button
          className="rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          type="button"
          onClick={onCreate}
          disabled={!canManage}
        >
          Thêm ngân sách
        </button>
      </div>

      {budgets.length > 0 ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-[24px] border border-rose-100 bg-rose-50 px-4 py-4 text-sm text-rose-900">
            <p className="text-xs uppercase tracking-[0.2em] text-rose-700">Vượt mức</p>
            <p className="mt-2 text-2xl font-semibold">{stats.exceededCount}</p>
          </div>
          <div className="rounded-[24px] border border-amber-100 bg-amber-50 px-4 py-4 text-sm text-amber-900">
            <p className="text-xs uppercase tracking-[0.2em] text-amber-700">Sát ngưỡng</p>
            <p className="mt-2 text-2xl font-semibold">{stats.warningCount}</p>
          </div>
          <div className="rounded-[24px] border border-emerald-100 bg-emerald-50 px-4 py-4 text-sm text-emerald-900">
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-700">An toàn</p>
            <p className="mt-2 text-2xl font-semibold">{stats.healthyCount}</p>
          </div>
        </div>
      ) : null}

      {budgets.length === 0 ? (
        <div className="mt-6">
          <AppState
            title="Chưa có ngân sách nào trong kỳ"
            description={
              canManage
                ? "Tạo ngân sách cho từng nhóm chi tiêu để chuẩn bị cho bước theo dõi vượt hạn mức ở các vòng sau."
                : "Đăng nhập để tạo, sửa và xóa ngân sách cho kỳ đang xem."
            }
            actionLabel={canManage ? "Tạo ngân sách" : undefined}
            onAction={canManage ? onCreate : undefined}
          />
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-[28px] border border-slate-200">
          <table className="min-w-full border-collapse text-left">
            <thead className="bg-slate-50/90">
              <tr className="text-xs uppercase tracking-[0.22em] text-slate-500">
                <th className="px-5 py-4">Danh mục</th>
                <th className="px-5 py-4">Đã chi / Hạn mức</th>
                <th className="px-5 py-4">Còn lại</th>
                <th className="px-5 py-4">Trạng thái</th>
                <th className="px-5 py-4">Cập nhật</th>
                <th className="px-5 py-4">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {budgets.map((budget) => {
                const status = getBudgetStatus(budget);

                return (
                  <tr
                    key={budget.id}
                    className={`border-t border-slate-100 ${
                      status.tone === "exceeded"
                        ? "bg-rose-50/70"
                        : status.tone === "warning"
                          ? "bg-amber-50/70"
                          : "bg-white"
                    }`}
                  >
                    <td className="px-5 py-4 text-sm font-medium text-slate-900">
                      <div className="flex flex-col gap-1">
                        <span>{budget.category.name}</span>
                        <span className="text-xs text-slate-500">Kỳ {periodLabel}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-700">
                      <div className="min-w-44">
                        <div className="flex items-center justify-between gap-3 text-sm font-semibold text-slate-950">
                          <span>{formatMoney(budget.spentAmount)}</span>
                          <span className="text-slate-500">/ {formatMoney(budget.limitAmount)}</span>
                        </div>
                        <div className="mt-3 h-2.5 rounded-full bg-slate-200">
                          <div
                            className={`h-2.5 rounded-full ${
                              status.tone === "exceeded"
                                ? "bg-rose-500"
                                : status.tone === "warning"
                                  ? "bg-amber-500"
                                  : "bg-emerald-500"
                            }`}
                            style={{ width: `${Math.min(status.progress, 100)}%` }}
                          />
                        </div>
                        <p className="mt-2 text-xs text-slate-500">
                          {status.progress.toFixed(0)}% ngân sách đã dùng
                        </p>
                      </div>
                    </td>
                    <td
                      className={`px-5 py-4 text-sm font-semibold ${
                        moneyToBigInt(budget.remainingAmount) < BigInt(0)
                          ? "text-rose-700"
                          : "text-slate-950"
                      }`}
                    >
                      {formatMoney(budget.remainingAmount)}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      <div className="flex flex-col gap-2">
                        <span
                          className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                            status.tone === "exceeded"
                              ? "bg-rose-100 text-rose-700"
                              : status.tone === "warning"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {status.label}
                        </span>
                        <span className="text-xs text-slate-500">{status.caption}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {formatDate(budget.updatedAt)}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      <div className="flex flex-wrap gap-2">
                        <button
                          className="rounded-full border border-slate-300 px-3 py-1.5 font-medium text-slate-700 transition hover:border-slate-500 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                          type="button"
                          onClick={() => onEdit?.(budget)}
                          disabled={!canManage}
                        >
                          Sửa
                        </button>
                        <button
                          className="rounded-full border border-orange-300 px-3 py-1.5 font-medium text-orange-700 transition hover:border-orange-500 hover:text-orange-900 disabled:cursor-not-allowed disabled:opacity-50"
                          type="button"
                          onClick={() => onDelete?.(budget)}
                          disabled={!canManage || deletingBudgetId === budget.id}
                        >
                          {deletingBudgetId === budget.id ? "Đang xóa" : "Xóa"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}