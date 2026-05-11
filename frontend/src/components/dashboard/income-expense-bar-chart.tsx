"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatMoney } from "@/lib/format";
import type { MonthlyTrendItem } from "@/types/finance";
import { useEffect, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
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
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const [chartSize, setChartSize] = useState({ width: 0, height: 0 });
  const chartData = items.map((item) => ({
    label: item.label,
    income: Number(item.income),
    expense: Number(item.expense),
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
        <div className="flex flex-col gap-3">
          <Badge className="bg-slate-800 text-slate-50">Xu hướng 6 tháng</Badge>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
            Thu và chi theo chu kỳ
          </h2>
          <p className="text-sm leading-6 text-slate-600">
            {source === "api"
              ? "Dữ liệu đang lấy trực tiếp từ backend cho 6 tháng gần nhất của kỳ đang chọn."
              : "Khối này đang dùng mock contract để giữ nguyên cấu trúc khi chưa kết nối backend thật."}
          </p>
        </div>

        <div ref={chartContainerRef} className="mt-6 h-[360px] min-w-0">
          {chartSize.width > 0 && chartSize.height > 0 ? (
            <BarChart data={chartData} barGap={10} height={chartSize.height} width={chartSize.width}>
                <CartesianGrid vertical={false} stroke="rgba(148, 163, 184, 0.28)" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value: number) => `${Math.round(value / 1000000)}tr`}
                />
                <Tooltip formatter={(value) => formatTooltipValue(value)} />
                <Legend />
                <Bar dataKey="income" name="Thu" fill="#10B981" radius={[10, 10, 0, 0]} />
                <Bar dataKey="expense" name="Chi" fill="#EF4444" radius={[10, 10, 0, 0]} />
            </BarChart>
          ) : (
            <div className="h-full rounded-[28px] bg-slate-100/80" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}