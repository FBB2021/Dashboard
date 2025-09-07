import type { NextApiHandler, NextApiRequest, NextApiResponse } from "next";
import { AppError } from "./exceptions";
import { success, fail } from "./api_response";

export function withErrorHandling(handler: NextApiHandler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      const result = await handler(req, res);
      if (res.writableEnded) return; 
      res.status(200).json(success(result));
    } catch (err: any) {
      if (err instanceof AppError) {
        res.status(err.statusCode).json(fail(err.message, err.statusCode));
      } else {
        console.error("Unexpected error:", err);
        res.status(500).json(fail("Internal Server Error", 500));
      }
    }
  };
}