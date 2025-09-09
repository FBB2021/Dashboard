import { PrismaClient } from "@prisma/client";

/**
 * Seed products, procurements, and sales data.
 * - Uses UPSERT for products (safe to run multiple times).
 * - Uses UPSERT for daily procurements and sales (unique by productId + day).
 */
export default async function seedProducts(prisma: PrismaClient) {
  console.log("🌱 Seeding products, procurements, and sales...");

  // Example dataset extracted and extended from Excel
  const products = [
    {
      id: "0000001",
      name: "CHERRY 1PACK",
      openingInventory: 117,
      procurements: [
        { day: 1, qty: 0, price: 0.0 },
        { day: 2, qty: 21, price: 13.72 },
        { day: 3, qty: 0, price: 0.0 },
      ],
      sales: [
        { day: 1, qty: 22, price: 5.98 },
        { day: 2, qty: 12, price: 5.98 },
        { day: 3, qty: 7, price: 4.98 },
      ],
    },
    {
      id: "0000002",
      name: "ENOKI MUSHROOM 360G",
      openingInventory: 1020,
      procurements: [
        { day: 1, qty: 750, price: 3.2 },
        { day: 2, qty: 240, price: 2.8 },
        { day: 3, qty: 192, price: 3.6 },
      ],
      sales: [
        { day: 1, qty: 157, price: 4.38 },
        { day: 2, qty: 111, price: 4.38 },
        { day: 3, qty: 95, price: 4.38 },
      ],
    },
    {
      id: "0000003",
      name: "JIN RAMEN HOT 5P",
      openingInventory: 23,
      procurements: [
        { day: 1, qty: 720, price: 7.0 },
        { day: 2, qty: 0, price: 7.0 },
        { day: 3, qty: 360, price: 7.6 },
      ],
      sales: [
        { day: 1, qty: 23, price: 9.98 },
        { day: 2, qty: 20, price: 9.98 },
        { day: 3, qty: 15, price: 9.98 },
      ],
    },
    {
      id: "0000004",
      name: "NONGSHIM SHIN RAMYUN 5P",
      openingInventory: 88,
      procurements: [
        { day: 1, qty: 150, price: 6.8 },
        { day: 2, qty: 120, price: 6.5 },
        { day: 3, qty: 0, price: 0.0 },
      ],
      sales: [
        { day: 1, qty: 40, price: 8.98 },
        { day: 2, qty: 36, price: 8.98 },
        { day: 3, qty: 42, price: 8.98 },
      ],
    },
    {
      id: "0000005",
      name: "COCA-COLA 1.25L",
      openingInventory: 340,
      procurements: [
        { day: 1, qty: 100, price: 1.2 },
        { day: 2, qty: 200, price: 1.25 },
        { day: 3, qty: 150, price: 1.3 },
      ],
      sales: [
        { day: 1, qty: 80, price: 2.5 },
        { day: 2, qty: 95, price: 2.5 },
        { day: 3, qty: 110, price: 2.5 },
      ],
    },
  ];

  for (const p of products) {
    // =====================
    // Upsert Product
    // =====================
    await prisma.product.upsert({
      where: { id: p.id },
      update: {
        name: p.name,
        openingInventory: p.openingInventory,
      },
      create: {
        id: p.id,
        name: p.name,
        openingInventory: p.openingInventory,
      },
    });

    // =====================
    // Upsert Procurement Records
    // =====================
    for (const proc of p.procurements) {
      await prisma.procurement.upsert({
        where: {
          productId_day: {
            productId: p.id,
            day: proc.day,
          },
        },
        update: {
          qty: proc.qty,
          price: proc.price,
        },
        create: {
          productId: p.id,
          day: proc.day,
          qty: proc.qty,
          price: proc.price,
        },
      });
    }

    // =====================
    // Upsert Sales Records
    // =====================
    for (const sale of p.sales) {
      await prisma.sale.upsert({
        where: {
          productId_day: {
            productId: p.id,
            day: sale.day,
          },
        },
        update: {
          qty: sale.qty,
          price: sale.price,
        },
        create: {
          productId: p.id,
          day: sale.day,
          qty: sale.qty,
          price: sale.price,
        },
      });
    }
  }

  console.log("✅ Products, procurements, and sales seeded.");
}
