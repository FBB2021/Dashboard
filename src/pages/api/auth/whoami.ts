import type { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = req.cookies?.token;
  const secret = process.env.JWT_SECRET || "supersecretkey";
  let payload: any = null;
  try {
    if (token) payload = jwt.verify(token, secret);
  } catch (e) {
    payload = { error: String(e) };
  }
  res.status(200).json({ token, payload });
}