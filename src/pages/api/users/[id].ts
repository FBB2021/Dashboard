import type { NextApiHandler } from "next";
import { getUserById, updateUser, deleteUser } from "@/services/user.service";
import { UpdateUserDto } from "@/dtos/request_dtos/user.dto";
import { UserResponse } from "@/dtos/response_dtos/user.response.dto";
import { success, error } from "@/utils/response";

/**
 * Handles requests for the /api/users/[id] endpoint.
 * - GET: Fetch a user by ID
 * - PUT: Update a user by ID
 * - DELETE: Remove a user by ID
 */
const handler: NextApiHandler = async (req, res) => {
  const { id } = req.query;

  try {
    if (!id || Array.isArray(id)) {
      res.status(400).json(error("Invalid user id", 400));
      return;
    }

    const userId = Number(id);

    if (req.method === "GET") {
      const user = await getUserById(userId);
      if (!user) {
        res.status(404).json(error("User not found", 404));
        return;
      }
      res.status(200).json(success<UserResponse>(user));
      return;
    }

    if (req.method === "PUT") {
      const body: UpdateUserDto = req.body;

      const existing = await getUserById(userId);
      if (!existing) {
        res.status(404).json(error("User not found", 404));
        return;
      }

      const user = await updateUser(userId, body);
      res.status(200).json(success<UserResponse>(user, "User updated"));
      return;
    }

    if (req.method === "DELETE") {
      const existing = await getUserById(userId);
      if (!existing) {
        res.status(404).json(error("User not found", 404));
        return;
      }

      await deleteUser(userId);
      res.status(200).json(success(null, "User deleted"));
      return;
    }

    res.status(405).json(error("Method not allowed", 405));
  } catch (err: any) {
    res.status(500).json(error(err.message, 500));
  }
};

export default handler;