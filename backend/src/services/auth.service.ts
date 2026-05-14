import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";

import { env } from "../config/env";
import { mailer } from "../lib/mailer";
import { prisma } from "../lib/prisma";
import { AppError } from "../utils/app-error";

type AuthInput = {
  email: string;
  password: string;
};

type RegisterInput = AuthInput & {
  fullName: string;
};

type UpdateProfileInput = {
  fullName?: string;
  avatarUrl?: string | null;
};

type ChangePasswordInput = {
  currentPassword: string;
  newPassword: string;
};

type ForgotPasswordInput = {
  email: string;
};

type ResetPasswordInput = {
  email: string;
  token: string;
  newPassword: string;
};

const normalizeFullName = (value: string) => value.trim().replace(/\s+/g, " ");
const normalizeEmail = (value: string) => value.trim().toLowerCase();

const buildResetTokenHash = (token: string) => crypto.createHash("sha256").update(token).digest("hex");
const buildResetOtp = () => crypto.randomInt(100000, 1000000).toString();

const signAccessToken = (user: { id: string; email: string; fullName: string }) => {
  return jwt.sign(
    {
      email: user.email,
      fullName: user.fullName,
    },
    env.JWT_SECRET,
    {
      subject: user.id,
      expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
    }
  );
};

const toAuthPayload = (user: { id: string; email: string; fullName: string; avatarUrl: string | null }) => ({
  user,
  accessToken: signAccessToken(user),
});

export const authService = {
  register: async ({ email, password, fullName }: RegisterInput) => {
    const normalizedEmail = normalizeEmail(email);

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (existingUser) {
      throw new AppError("Email already exists", 409, "EMAIL_ALREADY_EXISTS");
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        fullName: normalizeFullName(fullName),
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        avatarUrl: true,
      },
    });

    return toAuthPayload(user);
  },

  login: async ({ email, password }: AuthInput) => {
    const normalizedEmail = normalizeEmail(email);

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        fullName: true,
        avatarUrl: true,
        passwordHash: true,
      },
    });

    if (!user) {
      throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
    }

    return toAuthPayload({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
    });
  },

  getMe: async (userId: string) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new AppError("User not found", 404, "USER_NOT_FOUND");
    }

    return user;
  },

  updateProfile: async (userId: string, input: UpdateProfileInput) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new AppError("User not found", 404, "USER_NOT_FOUND");
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(input.fullName !== undefined ? { fullName: normalizeFullName(input.fullName) } : {}),
        ...(input.avatarUrl !== undefined ? { avatarUrl: input.avatarUrl } : {}),
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  },

  changePassword: async (userId: string, input: ChangePasswordInput) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        passwordHash: true,
      },
    });

    if (!user) {
      throw new AppError("User not found", 404, "USER_NOT_FOUND");
    }

    const isCurrentPasswordValid = await bcrypt.compare(input.currentPassword, user.passwordHash);

    if (!isCurrentPasswordValid) {
      throw new AppError("Current password is incorrect", 400, "INVALID_CURRENT_PASSWORD");
    }

    const passwordHash = await bcrypt.hash(input.newPassword, 12);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return { success: true };
  },

  createPasswordReset: async ({ email }: ForgotPasswordInput) => {
    if (!mailer.isConfigured) {
      throw new AppError(
        "Real SMTP delivery is not configured. Update backend/.env with SMTP provider credentials.",
        503,
        "EMAIL_SERVICE_NOT_CONFIGURED"
      );
    }

    const normalizedEmail = normalizeEmail(email);
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        fullName: true,
      },
    });

    if (!user) {
      return {
        delivered: true,
        expiresAt: null,
      };
    }

    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    const otp = buildResetOtp();
    const expiresAt = new Date(Date.now() + env.PASSWORD_RESET_OTP_EXPIRES_MINUTES * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: buildResetTokenHash(otp),
        expiresAt,
      },
    });

    try {
      await mailer.sendPasswordResetOtp({
        email: user.email,
        fullName: user.fullName,
        otp,
        expiresInMinutes: env.PASSWORD_RESET_OTP_EXPIRES_MINUTES,
      });
    } catch (error) {
      await prisma.passwordResetToken.deleteMany({
        where: { userId: user.id },
      });

      throw error;
    }

    return {
      delivered: true,
      expiresAt: expiresAt.toISOString(),
    };
  },

  resetPassword: async ({ email, token, newPassword }: ResetPasswordInput) => {
    const normalizedEmail = normalizeEmail(email);

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (!user) {
      throw new AppError("Reset token is invalid or expired", 400, "INVALID_RESET_TOKEN");
    }

    const passwordResetToken = await prisma.passwordResetToken.findFirst({
      where: {
        userId: user.id,
        tokenHash: buildResetTokenHash(token),
        usedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!passwordResetToken) {
      throw new AppError("Reset token is invalid or expired", 400, "INVALID_RESET_TOKEN");
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.deleteMany({
        where: { userId: user.id },
      }),
    ]);

    return { success: true };
  },
};
