"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatMoney } from "@/lib/format";
import type { CategoryExpense } from "@/types/finance";
import { useEffect, useRef, useState } from "react";
import { Cell, Legend, Pie, PieChart, Tooltip } from "recharts";

type ExpensePieChartProps = {
  items: CategoryExpense[];
  totalExpense: string;
};

const COLORS = ["#3B82F6", "#1E293B", "#10B981", "#93C5FD", "#EF4444"];

function formatTooltipValue(
  value: number | string | readonly (number | string)[] | undefined,
) {
  if (Array.isArray(value)) {
    return formatMoney(value[0] ?? 0);
  }

  return formatMoney(typeof value === "number" || typeof value === "string" ? value : 0);
}

export function ExpensePieChart({ items, totalExpense }: ExpensePieChartProps) {
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const [chartSize, setChartSize] = useState({ width: 0, height: 0 });
  const chartData = items.map((item) => ({
    name: item.categoryName,
    value: Number(item.amount),
  }));

  useEffect(() => {
    const element = chartContainerRef.current;

    if (!element) {
      return;
    }

    function updateChartSize() {
      if (!element) {
        return;
      }

      const nextWidth = element.clientWidth;
      const nextHeight = element.clientHeight;

      setChartSize((currentSize) =>
        currentSize.width === nextWidth && currentSize.height === nextHeight
          ? currentSize
          : { width: nextWidth, height: nextHeight },
      );
    }

    updateChartSize();

    const resizeObserver = new ResizeObserver(() => {
      updateChartSize();
    });

    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <Card className="panel min-w-0 rounded-[32px] border-slate-200/80 bg-white/85">
      <CardContent className="p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Badge className="bg-blue-100 text-blue-700">Chi tiêu theo nhóm</Badge>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
              Biểu đồ chi tiêu trọng tâm
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
              Khối này chiếm 2/3 hàng nội dung để bạn nhìn nhanh tỷ trọng từng nhóm chi tiêu ngay khi mở dashboard.
            </p>
          </div>
          <div className="rounded-2xl bg-slate-800 px-4 py-3 text-white">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-300">Tổng chi</p>
            <p className="mt-2 text-lg font-semibold">{formatMoney(totalExpense)}</p>
          </div>
        </div>

        <div ref={chartContainerRef} className="mt-6 h-[360px] min-w-0 xl:h-[400px]">
          {chartSize.width > 0 && chartSize.height > 0 ? (
            <PieChart height={chartSize.height} width={chartSize.width}>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={80}
                  outerRadius={124}
                  paddingAngle={4}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatTooltipValue(value)} />
                <Legend />
            </PieChart>
          ) : (
            <div className="h-full rounded-[28px] bg-slate-100/80" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}