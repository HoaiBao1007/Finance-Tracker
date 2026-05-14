import { z } from 'zod';

export const passwordRecoveryRequestSchema = z.object({
  email: z.email('Email không hợp lệ'),
});

export type PasswordRecoveryRequestValues = z.infer<typeof passwordRecoveryRequestSchema>;

export const passwordResetSchema = z
  .object({
    email: z.email('Email không hợp lệ'),
    token: z.string().trim().length(6, 'Vui lòng nhập mã OTP gồm 6 số'),
    newPassword: z.string().min(8, 'Mật khẩu mới tối thiểu 8 ký tự'),
    confirmPassword: z.string().min(8, 'Vui lòng xác nhận mật khẩu mới'),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Mật khẩu xác nhận không khớp',
  });

export type PasswordResetFormValues = z.infer<typeof passwordResetSchema>;