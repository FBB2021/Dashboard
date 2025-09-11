// pages/api/debug.ts  or  src/pages/api/debug.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

const g = globalThis as unknown as { _prisma?: PrismaClient };
const prisma = g._prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") g._prisma = prisma;

// ✅ 不用 any：参数用 unknown
function safeStringify(obj: unknown) {
  return JSON.stringify(obj, (_k, v) => (typeof v === "bigint" ? v.toString() : v));
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Content-Type", "application/json");
  try {
    const ping = await prisma.$queryRawUnsafe("SELECT 1.0 AS ok");

    res.status(200).send(
      safeStringify({
        NODE_ENV: process.env.NODE_ENV,
        DATABASE_URL: process.env.DATABASE_URL ? "✅ defined" : "❌ missing",
        JWT_SECRET: process.env.JWT_SECRET ? "✅ defined" : "❌ missing",
        NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || "❌ missing",
        ping,
      })
    );
  } catch (e: unknown) { // ✅ 不用 any
    // 做一个最小的安全收窄，避免显式 any
    const err = (e ?? {}) as {
      name?: string;
      code?: string | number;
      errno?: number;
      sqlState?: string;
      message?: string;
      meta?: unknown;
    };
    res.status(500).send(
      safeStringify({
        error: {
          name: err.name,
          code: err.code,
          errno: err.errno,
          sqlState: err.sqlState,
          message: err.message,
          meta: err.meta,
        },
      })
    );
  }
}
