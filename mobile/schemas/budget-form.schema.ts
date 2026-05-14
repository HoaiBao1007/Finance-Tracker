import { z } from 'zod';

export const budgetFormSchema = z.object({
  categoryId: z.string().min(1, 'Vui lòng chọn danh mục chi tiêu'),
  limitAmount: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập hạn mức')
    .refine((value) => /^\d+$/.test(value.trim()) && BigInt(value.trim()) > 0n, 'Hạn mức phải là số nguyên dương'),
});

export type BudgetFormValues = z.infer<typeof budgetFormSchema>;