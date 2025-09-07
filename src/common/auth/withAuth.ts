import type { NextApiHandler, NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import { AppError } from "@/common/exceptions";
import type { JwtPayload, AuthedHandler } from "./jwt.types";

const SECRET = process.env.JWT_SECRET || "supersecretkey";

export function withAuth(handler: AuthedHandler): NextApiHandler {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer ")) throw new AppError("Unauthorized", 401);

    const token = auth.slice("Bearer ".length).trim();
    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, SECRET) as JwtPayload;
    } catch {
      throw new AppError("Invalid token", 401);
    }

    return handler(Object.assign(req, { user: decoded }), res);
  };
}
