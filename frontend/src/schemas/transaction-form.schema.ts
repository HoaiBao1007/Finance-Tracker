import { z } from "zod";

export const transactionFormSchema = z.object({
  categoryId: z.string().min(1, "Vui lòng chọn category"),
  amount: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập số tiền")
    .refine((value) => Number(value) > 0, "Số tiền phải lớn hơn 0"),
  type: z.enum(["income", "expense"]),
  date: z.string().min(1, "Vui lòng chọn ngày"),
  note: z.string().trim().max(500, "Ghi chú tối đa 500 ký tự").optional(),
});

export type TransactionFormValues = z.infer<typeof transactionFormSchema>;