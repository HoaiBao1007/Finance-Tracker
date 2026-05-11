import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { env } from "../config/env";
import { prisma } from "../lib/prisma";
import { AppError } from "../utils/app-error";

type AuthInput = {
  email: string;
  password: string;
};

type RegisterInput = AuthInput & {
  fullName: string;
};

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

const toAuthPayload = (user: { id: string; email: string; fullName: string }) => ({
  user,
  accessToken: signAccessToken(user),
});

export const authService = {
  register: async ({ email, password, fullName }: RegisterInput) => {
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      throw new AppError("Email already exists", 409, "EMAIL_ALREADY_EXISTS");
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        fullName,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
      },
    });

    return toAuthPayload(user);
  },

  login: async ({ email, password }: AuthInput) => {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        fullName: true,
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
    });
  },

  getMe: async (userId: string) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new AppError("User not found", 404, "USER_NOT_FOUND");
    }

    return user;
  },
};
