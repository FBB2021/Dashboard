// src/pages/api/auth/logout.ts
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ code: 405, message: "Method Not Allowed", data: null });
  }

  const common = "Path=/; HttpOnly; SameSite=Lax";
  res.setHeader("Set-Cookie", [
    `token=; Max-Age=0; ${common}`,
    `refreshToken=; Max-Age=0; ${common}`,
  ]);

  return res.status(200).json({ code: 200, message: "success", data: null });
}
