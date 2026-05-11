export type TransactionType = "income" | "expense";

export interface PeriodRange {
  from: string;
  to: string;
}

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthPayload {
  user: AuthUser;
  accessToken: string;
}

export interface CategoryReference {
  id: string;
  name: string;
  type: TransactionType;
  isDefault: boolean;
}

export interface Category extends CategoryReference {
  userId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  categoryId: string;
  amount: string;
  type: TransactionType;
  date: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  category: CategoryReference;
}

export interface Budget {
  id: string;
  userId: string;
  categoryId: string;
  limitAmount: string;
  spentAmount: string;
  remainingAmount: string;
  month: number;
  year: number;
  createdAt: string;
  updatedAt: string;
  category: CategoryReference;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface SummaryReport {
  period: PeriodRange;
  totalIncome: string;
  totalExpense: string;
  balance: string;
}

export interface CategoryExpense {
  categoryId: string;
  categoryName: string;
  amount: string;
}

export interface ExpenseByCategoryReport {
  period: PeriodRange;
  totalExpense: string;
  categories: CategoryExpense[];
}

export interface MonthlyTrendItem {
  key: string;
  label: string;
  year: number;
  month: number;
  income: string;
  expense: string;
  balance: string;
}

export interface MonthlyTrendReport {
  period: PeriodRange;
  months: MonthlyTrendItem[];
}

export interface ReportFilters {
  month?: number;
  year?: number;
  from?: string;
  to?: string;
}

export interface MonthlyTrendQuery {
  months?: number;
  month?: number;
  year?: number;
}

export interface TransactionListQuery extends ReportFilters {
  categoryId?: string;
  type?: TransactionType;
  page?: number;
  limit?: number;
}

export interface BudgetListQuery {
  month?: number;
  year?: number;
}

export interface CategoryCreateInput {
  name: string;
  type: TransactionType;
}

export interface TransactionCreateInput {
  categoryId: string;
  amount: string;
  type: TransactionType;
  date: string;
  note?: string;
}

export interface TransactionUpdateInput {
  categoryId?: string;
  amount?: string;
  type?: TransactionType;
  date?: string;
  note?: string;
}

export interface BudgetCreateInput {
  categoryId: string;
  limitAmount: string;
  month: number;
  year: number;
}

export interface BudgetUpdateInput {
  limitAmount?: string;
}

export interface DashboardFilters {
  month: number;
  year: number;
}

export interface DashboardSnapshot {
  filters: DashboardFilters;
  source: "mock" | "api";
  summary: SummaryReport;
  expenseByCategory: ExpenseByCategoryReport;
  monthlyTrend: MonthlyTrendReport;
  budgets: Budget[];
  recentTransactions: Transaction[];
}

export interface DashboardLiveBundle {
  snapshot: DashboardSnapshot;
  categories: Category[];
  currentUser: AuthUser;
}