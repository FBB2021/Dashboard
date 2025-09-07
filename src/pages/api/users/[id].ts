import type { NextApiRequest, NextApiResponse } from "next";
import { getUserById, updateUser, deleteUser } from "@/services/user.service";
import { UpdateUserDto } from "@/dtos/request_dtos/user.dto";
import { UserResponse } from "@/dtos/response_dtos/user.response.dto";

/**
 * Handles requests for the /api/users/[id] endpoint.
 * - GET: Fetch a user by ID
 * - PUT: Update a user by ID
 * - DELETE: Remove a user by ID
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UserResponse | { error: string } | void>
) {
  const { id } = req.query;

  try {
    if (!id || Array.isArray(id)) {
      return res.status(400).json({ error: "Invalid user id" });
    }

    const userId = Number(id);

    if (req.method === "GET") {
      const user = await getUserById(userId);
      if (!user) return res.status(404).json({ error: "User not found" });
      return res.status(200).json(user);
    }

    if (req.method === "PUT") {
      const body: UpdateUserDto = req.body;
      const user = await updateUser(userId, body);
      return res.status(200).json(user);
    }

    if (req.method === "DELETE") {
      await deleteUser(userId);
      return res.status(204).end();
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}