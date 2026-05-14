"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatMoney } from "@/lib/format";
import { animate, motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

type SummaryCardProps = {
  label: string;
  value: string;
  caption: string;
  tone: "balance" | "income" | "expense";
  staggerIndex?: number;
  animateCount?: boolean;
};

const cardEase = [0.22, 1, 0.36, 1] as const;

const toneStyles: Record<
  SummaryCardProps["tone"],
  { badge: string; icon: string; track: string; iconSvg: JSX.Element }
> = {
  balance: {
    badge: "bg-blue-50 text-blue-700",
    icon: "bg-blue-600 text-white",
    track: "from-blue-500 to-blue-100",
    iconSvg: (
      <svg
        aria-hidden="true"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
        viewBox="0 0 24 24"
      >
        <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5z" />
        <path d="M8 12h8" />
        <path d="M8 9h3" />
      </svg>
    ),
  },
  income: {
    badge: "bg-emerald-50 text-emerald-700",
    icon: "bg-emerald-500 text-white",
    track: "from-emerald-500 to-emerald-100",
    iconSvg: (
      <svg
        aria-hidden="true"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
        viewBox="0 0 24 24"
      >
        <path d="M12 19V5" />
        <path d="m6 11 6-6 6 6" />
      </svg>
    ),
  },
  expense: {
    badge: "bg-rose-50 text-rose-700",
    icon: "bg-rose-500 text-white",
    track: "from-rose-500 to-rose-100",
    iconSvg: (
      <svg
        aria-hidden="true"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
        viewBox="0 0 24 24"
      >
        <path d="M12 5v14" />
        <path d="m18 13-6 6-6-6" />
      </svg>
    ),
  },
};

export function SummaryCard({
  label,
  value,
  caption,
  tone,
  staggerIndex = 0,
  animateCount = false,
}: SummaryCardProps) {
  const toneStyle = toneStyles[tone];
  const prefersReducedMotion = useReducedMotion();
  const formattedValue = useMemo(() => formatMoney(value), [value]);
  const [animatedValue, setAnimatedValue] = useState(() =>
    animateCount && !prefersReducedMotion ? formatMoney(0) : formattedValue,
  );

  useEffect(() => {
    if (!animateCount || prefersReducedMotion) {
      setAnimatedValue(formattedValue);
      return;
    }

    const targetValue = Number(value);

    if (!Number.isFinite(targetValue)) {
      setAnimatedValue(formattedValue);
      return;
    }

    const controls = animate(0, targetValue, {
      duration: 1.1,
      delay: staggerIndex * 0.1 + 0.15,
      ease: cardEase,
      onUpdate: (latest) => {
        setAnimatedValue(formatMoney(Math.round(latest)));
      },
      onComplete: () => {
        setAnimatedValue(formattedValue);
      },
    });

    return () => {
      controls.stop();
    };
  }, [animateCount, formattedValue, prefersReducedMotion, staggerIndex, value]);

  return (
    <motion.div
      className="h-full"
      initial={prefersReducedMotion ? false : { opacity: 0, y: 26 }}
      animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
      transition={
        prefersReducedMotion
          ? undefined
          : {
              duration: 0.55,
              delay: staggerIndex * 0.1,
              ease: cardEase,
            }
      }
      whileHover={
        prefersReducedMotion
          ? undefined
          : {
              scale: 1.018,
              y: -6,
              boxShadow: "0 30px 80px rgba(15, 23, 42, 0.14)",
            }
      }
      style={{ willChange: "transform, opacity, box-shadow" }}
    >
      <Card className="relative h-full overflow-hidden rounded-[30px] border border-slate-200/90 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.06)] transition-shadow duration-300">
        <CardContent className="p-6 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Badge className={`${toneStyle.badge} border-0 px-3 py-1 text-[0.72rem] font-semibold`}>
                {label}
              </Badge>
              <p className="mt-5 text-3xl font-semibold tracking-tight text-slate-950 sm:text-[2.15rem]">
                {animateCount ? animatedValue : formattedValue}
              </p>
            </div>
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm ${toneStyle.icon}`}>
              {toneStyle.iconSvg}
            </div>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600">{caption}</p>
          <div className={`mt-6 h-2 rounded-full bg-gradient-to-r ${toneStyle.track}`} />
        </CardContent>
      </Card>
    </motion.div>
  );
}