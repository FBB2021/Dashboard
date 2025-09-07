import type { NextApiHandler } from "next";
import { createUser, getUsers } from "@/services/user.service";
import { CreateUserDto } from "@/dtos/request_dtos/user.dto";
import { UserResponse } from "@/dtos/response_dtos/user.response.dto";
import { success, error } from "@/utils/response";

/**
 * Handles requests for the /api/users endpoint.
 * - GET: Fetch all users
 * - POST: Create a new user
 */
const handler: NextApiHandler = async (req, res) => {
  try {
    if (req.method === "GET") {
      const users = await getUsers();
      res.status(200).json(success<UserResponse[]>(users));
      return;
    }

    if (req.method === "POST") {
      const body: CreateUserDto = req.body;
      const user = await createUser(body);
      res.status(201).json(success<UserResponse>(user, "User created"));
      return;
    }

    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).json(error("Method not allowed", 405));
  } catch (err: unknown) {
    if (err instanceof Error) {
      res.status(500).json(error(err.message, 500));
    } else {
      res.status(500).json(error("Unknown error", 500));
    }
  }
};

export default handler;
