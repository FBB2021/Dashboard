import { PrismaClient } from "@prisma/client";
import seedRolesAndPermissions from "./seeds/roles_and_permissions";
import seedProducts from "./seeds/products";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Start seeding...");
  await seedRolesAndPermissions(prisma);
  await seedProducts(prisma);
  console.log("✅ Seeding finished.");
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });