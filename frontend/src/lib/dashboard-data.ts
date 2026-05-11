import { financeApi } from "@/lib/api";
import { buildMockDashboardSnapshot } from "@/lib/mock-data";
import type {
  DashboardFilters,
  DashboardLiveBundle,
  DashboardSnapshot,
} from "@/types/finance";

type SearchValue = string | string[] | undefined;

function firstValue(value: SearchValue): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function toInt(value: SearchValue): number | undefined {
  const normalized = firstValue(value);

  if (!normalized) {
    return undefined;
  }

  const parsed = Number.parseInt(normalized, 10);

  if (Number.isNaN(parsed)) {
    return undefined;
  }

  return parsed;
}

export function parseDashboardFilters(searchParams?: {
  month?: string | string[];
  year?: string | string[];
}): Partial<DashboardFilters> {
  return {
    month: toInt(searchParams?.month),
    year: toInt(searchParams?.year),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function normalizeDashboardFilters(
  filters: Partial<DashboardFilters>,
): DashboardFilters {
  const now = new Date();

  return {
    month: clamp(filters.month ?? now.getUTCMonth() + 1, 1, 12),
    year: clamp(filters.year ?? now.getUTCFullYear(), 2000, 2100),
  };
}

export async function getDashboardShellData(
  filters: Partial<DashboardFilters>,
): Promise<DashboardSnapshot> {
  return buildMockDashboardSnapshot(normalizeDashboardFilters(filters));
}

export async function getDashboardLiveBundle(
  filters: Partial<DashboardFilters>,
  token: string,
): Promise<DashboardLiveBundle> {
  const normalizedFilters = normalizeDashboardFilters(filters);
  const dashboardBundleResponse = await financeApi.getDashboardBundle(
    {
      month: normalizedFilters.month,
      year: normalizedFilters.year,
      months: 6,
    },
    token,
  );

  return dashboardBundleResponse.data;
}