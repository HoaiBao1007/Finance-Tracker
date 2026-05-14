import dns from "node:dns/promises";

import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";

import { env } from "../config/env";
import { AppError } from "../utils/app-error";

type PasswordResetOtpMailInput = {
  email: string;
  fullName?: string;
  otp: string;
  expiresInMinutes: number;
};

type MailProviderName = "smtp" | "resend";

type PasswordResetMessage = {
  from: string;
  to: string;
  toRecipient: string;
  subject: string;
  text: string;
  html: string;
};

const smtpPlaceholderValues = new Set([
  "smtp.example.com",
  "your-account@gmail.com",
  "your-app-password",
  "your-smtp-username",
  "your-smtp-password",
  "no-reply@example.com",
]);

const resendPlaceholderValues = new Set(["re_placeholder_api_key", "your-resend-api-key"]);

const isPlaceholderValue = (value: string | undefined) => {
  if (!value) {
    return false;
  }

  return smtpPlaceholderValues.has(value.trim().toLowerCase());
};

const hasSmtpConfig = Boolean(
  env.SMTP_HOST &&
    env.SMTP_PORT &&
    env.MAIL_FROM_EMAIL &&
    !isPlaceholderValue(env.SMTP_HOST) &&
    !isPlaceholderValue(env.MAIL_FROM_EMAIL) &&
    !(env.SMTP_USER && isPlaceholderValue(env.SMTP_USER)) &&
    !(env.SMTP_PASS && isPlaceholderValue(env.SMTP_PASS))
);

const hasResendConfig = Boolean(
  env.RESEND_API_KEY &&
    env.MAIL_FROM_EMAIL &&
    !resendPlaceholderValues.has(env.RESEND_API_KEY.trim().toLowerCase()) &&
    !isPlaceholderValue(env.MAIL_FROM_EMAIL)
);

const resolveActiveProvider = (): MailProviderName | null => {
  if (env.EMAIL_PROVIDER === "resend" && hasResendConfig) {
    return "resend";
  }

  if (env.EMAIL_PROVIDER === "smtp" && hasSmtpConfig) {
    return "smtp";
  }

  if (env.EMAIL_PROVIDER !== "resend" && hasResendConfig) {
    return "resend";
  }

  if (env.EMAIL_PROVIDER !== "smtp" && hasSmtpConfig) {
    return "smtp";
  }

  return null;
};

const activeProvider = resolveActiveProvider();

let transporterPromise: Promise<nodemailer.Transporter> | null = null;

const buildTransportOptions = async (): Promise<SMTPTransport.Options> => {
  const smtpHost = env.SMTP_HOST!;
  const smtpPort = env.SMTP_PORT!;
  const secure = env.SMTP_SECURE || smtpPort === 465;
  let resolvedHost = smtpHost;

  try {
    const lookupResult = await dns.lookup(smtpHost, { family: 4 });
    resolvedHost = lookupResult.address;
  } catch {
    resolvedHost = smtpHost;
  }

  return {
    host: resolvedHost,
    port: smtpPort,
    secure,
    connectionTimeout: 30_000,
    greetingTimeout: 30_000,
    socketTimeout: 30_000,
    ...(resolvedHost !== smtpHost
      ? {
          tls: {
            servername: smtpHost,
          },
        }
      : {}),
    ...(env.SMTP_USER && env.SMTP_PASS
      ? {
          auth: {
            user: env.SMTP_USER,
            pass: env.SMTP_PASS,
          },
        }
      : {}),
  };
};

const buildRecipient = ({ email, fullName }: Pick<PasswordResetOtpMailInput, "email" | "fullName">) => {
  const normalizedName = fullName?.trim();

  if (!normalizedName) {
    return email;
  }

  return `"${normalizedName}" <${email}>`;
};

