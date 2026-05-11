"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

type UseDashboardFiltersParams = {
  initialMonth: number;
  initialYear: number;
};

export function useDashboardFilters({
  initialMonth,
  initialYear,
}: UseDashboardFiltersParams) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentMonth = Number(searchParams.get("month") ?? initialMonth);
  const currentYear = Number(searchParams.get("year") ?? initialYear);
  const years = Array.from({ length: 5 }, (_, index) => initialYear - 2 + index);

  function updateFilter(key: "month" | "year", value: number) {
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set(key, String(value));

    if (!nextParams.get("month")) {
      nextParams.set("month", String(currentMonth));
    }

    if (!nextParams.get("year")) {
      nextParams.set("year", String(currentYear));
    }

    startTransition(() => {
      router.replace(`${pathname}?${nextParams.toString()}`, { scroll: false });
    });
  }

  return {
    currentMonth,
    currentYear,
    isPending,
    years,
    setMonth: (month: number) => updateFilter("month", month),
    setYear: (year: number) => updateFilter("year", year),
  };
}