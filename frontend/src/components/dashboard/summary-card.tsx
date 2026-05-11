import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatMoney } from "@/lib/format";

type SummaryCardProps = {
  label: string;
  value: string;
  caption: string;
  tone: "balance" | "income" | "expense";
};

const toneStyles: Record<
  SummaryCardProps["tone"],
  { badge: string; accent: string; icon: string }
> = {
  balance: {
    badge: "bg-slate-800 text-slate-50",
    accent: "from-slate-800 via-slate-700 to-blue-500",
    icon: "bg-blue-100 text-blue-600",
  },
  income: {
    badge: "bg-emerald-100 text-emerald-700",
    accent: "from-emerald-500 via-emerald-400 to-emerald-300",
    icon: "bg-emerald-100 text-emerald-600",
  },
  expense: {
    badge: "bg-red-100 text-red-700",
    accent: "from-red-500 via-red-400 to-red-300",
    icon: "bg-red-100 text-red-600",
  },
};

export function SummaryCard({ label, value, caption, tone }: SummaryCardProps) {
  const toneStyle = toneStyles[tone];

  return (
    <Card className="relative overflow-hidden rounded-[28px] border-slate-200/90 bg-white/85 shadow-[0_20px_48px_rgba(15,23,42,0.06)]">
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${toneStyle.accent}`} />
      <CardContent className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <Badge className={toneStyle.badge}>{label}</Badge>
          <div className={`flex h-11 w-11 items-center justify-center rounded-2xl text-lg font-semibold ${toneStyle.icon}`}>
            {tone === "balance" ? "B" : tone === "income" ? "+" : "-"}
          </div>
        </div>
        <p className="mt-6 text-3xl font-semibold tracking-tight text-slate-950 sm:text-[2rem]">
          {formatMoney(value)}
        </p>
        <p className="mt-3 text-sm leading-6 text-slate-600">{caption}</p>
      </CardContent>
    </Card>
  );
}