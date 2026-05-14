import { AppState } from "@/components/ui/app-state";
import { formatDate, formatMoney } from "@/lib/format";
import type { Transaction } from "@/types/finance";

function getCategoryMonogram(categoryName: string) {
  return categoryName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((chunk) => chunk[0]?.toUpperCase() ?? "")
    .join("");
}

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
    <section className="rounded-[34px] border border-slate-200/90 bg-white p-6 shadow-[0_24px_72px_rgba(15,23,42,0.07)] sm:p-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Bottom row</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-[2rem]">
            5 giao dịch gần nhất
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Bảng tóm tắt ưu tiên hạng mục, số tiền, ngày ghi nhận và trạng thái để quét nhanh trong vài giây.
          </p>
        </div>
        <button
          className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          type="button"
          onClick={onCreate}
          disabled={!canManage}
        >
          Thêm giao dịch
        </button>
      </div>

      <div className="mt-6 overflow-x-auto rounded-[28px] border border-slate-200">
        <table className="min-w-full border-collapse text-left">
          <thead className="bg-slate-50/90">
            <tr className="text-xs uppercase tracking-[0.22em] text-slate-500">
              <th className="px-5 py-4">Hạng mục</th>
              <th className="px-5 py-4">Ngày</th>
              <th className="px-5 py-4">Số tiền</th>
              <th className="px-5 py-4">Trạng thái</th>
              <th className="px-5 py-4">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <tr key={transaction.id} className="border-t border-slate-100 align-top transition hover:bg-slate-50/70">
                <td className="px-5 py-4 text-sm text-slate-700">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-2xl text-xs font-semibold ${
                        transaction.type === "income"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {getCategoryMonogram(transaction.category.name)}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{transaction.category.name}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {transaction.note || "Không có ghi chú"}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 text-sm text-slate-600">{formatDate(transaction.date)}</td>
                <td
                  className={`px-5 py-4 text-sm font-semibold ${
                    transaction.type === "income" ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {transaction.type === "income" ? "+" : "-"}
                  {formatMoney(transaction.amount)}
                </td>
                <td className="px-5 py-4 text-sm text-slate-700">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      transaction.type === "income"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-rose-50 text-rose-700"
                    }`}
                  >
                    {transaction.type === "income" ? "Đã nhận" : "Đã chi"}
                  </span>
                </td>
                <td className="px-5 py-4 text-sm text-slate-600">
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