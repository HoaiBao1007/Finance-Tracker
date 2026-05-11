import { z } from "zod";

const baseDateRangeQuerySchema = z
  .object({
    month: z.coerce.number().int().min(1).max(12).optional(),
    year: z.coerce.number().int().min(2000).max(2100).optional(),
    from: z.string().optional(),
    to: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    const hasMonthYear = value.month !== undefined || value.year !== undefined;
    const hasRange = Boolean(value.from || value.to);

    if ((value.month !== undefined) !== (value.year !== undefined)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "month and year must be provided together",
        path: [value.month === undefined ? "month" : "year"],
      });
    }

    if (hasMonthYear && hasRange) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Use either month/year or from/to filters, not both",
        path: ["month"],
      });
    }
  });

const monthlyTrendQuerySchema = z
  .object({
    months: z.coerce.number().int().min(1).max(24).default(6),
    month: z.coerce.number().int().min(1).max(12).optional(),
    year: z.coerce.number().int().min(2000).max(2100).optional(),
  })
  .superRefine((value, ctx) => {
    if ((value.month !== undefined) !== (value.year !== undefined)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "month and year must be provided together",
        path: [value.month === undefined ? "month" : "year"],
      });
    }
  });

export const summaryReportRequestSchema = z.object({
  query: baseDateRangeQuerySchema,
});

export const byCategoryReportRequestSchema = z.object({
  query: baseDateRangeQuerySchema,
});

export const monthlyTrendReportRequestSchema = z.object({
  query: monthlyTrendQuerySchema,
});

export const dashboardBundleRequestSchema = z.object({
  query: monthlyTrendQuerySchema,
});

export type SummaryReportQuery = z.infer<typeof baseDateRangeQuerySchema>;
export type ByCategoryReportQuery = z.infer<typeof baseDateRangeQuerySchema>;
export type MonthlyTrendReportQuery = z.infer<typeof monthlyTrendQuerySchema>;
export type DashboardBundleQuery = z.infer<typeof monthlyTrendQuerySchema>;
