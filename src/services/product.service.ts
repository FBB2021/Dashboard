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
