"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatMoney } from "@/lib/format";
import type { MonthlyTrendItem } from "@/types/finance";
import { motion, useReducedMotion } from "framer-motion";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type IncomeExpenseBarChartProps = {
  items: MonthlyTrendItem[];
  source: "mock" | "api";
};

function formatTooltipValue(
  value: number | string | readonly (number | string)[] | undefined,
) {
  if (Array.isArray(value)) {
    return formatMoney(value[0] ?? 0);
  }

  return formatMoney(typeof value === "number" || typeof value === "string" ? value : 0);
}

export function IncomeExpenseBarChart({ items, source }: IncomeExpenseBarChartProps) {
  const prefersReducedMotion = useReducedMotion();
  const chartData = useMemo(
    () =>
      items.map((item) => ({
        label: item.label,
        income: Number(item.income),
        expense: Number(item.expense),
      })),
    [items],
  );

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
      animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
      transition={
        prefersReducedMotion
          ? undefined
          : {
              duration: 0.45,
              ease: [0.22, 1, 0.36, 1],
            }
      }
    >
      <Card className="min-w-0 rounded-[34px] border border-slate-200/90 bg-white shadow-[0_24px_72px_rgba(15,23,42,0.07)]">
        <CardContent className="p-6 sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-2xl">
              <Badge className="bg-blue-50 text-blue-700">Biểu đồ chính</Badge>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 sm:text-[2rem]">
                Thu nhập và Chi tiêu hàng tháng
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
              {source === "api"
                ? "Thu nhập và chi tiêu được hiển thị tách riêng theo từng tháng để bạn nhìn rõ hai luồng tiền độc lập."
                : "Hiện đang dùng dữ liệu mock để hoàn thiện layout trước khi đồng bộ backend thật."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-600">
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                Thu nhập
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                Chi tiêu
              </span>
            </div>
          </div>

          <div className="mt-8 h-[360px] min-w-0 transform-gpu sm:h-[380px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barCategoryGap="18%" barGap={8} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="rgba(203, 213, 225, 0.7)" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value: number) => `${Math.round(value / 1000000)}tr`}
                />
                <Tooltip
                  shared
                  trigger="hover"
                  cursor={{ fill: "rgba(148, 163, 184, 0.08)" }}
                  formatter={(value) => formatTooltipValue(value)}
                  contentStyle={{
                    border: "1px solid rgba(226, 232, 240, 0.95)",
                    borderRadius: "16px",
                    boxShadow: "0 18px 50px rgba(15, 23, 42, 0.12)",
                  }}
                  wrapperStyle={{
                    pointerEvents: "none",
                    zIndex: 20,
                  }}
                />
                <Bar
                  dataKey="income"
                  name="Thu"
                  barSize={24}
                  minPointSize={12}
                  fill="#22c55e"
                  radius={[10, 10, 0, 0]}
                  isAnimationActive={!prefersReducedMotion}
                  animationDuration={650}
                  animationBegin={80}
                />
                <Bar
                  dataKey="expense"
                  name="Chi"
                  barSize={24}
                  minPointSize={12}
                  fill="#fb7185"
                  radius={[10, 10, 0, 0]}
                  isAnimationActive={!prefersReducedMotion}
                  animationDuration={700}
                  animationBegin={180}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}