import { z } from "zod";

const avatarInputSchema = z
  .string()
  .trim()
  .max(2_000_000, "Avatar image is too large")
  .refine(
    (value) => value.startsWith("data:image/") || /^https?:\/\//.test(value),
    "Avatar must be a valid image URL or data URI"
  );

export const registerRequestSchema = z.object({
  body: z.object({
    email: z.email(),
    password: z.string().min(8, "Password must be at least 8 characters"),
    fullName: z.string().trim().min(2, "Full name must be at least 2 characters"),
  }),
});

export const loginRequestSchema = z.object({
  body: z.object({
    email: z.email(),
    password: z.string().min(1, "Password is required"),
  }),
});

export const updateProfileRequestSchema = z.object({
  body: z
    .object({
      fullName: z.string().trim().min(2, "Full name must be at least 2 characters").optional(),
      avatarUrl: z.union([avatarInputSchema, z.null()]).optional(),
    })
    .refine((value) => value.fullName !== undefined || value.avatarUrl !== undefined, {
      message: "At least one profile field is required",
    }),
});

export const changePasswordRequestSchema = z.object({
  body: z
    .object({
      currentPassword: z.string().min(1, "Current password is required"),
      newPassword: z.string().min(8, "New password must be at least 8 characters"),
    })
    .refine((value) => value.currentPassword !== value.newPassword, {
      message: "New password must be different from the current password",
      path: ["newPassword"],
    }),
});

export const forgotPasswordRequestSchema = z.object({
  body: z.object({
    email: z.email(),
  }),
});

export const resetPasswordRequestSchema = z.object({
  body: z.object({
    email: z.email(),
    token: z.string().trim().length(6, "OTP must be 6 digits"),
    newPassword: z.string().min(8, "New password must be at least 8 characters"),
  }),
});
