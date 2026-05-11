import type { Prisma } from "@prisma/client";

import { AppError } from "./app-error";

type DateFilterInput = {
  month?: number;
  year?: number;
  from?: string;
  to?: string;
};

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const parseDateBoundary = (value: string, boundary: "start" | "end") => {
  const candidate = DATE_ONLY_PATTERN.test(value)
    ? `${value}T${boundary === "start" ? "00:00:00.000" : "23:59:59.999"}Z`
    : value;

  const parsedDate = new Date(candidate);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new AppError("Invalid date filter", 400, "INVALID_DATE_FILTER");
  }

  return parsedDate;
};

export const buildDateFilter = ({ month, year, from, to }: DateFilterInput): Prisma.DateTimeFilter | undefined => {
  const hasMonthYear = month !== undefined || year !== undefined;
  const hasRange = Boolean(from || to);

  if (hasMonthYear && hasRange) {
    throw new AppError(
      "Use either month/year or from/to filters, not both",
      400,
      "INVALID_DATE_FILTER"
    );
  }

  if (hasMonthYear) {
    if (month === undefined || year === undefined) {
      throw new AppError("month and year must be provided together", 400, "INVALID_DATE_FILTER");
    }

    return {
      gte: new Date(Date.UTC(year, month - 1, 1)),
      lt: new Date(Date.UTC(year, month, 1)),
    };
  }

  const filter: Prisma.DateTimeFilter = {};

  if (from) {
    filter.gte = parseDateBoundary(from, "start");
  }

  if (to) {
    filter.lte = parseDateBoundary(to, "end");
  }

  return Object.keys(filter).length > 0 ? filter : undefined;
};

type ResolvedDateRange = {
  filter: Prisma.DateTimeFilter;
  from: Date;
  to: Date;
};

type DateRangeDefaultMode = "current-month" | "all-time";

export const resolveDateRange = (
  input: DateFilterInput,
  defaultMode: DateRangeDefaultMode = "current-month"
): ResolvedDateRange => {
  const hasMonthYear = input.month !== undefined || input.year !== undefined;
  const hasRange = Boolean(input.from || input.to);

  if (hasMonthYear && hasRange) {
    throw new AppError(
      "Use either month/year or from/to filters, not both",
      400,
      "INVALID_DATE_FILTER"
    );
  }

  if (hasMonthYear) {
    if (input.month === undefined || input.year === undefined) {
      throw new AppError("month and year must be provided together", 400, "INVALID_DATE_FILTER");
    }

    const from = new Date(Date.UTC(input.year, input.month - 1, 1));
    const toExclusive = new Date(Date.UTC(input.year, input.month, 1));

    return {
      filter: {
        gte: from,
        lt: toExclusive,
      },
      from,
      to: new Date(toExclusive.getTime() - 1),
    };
  }

  if (hasRange) {
    const from = input.from ? parseDateBoundary(input.from, "start") : new Date(0);
    const to = input.to ? parseDateBoundary(input.to, "end") : new Date();

    if (from.getTime() > to.getTime()) {
      throw new AppError("from must be earlier than or equal to to", 400, "INVALID_DATE_FILTER");
    }

    return {
      filter: {
        gte: from,
        lte: to,
      },
      from,
      to,
    };
  }

  if (defaultMode === "all-time") {
    const from = new Date(0);
    const to = new Date();

    return {
      filter: {
        gte: from,
        lte: to,
      },
      from,
      to,
    };
  }

  const now = new Date();
  const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const toExclusive = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

  return {
    filter: {
      gte: from,
      lt: toExclusive,
    },
    from,
    to: new Date(toExclusive.getTime() - 1),
  };
};

export const getMonthWindow = (year: number, month: number) => {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const endExclusive = new Date(Date.UTC(year, month, 1));

  return {
    start,
    endExclusive,
    endInclusive: new Date(endExclusive.getTime() - 1),
  };
};

export const formatMonthKey = (year: number, month: number) => {
  return `${year}-${String(month).padStart(2, "0")}`;
};
