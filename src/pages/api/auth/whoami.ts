import type { NextApiRequest, NextApiResponse } from "next";
import type { JwtPayload } from "jsonwebtoken";
import jwt from "jsonwebtoken";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = req.cookies?.token;
  const secret = process.env.JWT_SECRET || "supersecretkey";
  let payload: string | JwtPayload | { error: string } | null = null;
  try {
    if (token) payload = jwt.verify(token, secret);
  } catch (e) {
    payload = { error: String(e) };
  }
  res.status(200).json({ token, payload });
}