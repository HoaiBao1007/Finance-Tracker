"use client";

import { AccountSettingsCard } from "@/components/dashboard/account-settings-card";
import { BackendConnectionCard } from "@/components/dashboard/backend-connection-card";
import { BudgetHealthBanner } from "@/components/dashboard/budget-health-banner";
import { BudgetModal } from "@/components/dashboard/budget-modal";
import { BudgetSection } from "@/components/dashboard/budget-section";
import { ExpensePieChart } from "@/components/dashboard/expense-pie-chart";
import { IncomeExpenseBarChart } from "@/components/dashboard/income-expense-bar-chart";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { TransactionModal } from "@/components/dashboard/transaction-modal";
import { TransactionsTable } from "@/components/dashboard/transactions-table";
import { Badge } from "@/components/ui/badge";
import { Toast, type ToastState } from "@/components/ui/toast";
import { financeApi } from "@/lib/api";
import { getDashboardLiveBundle } from "@/lib/dashboard-data";
import { formatDateRange, formatMonthLabel } from "@/lib/format";
import type { BudgetFormValues } from "@/schemas/budget-form.schema";
import type { TransactionFormValues } from "@/schemas/transaction-form.schema";
import type {
  AuthPayload,
  AuthUser,
  Budget,
  BudgetCreateInput,
  Category,
  DashboardSnapshot,
  Transaction,
  TransactionCreateInput,
} from "@/types/finance";
import { useEffect, useRef, useState } from "react";

const ACCESS_TOKEN_STORAGE_KEY = "finance-tracker.access-token";

type DashboardShellProps = {
  data: DashboardSnapshot;
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Đã có lỗi không xác định khi kết nối backend.";
}

function toTransactionPayload(values: TransactionFormValues): TransactionCreateInput {
  return {
    categoryId: values.categoryId,
    amount: values.amount.trim(),
    type: values.type,
    date: new Date(values.date).toISOString(),
    note: values.note?.trim() || undefined,
  };
}

function toBudgetPayload(
  values: BudgetFormValues,
  filters: DashboardSnapshot["filters"],
): BudgetCreateInput {
  return {
    categoryId: values.categoryId,
    limitAmount: values.limitAmount.trim(),
    month: filters.month,
    year: filters.year,
  };
}

type AuthMode = "login" | "register";

