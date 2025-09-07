import type { NextApiRequest, NextApiResponse } from "next";
import { getUsers, createUser } from "@/services/user.service";
import { withErrorHandling } from "@/common/api_handler";
import { AppError } from "@/common/exceptions";

/**
 * Handles requests for the /api/users endpoint.
 * - GET: Fetch all users
 * - POST: Create a new user
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    return await getUsers();
  }

  if (req.method === "POST") {
    return await createUser(req.body);
  }

  throw new AppError("Method not allowed", 405);
}

export default withErrorHandling(handler);
