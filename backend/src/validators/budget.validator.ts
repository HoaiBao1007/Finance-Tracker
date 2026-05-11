import { z } from "zod";

const amountSchema = z.union([z.string(), z.number()]);

const budgetParamsSchema = z.object({
  id: z.string().min(1, "Budget id is required"),
});

const createBudgetBodySchema = z.object({
  categoryId: z.string().min(1, "categoryId is required"),
  limitAmount: amountSchema,
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
});

const updateBudgetBodySchema = z
  .object({
    categoryId: z.string().min(1).optional(),
    limitAmount: amountSchema.optional(),
    month: z.coerce.number().int().min(1).max(12).optional(),
    year: z.coerce.number().int().min(2000).max(2100).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
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

const listBudgetsQuerySchema = z
  .object({
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

export const createBudgetRequestSchema = z.object({
  body: createBudgetBodySchema,
});

export const updateBudgetRequestSchema = z.object({
  params: budgetParamsSchema,
  body: updateBudgetBodySchema,
});

export const deleteBudgetRequestSchema = z.object({
  params: budgetParamsSchema,
});

export const listBudgetsRequestSchema = z.object({
  query: listBudgetsQuerySchema,
});

export type CreateBudgetBody = z.infer<typeof createBudgetBodySchema>;
export type UpdateBudgetBody = z.infer<typeof updateBudgetBodySchema>;
export type BudgetParams = z.infer<typeof budgetParamsSchema>;
export type ListBudgetsQuery = z.infer<typeof listBudgetsQuerySchema>;
