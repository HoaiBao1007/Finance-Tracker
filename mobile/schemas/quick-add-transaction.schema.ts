import { z } from 'zod';

export const quickAddTransactionSchema = z.object({
  categoryId: z.string().min(1, 'Vui lòng chọn danh mục'),
  amount: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập số tiền')
    .refine((value) => /^\d+$/.test(value.trim()) && BigInt(value.trim()) > 0n, 'Số tiền phải là số nguyên dương'),
  type: z.enum(['income', 'expense']),
  date: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập ngày giao dịch')
    .refine((value) => !Number.isNaN(new Date(value).getTime()), 'Ngày giao dịch không hợp lệ'),
  note: z.string().trim().max(500, 'Ghi chú tối đa 500 ký tự').optional(),
});

export type QuickAddTransactionValues = z.infer<typeof quickAddTransactionSchema>;