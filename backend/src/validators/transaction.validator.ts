import { z } from "zod";

const transactionTypeSchema = z.enum(["income", "expense"]);
const amountSchema = z.union([z.string(), z.number()]);

const isValidDateInput = (value: string) => !Number.isNaN(new Date(value).getTime());

const transactionParamsSchema = z.object({
  id: z.string().min(1, "Transaction id is required"),
});

const createTransactionBodySchema = z.object({
  categoryId: z.string().min(1, "categoryId is required"),
  amount: amountSchema,
  type: transactionTypeSchema,
  date: z.coerce.date(),
  note: z.string().trim().max(500).optional(),
});

const updateTransactionBodySchema = z
  .object({
    categoryId: z.string().min(1).optional(),
    amount: amountSchema.optional(),
    type: transactionTypeSchema.optional(),
    date: z.coerce.date().optional(),
    note: z.string().trim().max(500).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

const listTransactionsQuerySchema = z
  .object({
    month: z.coerce.number().int().min(1).max(12).optional(),
    year: z.coerce.number().int().min(2000).max(2100).optional(),
    from: z.string().optional(),
    to: z.string().optional(),
    categoryId: z.string().min(1).optional(),
    type: transactionTypeSchema.optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
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

    if (value.from && !isValidDateInput(value.from)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "from must be a valid date",
        path: ["from"],
      });
    }

    if (value.to && !isValidDateInput(value.to)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "to must be a valid date",
        path: ["to"],
      });
    }

    if (value.from && value.to) {
      const fromDate = new Date(value.from);
      const toDate = new Date(value.to);

      if (fromDate.getTime() > toDate.getTime()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "from must be earlier than or equal to to",
          path: ["from"],
        });
      }
    }
  });

export const createTransactionRequestSchema = z.object({
  body: createTransactionBodySchema,
});

export const updateTransactionRequestSchema = z.object({
  params: transactionParamsSchema,
  body: updateTransactionBodySchema,
});

export const getTransactionRequestSchema = z.object({
  params: transactionParamsSchema,
});

export const listTransactionsRequestSchema = z.object({
  query: listTransactionsQuerySchema,
});

export type CreateTransactionBody = z.infer<typeof createTransactionBodySchema>;
export type UpdateTransactionBody = z.infer<typeof updateTransactionBodySchema>;
export type TransactionParams = z.infer<typeof transactionParamsSchema>;
export type ListTransactionsQuery = z.infer<typeof listTransactionsQuerySchema>;
