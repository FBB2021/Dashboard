import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { CreateUserDto, UpdateUserDto } from "@/dtos/request_dtos/user.dto";
import { UserResponse } from "@/dtos/response_dtos/user.response.dto";
import { AppError } from "@/common/exceptions";
import type { User, Role } from "@prisma/client";

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || "10", 10);

/** Find default role id (USER). Throw if not seeded. */
async function getDefaultRoleId(): Promise<number> {
  const role = await prisma.role.findUnique({ where: { name: "USER" } });
  if (!role) throw new AppError("Default role 'USER' not found. Please seed roles first.", 500);
  return role.id;
}

/** Ensure the role exists when a roleId is provided. */
async function ensureRoleExists(roleId: number) {
  const role = await prisma.role.findUnique({ where: { id: roleId } });
  if (!role) throw new AppError("Role does not exist", 400);
}

/** Create a new user */
export async function createUser(data: CreateUserDto): Promise<UserResponse> {
  const existing = await prisma.user.findFirst({
    where: { OR: [{ username: data.username }, { email: data.email }] },
  });
  if (existing) throw new AppError("Username or email already exists", 400);

  const roleId = typeof data.roleId === "number" ? data.roleId : await getDefaultRoleId();
  await ensureRoleExists(roleId);

  const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      username: data.username,
      email: data.email,
      password: hashedPassword,
      roleId,
    },
    include: { role: true },
  });

  return toUserResponse(user);
}

/** Get all users */
export async function getUsers(): Promise<UserResponse[]> {
  const users = await prisma.user.findMany({ include: { role: true } });
  return users.map(toUserResponse);
}

/** Get a single user by ID */
export async function getUserById(id: number): Promise<UserResponse | null> {
  const user = await prisma.user.findUnique({ where: { id }, include: { role: true } });
  return user ? toUserResponse(user as User & { role: Role }) : null;
}

/** Update a user by ID */
export async function updateUser(id: number, data: UpdateUserDto): Promise<UserResponse> {
  // Uniqueness check for username/email
  if (data.username || data.email) {
    const or: any[] = [];
    if (data.username) or.push({ username: data.username });
    if (data.email) or.push({ email: data.email });

    if (or.length) {
      const existing = await prisma.user.findFirst({
        where: {
          OR: or,
          NOT: { id }, // exclude current user
        },
      });
      if (existing) throw new AppError("Username or email already exists", 400);
    }
  }

  // Prepare update payload
  const updateData: Partial<User> = {};
  if (data.username) updateData.username = data.username;
  if (data.email) updateData.email = data.email;
  if (data.password) updateData.password = await bcrypt.hash(data.password, SALT_ROUNDS);
  if (typeof data.roleId === "number") {
    await ensureRoleExists(data.roleId);
    updateData.roleId = data.roleId;
  }

  const user = await prisma.user.update({
    where: { id },
    data: updateData,
    include: { role: true },
  });

  return toUserResponse(user as User & { role: Role });
}

/** Delete a user by ID */
export async function deleteUser(id: number): Promise<void> {
  await prisma.user.delete({ where: { id } });
}

/** Helper: Convert DB User(+Role) -> Response DTO (no password) */
function toUserResponse(user: User & { role: Role }): UserResponse {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    createdAt: user.createdAt,
    role: { id: user.role.id, name: user.role.name },
  };
}
