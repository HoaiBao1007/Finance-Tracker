import { AppState } from "@/components/ui/app-state";
import { formatDate, formatMoney } from "@/lib/format";
import type { Transaction } from "@/types/finance";

type TransactionsTableProps = {
  transactions: Transaction[];
  canManage: boolean;
  deletingTransactionId?: string | null;
  onCreate?: () => void;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (transaction: Transaction) => void;
};

export function TransactionsTable({
  transactions,
  canManage,
  deletingTransactionId,
  onCreate,
  onEdit,
  onDelete,
}: TransactionsTableProps) {
  if (transactions.length === 0) {
    return (
      <AppState
        title="Chưa có giao dịch nào trong kỳ"
        description={
          canManage
            ? "Hãy tạo giao dịch đầu tiên để backend trả dữ liệu thật cho summary cards và charts của dashboard."
            : "Đăng nhập để bật create, edit, delete transaction với backend thật."
        }
        actionLabel={canManage ? "Tạo giao dịch" : undefined}
        onAction={canManage ? onCreate : undefined}
      />
    );
  }

  return (
    <section className="panel rounded-[32px] p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Recent activity</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            Giao dịch gần đây
          </h2>
        </div>
        <div className="flex flex-col items-start gap-3 sm:items-end">
          <p className="text-sm leading-6 text-slate-600">
            Bảng này đã dùng đúng shape transaction từ backend docs.
          </p>
          <button
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            type="button"
            onClick={onCreate}
            disabled={!canManage}
          >
            Thêm giao dịch
          </button>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-y-3 text-left">
          <thead>
            <tr className="text-xs uppercase tracking-[0.22em] text-slate-500">
              <th className="pb-2 pr-4">Ngày</th>
              <th className="pb-2 pr-4">Danh mục</th>
              <th className="pb-2 pr-4">Loại</th>
              <th className="pb-2 pr-4">Số tiền</th>
              <th className="pb-2 pr-4">Ghi chú</th>
              <th className="pb-2">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <tr key={transaction.id} className="rounded-2xl bg-white/85">
                <td className="rounded-l-2xl px-4 py-4 text-sm text-slate-700">
                  {formatDate(transaction.date)}
                </td>
                <td className="px-4 py-4 text-sm font-medium text-slate-900">
                  {transaction.category.name}
                </td>
                <td className="px-4 py-4 text-sm text-slate-700">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      transaction.type === "income"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-orange-50 text-orange-700"
                    }`}
                  >
                    {transaction.type === "income" ? "Thu" : "Chi"}
                  </span>
                </td>
                <td className="px-4 py-4 text-sm font-semibold text-slate-950">
                  {formatMoney(transaction.amount)}
                </td>
                <td className="px-4 py-4 text-sm text-slate-600">
                  {transaction.note || "-"}
                </td>
                <td className="rounded-r-2xl px-4 py-4 text-sm text-slate-600">
                  <div className="flex flex-wrap gap-2">
                    <button
                      className="rounded-full border border-slate-300 px-3 py-1.5 font-medium text-slate-700 transition hover:border-slate-500 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                      type="button"
                      onClick={() => onEdit?.(transaction)}
                      disabled={!canManage}
                    >
                      Sửa
                    </button>
                    <button
                      className="rounded-full border border-orange-300 px-3 py-1.5 font-medium text-orange-700 transition hover:border-orange-500 hover:text-orange-900 disabled:cursor-not-allowed disabled:opacity-50"
                      type="button"
                      onClick={() => onDelete?.(transaction)}
                      disabled={!canManage || deletingTransactionId === transaction.id}
                    >
                      {deletingTransactionId === transaction.id ? "Đang xóa" : "Xóa"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}