import type { NextApiRequest, NextApiResponse } from "next";
import { getUsers, createUser } from "@/services/user.service";
import { withErrorHandling } from "@/common/api_handler";
import { AppError } from "@/common/exceptions";
import { withAuth } from "@/common/auth/withAuth";
import { withRole } from "@/common/auth/authorize";

/**
 * Handles requests for the /api/users endpoint.
 * - GET: Fetch all users
 * - POST: Create a new user
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    const users = await getUsers();
    return res.status(200).json(users);
  }

  if (req.method === "POST") {
    const newUser = await createUser(req.body);
    return res.status(201).json(newUser);
  }

  throw new AppError("Method not allowed", 405);
}

export default withErrorHandling(
  withAuth(withRole("ADMIN")(handler))
);
