import { z } from "zod";

export const budgetFormSchema = z.object({
  categoryId: z.string().min(1, "Vui lòng chọn category chi tiêu"),
  limitAmount: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập hạn mức")
    .refine((value) => Number(value) > 0, "Hạn mức phải lớn hơn 0"),
});

export type BudgetFormValues = z.infer<typeof budgetFormSchema>;