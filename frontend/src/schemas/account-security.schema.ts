import { z } from "zod";

export const changePasswordFormSchema = z
  .object({
    currentPassword: z.string().min(1, "Vui lòng nhập mật khẩu hiện tại"),
    newPassword: z.string().min(8, "Mật khẩu mới tối thiểu 8 ký tự"),
    confirmPassword: z.string().min(8, "Vui lòng xác nhận mật khẩu mới"),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Mật khẩu xác nhận không khớp",
  })
  .refine((values) => values.currentPassword !== values.newPassword, {
    path: ["newPassword"],
    message: "Mật khẩu mới phải khác mật khẩu hiện tại",
  });

export const passwordRecoveryRequestSchema = z.object({
  email: z.string().trim().email("Email không hợp lệ"),
});

export const passwordResetFormSchema = z
  .object({
    email: z.string().trim().email("Email không hợp lệ"),
    token: z.string().trim().length(6, "Vui lòng nhập mã OTP gồm 6 số"),
    newPassword: z.string().min(8, "Mật khẩu mới tối thiểu 8 ký tự"),
    confirmPassword: z.string().min(8, "Vui lòng xác nhận mật khẩu mới"),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Mật khẩu xác nhận không khớp",
  });

export type ChangePasswordFormValues = z.infer<typeof changePasswordFormSchema>;
export type PasswordRecoveryRequestValues = z.infer<typeof passwordRecoveryRequestSchema>;
export type PasswordResetFormValues = z.infer<typeof passwordResetFormSchema>;