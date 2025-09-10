import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AppError } from "@/common/exceptions";

const SECRET_KEY = process.env.JWT_SECRET || "supersecretkey";

export async function loginUser(identifier: string, password: string) {
  const user = await prisma.user.findFirst({
    where: { OR: [{ username: identifier }, { email: identifier }] },
    include: {
      role: {
        include: {
          permissions: { include: { permission: true } },
        },
      },
    },
  });
  if (!user) throw new AppError("User not found", 404);

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) throw new AppError("Invalid credentials", 401);

  const permissions = user.role.permissions.map(rp => rp.permission.name);

  const token = jwt.sign(
    { userId: user.id, username: user.username, role: user.role.name, permissions },
    SECRET_KEY,
    { expiresIn: "1d" }
  );

  return { token };
}