export function DashboardShell({ data: initialData }: DashboardShellProps) {
  const [dashboardData, setDashboardData] = useState(initialData);
  const [authToken, setAuthToken] = useState("");
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [helperMessage, setHelperMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isSubmittingTransaction, setIsSubmittingTransaction] = useState(false);
  const [deletingTransactionId, setDeletingTransactionId] = useState<string | null>(null);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [isSubmittingBudget, setIsSubmittingBudget] = useState(false);
  const [deletingBudgetId, setDeletingBudgetId] = useState<string | null>(null);
  const [toastQueue, setToastQueue] = useState<ToastState[]>([]);
  const nextToastIdRef = useRef(0);

  useEffect(() => {
    const storedToken = window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY) ?? "";

    setAuthToken(storedToken);

    if (storedToken) {
      setHelperMessage("Đang khôi phục phiên đăng nhập đã lưu...");
    }
  }, []);

  useEffect(() => {
    let isCancelled = false;

    async function syncDashboardWithCurrentSource() {
      if (!authToken.trim()) {
        setDashboardData(initialData);
        setCurrentUser(null);
        setCategories([]);
        return;
      }

      setIsSyncing(true);

      try {
        const bundle = await getDashboardLiveBundle(initialData.filters, authToken);

        if (isCancelled) {
          return;
        }

        setDashboardData(bundle.snapshot);
        setCategories(bundle.categories);
        setCurrentUser(bundle.currentUser);
        setErrorMessage(null);
        setHelperMessage(`Dữ liệu thật đã sẵn sàng cho ${bundle.currentUser.email}.`);
      } catch (error) {
        if (isCancelled) {
          return;
        }

        window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
        setAuthToken("");
        setCurrentUser(null);
        setCategories([]);
        setDashboardData(initialData);
        setErrorMessage(getErrorMessage(error));
        setHelperMessage("Đã quay về mock mode để bạn vẫn tiếp tục dựng UI.");
      } finally {
        if (!isCancelled) {
          setIsSyncing(false);
        }
      }
    }

    void syncDashboardWithCurrentSource();

    return () => {
      isCancelled = true;
    };
  }, [authToken, initialData]);

  const expenseCategories = categories.filter((category) => category.type === "expense");
  const canManageTransactions = Boolean(authToken && currentUser && categories.length > 0);
  const canManageBudgets = Boolean(authToken && currentUser && expenseCategories.length > 0);
  const budgetPeriodLabel = formatMonthLabel(
    dashboardData.filters.year,
    dashboardData.filters.month,
  );
  const currentPeriodLabel = formatDateRange(
    dashboardData.summary.period.from,
    dashboardData.summary.period.to,
  );
  const sourceLabel = dashboardData.source === "api" ? "API live" : "Mock mode";
  const greetingName = currentUser?.fullName ?? "bạn";
  const recentTransactions = dashboardData.recentTransactions.slice(0, 5);
  const sourceDescription =
    dashboardData.source === "api"
      ? "Đã kết nối dữ liệu thật từ backend và sẵn sàng CRUD ngay trên dashboard."
      : "Đang dùng dataset mẫu để hoàn thiện trải nghiệm giao diện trước khi đồng bộ backend.";


  function showToast(tone: ToastState["tone"], title: string, message: string) {
    nextToastIdRef.current += 1;

    setToastQueue((currentQueue) => [
      ...currentQueue,
      {
        id: nextToastIdRef.current,
        tone,
        title,
        message,
      },
    ]);
  }

  function dismissToast(toastId: ToastState["id"]) {
    setToastQueue((currentQueue) => currentQueue.filter((toast) => toast.id !== toastId));
  }

  async function refreshLiveData(options?: { silentSuccess?: boolean; trigger?: "manual" }) {
    if (!authToken.trim()) {
      setHelperMessage("Cần đăng nhập bằng tài khoản hợp lệ để đồng bộ backend thật.");

      if (options?.trigger === "manual") {
        showToast(
          "info",
          "Chưa thể đồng bộ",
          "Hãy đăng nhập trước khi yêu cầu tải dữ liệu thật từ backend.",
        );
      }

      return;
    }

    setIsSyncing(true);

    try {
      const bundle = await getDashboardLiveBundle(initialData.filters, authToken);

      setDashboardData(bundle.snapshot);
      setCategories(bundle.categories);
      setCurrentUser(bundle.currentUser);
      setErrorMessage(null);

      if (!options?.silentSuccess) {
        setHelperMessage("Dashboard đã đồng bộ lại từ backend thật.");
      }

      if (options?.trigger === "manual") {
        showToast(
          "success",
          "Đã đồng bộ dashboard",
          "Dữ liệu mới nhất từ backend đã được tải xong.",
        );
      }
    } catch (error) {
      const message = getErrorMessage(error);

      setErrorMessage(message);
      setHelperMessage(null);

      if (options?.trigger === "manual") {
        showToast("error", "Không thể đồng bộ dashboard", message);
      }
    } finally {
      setIsSyncing(false);
    }
  }

  function handleAuthenticated(payload: AuthPayload, mode: AuthMode) {
    window.localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, payload.accessToken);
    setErrorMessage(null);
    setHelperMessage(`Xin chào ${payload.user.fullName}, đang đồng bộ dashboard...`);
    setCurrentUser(payload.user);
    setAuthToken(payload.accessToken);

    showToast(
      "success",
      mode === "login" ? "Đăng nhập thành công" : "Tạo tài khoản thành công",
      mode === "login"
        ? `Đang kết nối dashboard với dữ liệu thật của ${payload.user.email}.`
        : `${payload.user.fullName} đã được đăng nhập và đang đồng bộ dữ liệu thật.`,
    );
  }

  function handleDisconnectToken() {
    window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
    setAuthToken("");
    setCurrentUser(null);
    setCategories([]);
    setDashboardData(initialData);
    setEditingTransaction(null);
    setIsModalOpen(false);
    setEditingBudget(null);
    setIsBudgetModalOpen(false);
    setErrorMessage(null);
    setHelperMessage("Đã ngắt kết nối backend. Dashboard đang dùng mock contract.");
    showToast(
      "info",
      "Đã đăng xuất",
      "Access token đã được gỡ khỏi trình duyệt và dashboard đã quay về mock mode.",
    );
  }

  function handleProfileUpdated(user: AuthUser) {
    setCurrentUser(user);
    setHelperMessage(`Hồ sơ của ${user.email} đã được cập nhật.`);
  }

  function openCreateBudgetModal() {
    if (!canManageBudgets) {
      setErrorMessage("Cần đăng nhập hợp lệ trước khi tạo ngân sách.");
      return;
    }

    setEditingBudget(null);
    setIsBudgetModalOpen(true);
  }

  function openEditBudgetModal(budget: Budget) {
    if (!canManageBudgets) {
      setErrorMessage("Cần đăng nhập hợp lệ trước khi sửa ngân sách.");
      return;
    }

    setEditingBudget(budget);
    setIsBudgetModalOpen(true);
  }

  function closeBudgetModal() {
    if (isSubmittingBudget) {
      return;
    }

    setIsBudgetModalOpen(false);
    setEditingBudget(null);
  }

  function openCreateTransactionModal() {
    if (!canManageTransactions) {
      setErrorMessage("Cần đăng nhập hợp lệ trước khi tạo transaction trên backend thật.");
      return;
    }

    setEditingTransaction(null);
    setIsModalOpen(true);
  }

  function openEditTransactionModal(transaction: Transaction) {
    if (!canManageTransactions) {
      setErrorMessage("Cần đăng nhập hợp lệ trước khi sửa transaction.");
      return;
    }

    setEditingTransaction(transaction);
    setIsModalOpen(true);
  }

  function closeTransactionModal() {
    if (isSubmittingTransaction) {
      return;
    }

    setIsModalOpen(false);
    setEditingTransaction(null);
  }

  async function handleSubmitTransaction(values: TransactionFormValues) {
    if (!authToken.trim()) {
      setErrorMessage("Cần đăng nhập hợp lệ để submit transaction.");
      return;
    }

    setIsSubmittingTransaction(true);

    try {
      const payload = toTransactionPayload(values);

      if (editingTransaction) {
        await financeApi.updateTransaction(editingTransaction.id, payload, authToken);
      } else {
        await financeApi.createTransaction(payload, authToken);
      }

      await refreshLiveData({ silentSuccess: true });
      setIsModalOpen(false);
      setEditingTransaction(null);
      showToast(
        "success",
        editingTransaction ? "Đã cập nhật giao dịch" : "Đã tạo giao dịch",
        "Dashboard đã được đồng bộ với dữ liệu mới.",
      );
    } catch (error) {
      const message = getErrorMessage(error);
      setErrorMessage(message);
      showToast(
        "error",
        editingTransaction ? "Không thể cập nhật giao dịch" : "Không thể tạo giao dịch",
        message,
      );
    } finally {
      setIsSubmittingTransaction(false);
    }
  }

  async function handleDeleteTransaction(transaction: Transaction) {
    if (!authToken.trim()) {
      setErrorMessage("Cần đăng nhập hợp lệ để xóa transaction.");
      return;
    }

    const confirmed = window.confirm(
      `Xóa giao dịch ${transaction.category.name} - ${transaction.amount}?`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingTransactionId(transaction.id);

    try {
      await financeApi.deleteTransaction(transaction.id, authToken);
      await refreshLiveData({ silentSuccess: true });
      showToast("success", "Đã xóa giao dịch", "Dashboard đã được đồng bộ với dữ liệu mới.");
    } catch (error) {
      const message = getErrorMessage(error);
      setErrorMessage(message);
      showToast("error", "Không thể xóa giao dịch", message);
    } finally {
      setDeletingTransactionId(null);
    }
  }

  async function handleSubmitBudget(values: BudgetFormValues) {
    if (!authToken.trim()) {
      setErrorMessage("Cần đăng nhập hợp lệ để lưu ngân sách.");
      return;
    }

    setIsSubmittingBudget(true);

    try {
      const payload = toBudgetPayload(values, dashboardData.filters);

      if (editingBudget) {
        await financeApi.updateBudget(editingBudget.id, payload, authToken);
      } else {
        await financeApi.createBudget(payload, authToken);
      }

      await refreshLiveData({ silentSuccess: true });
      setIsBudgetModalOpen(false);
      setEditingBudget(null);
      showToast(
        "success",
        editingBudget ? "Đã cập nhật ngân sách" : "Đã tạo ngân sách",
        "Trạng thái ngân sách đã được làm mới trên dashboard.",
      );
    } catch (error) {
      const message = getErrorMessage(error);
      setErrorMessage(message);
      showToast(
        "error",
        editingBudget ? "Không thể cập nhật ngân sách" : "Không thể tạo ngân sách",
        message,
      );
    } finally {
      setIsSubmittingBudget(false);
    }
  }

  async function handleDeleteBudget(budget: Budget) {
    if (!authToken.trim()) {
      setErrorMessage("Cần đăng nhập hợp lệ để xóa ngân sách.");
      return;
    }

    const confirmed = window.confirm(
      `Xóa ngân sách ${budget.category.name} - ${budget.limitAmount}?`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingBudgetId(budget.id);

    try {
      await financeApi.deleteBudget(budget.id, authToken);
      await refreshLiveData({ silentSuccess: true });
      showToast(
        "success",
        "Đã xóa ngân sách",
        "Trạng thái ngân sách đã được làm mới trên dashboard.",
      );
    } catch (error) {
      const message = getErrorMessage(error);
      setErrorMessage(message);
      showToast("error", "Không thể xóa ngân sách", message);
    } finally {
      setDeletingBudgetId(null);
    }
  }

  return (
    <>
      <main className="min-h-screen px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        <div className="mx-auto max-w-[1440px] space-y-6 lg:space-y-8">
          <section className="panel relative overflow-hidden rounded-[40px] bg-[linear-gradient(135deg,#ffffff_0%,#f7fbff_58%,#f1f8ff_100%)] px-6 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
            <div className="relative flex flex-col gap-8">
              <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                <div className="max-w-3xl">
                  <Badge className="bg-slate-900 text-white">Dashboard cá nhân</Badge>
                  <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                    Chào {greetingName}!
                  </h1>
                  <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                    Một bố cục grid sáng, gọn và dễ quét để bạn theo dõi số dư, xu hướng thu chi và các giao dịch mới nhất mà không bị rối mắt.
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3 text-sm text-slate-600">
                    <span className="rounded-full border border-slate-200 bg-white/80 px-4 py-2">
                      {budgetPeriodLabel}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-white/80 px-4 py-2">
                      {sourceLabel}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-white/80 px-4 py-2">
                      {currentUser?.email ?? "Chưa đăng nhập"}
                    </span>
                  </div>
                </div>

                <div className="flex w-full flex-col gap-3 xl:max-w-[320px] xl:items-stretch">
                  <div className="rounded-[28px] border border-white/90 bg-white/90 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Tổng quan kỳ</p>
                    <p className="mt-3 text-lg font-semibold text-slate-950">{currentPeriodLabel}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{sourceDescription}</p>
                  </div>
                  <button
                    className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white shadow-[0_16px_36px_rgba(37,99,235,0.25)] transition hover:bg-blue-500"
                    type="button"
                    onClick={openCreateTransactionModal}
                  >
                    Thêm Giao dịch
                  </button>
                </div>
              </div>

              {helperMessage ? (
                <div className="rounded-[24px] border border-emerald-100 bg-emerald-50/90 px-5 py-4 text-sm text-emerald-700">
                  {helperMessage}
                </div>
              ) : null}
              {errorMessage ? (
                <div className="rounded-[24px] border border-rose-100 bg-rose-50/90 px-5 py-4 text-sm text-rose-700">
                  {errorMessage}
                </div>
              ) : null}

              <div className="grid gap-4 xl:grid-cols-3">
                <SummaryCard
                  staggerIndex={0}
                  animateCount
                  label="Tổng số dư"
                  value={dashboardData.summary.balance}
                  caption="Số dư ròng hiện tại của tháng đang xem, ưu tiên đặt trên cùng để nắm tình hình ngay khi mở trang."
                  tone="balance"
                />
                <SummaryCard
                  staggerIndex={1}
                  label="Thu nhập tháng"
                  value={dashboardData.summary.totalIncome}
                  caption="Toàn bộ khoản tiền vào trong tháng, dùng sắc xanh lá để nhấn trạng thái tích cực."
                  tone="income"
                />
                <SummaryCard
                  staggerIndex={2}
                  label="Chi tiêu tháng"
                  value={dashboardData.summary.totalExpense}
                  caption="Tổng chi trong tháng, dùng sắc đỏ dịu để cảnh báo vùng cần theo dõi kỹ hơn."
                  tone="expense"
                />
              </div>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
            <IncomeExpenseBarChart
              items={dashboardData.monthlyTrend.months}
              source={dashboardData.source}
            />
            <ExpensePieChart
              items={dashboardData.expenseByCategory.categories}
              totalExpense={dashboardData.expenseByCategory.totalExpense}
            />
          </section>

          <TransactionsTable
            transactions={recentTransactions}
            canManage={canManageTransactions}
            deletingTransactionId={deletingTransactionId}
            onCreate={openCreateTransactionModal}
            onEdit={openEditTransactionModal}
            onDelete={handleDeleteTransaction}
          />

          <section className="grid gap-6 xl:grid-cols-[minmax(320px,0.95fr)_minmax(0,1.4fr)]">
            <div className="space-y-6">
              <BackendConnectionCard
                currentUser={currentUser}
                source={dashboardData.source}
                periodLabel={budgetPeriodLabel}
                isLoading={isSyncing}
                errorMessage={errorMessage}
                helperMessage={helperMessage}
                onAuthenticated={handleAuthenticated}
                onDisconnect={handleDisconnectToken}
                onRefresh={() => void refreshLiveData({ trigger: "manual" })}
              />

              <AccountSettingsCard
                authToken={authToken}
                currentUser={currentUser}
                onError={setErrorMessage}
                onProfileUpdated={handleProfileUpdated}
                onSuccess={(title, message) => showToast("success", title, message)}
              />
            </div>

            <div className="space-y-6">
              <BudgetHealthBanner budgets={dashboardData.budgets} periodLabel={budgetPeriodLabel} />
              <BudgetSection
                budgets={dashboardData.budgets}
                canManage={canManageBudgets}
                periodLabel={budgetPeriodLabel}
                deletingBudgetId={deletingBudgetId}
                onCreate={openCreateBudgetModal}
                onEdit={openEditBudgetModal}
                onDelete={handleDeleteBudget}
              />
            </div>
          </section>
        </div>
      </main>

      <BudgetModal
        isOpen={isBudgetModalOpen}
        mode={editingBudget ? "edit" : "create"}
        categories={expenseCategories}
        initialBudget={editingBudget}
        periodLabel={budgetPeriodLabel}
        isSubmitting={isSubmittingBudget}
        onClose={closeBudgetModal}
        onSubmit={handleSubmitBudget}
      />

      <TransactionModal
        isOpen={isModalOpen}
        mode={editingTransaction ? "edit" : "create"}
        categories={categories}
        initialTransaction={editingTransaction}
        isSubmitting={isSubmittingTransaction}
        onClose={closeTransactionModal}
        onSubmit={handleSubmitTransaction}
      />

      <Toast
        toast={toastQueue[0] ?? null}
        queuedCount={Math.max(toastQueue.length - 1, 0)}
        onDismiss={dismissToast}
      />
    </>
  );
}
