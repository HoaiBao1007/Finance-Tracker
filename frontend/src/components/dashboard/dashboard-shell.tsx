"use client";

import { BudgetHealthBanner } from "@/components/dashboard/budget-health-banner";
import { BudgetModal } from "@/components/dashboard/budget-modal";
import { BudgetSection } from "@/components/dashboard/budget-section";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { ExpensePieChart } from "@/components/dashboard/expense-pie-chart";
import { IncomeExpenseBarChart } from "@/components/dashboard/income-expense-bar-chart";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { TransactionModal } from "@/components/dashboard/transaction-modal";
import { TransactionsTable } from "@/components/dashboard/transactions-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sheet } from "@/components/ui/sheet";
import { Toast, type ToastState } from "@/components/ui/toast";
import { financeApi } from "@/lib/api";
import { getDashboardLiveBundle } from "@/lib/dashboard-data";
import { formatDateRange, formatMonthLabel } from "@/lib/format";
import type { BudgetFormValues } from "@/schemas/budget-form.schema";
import type {
  AuthPayload,
  AuthUser,
  Budget,
  Category,
  DashboardSnapshot,
  BudgetCreateInput,
  Transaction,
  TransactionCreateInput,
} from "@/types/finance";
import type { TransactionFormValues } from "@/schemas/transaction-form.schema";
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
type DashboardSectionId = "overview" | "reports" | "budgets" | "transactions";

const DASHBOARD_SECTION_IDS: DashboardSectionId[] = [
  "overview",
  "reports",
  "budgets",
  "transactions",
];

