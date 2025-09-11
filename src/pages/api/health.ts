import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

// Reuse Prisma clients 
// (to avoid excessive connections created by hot reloading in development environments)
const g = globalThis as unknown as { _prisma?: PrismaClient };
const prisma = g._prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") g._prisma = prisma;

// Safe JSON: BigInt -> string, preventing serialization errors
function safeStringify(obj: unknown) {
  return JSON.stringify(obj, (_k, v) => (typeof v === "bigint" ? v.toString() : v));
}

async function checkDb() {
  const t0 = Date.now();
  try {
    await prisma.$queryRawUnsafe("SELECT 1.0 AS ok"); // Return floating-point values to avoid BigInt
    return { connected: true, latencyMs: Date.now() - t0 as number };
  } catch (e: unknown) {
    const err = (e ?? {}) as { name?: string; code?: string | number; message?: string };
    return {
      connected: false,
      latencyMs: Date.now() - t0 as number,
      error: { name: err.name, code: err.code, message: err.message },
    };
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // HEAD for health checks: Fast response, no response body
  if (req.method === "HEAD") {
    return res.status(204).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const db = await checkDb();
  const healthy = db.connected;

  const payload = {
    status: healthy ? "ok" : "degraded",
    time: new Date().toISOString(),
    uptimeSec: Math.round(process.uptime()),
    env: process.env.NODE_ENV,
    apiBase: process.env.NEXT_PUBLIC_API_BASE_URL || "same-origin",
    db,
  };

  res.setHeader("Content-Type", "application/json");
  res.status(healthy ? 200 : 503).send(safeStringify(payload));
}
