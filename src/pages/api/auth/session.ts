import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  const common = `Path=/; HttpOnly; SameSite=Lax${secure}`;

  if (req.method === "POST") {
    const body = typeof req.body === "string" ? safeJSON(req.body) : (req.body || {});
    const token: string | undefined = body.token;
    const remember: boolean = Boolean(body.remember);

    if (!token) {
      return res.status(400).json({ code: 400, message: "Missing token", data: null });
    }

    // 记住我：30 天；否则 12 小时
    const maxAge = remember ? 60 * 60 * 24 * 30 : 60 * 60 * 12;

    res.setHeader("Set-Cookie", `token=${encodeURIComponent(token)}; Max-Age=${maxAge}; ${common}`);
    return res.status(200).json({ code: 200, message: "ok", data: null });
  }

  if (req.method === "DELETE") {
    res.setHeader("Set-Cookie", `token=; Max-Age=0; ${common}`);
    return res.status(200).json({ code: 200, message: "logged out", data: null });
  }

  res.setHeader("Allow", "POST, DELETE");
  return res.status(405).json({ code: 405, message: "Method Not Allowed", data: null });
}

function safeJSON(s: string) { try { return JSON.parse(s); } catch { return {}; } }