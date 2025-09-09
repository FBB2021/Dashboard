import {
  CreateProductDto,
  UpdateProductDto,
} from "@/dtos/request_dtos/product.dto";
import {
  ProductHistoryResponse,
  ProductsHistoryResponse,
} from "@/dtos/response_dtos/product.response.dto";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/common/exceptions";
import { ProductBasic } from "@/dtos/response_dtos/product.response.dto";


/**
 * Get all products with id and name only.
 * - Useful for search, dropdowns, and selection lists.
 */
export async function getAllProducts(): Promise<ProductBasic[]> {
  return prisma.product.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

/** Get history for a single product */
export async function getProductHistory(productId: string): Promise<ProductHistoryResponse> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { procurements: true, sales: true },
  });

  if (!product) throw new AppError("Product not found", 404);

  const days = Array.from(
    new Set([
      ...product.procurements.map((p) => p.day),
      ...product.sales.map((s) => s.day),
    ])
  ).sort((a, b) => a - b);

  let currentInventory = product.openingInventory;
  const history = days.map((day) => {
    const dayProc = product.procurements.find((p) => p.day === day);
    const daySale = product.sales.find((s) => s.day === day);

    const procurementAmount = dayProc ? dayProc.qty * dayProc.price : 0;
    const salesAmount = daySale ? daySale.qty * daySale.price : 0;

    currentInventory += (dayProc?.qty ?? 0) - (daySale?.qty ?? 0);

    return {
      day,
      inventory: currentInventory,
      procurementAmount,
      salesAmount,
    };
  });

  return {
    productId: product.id,
    name: product.name,
    history,
  };
}

/** Get history for multiple products */
export async function getProductsHistory(productIds: string[]): Promise<ProductsHistoryResponse> {
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    include: { procurements: true, sales: true },
  });

  if (!products.length) throw new AppError("No products found", 404);

  return products.map((product) => {
    const days = Array.from(
      new Set([
        ...product.procurements.map((p) => p.day),
        ...product.sales.map((s) => s.day),
      ])
    ).sort((a, b) => a - b);

    let currentInventory = product.openingInventory;
    const history = days.map((day) => {
      const dayProc = product.procurements.find((p) => p.day === day);
      const daySale = product.sales.find((s) => s.day === day);

      const procurementAmount = dayProc ? dayProc.qty * dayProc.price : 0;
      const salesAmount = daySale ? daySale.qty * daySale.price : 0;

      currentInventory += (dayProc?.qty ?? 0) - (daySale?.qty ?? 0);

      return {
        day,
        inventory: currentInventory,
        procurementAmount,
        salesAmount,
      };
    });

    return {
      productId: product.id,
      name: product.name,
      history,
    };
  });
}

/** Create a new product with optional procurement and sales records */
export async function createProduct(data: CreateProductDto): Promise<ProductBasic> {
  const existing = await prisma.product.findUnique({ where: { id: data.id } });
  if (existing) throw new AppError("Product ID already exists", 400);

  const product = await prisma.product.create({
    data: {
      id: data.id,
      name: data.name,
      openingInventory: data.openingInventory,
      procurements: data.procurements
        ? { create: data.procurements }
        : undefined,
      sales: data.sales ? { create: data.sales } : undefined,
    },
    select: { id: true, name: true },
  });

  return product;
}

/** Update a product by ID (including procurement & sales history) */
export async function updateProduct(id: string, data: UpdateProductDto): Promise<ProductBasic> {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw new AppError("Product not found", 404);

  // 1. Update product
  const updatedProduct = await prisma.product.update({
    where: { id },
    data: {
      name: data.name,
      openingInventory: data.openingInventory,
    },
    select: { id: true, name: true },
  });

  // 2. Update procurements
  if (data.procurements && data.procurements.length > 0) {
    for (const proc of data.procurements) {
      await prisma.procurement.upsert({
        where: { productId_day: { productId: id, day: proc.day } },
        update: { qty: proc.qty, price: proc.price },
        create: { productId: id, day: proc.day, qty: proc.qty, price: proc.price },
      });
    }
  }

  // 3. Update sales
  if (data.sales && data.sales.length > 0) {
    for (const sale of data.sales) {
      await prisma.sale.upsert({
        where: { productId_day: { productId: id, day: sale.day } },
        update: { qty: sale.qty, price: sale.price },
        create: { productId: id, day: sale.day, qty: sale.qty, price: sale.price },
      });
    }
  }

  return updatedProduct;
}

/** Delete a product by ID */
export async function deleteProduct(id: string): Promise<void> {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) {
    // idempotent delete: no error if product doesn't exist
    return;
  }

  await prisma.procurement.deleteMany({ where: { productId: id } });
  await prisma.sale.deleteMany({ where: { productId: id } });
  await prisma.product.delete({ where: { id } });
}