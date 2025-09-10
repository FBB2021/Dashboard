import type { NextApiRequest } from "next";
import { withErrorHandling } from "@/common/api_handler";
import { loginUser } from "@/services/auth.service";
import { AppError } from "@/common/exceptions";

async function handler(req: NextApiRequest) {
  if (req.method !== "POST") throw new AppError("Method not allowed", 405);

  const { identifier, password } = req.body;
  if (!identifier || !password) {
    throw new AppError("Username/email and password are required", 400);
  }

  return await loginUser(identifier, password);
}

export default withErrorHandling(handler);
