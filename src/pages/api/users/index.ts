import type { NextApiRequest, NextApiResponse } from "next";
import { createUser, getUsers } from "@/services/user.service";
import { CreateUserDto } from "@/dtos/request_dtos/user.dto";
import { UserResponse } from "@/dtos/response_dtos/user.response.dto";

/**
 * Handles requests for the /api/users endpoint.
 * - GET: Fetch all users
 * - POST: Create a new user
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UserResponse[] | UserResponse | { error: string }>
) {
  try {
    if (req.method === "GET") {
      const users = await getUsers();
      return res.status(200).json(users);
    }

    if (req.method === "POST") {
      const body: CreateUserDto = req.body;
      const user = await createUser(body);
      return res.status(201).json(user);
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}