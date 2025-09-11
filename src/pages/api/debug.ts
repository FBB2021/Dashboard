import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    res.status(200).json({
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL: process.env.DATABASE_URL ? "✅ defined" : "❌ missing",
      JWT_SECRET: process.env.JWT_SECRET ? "✅ defined" : "❌ missing",
      NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || "❌ missing",
      userCount: await prisma.user.count().catch(() => "⚠️ db not connected"),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
