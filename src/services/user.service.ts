import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { CreateUserDto, UpdateUserDto } from "@/dtos/request_dtos/user.dto";
import { UserResponse } from "@/dtos/response_dtos/user.response.dto";
import { AppError } from "@/common/exceptions";
import { User } from "@prisma/client";

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || "10", 10);

/**
 * Create a new user
 */
export async function createUser(data: CreateUserDto): Promise<UserResponse> {
  const existing = await prisma.user.findFirst({
    where: { OR: [{ username: data.username }, { email: data.email }] },
  });
  if (existing) throw new AppError("Username or email already exists", 400);

  const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: { ...data, password: hashedPassword },
  });
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
  if (data.username || data.email) {
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          data.username ? { username: data.username } : undefined,
          data.email ? { email: data.email } : undefined,
        ].filter(Boolean) as any,
        NOT: { id },
      },
    });
    if (existing) throw new AppError("Username or email already exists", 400);
  }

  let updateData: any = { ...data };
  if (data.password) {
    updateData.password = await bcrypt.hash(data.password, SALT_ROUNDS);
  }

  const user = await prisma.user.update({ where: { id }, data: updateData });
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
function toUserResponse(user: User): UserResponse {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    createdAt: user.createdAt,
    password: user.password
  };
}
