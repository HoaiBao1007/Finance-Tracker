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

const COLORS = ["#2563EB", "#10B981", "#F59E0B", "#F97316", "#8B5CF6", "#EC4899"];

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
    <Card className="min-w-0 rounded-[34px] border border-slate-200/90 bg-white shadow-[0_24px_72px_rgba(15,23,42,0.07)]">
      <CardContent className="p-6 sm:p-7">
        <div className="flex flex-col gap-4">
          <div>
            <Badge className="bg-slate-100 text-slate-700">Cơ cấu chi tiêu</Badge>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
              Chi tiêu theo hạng mục
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Donut chart giúp nhìn nhanh nhóm nào đang chiếm tỷ trọng lớn nhất trong tháng hiện tại.
            </p>
          </div>
          <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-5">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Tổng chi tháng</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{formatMoney(totalExpense)}</p>
          </div>
        </div>

        <div ref={chartContainerRef} className="mt-6 h-[360px] min-w-0 sm:h-[400px] xl:h-[440px]">
          {chartSize.width > 0 && chartSize.height > 0 ? (
            <PieChart height={chartSize.height} width={chartSize.width}>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={84}
                  outerRadius={142}
                  paddingAngle={5}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => formatTooltipValue(value)}
                  contentStyle={{
                    border: "1px solid rgba(226, 232, 240, 0.95)",
                    borderRadius: "16px",
                    boxShadow: "0 18px 50px rgba(15, 23, 42, 0.12)",
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: 28, fontSize: 12 }} />
            </PieChart>
          ) : (
            <div className="h-full rounded-[28px] bg-slate-100/80" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}