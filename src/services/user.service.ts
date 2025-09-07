import { prisma } from "@/lib/prisma";
import { CreateUserDto, UpdateUserDto } from "@/dtos/request_dtos/user.dto";
import { UserResponse } from "@/dtos/response_dtos/user.response.dto";

/**
 * Create a new user
 */
export async function createUser(data: CreateUserDto): Promise<UserResponse> {
  const user = await prisma.user.create({ data });
  return toUserResponse(user);
}

/**
 * Get all users
 */
export async function getUsers(): Promise<UserResponse[]> {
  const users = await prisma.user.findMany();
  return users.map(toUserResponse);
}

/**
 * Get a single user by ID
 */
export async function getUserById(id: number): Promise<UserResponse | null> {
  const user = await prisma.user.findUnique({ where: { id } });
  return user ? toUserResponse(user) : null;
}

/**
 * Update a user by ID
 */
export async function updateUser(id: number, data: UpdateUserDto): Promise<UserResponse> {
  const user = await prisma.user.update({
    where: { id },
    data,
  });
  return toUserResponse(user);
}

/**
 * Delete a user by ID
 */
export async function deleteUser(id: number): Promise<void> {
  await prisma.user.delete({ where: { id } });
}

/**
 * Helper: Convert DB User -> Response DTO
 */
function toUserResponse(user: any): UserResponse {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    createdAt: user.createdAt,
  };
}
