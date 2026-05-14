import "dotenv/config";

import { createApp } from "./app";
import { env } from "./config/env";
import { mailer } from "./lib/mailer";
import { prisma } from "./lib/prisma";

const app = createApp();

const startServer = async () => {
  try {
    await prisma.$connect();

    if (!mailer.isConfigured) {
      console.warn(
        "Email delivery is not configured. Forgot-password OTP emails stay disabled until backend/.env contains valid EMAIL_PROVIDER credentials for Resend or SMTP."
      );
    } else if (mailer.isFallback && mailer.providerName) {
      console.warn(
        `Email provider '${mailer.requestedProvider}' is not fully configured. Falling back to '${mailer.providerName}'.`
      );
    }

    const server = app.listen(env.PORT, () => {
      console.log(`Finance Tracker API is running on port ${env.PORT}`);
    });

    const shutdown = async (signal: string) => {
      console.log(`${signal} received. Shutting down gracefully.`);

      server.close(async () => {
        await prisma.$disconnect();
        process.exit(0);
      });
    };

    process.on("SIGINT", () => {
      void shutdown("SIGINT");
    });

    process.on("SIGTERM", () => {
      void shutdown("SIGTERM");
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    await prisma.$disconnect().catch(() => undefined);
    process.exit(1);
  }
};

void startServer();