const buildPasswordResetMessage = ({ email, fullName, otp, expiresInMinutes }: PasswordResetOtpMailInput): PasswordResetMessage => ({
  from: `"${env.MAIL_FROM_NAME}" <${env.MAIL_FROM_EMAIL!}>`,
  to: email,
  toRecipient: buildRecipient({ email, fullName }),
  subject: "Finance Tracker password reset OTP",
  text: [
    `Hello ${fullName?.trim() || "there"},`,
    "",
    `Your Finance Tracker OTP is: ${otp}`,
    `This code expires in ${expiresInMinutes} minutes.`,
    "",
    "If you did not request a password reset, you can ignore this email.",
  ].join("\n"),
  html: `
          <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #1f2937;">
            <h2 style="margin-bottom: 16px;">Finance Tracker password reset</h2>
            <p style="margin: 0 0 12px;">Hello ${fullName?.trim() || "there"},</p>
            <p style="margin: 0 0 12px;">Use the OTP below to reset your password:</p>
            <div style="margin: 20px 0; padding: 16px 20px; border-radius: 14px; background: #eff6ff; border: 1px solid #bfdbfe; font-size: 28px; font-weight: 700; letter-spacing: 8px; text-align: center; color: #1d4ed8;">
              ${otp}
            </div>
            <p style="margin: 0 0 12px;">This code expires in ${expiresInMinutes} minutes.</p>
            <p style="margin: 0; color: #6b7280;">If you did not request a password reset, you can ignore this email.</p>
          </div>
        `,
});

const parseJsonSafely = (value: string) => {
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return null;
  }
};

const readStringField = (payload: Record<string, unknown> | null, key: string) => {
  const value = payload?.[key];

  return typeof value === "string" ? value : null;
};

const buildConfigError = () =>
  new AppError(
    "Email delivery is not configured. Configure EMAIL_PROVIDER with valid Resend or SMTP credentials.",
    503,
    "EMAIL_SERVICE_NOT_CONFIGURED",
    {
      requestedProvider: env.EMAIL_PROVIDER,
    }
  );

const getTransporter = async () => {
  if (!hasSmtpConfig) {
    throw buildConfigError();
  }

  if (!transporterPromise) {
    transporterPromise = buildTransportOptions().then((transportOptions) => nodemailer.createTransport(transportOptions));
  }

  try {
    return await transporterPromise;
  } catch (error) {
    transporterPromise = null;
    throw error;
  }
};

const sendWithSmtp = async (input: PasswordResetOtpMailInput) => {
  const activeTransporter = await getTransporter();
  const message = buildPasswordResetMessage(input);

  await activeTransporter.sendMail({
    from: message.from,
    to: message.toRecipient,
    subject: message.subject,
    text: message.text,
    html: message.html,
  });
};

const sendWithResend = async (input: PasswordResetOtpMailInput) => {
  if (!hasResendConfig) {
    throw buildConfigError();
  }

  const message = buildPasswordResetMessage(input);
  const response = await fetch(`${env.RESEND_API_BASE_URL.replace(/\/+$/, "")}/emails`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY!}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: message.from,
      to: [message.to],
      subject: message.subject,
      text: message.text,
      html: message.html,
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (response.ok) {
    return;
  }

  const responseText = await response.text();
  const payload = parseJsonSafely(responseText);
  const providerMessage =
    readStringField(payload, "message") ||
    readStringField(payload, "error") ||
    responseText ||
    `Resend returned ${response.status}`;

  throw new Error(providerMessage);
};

export const mailer = {
  isConfigured: activeProvider !== null,
  providerName: activeProvider,
  requestedProvider: env.EMAIL_PROVIDER,
  isFallback: activeProvider !== null && activeProvider !== env.EMAIL_PROVIDER,

  sendPasswordResetOtp: async ({ email, fullName, otp, expiresInMinutes }: PasswordResetOtpMailInput) => {
    if (!activeProvider) {
      throw buildConfigError();
    }

    try {
      if (activeProvider === "resend") {
        await sendWithResend({ email, fullName, otp, expiresInMinutes });
        return;
      }

      await sendWithSmtp({ email, fullName, otp, expiresInMinutes });
    } catch (error) {
      if (error instanceof AppError && error.code === "EMAIL_SERVICE_NOT_CONFIGURED") {
        throw error;
      }

      throw new AppError(
        "Unable to deliver password reset email. Check your email provider credentials and sender settings.",
        503,
        "EMAIL_DELIVERY_FAILED",
        {
          provider: activeProvider,
          cause: error instanceof Error ? error.message : "UNKNOWN",
        }
      );
    }
  },
};