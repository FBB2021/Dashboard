import type { NextApiResponse } from "next";
import { AppError } from "@/common/exceptions";
import type { AuthedRequest, AuthedHandler } from "./jwt.types";

export function withRole(required: string | string[]) {
  const need = Array.isArray(required) ? required : [required];
  return (handler: AuthedHandler): AuthedHandler =>
    (req: AuthedRequest, res: NextApiResponse) => {
      if (!req.user || !need.includes(req.user.role)) {
        throw new AppError("Forbidden", 403);
      }
      return handler(req, res);
    };
}

export function withPermissions(required: string | string[], mode: "any" | "all" = "any") {
  const need = Array.isArray(required) ? required : [required];
  return (handler: AuthedHandler): AuthedHandler =>
    (req: AuthedRequest, res: NextApiResponse) => {
      const have = req.user?.permissions || [];
      const ok = mode === "all" ? need.every(p => have.includes(p))
                                : need.some(p => have.includes(p));
      if (!ok) throw new AppError("Forbidden", 403);
      return handler(req, res);
    };
}