function getDashboardSectionFromHash(hash: string): DashboardSectionId | null {
  const normalizedHash = hash.replace(/^#/, "");

  return DASHBOARD_SECTION_IDS.find((sectionId) => sectionId === normalizedHash) ?? null;
}

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
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<DashboardSectionId>("overview");
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

  useEffect(() => {
    function updateActiveSection() {
      const threshold = 160;
      let nextActiveSection: DashboardSectionId = DASHBOARD_SECTION_IDS[0];

      for (const sectionId of DASHBOARD_SECTION_IDS) {
        const element = document.getElementById(`dashboard-section-${sectionId}`);

        if (!element) {
          continue;
        }

        const rect = element.getBoundingClientRect();

        if (rect.top <= threshold) {
          nextActiveSection = sectionId;
        }
      }

      setActiveSection((currentSection) =>
        currentSection === nextActiveSection ? currentSection : nextActiveSection,
      );
    }

    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection);

    return () => {
      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
    };
  }, []);

  useEffect(() => {
    function syncSectionFromHash() {
      const sectionFromHash = getDashboardSectionFromHash(window.location.hash);

      if (!sectionFromHash) {
        return;
      }

      const element = document.getElementById(`dashboard-section-${sectionFromHash}`);

      if (!element) {
        return;
      }

      setActiveSection(sectionFromHash);
      element.scrollIntoView({ behavior: "auto", block: "start" });
    }

    const frameId = window.requestAnimationFrame(syncSectionFromHash);
    window.addEventListener("hashchange", syncSectionFromHash);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("hashchange", syncSectionFromHash);
    };
  }, []);

  useEffect(() => {
    const nextHash = `#${activeSection}`;

    if (window.location.hash === nextHash) {
      return;
    }

    window.history.replaceState(
      window.history.state,
      "",
      `${window.location.pathname}${window.location.search}${nextHash}`,
    );
  }, [activeSection]);

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
  const navigationItems = [
    {
      sectionId: "overview" as const,
      label: "Dashboard",
      caption: "Tổng quan số dư, thu chi và cảnh báo budget",
      active: activeSection === "overview",
    },
    {
      sectionId: "reports" as const,
      label: "Báo cáo",
      caption: "Pie chart và xu hướng 6 tháng theo kỳ đang chọn",
      active: activeSection === "reports",
    },
    {
      sectionId: "budgets" as const,
      label: "Ngân sách",
      caption: `${dashboardData.budgets.length} danh mục đang được theo dõi`,
      active: activeSection === "budgets",
    },
    {
      sectionId: "transactions" as const,
      label: "Giao dịch",
      caption: `${dashboardData.recentTransactions.length} giao dịch gần nhất đang hiển thị`,
      active: activeSection === "transactions",
    },
  ];

  function handleSidebarNavigate(sectionId: string) {
    const nextSectionId = sectionId as DashboardSectionId;
    const element = document.getElementById(`dashboard-section-${nextSectionId}`);

    if (!element) {
      return;
    }

    setActiveSection(nextSectionId);
    window.history.replaceState(
      window.history.state,
      "",
      `${window.location.pathname}${window.location.search}#${nextSectionId}`,
    );
    element.scrollIntoView({ behavior: "smooth", block: "start" });
    setIsMobileSidebarOpen(false);
  }

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
      showToast("success", "Đã xóa ngân sách", "Trạng thái ngân sách đã được làm mới trên dashboard.");
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
      <main className="min-h-screen px-3 py-3 sm:px-4 lg:px-6 lg:py-6">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-6 lg:min-h-[calc(100vh-3rem)] lg:flex-row">
          <aside className="hidden lg:sticky lg:top-6 lg:block lg:w-[320px] lg:self-start">
            <DashboardSidebar
              navigationItems={navigationItems}
              sourceLabel={sourceLabel}
              budgetPeriodLabel={budgetPeriodLabel}
              currentPeriodLabel={currentPeriodLabel}
              recentTransactionsCount={dashboardData.recentTransactions.length}
              filters={dashboardData.filters}
              source={dashboardData.source}
              currentUser={currentUser}
              isSyncing={isSyncing}
              errorMessage={errorMessage}
              helperMessage={helperMessage}
              onAuthenticated={handleAuthenticated}
              onDisconnect={handleDisconnectToken}
              onRefresh={() => void refreshLiveData({ trigger: "manual" })}
              onNavigate={handleSidebarNavigate}
            />
          </aside>

          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-6">
              <Card className="border-slate-200/80 bg-white/90 shadow-[0_16px_40px_rgba(15,23,42,0.06)] lg:hidden">
                <CardContent className="flex items-center justify-between gap-4 p-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Dashboard mobile
                    </p>
                    <p className="mt-2 text-base font-semibold text-slate-950">
                      {sourceLabel} · {budgetPeriodLabel}
                    </p>
                  </div>
                  <Button
                    aria-label="Mở sidebar dashboard"
                    className="rounded-2xl px-3"
                    size="icon"
                    variant="outline"
                    onClick={() => setIsMobileSidebarOpen(true)}
                  >
                    <svg
                      aria-hidden="true"
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.8"
                      viewBox="0 0 24 24"
                    >
                      <path d="M4 7h16" />
                      <path d="M4 12h16" />
                      <path d="M4 17h16" />
                    </svg>
                  </Button>
                </CardContent>
              </Card>

              <Card
                className="relative overflow-hidden rounded-[36px] border-slate-200/80 bg-white/80 shadow-[0_26px_90px_rgba(15,23,42,0.08)] scroll-mt-24"
                id="dashboard-section-overview"
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.16),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(30,41,59,0.08),transparent_35%)]" />
                <CardContent className="relative p-6 sm:p-8">
                  <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                    <div className="max-w-3xl">
                      <Badge className="bg-slate-800 text-slate-50">Tổng quan dashboard</Badge>
                      <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                        Bố cục mới ưu tiên số dư ở trên cùng và biểu đồ chi tiêu ở trung tâm màn hình
                      </h2>
                      <p className="mt-4 text-base leading-7 text-slate-600">
                        Khung dashboard giờ tách điều hướng sang sidebar trái, gom thẻ tổng quan lên đầu trang, và dành phần ngang lớn nhất cho biểu đồ chi tiêu để việc đọc dữ liệu nhanh hơn khi demo hoặc tích hợp backend thật.
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[360px]">
                      <Card className="border-slate-200 bg-slate-50/85 shadow-none">
                        <CardContent className="p-4">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Nguồn hiện tại</p>
                          <p className="mt-2 text-lg font-semibold text-slate-950">{sourceLabel}</p>
                          <p className="mt-2 text-sm leading-6 text-slate-600">
                            {dashboardData.source === "api"
                              ? "Đã kết nối dữ liệu thật từ backend và sẵn sàng thao tác CRUD."
                              : "Đang dùng mock dataset để dựng layout và kiểm tra giao diện."}
                          </p>
                        </CardContent>
                      </Card>
                      <Card className="border-slate-200 bg-slate-50/85 shadow-none">
                        <CardContent className="p-4">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Người dùng / Chu kỳ</p>
                          <p className="mt-2 text-lg font-semibold text-slate-950">
                            {currentUser?.fullName ?? "Khách demo"}
                          </p>
                          <p className="mt-2 text-sm leading-6 text-slate-600">{currentPeriodLabel}</p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 xl:grid-cols-3">
                    <SummaryCard
                      label="Số dư"
                      value={dashboardData.summary.balance}
                      caption="Số dư ròng của kỳ đang xem, đặt ở đầu trang để nhìn thấy ngay khi mở dashboard."
                      tone="balance"
                    />
                    <SummaryCard
                      label="Tổng thu"
                      value={dashboardData.summary.totalIncome}
                      caption="Dòng tiền vào của kỳ hiện tại, dùng màu xanh lá cho trạng thái tích cực."
                      tone="income"
                    />
                    <SummaryCard
                      label="Tổng chi"
                      value={dashboardData.summary.totalExpense}
                      caption="Dòng tiền ra trong kỳ, dùng màu đỏ để nhấn vùng tiêu cực hoặc cần theo dõi kỹ."
                      tone="expense"
                    />
                  </div>
                </CardContent>
              </Card>

              <BudgetHealthBanner budgets={dashboardData.budgets} periodLabel={budgetPeriodLabel} />

              <section
                className="grid gap-4 scroll-mt-24 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]"
                id="dashboard-section-reports"
              >
                <ExpensePieChart
                  items={dashboardData.expenseByCategory.categories}
                  totalExpense={dashboardData.expenseByCategory.totalExpense}
                />
                <IncomeExpenseBarChart
                  items={dashboardData.monthlyTrend.months}
                  source={dashboardData.source}
                />
              </section>

              <div className="scroll-mt-24" id="dashboard-section-budgets">
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

              <div className="scroll-mt-24" id="dashboard-section-transactions">
                <TransactionsTable
                  transactions={dashboardData.recentTransactions}
                  canManage={canManageTransactions}
                  deletingTransactionId={deletingTransactionId}
                  onCreate={openCreateTransactionModal}
                  onEdit={openEditTransactionModal}
                  onDelete={handleDeleteTransaction}
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      <Sheet
        open={isMobileSidebarOpen}
        onOpenChange={setIsMobileSidebarOpen}
        title="Điều hướng dashboard"
        description="Mở sidebar trên mobile để đổi kỳ, xem trạng thái và kết nối backend."
      >
        <DashboardSidebar
          navigationItems={navigationItems}
          sourceLabel={sourceLabel}
          budgetPeriodLabel={budgetPeriodLabel}
          currentPeriodLabel={currentPeriodLabel}
          recentTransactionsCount={dashboardData.recentTransactions.length}
          filters={dashboardData.filters}
          source={dashboardData.source}
          currentUser={currentUser}
          isSyncing={isSyncing}
          errorMessage={errorMessage}
          helperMessage={helperMessage}
          onAuthenticated={handleAuthenticated}
          onDisconnect={handleDisconnectToken}
          onRefresh={() => void refreshLiveData({ trigger: "manual" })}
          onNavigate={handleSidebarNavigate}
          variant="mobile"
        />
      </Sheet>

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