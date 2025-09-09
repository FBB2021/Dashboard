// pages/api/auth/session.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { serialize } from "cookie";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const isProd = process.env.NODE_ENV === "production";

  // 如果需要跨子域共享（app.example.com 与 admin.example.com），取消注释并替换域名
  // const domain = isProd ? ".yourdomain.com" : undefined;

  const base = {
    httpOnly: true as const,
    sameSite: "lax" as const,
    secure: isProd,
    path: "/",
    // domain, // <- 需要跨子域时再开启
  };

  if (req.method === "POST") {
    const body = typeof req.body === "string" ? safeJSON(req.body) : (req.body || {});
    const token: string | undefined = body.token;
    const remember = Boolean(body.remember);
    if (!token) return res.status(400).json({ code: 400, message: "Missing token", data: null });

    // remember=30d，否则12h
    const maxAge = remember ? 60 * 60 * 24 * 30 : 60 * 60 * 12;

    // 关键：不要 encodeURIComponent(token)
    res.setHeader("Set-Cookie", serialize("token", token, { ...base, maxAge }));
    return res.status(200).json({ code: 200, message: "ok", data: null });
  }

  if (req.method === "DELETE") {
    res.setHeader("Set-Cookie", serialize("token", "", { ...base, maxAge: 0 }));
    return res.status(200).json({ code: 200, message: "logged out", data: null });
  }

  res.setHeader("Allow", "POST, DELETE");
  return res.status(405).json({ code: 405, message: "Method Not Allowed", data: null });
}

function safeJSON(s: string) {
  try { return JSON.parse(s); } catch { return {}; }
}
