import { z } from "zod";

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
