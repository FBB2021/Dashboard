import type { NextApiRequest, NextApiResponse } from "next";
import { getUserById, updateUser, deleteUser } from "@/services/user.service";
import { UpdateUserDto } from "@/dtos/request_dtos/user.dto";
import { withErrorHandling } from "@/common/api_handler";
import { AppError } from "@/common/exceptions";
import { withAuth } from "@/common/auth/withAuth";
import { withRole } from "@/common/auth/authorize";
/**
 * Handles requests for the /api/users/[id] endpoint.
 * - GET: Fetch a user by ID
 * - PUT: Update a user by ID
 * - DELETE: Remove a user by ID
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || Array.isArray(id)) {
    throw new AppError("Invalid user id", 400);
  }

  const userId = Number(id);
  const user = await getUserById(userId);

  if (!user) {
    if (req.method === "DELETE") {
      // idempotent delete：return 200 if user not exist
      return null;
    }
    throw new AppError("User not found", 404);
  }

  if (req.method === "GET") {
    return user;
  }

  if (req.method === "PUT") {
    const body: UpdateUserDto = req.body;
    const updatedUser = await updateUser(userId, body);
    return updatedUser;
  }

  if (req.method === "DELETE") {
    await deleteUser(userId);
    return null;
  }

  throw new AppError("Method not allowed", 405);
}

export default withErrorHandling(withAuth(withRole("ADMIN")(handler)));
