"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useDashboardFilters } from "@/hooks/use-dashboard-filters";

type DashboardFilterBarProps = {
  month: number;
  year: number;
  source: "mock" | "api";
  layout?: "default" | "sidebar";
};

const monthOptions = Array.from({ length: 12 }, (_, index) => ({
  value: index + 1,
  label: `Tháng ${index + 1}`,
}));

export function DashboardFilterBar({
  month,
  year,
  source,
  layout = "default",
}: DashboardFilterBarProps) {
  const { currentMonth, currentYear, isPending, years, setMonth, setYear } =
    useDashboardFilters({
      initialMonth: month,
      initialYear: year,
    });

  const sourceLabel = isPending ? "Đang cập nhật" : source === "api" ? "API thật" : "Mock";

  if (layout === "sidebar") {
    return (
      <Card className="border-white/10 bg-white/5 text-white shadow-none">
        <CardContent className="space-y-4 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-300">
                Bộ lọc dashboard
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Chọn lại tháng và năm ngay trong sidebar để làm mới dashboard.
              </p>
            </div>
            <Badge className="bg-white/10 text-white">{sourceLabel}</Badge>
          </div>

          <div className="grid gap-3">
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-100">
              Tháng
              <select
                className="rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white outline-none transition focus:border-blue-400"
                value={currentMonth}
                onChange={(event) => setMonth(Number(event.target.value))}
              >
                {monthOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-100">
              Năm
              <select
                className="rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white outline-none transition focus:border-blue-400"
                value={currentYear}
                onChange={(event) => setYear(Number(event.target.value))}
              >
                {years.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="panel border-slate-200/80 bg-white/80">
      <CardContent className="flex flex-col gap-4 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="eyebrow">Bộ lọc dashboard</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Đổi tháng và năm để làm mới dashboard theo từng kỳ, dùng cùng một flow cho cả mock mode và live mode.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Tháng
            <select
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-blue-500"
              value={currentMonth}
              onChange={(event) => setMonth(Number(event.target.value))}
            >
              {monthOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Năm
            <select
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-blue-500"
              value={currentYear}
              onChange={(event) => setYear(Number(event.target.value))}
            >
              {years.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <Badge className="bg-blue-100 text-blue-700">{sourceLabel}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}