import { env } from "@/lib/env";
import type { ApiResponse, ApiSuccessResponse, QueryValue } from "@/types/api";
import type {
  AuthPayload,
  AuthUser,
  Budget,
  BudgetCreateInput,
  BudgetListQuery,
  BudgetUpdateInput,
  Category,
  CategoryCreateInput,
  DashboardLiveBundle,
  ExpenseByCategoryReport,
  MonthlyTrendQuery,
  MonthlyTrendReport,
  PaginationMeta,
  PasswordResetRequestInput,
  PasswordResetRequestResult,
  ProfileUpdateInput,
  ReportFilters,
  ResetPasswordInput,
  SummaryReport,
  Transaction,
  TransactionCreateInput,
  TransactionListQuery,
  TransactionUpdateInput,
  ChangePasswordInput,
} from "@/types/finance";

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  query?: object;
  body?: unknown;
  token?: string;
  cache?: RequestCache;
};

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const url = new URL(`${env.apiBaseUrl}${path}`);

  if (query) {
    Object.entries(query as Record<string, QueryValue>).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") {
        return;
      }

      url.searchParams.set(key, String(value));
    });
  }

  return url.toString();
}

async function request<TData, TMeta = undefined>(
  path: string,
  options: RequestOptions = {},
): Promise<ApiSuccessResponse<TData, TMeta>> {
  const headers = new Headers({
    Accept: "application/json",
  });

  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  const response = await fetch(
    buildUrl(path, options.query as Record<string, QueryValue> | undefined),
    {
    method: options.method ?? "GET",
    headers,
    cache: options.cache ?? "no-store",
    body:
      options.body !== undefined ? JSON.stringify(options.body) : undefined,
    },
  );

  let payload: ApiResponse<TData, TMeta> | null = null;

  try {
    payload = (await response.json()) as ApiResponse<TData, TMeta>;
  } catch {
    payload = null;
  }

  if (!response.ok || payload?.success === false) {
    throw new Error(
      payload?.message || `Request failed with status ${response.status}`,
    );
  }

  if (!payload) {
    throw new Error("Backend returned an invalid response");
  }

  return payload;
}

export const financeApi = {
  register: (body: { email: string; password: string; fullName: string }) =>
    request<AuthPayload>("/auth/register", { method: "POST", body }),

  login: (body: { email: string; password: string }) =>
    request<AuthPayload>("/auth/login", { method: "POST", body }),

  requestPasswordReset: (body: PasswordResetRequestInput) =>
    request<PasswordResetRequestResult>("/auth/forgot-password", {
      method: "POST",
      body,
    }),

  resetPassword: (body: ResetPasswordInput) =>
    request<{ success: true }>("/auth/reset-password", {
      method: "POST",
      body,
    }),

  getCurrentUser: (token: string) =>
    request<AuthUser>("/auth/me", { token }),

  updateProfile: (body: ProfileUpdateInput, token: string) =>
    request<AuthUser>("/auth/profile", { method: "PATCH", body, token }),

  changePassword: (body: ChangePasswordInput, token: string) =>
    request<{ success: true }>("/auth/change-password", {
      method: "POST",
      body,
      token,
    }),

  getDashboardBundle: (
    query: { month?: number; year?: number; months?: number },
    token: string,
  ) => request<DashboardLiveBundle>("/reports/dashboard", { query, token }),

  getCategories: (query?: { type?: "income" | "expense" }, token?: string) =>
    request<Category[]>("/categories", { query, token }),

  createCategory: (body: CategoryCreateInput, token: string) =>
    request<Category>("/categories", { method: "POST", body, token }),

  getTransactions: (query?: TransactionListQuery, token?: string) =>
    request<Transaction[], PaginationMeta>("/transactions", { query, token }),

  createTransaction: (body: TransactionCreateInput, token: string) =>
    request<Transaction>("/transactions", { method: "POST", body, token }),

  updateTransaction: (
    transactionId: string,
    body: TransactionUpdateInput,
    token: string,
  ) =>
    request<Transaction>(`/transactions/${transactionId}`, {
      method: "PATCH",
      body,
      token,
    }),

  deleteTransaction: (transactionId: string, token: string) =>
    request<{ id: string }>(`/transactions/${transactionId}`, {
      method: "DELETE",
      token,
    }),

  getBudgets: (query?: BudgetListQuery, token?: string) =>
    request<Budget[]>("/budgets", { query, token }),

  createBudget: (body: BudgetCreateInput, token: string) =>
    request<Budget>("/budgets", { method: "POST", body, token }),

  updateBudget: (budgetId: string, body: BudgetUpdateInput, token: string) =>
    request<Budget>(`/budgets/${budgetId}`, {
      method: "PATCH",
      body,
      token,
    }),

  deleteBudget: (budgetId: string, token: string) =>
    request<{ id: string }>(`/budgets/${budgetId}`, {
      method: "DELETE",
      token,
    }),

  getSummary: (query?: ReportFilters, token?: string) =>
    request<SummaryReport>("/reports/summary", { query, token }),

  getExpenseByCategory: (query?: ReportFilters, token?: string) =>
    request<ExpenseByCategoryReport>("/reports/by-category", {
      query,
      token,
    }),

  getMonthlyTrend: (query?: MonthlyTrendQuery, token?: string) =>
    request<MonthlyTrendReport>("/reports/monthly-trend", {
      query,
      token,
    }),
};