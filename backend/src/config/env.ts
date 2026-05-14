import { z } from "zod";

const emailProviderSchema = z.enum(["smtp", "resend"]).default("smtp");
const smtpSecureSchema = z.enum(["true", "false"]).default("false").transform((value) => value === "true");
const allowLocalSmtpSchema = z.enum(["true", "false"]).default("false").transform((value) => value === "true");
const localSmtpHosts = new Set(["localhost", "127.0.0.1", "::1"]);

const rawEnv = {
  ...process.env,
  EMAIL_PROVIDER: process.env.EMAIL_PROVIDER ?? "smtp",
  MAIL_FROM_EMAIL: process.env.MAIL_FROM_EMAIL ?? process.env.SMTP_FROM_EMAIL,
  MAIL_FROM_NAME: process.env.MAIL_FROM_NAME ?? process.env.SMTP_FROM_NAME,
  RESEND_API_BASE_URL: process.env.RESEND_API_BASE_URL ?? "https://api.resend.com",
};

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  CLIENT_ORIGIN: z.string().default("http://localhost:3000"),
  EMAIL_PROVIDER: emailProviderSchema,
  MAIL_FROM_EMAIL: z.string().email().optional(),
  MAIL_FROM_NAME: z.string().trim().min(1).default("Finance Tracker"),
  SMTP_HOST: z.string().trim().min(1).optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_SECURE: smtpSecureSchema,
  SMTP_USER: z.string().trim().min(1).optional(),
  SMTP_PASS: z.string().min(1).optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  RESEND_API_BASE_URL: z.string().url().default("https://api.resend.com"),
  ALLOW_LOCAL_SMTP: allowLocalSmtpSchema,
  PASSWORD_RESET_OTP_EXPIRES_MINUTES: z.coerce.number().int().min(5).max(60).default(15),
}).superRefine((value, context) => {
  const requiredSmtpValues = {
    SMTP_HOST: value.SMTP_HOST,
    SMTP_PORT: value.SMTP_PORT,
    MAIL_FROM_EMAIL: value.MAIL_FROM_EMAIL,
  };
  const hasAnySmtpValue = [value.SMTP_HOST, value.SMTP_PORT, value.SMTP_USER, value.SMTP_PASS].some(
    (entry) => entry !== undefined
  );

  if (value.EMAIL_PROVIDER === "resend") {
    if (value.RESEND_API_KEY === undefined) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["RESEND_API_KEY"],
        message: "RESEND_API_KEY is required when EMAIL_PROVIDER=resend",
      });
    }

    if (value.MAIL_FROM_EMAIL === undefined) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["MAIL_FROM_EMAIL"],
        message: "MAIL_FROM_EMAIL is required when EMAIL_PROVIDER=resend",
      });
    }
  }

  if (value.EMAIL_PROVIDER !== "smtp" && !hasAnySmtpValue) {
    return;
  }

  if (!hasAnySmtpValue) {
    if (value.SMTP_USER !== undefined || value.SMTP_PASS !== undefined) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["SMTP_USER"],
        message: "SMTP_HOST, SMTP_PORT and MAIL_FROM_EMAIL are required when SMTP auth is provided",
      });
    }
  }

  for (const [key, fieldValue] of Object.entries(requiredSmtpValues)) {
    if (fieldValue === undefined) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: [key],
        message: `${key} is required when SMTP email delivery is enabled`,
      });
    }
  }

  if ((value.SMTP_USER === undefined) !== (value.SMTP_PASS === undefined)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["SMTP_USER"],
      message: "SMTP_USER and SMTP_PASS must be provided together",
    });
  }

  if (value.SMTP_HOST && localSmtpHosts.has(value.SMTP_HOST.toLowerCase()) && !value.ALLOW_LOCAL_SMTP) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["SMTP_HOST"],
      message:
        "Local SMTP is disabled by default. Configure a real SMTP provider, or set ALLOW_LOCAL_SMTP=true only for local debugging.",
    });
  }
});

const parsedEnv = envSchema.safeParse(rawEnv);

if (!parsedEnv.success) {
  console.error("Invalid environment variables:", parsedEnv.error.flatten().fieldErrors);
  throw new Error("Environment validation failed");
}

export const env = parsedEnv.data;
