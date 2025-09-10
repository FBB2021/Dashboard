import type { NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import { AppError } from "@/common/exceptions";
import type { AuthedRequest, JwtPayload, AuthedHandler } from "@/common/auth/jwt.types";

export function withAuth(handler: AuthedHandler): AuthedHandler {
  return async (req: AuthedRequest, res: NextApiResponse) => {
    const bearer = req.headers.authorization?.split(" ")[1];
    const token = req.cookies?.token || bearer;
    if (!token) throw new AppError("Unauthorized", 401);

    try {
      const SECRET = process.env.JWT_SECRET || "supersecretkey";
      const payload = jwt.verify(token, SECRET) as JwtPayload;
      req.user = payload; // Inject user
      return handler(req, res);
    } catch {
      throw new AppError("Unauthorized", 401);
    }
  };
}
