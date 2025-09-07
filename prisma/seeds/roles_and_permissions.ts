import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || "10", 10);

// Seed user profiles can be overridden via environment variables
const ADMIN_SEED = {
  username: process.env.SEED_ADMIN_USERNAME || "admin",
  email: process.env.SEED_ADMIN_EMAIL || "admin@example.com",
  password: process.env.SEED_ADMIN_PASSWORD || "admin123",
};

const USER_SEED = {
  username: process.env.SEED_USER_USERNAME || "demo",
  email: process.env.SEED_USER_EMAIL || "demo@example.com",
  password: process.env.SEED_USER_PASSWORD || "user123",
};

/**
 * Seed roles, permissions, role-permission relations, and default users.
 * - Uses only UPSERTs for full idempotency (safe to run multiple times).
 * - Never overwrites existing user passwords; only fixes role assignment.
 */
export default async function seedRolesAndPermissions(prisma: PrismaClient) {
  console.log("🌱 Seeding roles and permissions...");

  // 1) Permissions (idempotent)
  //    Add or ensure existence of base permissions.
  const permissions = [
    { name: "USER:READ", description: "Read user information" },
    { name: "USER:WRITE", description: "Create or update user information" },
    { name: "POST:READ", description: "Read posts" },
    { name: "POST:WRITE", description: "Create or update posts" },
    { name: "POST:DELETE", description: "Delete posts" },
  ];

  for (const p of permissions) {
    await prisma.permission.upsert({
      where: { name: p.name },
      update: {},       // nothing to update for now
      create: p,        // create if it doesn't exist
    });
  }

  // 2) Roles (idempotent)
  //    Create basic roles ADMIN and USER if missing.
  const adminRole = await prisma.role.upsert({
    where: { name: "ADMIN" },
    update: {},
    create: { name: "ADMIN" },
  });

  const userRole = await prisma.role.upsert({
    where: { name: "USER" },
    update: {},
    create: { name: "USER" },
  });

  // 3) Role-Permission relations (idempotent)
  //    ADMIN -> all permissions
  //    USER  -> subset (POST:* + USER:READ)
  const allPermissions = await prisma.permission.findMany();

  // Assign all permissions to ADMIN
  for (const p of allPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: p.id,
        },
      },
      update: {}, // no updates required
      create: { roleId: adminRole.id, permissionId: p.id },
    });
  }

  // Assign a limited permission set to USER
  const userAllowed = allPermissions.filter(
    (p) => p.name.startsWith("POST:") || p.name === "USER:READ"
  );
  for (const p of userAllowed) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: userRole.id,
          permissionId: p.id,
        },
      },
      update: {},
      create: { roleId: userRole.id, permissionId: p.id },
    });
  }

  // 4) Default users (idempotent)
  //    - Passwords are hashed only on create.
  //    - If user already exists (matched by unique email), we DO NOT overwrite password;
  //      we only ensure the role is correct (update roleId).
  console.log("👤 Seeding default users...");

  const adminHashed = await bcrypt.hash(ADMIN_SEED.password, SALT_ROUNDS);
  await prisma.user.upsert({
    where: { email: ADMIN_SEED.email }, // unique key
    update: { roleId: adminRole.id },   // ensure role is ADMIN if user exists
    create: {
      username: ADMIN_SEED.username,
      email: ADMIN_SEED.email,
      password: adminHashed,
      roleId: adminRole.id,
    },
  });

  const userHashed = await bcrypt.hash(USER_SEED.password, SALT_ROUNDS);
  await prisma.user.upsert({
    where: { email: USER_SEED.email },
    update: { roleId: userRole.id },    // ensure role is USER if user exists
    create: {
      username: USER_SEED.username,
      email: USER_SEED.email,
      password: userHashed,
      roleId: userRole.id,
    },
  });

  console.log("✅ Roles, permissions, and default users seeded.");
}