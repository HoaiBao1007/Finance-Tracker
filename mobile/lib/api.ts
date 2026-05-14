import { env } from '@/lib/env';
import type { ApiErrorResponse, ApiResponse, QueryValue } from '@/types/api';
import type {
  AuthPayload,
  AuthUser,
  Budget,
  BudgetCreateInput,
  BudgetListQuery,
  BudgetUpdateInput,
  Category,
  ChangePasswordInput,
  DashboardLiveBundle,
  ExpenseByCategoryReport,
  MonthlyTrendQuery,
  MonthlyTrendReport,
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
} from '@/types/finance';

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  query?: object;
  body?: unknown;
  token?: string;
};

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly fieldErrors?: ApiErrorResponse['errors'],
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const url = `${env.apiBaseUrl}${path}`;

  if (!query) {
    return url;
  }

  const searchParams = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }

    searchParams.set(key, String(value));
  });

  const serializedQuery = searchParams.toString();

  return serializedQuery ? `${url}?${serializedQuery}` : url;
}

async function request<TData>(path: string, options: RequestOptions = {}): Promise<TData> {
  const headers = new Headers({
    Accept: 'application/json',
  });

  if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }

  if (options.token) {
    headers.set('Authorization', `Bearer ${options.token}`);
  }

  const response = await fetch(buildUrl(path, options.query as Record<string, QueryValue> | undefined), {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  let payload: ApiResponse<TData> | null = null;

  try {
    payload = (await response.json()) as ApiResponse<TData>;
  } catch {
    payload = null;
  }

  if (!response.ok || payload?.success === false) {
    throw new ApiRequestError(
      payload?.message || `Request failed with status ${response.status}`,
      response.status,
      payload && payload.success === false ? payload.errors : undefined,
    );
  }

  if (!payload || payload.success !== true) {
    throw new ApiRequestError('Backend returned an invalid response', response.status);
  }

  return payload.data;
}

export const financeApi = {
  register: (body: { email: string; password: string; fullName: string }) =>
    request<AuthPayload>('/auth/register', { method: 'POST', body }),

  login: (body: { email: string; password: string }) =>
    request<AuthPayload>('/auth/login', { method: 'POST', body }),

  requestPasswordReset: (body: PasswordResetRequestInput) =>
    request<PasswordResetRequestResult>('/auth/forgot-password', { method: 'POST', body }),

  resetPassword: (body: ResetPasswordInput) =>
    request<{ success: true }>('/auth/reset-password', { method: 'POST', body }),

  getCurrentUser: (token: string) => request<AuthUser>('/auth/me', { token }),

  updateProfile: (body: ProfileUpdateInput, token: string) =>
    request<AuthUser>('/auth/profile', { method: 'PATCH', body, token }),

  changePassword: (body: ChangePasswordInput, token: string) =>
    request<{ success: true }>('/auth/change-password', { method: 'POST', body, token }),

  getDashboardBundle: (query: { month?: number; year?: number; months?: number }, token: string) =>
    request<DashboardLiveBundle>('/reports/dashboard', { query, token }),

  getCategories: (query: { type?: 'income' | 'expense' } | undefined, token: string) =>
    request<Category[]>('/categories', { query, token }),

  createTransaction: (body: TransactionCreateInput, token: string) =>
    request<Transaction>('/transactions', { method: 'POST', body, token }),

  updateTransaction: (transactionId: string, body: TransactionUpdateInput, token: string) =>
    request<Transaction>(`/transactions/${transactionId}`, { method: 'PATCH', body, token }),

  deleteTransaction: (transactionId: string, token: string) =>
    request<{ id: string }>(`/transactions/${transactionId}`, { method: 'DELETE', token }),

  getTransactions: (query: TransactionListQuery, token: string) =>
    request<Transaction[]>('/transactions', { query, token }),

  getBudgets: (query: BudgetListQuery, token: string) =>
    request<Budget[]>('/budgets', { query, token }),

  createBudget: (body: BudgetCreateInput, token: string) =>
    request<Budget>('/budgets', { method: 'POST', body, token }),

  updateBudget: (budgetId: string, body: BudgetUpdateInput, token: string) =>
    request<Budget>(`/budgets/${budgetId}`, { method: 'PATCH', body, token }),

  deleteBudget: (budgetId: string, token: string) =>
    request<{ id: string }>(`/budgets/${budgetId}`, { method: 'DELETE', token }),

  getSummary: (query: ReportFilters, token: string) =>
    request<SummaryReport>('/reports/summary', { query, token }),

  getExpenseByCategory: (query: ReportFilters, token: string) =>
    request<ExpenseByCategoryReport>('/reports/by-category', { query, token }),

  getMonthlyTrend: (query: MonthlyTrendQuery, token: string) =>
    request<MonthlyTrendReport>('/reports/monthly-trend', { query, token }),
};