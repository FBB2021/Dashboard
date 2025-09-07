import { PrismaClient } from "@prisma/client";

// Prevent duplicate PrismaClient instances in dev environment
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["query"], // Show SQL logs when debugging
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
