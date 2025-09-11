// pages/api/debug.ts  或  src/pages/api/debug.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

// —— 仅为调试，单文件内自带 Prisma 复用（避免热更新连接过多）
const g = globalThis as unknown as { _prisma?: PrismaClient };
const prisma = g._prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") g._prisma = prisma;

// 安全 JSON：把 BigInt 转成字符串，防止 “Do not know how to serialize a BigInt”
function safeStringify(obj: any) {
  return JSON.stringify(obj, (_k, v) => (typeof v === "bigint" ? v.toString() : v));
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Content-Type", "application/json");
  try {
    // 用 1.0 避免 BigInt；想试真正查询可改成 COUNT(*) 等
    const ping = await prisma.$queryRawUnsafe("SELECT 1.0 AS ok");

    // 只显示“是否存在”，不打印敏感值
    const payload = {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL: process.env.DATABASE_URL ? "✅ defined" : "❌ missing",
      JWT_SECRET: process.env.JWT_SECRET ? "✅ defined" : "❌ missing",
      NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || "❌ missing",
      ping,
    };

    res.status(200).send(safeStringify(payload));
  } catch (e: any) {
    // 把真实错误细节打出来，便于判断是密码/库不存在/网络/TLS等
    const err = {
      name: e?.name,
      code: e?.code,
      errno: e?.errno,
      sqlState: e?.sqlState,
      message: e?.message,
      meta: e?.meta,
    };
    res.status(500).send(safeStringify({ error: err }));
  }
}
