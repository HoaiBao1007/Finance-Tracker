import "dotenv/config";

import { createApp } from "./app";
import { env } from "./config/env";
import { prisma } from "./lib/prisma";

const app = createApp();

const startServer = async () => {
  try {
    await prisma.$connect();

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
