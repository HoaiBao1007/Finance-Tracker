import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getDashboardShellData, parseDashboardFilters } from "@/lib/dashboard-data";

export const dynamic = "force-dynamic";

type DashboardPageProps = {
  searchParams?: {
    month?: string | string[];
    year?: string | string[];
  };
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const filters = parseDashboardFilters(searchParams);
  const dashboardData = await getDashboardShellData(filters);

  return <DashboardShell data={dashboardData} />;
}